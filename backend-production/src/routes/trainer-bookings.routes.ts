import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { TrainerBookingStatus, TrainerAvailabilityStatus } from '@prisma/client';

const router = express.Router();

// Helper to sync availability status when a trainer booking is created/updated
async function syncAvailability(trainerId: string, date: Date, status: TrainerBookingStatus) {
  const availStatusMap: Record<string, TrainerAvailabilityStatus> = {
    PENDING: 'TENTATIVE',
    TENTATIVE: 'TENTATIVE',
    CONFIRMED: 'BOOKED',
    CANCELLED: 'AVAILABLE', // Or check if there are other bookings?
    COMPLETED: 'BOOKED'
  };

  const availStatus = availStatusMap[status];

  // Try to find existing availability for that date
  const existing = await prisma.trainerAvailability.findFirst({
    where: {
      trainerId,
      date: {
        equals: date
      }
    }
  });

  if (existing) {
    await prisma.trainerAvailability.update({
      where: { id: existing.id },
      data: { status: availStatus }
    });
  } else {
    await prisma.trainerAvailability.create({
      data: {
        trainerId,
        date,
        status: availStatus
      }
    });
  }
}

// Get all bookings for a trainer
router.get('/trainer/:trainerId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { trainerId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { trainerId };

    if (startDate && endDate) {
      where.bookingDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const bookings = await prisma.trainerBooking.findMany({
      where,
      orderBy: { bookingDate: 'asc' },
    });

    return res.json({ bookings });
  } catch (error: any) {
    console.error('Get trainer bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer bookings' });
  }
});

// Create a new trainer booking
router.post('/', authenticate, authorize('TRAINER'), async (req: AuthRequest, res) => {
  try {
    const { trainerId, bookingDate, status, notes } = req.body;

    if (req.user!.id !== trainerId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const date = new Date(bookingDate);
    
    const booking = await prisma.trainerBooking.create({
      data: {
        trainerId,
        bookingDate: date,
        status: (status === 'BOOKED' ? 'CONFIRMED' : (status || 'CONFIRMED')),
        notes
      }
    });

    // Sync availability
    await syncAvailability(trainerId, date, booking.status);

    return res.status(201).json({ booking });
  } catch (error: any) {
    console.error('Create trainer booking error:', error);
    return res.status(500).json({ error: 'Failed to create trainer booking' });
  }
});

// Update a trainer booking
router.put('/:id', authenticate, authorize('TRAINER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const existing = await prisma.trainerBooking.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user!.id !== existing.trainerId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const booking = await prisma.trainerBooking.update({
      where: { id },
      data: {
        status,
        notes,
      }
    });

    // Logic: if status changed, sync availability
    if (status && status !== existing.status) {
      await syncAvailability(existing.trainerId, existing.bookingDate, status);
    }

    return res.json({ booking });
  } catch (error: any) {
    console.error('Update trainer booking error:', error);
    return res.status(500).json({ error: 'Failed to update trainer booking' });
  }
});

// Delete a trainer booking
router.delete('/:id', authenticate, authorize('TRAINER', 'ADMIN'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.trainerBooking.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (req.user!.id !== existing.trainerId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.trainerBooking.delete({
      where: { id }
    });

    // Reset availability to AVAILABLE on delete?
    const otherBookings = await prisma.trainerBooking.findFirst({
      where: {
        trainerId: existing.trainerId,
        bookingDate: existing.bookingDate
      }
    });

    if (!otherBookings) {
      const avail = await prisma.trainerAvailability.findFirst({
        where: {
          trainerId: existing.trainerId,
          date: existing.bookingDate
        }
      });
      if (avail) {
        await prisma.trainerAvailability.update({
          where: { id: avail.id },
          data: { status: 'AVAILABLE' }
        });
      }
    }

    return res.json({ message: 'Booking deleted successfully' });
  } catch (error: any) {
    console.error('Delete trainer booking error:', error);
    return res.status(500).json({ error: 'Failed to delete trainer booking' });
  }
});

export default router;
