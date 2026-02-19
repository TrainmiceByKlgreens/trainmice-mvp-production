import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/utils/notificationHelper';

const router = express.Router();

// Get custom course requests
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    // Clients see their own requests
    if (req.user!.role === 'CLIENT') {
      where.clientId = req.user!.id;
    }
    // Admins see all

    const requests = await prisma.customCourseRequest.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            userName: true,
            companyEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ requests });
  } catch (error: any) {
    console.error('Get custom requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch custom requests', details: error.message });
  }
});

// Create custom course request (authenticated client)
router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  [
    body('courseName').trim().notEmpty(),
    body('contactPerson').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const requestData = {
        ...req.body,
        clientId: req.user!.id,
      };

      const request = await prisma.customCourseRequest.create({
        data: requestData,
        include: {
          client: {
            select: {
              id: true,
              userName: true,
              companyEmail: true,
            },
          },
        },
      });

      // Notify all admins about the new training request
      try {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true }
        });

        if (admins.length > 0) {
          await sendNotification({
            userId: admins.map(admin => admin.id),
            title: 'New Training Request',
            message: `A new training request for "${request.courseName}" has been submitted by ${request.contactPerson}.`,
            type: 'INFO',
            relatedEntityType: 'custom_course_request',
            relatedEntityId: request.id,
          });
        }
      } catch (notifyError) {
        console.error('Error notifying admins about new training request:', notifyError);
      }

      return res.status(201).json({ request });
    } catch (error: any) {
      console.error('Create custom request error:', error);
      return res.status(500).json({ error: 'Failed to create custom request', details: error.message });
    }
  }
);

// Update custom course request status (admin only)
router.put(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, adminNotes, assignedTrainerId } = req.body;

      const request = await prisma.customCourseRequest.update({
        where: { id },
        data: {
          status,
          adminNotes,
          assignedTrainerId,
        },
        include: {
          client: true,
        },
      });

      return res.json({ request });
    } catch (error: any) {
      console.error('Update custom request error:', error);
      return res.status(500).json({ error: 'Failed to update custom request', details: error.message });
    }
  }
);

export default router;

