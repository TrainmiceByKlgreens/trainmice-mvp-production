import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { hashPassword } from '../utils/utils/password';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all admin accounts
router.get('/admins', async (_req: AuthRequest, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ admins });
  } catch (error: any) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins', details: error.message });
  }
});

// Create admin account
router.post(
  '/admins',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('fullName').optional().trim(),
    body('adminCode').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, adminCode } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: await hashPassword(password),
          fullName: fullName || null,
          role: 'ADMIN',
          emailVerified: true,
        },
      });

      // Create admin profile
      const admin = await prisma.admin.create({
        data: {
          id: user.id,
          email,
          fullName: fullName || null,
          adminCode: adminCode || null,
        },
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CREATE',
        entityType: 'admin',
        entityId: admin.id,
        description: `Created admin account: ${email}`,
      });

      return res.status(201).json({ admin, message: 'Admin account created successfully' });
    } catch (error: any) {
      console.error('Create admin error:', error);
      return res.status(500).json({ error: 'Failed to create admin account', details: error.message });
    }
  }
);

// Update admin account
router.put(
  '/admins/:id',
  [
    body('fullName').optional().trim(),
    body('adminCode').optional().trim(),
    body('password').optional().isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const admin = await prisma.admin.findUnique({
        where: { id: req.params.id },
      });

      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const updateData: any = {};
      if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
      if (req.body.adminCode !== undefined) updateData.adminCode = req.body.adminCode;

      const updated = await prisma.admin.update({
        where: { id: req.params.id },
        data: updateData,
      });

      // Update password if provided
      if (req.body.password) {
        await prisma.user.update({
          where: { id: req.params.id },
          data: {
            passwordHash: await hashPassword(req.body.password),
          },
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'admin',
        entityId: admin.id,
        description: `Updated admin account`,
      });

      return res.json({ admin: updated, message: 'Admin account updated successfully' });
    } catch (error: any) {
      console.error('Update admin error:', error);
      return res.status(500).json({ error: 'Failed to update admin account', details: error.message });
    }
  }
);

// Delete admin account
router.delete('/admins/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Prevent self-deletion
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: req.params.id },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Delete admin (user will be cascade deleted)
    await prisma.admin.delete({
      where: { id: req.params.id },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'admin',
      entityId: req.params.id,
      description: `Deleted admin account: ${admin.email}`,
    });

    return res.json({ message: 'Admin account deleted successfully' });
  } catch (error: any) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ error: 'Failed to delete admin account', details: error.message });
  }
});

// Get platform settings (placeholder - you can create a settings table)
router.get('/platform', async (_req: AuthRequest, res: Response) => {
  try {
    // This would typically come from a settings table
    // For now, return default settings
    res.json({
      settings: {
        platformName: 'TrainMICE',
        maintenanceMode: false,
        allowTrainerRegistration: true,
        allowClientRegistration: true,
        emailNotificationsEnabled: true,
        hrdcExpiryAlertDays: 30,
      },
    });
  } catch (error: any) {
    console.error('Get platform settings error:', error);
    res.status(500).json({ error: 'Failed to fetch platform settings', details: error.message });
  }
});

// Update platform settings
router.put(
  '/platform',
  [
    body('maintenanceMode').optional().isBoolean(),
    body('allowTrainerRegistration').optional().isBoolean(),
    body('allowClientRegistration').optional().isBoolean(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // This would typically update a settings table
      // For now, just log the activity

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'platform_settings',
        entityId: undefined,
        description: 'Updated platform settings',
        metadata: req.body,
      });

      return res.json({ message: 'Platform settings updated successfully', settings: req.body });
    } catch (error: any) {
      console.error('Update platform settings error:', error);
      return res.status(500).json({ error: 'Failed to update platform settings', details: error.message });
    }
  }
);

export default router;

