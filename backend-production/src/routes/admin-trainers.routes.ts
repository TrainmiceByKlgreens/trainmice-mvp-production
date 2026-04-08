import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { generateTrainerId } from '../utils/utils/sequentialId';
import { hashPassword } from '../utils/utils/password';

const router = express.Router();

// All routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all trainers (admin view - includes all fields)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { search, category, state } = req.query;

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
