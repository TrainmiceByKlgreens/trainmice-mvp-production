import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { sendNotification } from '../utils/utils/notificationHelper';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all custom course requests
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status) {
      // Convert status to uppercase to match enum values (PENDING, APPROVED, REJECTED, IN_PROGRESS)
      const statusStr = String(status).toUpperCase();
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'];
      if (validStatuses.includes(statusStr)) {
        where.status = statusStr;
      }
    }

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

    res.json({ requests });
  } catch (error: any) {
    console.error('Get requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
  }
});

// Approve request
router.put(
  '/:id/approve',
  [
    body('assignedTrainerId').notEmpty(),
    body('adminNotes').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { assignedTrainerId, adminNotes } = req.body;

      const request = await prisma.customCourseRequest.findUnique({
        where: { id: req.params.id },
      });

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Update request
      const updated = await prisma.customCourseRequest.update({
        where: { id: req.params.id },
        data: {
          status: 'APPROVED',
          assignedTrainerId,
          adminNotes: adminNotes || null,
        },
      });

      // Create course
      const course = await prisma.course.create({
        data: {
          title: request.courseName,
          description: request.reason || null,
          trainerId: assignedTrainerId,
          createdByAdmin: true,
          status: 'DRAFT',
          courseType: 'IN_HOUSE',
          durationHours: 8, // Default, can be updated later
        },
      });

      // Create notification
      if (request.clientId) {
        await sendNotification({
          userId: request.clientId,
          title: 'Course Request Approved',
          message: `Custom course request "${request.courseName}" has been approved.`,
          type: 'SUCCESS',
          relatedEntityType: 'custom_course_request',
          relatedEntityId: request.id,
        }).catch((err) => {
          console.error('Error sending course request approval notification:', err);
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'APPROVE',
        entityType: 'custom_course_request',
        entityId: request.id,
        description: `Approved course request: ${request.courseName}`,
      });

      return res.json({
        message: 'Request approved and course created',
        request: updated,
        course,
      });
    } catch (error: any) {
      console.error('Approve request error:', error);
      return res.status(500).json({ error: 'Failed to approve request', details: error.message });
    }
  }
);

// Reject request
router.put('/:id/reject', async (req: AuthRequest, res) => {
  try {
    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.customCourseRequest.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
    });

    // Create notification
    if (request.clientId) {
      await sendNotification({
        userId: request.clientId,
        title: 'Course Request Rejected',
        message: 'A custom course request has been rejected.',
        type: 'WARNING',
        relatedEntityType: 'custom_course_request',
        relatedEntityId: request.id,
      }).catch((err) => {
        console.error('Error sending course request rejection notification:', err);
      });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'REJECT',
      entityType: 'custom_course_request',
      entityId: request.id,
      description: `Rejected course request: ${request.courseName}`,
    });

    return res.json({ message: 'Request rejected', request: updated });
  } catch (error: any) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request', details: error.message });
  }
});

export default router;

