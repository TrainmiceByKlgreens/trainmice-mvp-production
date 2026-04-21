import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { generateTrainerId } from '../utils/utils/sequentialId';
import { hashPassword } from '../utils/utils/password';
import { sendNotification } from '../utils/utils/notificationHelper';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all trainers (admin view - includes all fields)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, category, state, profileStatus } = req.query;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phoneNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      // Specialization search temporarily disabled or to be replaced with dedicated table search
      // where.areasOfExpertise = { contains: category as string };
    }

    if (state) {
      where.state = state as string;
    }

    if (profileStatus) {
      where.profileApprovalStatus = profileStatus as string;
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        qualifications: true,
        workHistoryEntries: true,
        pastClients: true,
        trainerDocuments: true,
        weeklyAvailability: true,
        blockedDates: true,
        courseTrainers: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return res.json({ trainers });
  } catch (error: any) {
    console.error('Get trainers error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainers', details: error.message });
  }
});

// Get single trainer (admin view)
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: req.params.id },
      include: {
        qualifications: true,
        workHistoryEntries: true,
        pastClients: true,
        trainerDocuments: true,
        weeklyAvailability: true,
        blockedDates: true,
        trainerLanguages: true,
        courseTrainers: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    return res.json({ trainer });
  } catch (error: any) {
    console.error('Get trainer error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer', details: error.message });
  }
});

// Create trainer (admin)
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('fullName').optional().trim(),
    body('full_name').optional().trim(),
    body('phoneNumber').optional().trim(),
    body('phone').optional().trim(),
    body('password').isLength({ min: 8 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const fullName = (req.body.fullName || req.body.full_name || '').trim();
      const phoneNumber = req.body.phoneNumber ?? req.body.phone;
      const {
        email,
        password,
        specialization,
        bio,
        hourlyRate,
        hrdcCertified,
        state,
        city,
        country,
      } = req.body;

      if (!fullName) {
        return res.status(400).json({ error: 'Full name is required' });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }

      const customTrainerId = await generateTrainerId();
      const passwordHash = await hashPassword(password);

      const trainer = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            fullName,
            role: 'TRAINER',
            // Admin-created trainer accounts should be usable immediately.
            emailVerified: true,
          },
        });

        const createdTrainer = await tx.trainer.create({
          data: {
            id: user.id,
            email,
            fullName,
            phoneNumber: phoneNumber || null,
            customTrainerId,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            professionalBio: bio || null,
            hrdcAccreditationId: hrdcCertified ? `HRDC-${customTrainerId}` : null,
            state: state || null,
            city: city || null,
            country: country || null,
            areasOfExpertise: specialization ? [specialization] : undefined,
            profileApprovalStatus: 'APPROVED',
            profileApprovalUpdatedAt: new Date(),
            profileApprovedAt: new Date(),
            profileApprovedBy: req.user!.id,
          },
        });

        await tx.trainerMessage.create({
          data: {
            trainerId: createdTrainer.id,
            lastMessage: 'Trainer added to system',
            platform: 'WEBSITE',
            isRead: true,
          },
        }).catch(() => undefined);

        return createdTrainer;
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CREATE',
        entityType: 'trainer',
        entityId: trainer.id,
        description: `Added trainer: ${fullName}`,
      });

      return res.status(201).json({
        message: 'Trainer added successfully',
        trainer,
      });
    } catch (error: any) {
      console.error('Create trainer error:', error);
      return res.status(500).json({ error: 'Failed to create trainer', details: error.message });
    }
  }
);

