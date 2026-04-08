import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { calculateTrainerRating } from '../utils/utils/ratingCalculator';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get trainer analytics
router.get('/:id/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = req.params.id;

    const [
      totalCourses,
      avgRating,
      totalBookings,
      cancelledBookings,
      feedbacks,
    ] = await Promise.all([
      prisma.trainerCourseConducted.count({ where: { trainerId } }),
      calculateTrainerRating(trainerId),
      prisma.bookingRequest.count({
        where: { trainerId, status: { in: ['CONFIRMED', 'COMPLETED'] } },
      }),
      prisma.bookingRequest.count({
        where: { trainerId, status: 'CANCELLED' },
      }),
      prisma.feedback.findMany({
        where: { trainerId },
        select: {
          trainerKnowledge: true,
          trainerEngagement: true,
          knowledgeExposure: true,
          knowledgeApplication: true,
          recommendCourse: true,
        },
      }),
    ]);

    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    // Calculate average response time (would need to track this in booking requests)
    // For now, return placeholder
    const avgResponseTime = null; // TODO: Implement response time tracking

    return res.json({
      totalCourses,
      avgRating,
      totalBookings,
      cancelledBookings,
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      avgResponseTime,
      feedbackCount: feedbacks.length,
    });
  } catch (error: any) {
    console.error('Get trainer analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer analytics', details: error.message });
  }
});

// Verify HRDC certification
router.put(
  '/:id/hrdc/verify',
  [
    body('hrdcAccreditationId').optional().trim(),
    body('hrdcAccreditationValidUntil').optional().isISO8601(),
    body('verified').isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { hrdcAccreditationId, hrdcAccreditationValidUntil, verified } = req.body;

      const trainer = await prisma.trainer.findUnique({
        where: { id: req.params.id },
      });

      if (!trainer) {
        return res.status(404).json({ error: 'Trainer not found' });
      }

      const updateData: any = {};
      if (hrdcAccreditationId !== undefined) {
        updateData.hrdcAccreditationId = hrdcAccreditationId || null;
      }
      if (hrdcAccreditationValidUntil !== undefined) {
        updateData.hrdcAccreditationValidUntil = hrdcAccreditationValidUntil ? new Date(hrdcAccreditationValidUntil) : null;
      }

      const updated = await prisma.trainer.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Update related document if exists
      if (verified) {
        await prisma.trainerDocument.updateMany({
          where: {
            trainerId: req.params.id,
            documentType: { contains: 'HRDC' },
          },
          data: {
            verified: true,
            verifiedBy: req.user!.id,
            verifiedAt: new Date(),
          },
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: verified ? 'APPROVE' : 'UPDATE',
        entityType: 'trainer',
        entityId: trainer.id,
        description: `${verified ? 'Verified' : 'Updated'} HRDC certification for ${trainer.fullName}`,
      });

      return res.json({ trainer: updated, message: 'HRDC certification updated successfully' });
    } catch (error: any) {
      console.error('Verify HRDC error:', error);
      return res.status(500).json({ error: 'Failed to verify HRDC certification', details: error.message });
    }
  }
);

// Create trainer availability (admin only)
router.post(
  '/:id/availability/create',
  [
    body('dates').isArray().notEmpty(),
    body('dates.*').isISO8601(),
    body('status').isIn(['AVAILABLE', 'NOT_AVAILABLE']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { dates, status } = req.body;
      const trainerId = req.params.id;

      // Verify trainer exists
      const trainer = await prisma.trainer.findUnique({
        where: { id: trainerId },
      });

      if (!trainer) {
        return res.status(404).json({ error: 'Trainer not found' });
      }

      // Process each date: create if doesn't exist, update if exists
      const results = await Promise.all(
        dates.map(async (dateStr: string) => {
          const targetDate = new Date(dateStr);
          targetDate.setHours(0, 0, 0, 0);

          // Check if availability record already exists for this date
          const existing = await prisma.trainerAvailability.findFirst({
            where: {
              trainerId,
              date: targetDate,
            },
          });

          if (existing) {
            // Update existing record
            return prisma.trainerAvailability.update({
              where: { id: existing.id },
              data: { status: status as any },
            });
          } else {
            // Create new record
            return prisma.trainerAvailability.create({
              data: {
                trainerId,
                date: targetDate,
                status: status as any,
              },
            });
          }
        })
      );

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'trainer',
        entityId: trainerId,
        description: `Created/updated trainer availability for ${dates.length} date(s) with status ${status}`,
      });

      return res.json({
        availability: results,
        message: `Availability created/updated successfully for ${dates.length} date(s)`,
      });
    } catch (error: any) {
      console.error('Create availability error:', error);
      return res.status(500).json({ error: 'Failed to create availability', details: error.message });
    }
  }
);

