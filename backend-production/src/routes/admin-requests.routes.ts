import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { sendNotification } from '../utils/utils/notificationHelper';
import { broadcastUpdate } from '../lib/socket';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all custom course requests
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, includeHidden } = req.query;

    const where: any = {};

    // Hide hidden requests by default
    if (includeHidden !== 'true') {
      where.isHidden = false;
    }

    if (status) {
      // Convert status to uppercase to match enum values (PENDING, TBC, REJECTED, IN_PROGRESS)
      const statusStr = String(status).toUpperCase();
      const validStatuses = ['PENDING', 'TBC', 'REJECTED', 'IN_PROGRESS', 'COURSE_OUTLINE_PENDING', 'COURSE_OUTLINE_READY'];
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

    // Item-level mark-as-read is handled in the individual GET /:id route

    return res.json({ requests });
  } catch (error: any) {
    console.error('Get requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch requests', details: error.message });
  }
});

// Get single request
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
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

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Mark as read when individual request is fetched
    if (!request.isRead) {
      await prisma.customCourseRequest.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      broadcastUpdate('custom_course_requests', 'UPDATE', {});
    }

    return res.json({ request });
  } catch (error: any) {
    console.error('Get request error:', error);
    return res.status(500).json({ error: 'Failed to fetch request', details: error.message });
  }
});

// Approve request
router.put(
  '/:id/approve',
  [
    body('assignedTrainerId').optional().trim(),
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
          status: 'TBC',
          assignedTrainerId: assignedTrainerId || null,
          adminNotes: adminNotes || null,
        },
      });

      // Create course
      const course = await prisma.course.create({
        data: {
          title: request.courseName,
          description: request.reason || null,
          trainerId: assignedTrainerId || null,
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

      broadcastUpdate('custom_course_requests', 'UPDATE', {});

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
    const { reason } = req.body;

    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.customCourseRequest.update({
      where: { id: req.params.id },
      data: { 
        status: 'REJECTED',
        adminNotes: reason || null,
      },
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

    broadcastUpdate('custom_course_requests', 'UPDATE', {});

    return res.json({ message: 'Request rejected', request: updated });
  } catch (error: any) {
    console.error('Reject request error:', error);
    return res.status(500).json({ error: 'Failed to reject request', details: error.message });
  }
});

// Update request status (generic)
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status, trainerId, adminNotes } = req.body;

    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const data: any = { status };
    if (trainerId !== undefined) data.assignedTrainerId = trainerId || null;
    if (adminNotes !== undefined) data.adminNotes = adminNotes || null;

    const updated = await prisma.customCourseRequest.update({
      where: { id: req.params.id },
      data,
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'custom_course_request',
      entityId: request.id,
      description: `Updated course request status to ${status}: ${request.courseName}`,
    });

    broadcastUpdate('custom_course_requests', 'UPDATE', {});

    return res.json({ message: 'Request status updated', request: updated });
  } catch (error: any) {
    console.error('Update request status error:', error);
    return res.status(500).json({ error: 'Failed to update request status', details: error.message });
  }
});

// Toggle hide status
router.patch('/:id/toggle-hide', async (req: AuthRequest, res) => {
  try {
    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const updated = await prisma.customCourseRequest.update({
      where: { id: req.params.id },
      data: { isHidden: !request.isHidden },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'custom_course_request',
      entityId: request.id,
      description: `${updated.isHidden ? 'Hid' : 'Unhid'} custom request for ${request.companyName || request.contactPerson}`,
      metadata: { isHidden: updated.isHidden },
    });

    broadcastUpdate('custom_course_requests', 'UPDATE', {});

    return res.json({ message: `Request ${updated.isHidden ? 'hidden' : 'unhidden'} successfully`, request: updated });
  } catch (error: any) {
    console.error('Toggle hide request error:', error);
    return res.status(500).json({ error: 'Failed to toggle hide status', details: error.message });
  }
});

// Delete request
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const request = await prisma.customCourseRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await prisma.customCourseRequest.delete({
      where: { id: req.params.id },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'custom_course_request',
      entityId: req.params.id,
      description: `Permanently deleted custom request for ${request.companyName || request.contactPerson}`,
      metadata: { companyName: request.companyName, contactPerson: request.contactPerson },
    });

    broadcastUpdate('course_requests', 'UPDATE', {});

    return res.json({ message: 'Request permanently deleted successfully' });
  } catch (error: any) {
    console.error('Delete request error:', error);
    return res.status(500).json({ error: 'Failed to delete request', details: error.message });
  }
});

export default router;