// Review trainer profile for website publishing
router.put(
  '/:id/profile-approval',
  [
    body('status').isIn(['PENDING_APPROVAL', 'APPROVED', 'DENIED']),
    body('notes').optional({ nullable: true }).isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trainerId = req.params.id;
      const { status, notes } = req.body as {
        status: 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED';
        notes?: string | null;
      };

      const trainer = await prisma.trainer.findUnique({
        where: { id: trainerId },
        select: {
          id: true,
          fullName: true,
          profileApprovalStatus: true,
        },
      });

      if (!trainer) {
        return res.status(404).json({ error: 'Trainer not found' });
      }

      const trimmedNotes = notes?.trim() ? notes.trim() : null;
      const baseApprovalData = {
        profileApprovalStatus: status,
        profileApprovalNotes: trimmedNotes,
        profileApprovalUpdatedAt: new Date(),
      };
      const minimalApprovalData = {
        profileApprovalStatus: status,
        profileApprovalNotes: trimmedNotes,
      };

      let updatedTrainer;
      try {
        updatedTrainer = await prisma.trainer.update({
          where: { id: trainerId },
          data: {
            ...baseApprovalData,
            profileApprovedAt: status === 'APPROVED' ? new Date() : null,
            profileApprovedBy: status === 'APPROVED' ? req.user!.id : null,
          },
        });
      } catch (updateError: any) {
        // Some deployed databases are behind schema and can miss one or more
        // profile review audit columns. Retry with progressively smaller payloads.
        const missingColumn = String(updateError?.meta?.column || '');
        const isMissingApprovalAuditColumn =
          updateError?.code === 'P2022' &&
          (
            missingColumn.includes('profile_approved_at') ||
            missingColumn.includes('profile_approved_by')
          );

        if (!isMissingApprovalAuditColumn) {
          throw updateError;
        }

        console.warn('Trainer profile approval audit columns missing; retrying without approval audit fields.');
        try {
          updatedTrainer = await prisma.trainer.update({
            where: { id: trainerId },
            data: baseApprovalData,
          });
        } catch (fallbackError: any) {
          const fallbackMissingColumn = String(fallbackError?.meta?.column || '');
          const isMissingUpdatedAtColumn =
            fallbackError?.code === 'P2022' &&
            fallbackMissingColumn.includes('profile_approval_updated_at');

          if (!isMissingUpdatedAtColumn) {
            throw fallbackError;
          }

          console.warn('Trainer profile approval updated-at column missing; retrying with minimal profile review fields.');
          updatedTrainer = await prisma.trainer.update({
            where: { id: trainerId },
            data: minimalApprovalData,
          });
        }
      }

      const profileMessages = {
        APPROVED: {
          title: 'Trainer Profile Approved',
          message: 'Your trainer profile is approved and can now appear on the website.',
          type: 'SUCCESS' as const,
          actionType: 'APPROVE' as const,
        },
        DENIED: {
          title: 'Trainer Profile Changes Requested',
          message: `Your trainer profile needs updates before it can be published.${trimmedNotes ? ` Notes: ${trimmedNotes}` : ''}`,
          type: 'WARNING' as const,
          actionType: 'REJECT' as const,
        },
        PENDING_APPROVAL: {
          title: 'Trainer Profile Review Reset',
          message: 'Your trainer profile has been moved back to pending review.',
          type: 'INFO' as const,
          actionType: 'UPDATE' as const,
        },
      };

      const notification = profileMessages[status];
      await sendNotification({
        userId: trainer.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        relatedEntityType: 'trainer_profile',
        relatedEntityId: trainerId,
      }).catch((error) => {
        console.error('Error sending trainer profile review notification:', error);
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: notification.actionType,
        entityType: 'trainer_profile',
        entityId: trainerId,
        description: `${status === 'APPROVED' ? 'Approved' : status === 'DENIED' ? 'Requested changes for' : 'Reset review for'} trainer profile: ${trainer.fullName}`,
      });

      return res.json({
        message: 'Trainer profile review updated successfully',
        trainer: updatedTrainer,
      });
    } catch (error: any) {
      console.error('Update trainer profile approval error:', error);
      return res.status(500).json({ error: 'Failed to update trainer profile review', details: error.message });
    }
  }
);