// Block trainer availability manually
router.post(
  '/:id/availability/block',
  [
    body('blockedDate').isISO8601(),
    body('reason').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { blockedDate, reason } = req.body;

      const blocked = await prisma.trainerBlockedDate.create({
        data: {
          trainerId: req.params.id,
          blockedDate: new Date(blockedDate),
          reason: reason || null,
        },
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'trainer',
        entityId: req.params.id,
        description: `Manually blocked trainer availability for ${blockedDate}`,
      });

      return res.json({ blocked, message: 'Availability blocked successfully' });
    } catch (error: any) {
      console.error('Block availability error:', error);
      return res.status(500).json({ error: 'Failed to block availability', details: error.message });
    }
  }
);

// Unblock trainer availability
router.delete('/:id/availability/block/:blockedId', async (req: AuthRequest, res: Response) => {
  try {
    const blocked = await prisma.trainerBlockedDate.findUnique({
      where: { id: req.params.blockedId },
    });

    if (!blocked || blocked.trainerId !== req.params.id) {
      return res.status(404).json({ error: 'Blocked date not found' });
    }

    await prisma.trainerBlockedDate.delete({
      where: { id: req.params.blockedId },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'trainer',
      entityId: req.params.id,
      description: `Unblocked trainer availability`,
    });

    return res.json({ message: 'Availability unblocked successfully' });
  } catch (error: any) {
    console.error('Unblock availability error:', error);
    return res.status(500).json({ error: 'Failed to unblock availability', details: error.message });
  }
});

// Get trainer availability conflicts
router.get('/:id/availability/conflicts', async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get all bookings in the date range
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        trainerId: req.params.id,
        requestedDate: {
          gte: start,
          lte: end,
        },
        status: { in: ['APPROVED', 'CONFIRMED', 'TENTATIVE'] },
      },
    });

    // Get blocked dates
    const blockedDates = await prisma.trainerBlockedDate.findMany({
      where: {
        trainerId: req.params.id,
        blockedDate: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get weekly availability
    const weeklyAvailability = await prisma.trainerWeeklyAvailability.findMany({
      where: { trainerId: req.params.id },
    });

    return res.json({
      bookings,
      blockedDates,
      weeklyAvailability,
      conflicts: bookings.length > 0 || blockedDates.length > 0,
    });
  } catch (error: any) {
    console.error('Get availability conflicts error:', error);
    return res.status(500).json({ error: 'Failed to check availability conflicts', details: error.message });
  }
});

// Search trainers with advanced filters
router.get('/search/advanced', async (req: AuthRequest, res: Response) => {
  try {
    const { expertise, hrdcStatus, state, minRating, availableFrom, availableTo } = req.query;

    const where: any = {};

    if (expertise) {
      where.areasOfExpertise = { contains: expertise as string };
    }

    if (hrdcStatus === 'certified') {
      where.hrdcAccreditationId = { not: null };
      where.hrdcAccreditationValidUntil = { gte: new Date() };
    } else if (hrdcStatus === 'expired') {
      where.hrdcAccreditationValidUntil = { lt: new Date() };
    } else if (hrdcStatus === 'none') {
      where.hrdcAccreditationId = null;
    }

    if (state) {
      where.state = state as string;
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        qualifications: true,
        trainerDocuments: {
          where: {
            documentType: { contains: 'HRDC' },
          },
        },
        weeklyAvailability: true,
      },
    });

    // Filter by rating if provided
    let filteredTrainers = trainers;
    if (minRating) {
      const ratings = await Promise.all(
        trainers.map(async (trainer) => ({
          trainer,
          rating: await calculateTrainerRating(trainer.id),
        }))
      );
      filteredTrainers = ratings
        .filter((r) => r.rating !== null && r.rating >= parseFloat(minRating as string))
        .map((r) => r.trainer);
    }

    // Filter by availability if provided
    if (availableFrom && availableTo) {
      const availableTrainers = await Promise.all(
        filteredTrainers.map(async (trainer) => {
          const conflicts = await prisma.trainerBlockedDate.findFirst({
            where: {
              trainerId: trainer.id,
              blockedDate: {
                gte: new Date(availableFrom as string),
                lte: new Date(availableTo as string),
              },
            },
          });

          const bookings = await prisma.bookingRequest.findFirst({
            where: {
              trainerId: trainer.id,
              requestedDate: {
                gte: new Date(availableFrom as string),
                lte: new Date(availableTo as string),
              },
              status: { in: ['APPROVED', 'CONFIRMED'] },
            },
          });

          return conflicts || bookings ? null : trainer;
        })
      );

      filteredTrainers = availableTrainers.filter((t) => t !== null) as typeof trainers;
    }

    res.json({ trainers: filteredTrainers, count: filteredTrainers.length });
  } catch (error: any) {
    console.error('Advanced trainer search error:', error);
    res.status(500).json({ error: 'Failed to search trainers', details: error.message });
  }
});

export default router;

