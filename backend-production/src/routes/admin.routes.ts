import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get admin profile
router.get('/profile', async (req: AuthRequest, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    return res.json({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      adminCode: admin.adminCode,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    });
  } catch (error: any) {
    console.error('Get admin profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin profile', details: error.message });
  }
});

// Update admin profile
router.put(
  '/profile',
  [body('fullName').optional().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { fullName } = req.body;

      const admin = await prisma.admin.update({
        where: { id: req.user!.id },
        data: {
          fullName: fullName || undefined,
        },
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'admin',
        entityId: admin.id,
        description: `Updated admin profile`,
      });

      return res.json({
        message: 'Profile updated successfully',
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          adminCode: admin.adminCode,
        },
      });
    } catch (error: any) {
      console.error('Update admin profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
  }
);

// Import sub-routes
import adminTrainersRoutes from './admin-trainers.routes';
import adminTrainersEnhancedRoutes from './admin-trainers-enhanced.routes';
import adminDashboardRoutes from './admin-dashboard.routes';
import adminBookingsRoutes from './admin-bookings.routes';
import adminBookingsEnhancedRoutes from './admin-bookings-enhanced.routes';
import adminRequestsRoutes from './admin-requests.routes';
import adminMessagesRoutes from './admin-messages.routes';
import adminCoursesRoutes from './admin-courses.routes';
import adminCoursesEnhancedRoutes from './admin-courses-enhanced.routes';
import adminDocumentsRoutes from './admin-documents.routes';
import adminLogsRoutes from './admin-logs.routes';
import adminClientsRoutes from './admin-clients.routes';
import adminSettingsRoutes from './admin-settings.routes';
import adminEventsRoutes from './admin-events.routes';
import adminTrainerMessagesRoutes from './admin-trainer-messages.routes';

// Mount sub-routes
router.use('/trainers', adminTrainersRoutes);
router.use('/trainers', adminTrainersEnhancedRoutes);
router.use('/dashboard', adminDashboardRoutes);
router.use('/bookings', adminBookingsRoutes);
router.use('/bookings', adminBookingsEnhancedRoutes);
router.use('/custom-requests', adminRequestsRoutes);
router.use('/messages', adminMessagesRoutes);
router.use('/courses', adminCoursesRoutes);
router.use('/courses', adminCoursesEnhancedRoutes);
router.use('/documents', adminDocumentsRoutes);
router.use('/logs', adminLogsRoutes);
router.use('/clients', adminClientsRoutes);
router.use('/settings', adminSettingsRoutes);
router.use('/events', adminEventsRoutes);
router.use('/', adminTrainerMessagesRoutes);

export default router;

