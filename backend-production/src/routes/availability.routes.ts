import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

import { TrainerAvailabilityStatus } from '@prisma/client';

const normalizeStatus = (status: string | undefined | null): TrainerAvailabilityStatus | undefined => {
  if (!status) return undefined;
  const upper = status.toString().toUpperCase();
  const allowed: TrainerAvailabilityStatus[] = ['AVAILABLE', 'NOT_AVAILABLE', 'TENTATIVE', 'BOOKED'];
  return allowed.includes(upper as TrainerAvailabilityStatus) ? (upper as TrainerAvailabilityStatus) : undefined;
};

// Get trainer availability (public or authenticated)
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { month, year, startDate, endDate, courseId } = req.query;

    const where: any = { trainerId };

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0);
      where.date = {
        gte: start,
        lte: end,
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const availability = await prisma.trainerAvailability.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // If courseId is provided, also fetch pending and tentative bookings count for each date
    let pendingCountsByDate: Record<string, number> = {};
    let tentativeCountsByDate: Record<string, number> = {};
    if (courseId) {
      // Get all pending bookings for this trainer and course
      const pendingBookings = await prisma.bookingRequest.findMany({
        where: {
          trainerId,
          courseId: courseId as string,
          status: 'PENDING',
        },
        select: {
          requestedDate: true,
          endDate: true,
        },
      });

      // Get all approved bookings (which are considered tentative) for this trainer and course
      const tentativeBookings = await prisma.bookingRequest.findMany({
        where: {
          trainerId,
          courseId: courseId as string,
          status: 'APPROVED',
        },
        select: {
          requestedDate: true,
          endDate: true,
        },
      });

      // For each availability date, count how many pending and tentative bookings overlap with it
      for (const avail of availability) {
        const availDate = new Date(avail.date);
        const dateStr = `${availDate.getUTCFullYear()}-${String(availDate.getUTCMonth() + 1).padStart(2, '0')}-${String(availDate.getUTCDate()).padStart(2, '0')}`;

        let pendingCount = 0;
        let tentativeCount = 0;

        // Count pending bookings
        for (const booking of pendingBookings) {
          if (!booking.requestedDate) continue;

          const bookingStart = new Date(booking.requestedDate);
          bookingStart.setUTCHours(0, 0, 0, 0);

          const bookingEnd = booking.endDate
            ? new Date(booking.endDate)
            : new Date(booking.requestedDate);
          bookingEnd.setUTCHours(23, 59, 59, 999);

          const checkDate = new Date(availDate);
          checkDate.setUTCHours(0, 0, 0, 0);

          // Check if the availability date falls within the booking date range
          if (checkDate >= bookingStart && checkDate <= bookingEnd) {
            pendingCount++;
          }
        }

        // Count tentative (approved) bookings
        for (const booking of tentativeBookings) {
          if (!booking.requestedDate) continue;

          const bookingStart = new Date(booking.requestedDate);
          bookingStart.setUTCHours(0, 0, 0, 0);

          const bookingEnd = booking.endDate
            ? new Date(booking.endDate)
            : new Date(booking.requestedDate);
          bookingEnd.setUTCHours(23, 59, 59, 999);

          const checkDate = new Date(availDate);
          checkDate.setUTCHours(0, 0, 0, 0);

          // Check if the availability date falls within the booking date range
          if (checkDate >= bookingStart && checkDate <= bookingEnd) {
            tentativeCount++;
          }
        }

        if (pendingCount > 0) {
          pendingCountsByDate[dateStr] = pendingCount;
        }
        if (tentativeCount > 0) {
          tentativeCountsByDate[dateStr] = tentativeCount;
        }
      }
    }

    return res.json({
      availability,
      pendingCounts: pendingCountsByDate,
      tentativeCounts: tentativeCountsByDate,
    });
  } catch (error: any) {
    console.error('Get availability error:', error);
    return res.status(500).json({ error: 'Failed to fetch availability', details: error.message });
  }
});

