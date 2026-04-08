import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all booking requests with filters
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const { status, trainerId, clientId, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (trainerId) {
      where.trainerId = trainerId;
    }
    if (clientId) {
      where.clientId = clientId;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      prisma.bookingRequest.findMany({
        where,
        include: {
          course: {
            select: {
              id: true,
              title: true,
              courseType: true,
            },
          },
          trainer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          client: {
            select: {
              id: true,
              userName: true,
              companyEmail: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.bookingRequest.count({ where }),
    ]);

    res.json({
      bookings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get booking requests error:', error);
    res.status(500).json({ error: 'Failed to fetch booking requests', details: error.message });
  }
});

// Get trainer responses for a booking
router.get('/requests/:id/trainer-response', async (req: AuthRequest, res: Response) => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    // Get trainer's response status
    // Note: Trainer response might be stored in booking status or a separate field
    // Adjust based on your actual schema

    return res.json({
      booking,
      trainerResponse: booking.status, // Adjust based on actual response tracking
    });
  } catch (error: any) {
    console.error('Get trainer response error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer response', details: error.message });
  }
});

// Override trainer approval (for corporate clients)
router.put(
  '/requests/:id/override-approval',
  [
    body('overrideReason').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const booking = await prisma.bookingRequest.findUnique({
        where: { id: req.params.id },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking request not found' });
      }

      // Override and approve
      const updated = await prisma.bookingRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
        },
      });

      // Auto-block trainer availability
      if (booking.trainerId && booking.requestedDate) {
        await prisma.trainerBlockedDate.create({
          data: {
            trainerId: booking.trainerId,
            blockedDate: new Date(booking.requestedDate),
            reason: `Auto-blocked: Booking approved (Admin override: ${req.body.overrideReason})`,
          },
        }).catch(() => {
          // Ignore if already blocked
        });
      }

      // Notify trainer
      if (booking.trainerId) {
        await prisma.notification.create({
          data: {
            userId: booking.trainerId,
            title: 'Booking Approved (Admin Override)',
            message: `A booking has been approved by admin.${req.body.overrideReason ? ` Reason: ${req.body.overrideReason}` : ''}`,
            type: 'INFO',
            relatedEntityType: 'booking_request',
            relatedEntityId: booking.id,
          },
        }).catch(() => {});
      }

      // Notify client
      if (booking.clientId) {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: 'Booking Approved',
            message: 'Your booking request has been approved.',
            type: 'SUCCESS',
            relatedEntityType: 'booking_request',
            relatedEntityId: booking.id,
          },
        }).catch(() => {});
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'APPROVE',
        entityType: 'booking_request',
        entityId: booking.id,
        description: `Override approved booking (Corporate client)`,
        metadata: { overrideReason: req.body.overrideReason },
      });

      return res.json({ booking: updated, message: 'Booking approved with override' });
    } catch (error: any) {
      console.error('Override approval error:', error);
      return res.status(500).json({ error: 'Failed to override approval', details: error.message });
    }
  }
);

// Detect scheduling conflicts
router.get('/conflicts/detect', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, startDate, endDate } = req.query;

    if (!trainerId || !startDate || !endDate) {
      return res.status(400).json({ error: 'trainerId, startDate, and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Check for existing bookings
    const existingBookings = await prisma.bookingRequest.findMany({
      where: {
        trainerId: trainerId as string,
        requestedDate: {
          gte: start,
          lte: end,
        },
        status: { in: ['APPROVED', 'CONFIRMED', 'TENTATIVE'] },
      },
    });

    // Check for blocked dates
    const blockedDates = await prisma.trainerBlockedDate.findMany({
      where: {
        trainerId: trainerId as string,
        blockedDate: {
          gte: start,
          lte: end,
        },
      },
    });

    // Check for weekly availability
    const weeklyAvailability = await prisma.trainerWeeklyAvailability.findMany({
      where: { trainerId: trainerId as string },
    });

    const conflicts = {
      hasConflict: existingBookings.length > 0 || blockedDates.length > 0,
      existingBookings,
      blockedDates,
      weeklyAvailability,
      suggestedAlternatives: [] as any[],
    };

    // Suggest alternatives if conflict exists
    if (conflicts.hasConflict) {
      // Find next available dates (simplified - you can enhance this)
      const nextWeek = new Date(start);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const nextWeekBookings = await prisma.bookingRequest.findMany({
        where: {
          trainerId: trainerId as string,
          requestedDate: {
            gte: nextWeek,
            lte: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
          status: { in: ['APPROVED', 'CONFIRMED'] },
        },
      });

      const nextWeekBlocked = await prisma.trainerBlockedDate.findMany({
        where: {
          trainerId: trainerId as string,
          blockedDate: {
            gte: nextWeek,
            lte: new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (nextWeekBookings.length === 0 && nextWeekBlocked.length === 0) {
        conflicts.suggestedAlternatives.push({
          startDate: nextWeek.toISOString().split('T')[0],
          endDate: new Date(nextWeek.getTime() + (end.getTime() - start.getTime())).toISOString().split('T')[0],
          reason: 'Next week available',
        });
      }
    }

    return res.json(conflicts);
  } catch (error: any) {
    console.error('Detect conflicts error:', error);
    return res.status(500).json({ error: 'Failed to detect conflicts', details: error.message });
  }
});

// Resolve scheduling conflict
router.post(
  '/conflicts/resolve',
  [
    body('bookingId').notEmpty(),
    body('resolution').isIn(['reschedule', 'override', 'cancel']),
    body('newDate').optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookingId, resolution, newDate } = req.body;

      const booking = await prisma.bookingRequest.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (resolution === 'reschedule' && newDate) {
        const updated = await prisma.bookingRequest.update({
          where: { id: bookingId },
          data: {
            requestedDate: new Date(newDate),
            status: 'TENTATIVE',
          },
        });

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'UPDATE',
          entityType: 'booking_request',
          entityId: bookingId,
          description: `Resolved conflict by rescheduling booking`,
        });

        return res.json({ booking: updated, message: 'Booking rescheduled' });
      }

      if (resolution === 'override') {
        // Override and block the conflicting date
        if (booking.trainerId && booking.requestedDate) {
          await prisma.trainerBlockedDate.create({
            data: {
              trainerId: booking.trainerId,
              blockedDate: new Date(booking.requestedDate),
              reason: 'Admin override: Conflict resolved',
            },
          }).catch(() => {});
        }

        const updated = await prisma.bookingRequest.update({
          where: { id: bookingId },
          data: { status: 'APPROVED' },
        });

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'UPDATE',
          entityType: 'booking_request',
          entityId: bookingId,
          description: `Resolved conflict by overriding`,
        });

        return res.json({ booking: updated, message: 'Conflict resolved by override' });
      }

      if (resolution === 'cancel') {
        const updated = await prisma.bookingRequest.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' },
        });

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CANCEL',
          entityType: 'booking_request',
          entityId: bookingId,
          description: `Resolved conflict by cancelling booking`,
        });

        return res.json({ booking: updated, message: 'Booking cancelled' });
      }

      return res.status(400).json({ error: 'Invalid resolution type' });
    } catch (error: any) {
      console.error('Resolve conflict error:', error);
      return res.status(500).json({ error: 'Failed to resolve conflict', details: error.message });
    }
  }
);

export default router;