// Update trainer (admin)
router.put(
  '/:id',
  [
    body('fullName').optional().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phoneNumber').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const trainerId = req.params.id;
      const updateData: any = {};

      // Only include fields that are provided
      if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
      /* Removed from schema
      if (req.body.specialization !== undefined) {
        updateData.areasOfExpertise = Array.isArray(req.body.specialization) 
          ? req.body.specialization 
          : [req.body.specialization];
      }
      */
      if (req.body.bio !== undefined) updateData.professionalBio = req.body.bio;
      if (req.body.hrdcCertified !== undefined) {
        updateData.hrdcAccreditationId = req.body.hrdcCertified ? 'HRDC-' + req.params.id : null;
      }
      if (req.body.state !== undefined) updateData.state = req.body.state;
      if (req.body.city !== undefined) updateData.city = req.body.city;
      if (req.body.country !== undefined) updateData.country = req.body.country;

      const trainer = await prisma.trainer.update({
        where: { id: trainerId },
        data: updateData,
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'trainer',
        entityId: trainerId,
        description: `Updated trainer: ${trainer.fullName}`,
      });

      return res.json({
        message: 'Trainer updated successfully',
        trainer,
      });
    } catch (error: any) {
      console.error('Update trainer error:', error);
      return res.status(500).json({ error: 'Failed to update trainer', details: error.message });
    }
  }
);

// Delete trainer (admin)
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: req.params.id },
      select: { fullName: true },
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    await prisma.trainer.delete({
      where: { id: req.params.id },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'trainer',
      entityId: req.params.id,
      description: `Deleted trainer: ${trainer.fullName}`,
    });

    return res.json({ message: 'Trainer deleted successfully' });
  } catch (error: any) {
    console.error('Delete trainer error:', error);
    return res.status(500).json({ error: 'Failed to delete trainer', details: error.message });
  }
});

// Get trainer weekly availability
router.get('/:id/availability/weekly', async (req: AuthRequest, res) => {
  try {
    const availability = await prisma.trainerWeeklyAvailability.findMany({
      where: { trainerId: req.params.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return res.json({ availability });
  } catch (error: any) {
    console.error('Get weekly availability error:', error);
    return res.status(500).json({ error: 'Failed to fetch availability', details: error.message });
  }
});

// Set trainer weekly availability
router.post('/:id/availability/weekly', async (req: AuthRequest, res) => {
  try {
    const { availability } = req.body; // Array of { dayOfWeek, startTime, endTime }

    // Delete existing availability
    await prisma.trainerWeeklyAvailability.deleteMany({
      where: { trainerId: req.params.id },
    });

    // Create new availability
    if (availability && Array.isArray(availability)) {
      await prisma.trainerWeeklyAvailability.createMany({
        data: availability.map((av: any) => ({
          trainerId: req.params.id,
          dayOfWeek: parseInt(av.dayOfWeek),
          startTime: av.startTime,
          endTime: av.endTime,
        })),
      });
    }

    const updated = await prisma.trainerWeeklyAvailability.findMany({
      where: { trainerId: req.params.id },
    });

    return res.json({ availability: updated });
  } catch (error: any) {
    console.error('Set weekly availability error:', error);
    return res.status(500).json({ error: 'Failed to set availability', details: error.message });
  }
});

// Get trainer blocked dates
router.get('/:id/blocked-dates', async (req: AuthRequest, res) => {
  try {
    const blockedDates = await prisma.trainerBlockedDate.findMany({
      where: { trainerId: req.params.id },
      orderBy: { blockedDate: 'asc' },
    });

    return res.json({ blockedDates });
  } catch (error: any) {
    console.error('Get blocked dates error:', error);
    return res.status(500).json({ error: 'Failed to fetch blocked dates', details: error.message });
  }
});

// Add blocked date
router.post(
  '/:id/blocked-dates',
  [
    body('blockedDate').isISO8601().toDate(),
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

      return res.status(201).json({ blockedDate: blocked });
    } catch (error: any) {
      console.error('Add blocked date error:', error);
      return res.status(500).json({ error: 'Failed to add blocked date', details: error.message });
    }
  }
);

// Remove blocked date
router.delete('/:id/blocked-dates/:dateId', async (req: AuthRequest, res) => {
  try {
    await prisma.trainerBlockedDate.delete({
      where: { id: req.params.dateId },
    });

    return res.json({ message: 'Blocked date removed successfully' });
  } catch (error: any) {
    console.error('Remove blocked date error:', error);
    return res.status(500).json({ error: 'Failed to remove blocked date', details: error.message });
  }
});

export default router;