// Create/Update availability (trainer only)
router.post(
  '/trainer/:trainerId',
  authenticate,
  authorize('TRAINER'),
  async (req: AuthRequest, res) => {
    try {
      const { trainerId } = req.params;

      // Trainers can only manage their own availability
      if (req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const availabilityData = Array.isArray(req.body) ? req.body : [req.body];

      const results = await Promise.all(
        availabilityData.map(async (item: any) => {
          const { date, status } = item;

          const targetDate = new Date(date);

          // Full-day only: one record per trainerId + date
          const existing = await prisma.trainerAvailability.findFirst({
            where: {
              trainerId,
              date: targetDate,
            },
          });

          const normalizedStatus = normalizeStatus(status) || TrainerAvailabilityStatus.AVAILABLE;

          if (existing) {
            return prisma.trainerAvailability.update({
              where: { id: existing.id },
              data: {
                status: normalizedStatus,
              },
            });
          }

          return prisma.trainerAvailability.create({
            data: {
              trainerId,
              date: targetDate,
              status: normalizedStatus,
            },
          });
        })
      );

      // Log availability update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'availability',
        entityId: trainerId,
        description: `Trainer updated their availability for ${results.length} dates`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(201).json({ availability: results });
    } catch (error: any) {
      console.error('Create availability error:', error);
      return res.status(500).json({ error: 'Failed to create availability', details: error.message });
    }
  }
);

// Update availability (trainer only)
router.put(
  '/:id',
  authenticate,
  authorize('TRAINER'),
  async (req: AuthRequest, res) => {
    try {
      const availabilityId = req.params.id;

      const existing = await prisma.trainerAvailability.findUnique({
        where: { id: availabilityId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Availability not found' });
      }

      // Trainers can only update their own availability
      if (existing.trainerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updateData = req.body;
      const normalizedStatus = normalizeStatus(updateData.status);

      const availability = await prisma.trainerAvailability.update({
        where: { id: availabilityId },
        data: normalizedStatus ? { ...updateData, status: normalizedStatus } : updateData,
      });

      // Log availability update
      await createActivityLog({
        userId: existing.trainerId,
        actionType: 'UPDATE',
        entityType: 'availability',
        entityId: availability.id,
        description: `Trainer updated availability for ${new Date(availability.date).toLocaleDateString()}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ availability });
    } catch (error: any) {
      console.error('Update availability error:', error);
      return res.status(500).json({ error: 'Failed to update availability', details: error.message });
    }
  }
);

// Delete availability (trainer only)
router.delete(
  '/:id',
  authenticate,
  authorize('TRAINER'),
  async (req: AuthRequest, res) => {
    try {
      const availabilityId = req.params.id;

      const existing = await prisma.trainerAvailability.findUnique({
        where: { id: availabilityId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Availability not found' });
      }

      // Trainers can only delete their own availability
      if (existing.trainerId !== req.user!.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.trainerAvailability.delete({
        where: { id: availabilityId },
      });

      // Log availability deletion
      await createActivityLog({
        userId: existing.trainerId,
        actionType: 'DELETE',
        entityType: 'availability',
        entityId: availabilityId,
        description: `Trainer deleted availability for ${new Date(existing.date).toLocaleDateString()}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ message: 'Availability deleted successfully' });
    } catch (error: any) {
      console.error('Delete availability error:', error);
      return res.status(500).json({ error: 'Failed to delete availability', details: error.message });
    }
  }
);

// Get recurring blocked days for a trainer
router.get('/trainer/:trainerId/blocked-days', async (req, res) => {
  try {
    const { trainerId } = req.params;

    const days = await prisma.trainerBlockedDay.findMany({
      where: { trainerId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return res.json({ blockedDays: days.map((day) => day.dayOfWeek) });
  } catch (error: any) {
    console.error('Get blocked days error:', error);
    return res.status(500).json({ error: 'Failed to fetch blocked days', details: error.message });
  }
});

// Replace recurring blocked days for a trainer
router.put(
  '/trainer/:trainerId/blocked-days',
  authenticate,
  authorize('TRAINER'),
  async (req: AuthRequest, res) => {
    try {
      const { trainerId } = req.params;
      const { days } = req.body as { days?: number[] };

      if (req.user!.id !== trainerId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const normalizedDays = Array.isArray(days)
        ? Array.from(new Set(days.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)))
        : [];

      await prisma.trainerBlockedDay.deleteMany({
        where: { trainerId },
      });

      if (normalizedDays.length > 0) {
        await prisma.trainerBlockedDay.createMany({
          data: normalizedDays.map((day) => ({
            trainerId,
            dayOfWeek: day,
          })),
        });
      }

      // Log blocked days update
      await createActivityLog({
        userId: trainerId,
        actionType: 'UPDATE',
        entityType: 'blocked_days',
        entityId: trainerId,
        description: `Trainer updated their recurring blocked days: ${normalizedDays.join(', ')}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.json({ blockedDays: normalizedDays });
    } catch (error: any) {
      console.error('Update blocked days error:', error);
      return res.status(500).json({ error: 'Failed to update blocked days', details: error.message });
    }
  }
);

export default router;
