import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { broadcastUpdate } from '../lib/socket';
import { sendNotification } from '../utils/utils/notificationHelper';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all contact submissions (incoming messages)
router.get('/contact-submissions', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const where: any = {};
    // Note: ContactSubmission doesn't have a 'resolved' field in schema
    // You may need to add this field or use a different approach

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.contactSubmission.count({ where }),
    ]);

    return res.json({
      submissions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get contact submissions error:', error);
    return res.status(500).json({ error: 'Failed to fetch contact submissions', details: error.message });
  }
});

// Mark contact submission as read (previously resolve)
router.put('/contact-submissions/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const submission = await prisma.contactSubmission.findUnique({
      where: { id: req.params.id },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Contact submission not found' });
    }

    const updated = await prisma.contactSubmission.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'contact_submission',
      entityId: submission.id,
      description: `Marked contact submission as read`,
    });

    return res.json({ submission: updated, message: 'Contact submission marked as read' });
  } catch (error: any) {
    console.error('Read contact submission error:', error);
    return res.status(500).json({ error: 'Failed to mark contact submission as read', details: error.message });
  }
});

// Get all notifications (grouped by broadcast when applicable)
router.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const { isRead, userId, type, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // We do a raw query or a complex findMany to group by broadcastId
    // For simplicity in this implementation, we will fetch all notifications and group them in memory for now,
    // or use a distinct/groupBy approach. However, since we need to include user info for non-broadcasts,
    // we'll use a strategy where we fetch a subset and then handle grouping.

    // Better approach: fetch notifications but identify broadcasts
    const where: any = {};
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (userId) {
      where.userId = userId as string;
    }
    if (type) {
      where.type = type as string;
    }

    // To implement grouping by broadcastId while still allowing pagination,
    // we need to be clever. One way is to fetch "main" notification per broadcast.

    // First, get total count of unique entries (single notifications + unique broadcastIds)
    const [allNotifs] = await Promise.all([
      prisma.notification.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
      })
    ]);

    // Grouping logic
    const groupedNotifications: any[] = [];
    const seenBroadcasts = new Set<string>();

    for (const notif of allNotifs) {
      if (notif.isBroadcast && notif.broadcastId) {
        if (!seenBroadcasts.has(notif.broadcastId)) {
          groupedNotifications.push(notif);
          seenBroadcasts.add(notif.broadcastId);
        }
      } else {
        groupedNotifications.push(notif);
      }
    }

    const total = groupedNotifications.length;
    const paginatedNotifs = groupedNotifications.slice(skip, skip + limitNum);

    return res.json({
      notifications: paginatedNotifs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

// Send notification (targeted or global)
router.post(
  '/notifications/send',
  [
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('type').isIn(['INFO', 'WARNING', 'SUCCESS', 'ERROR']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, message, type, userId, userRole, relatedEntityType, relatedEntityId } = req.body;
      const broadcastId = `bc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // If userId is provided, send to specific user
      if (userId) {
        const notification = await sendNotification({
          userId,
          title,
          message,
          type,
          relatedEntityType: relatedEntityType || undefined,
          relatedEntityId: relatedEntityId || undefined,
        }) as any;

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CREATE',
          entityType: 'notification',
          entityId: notification.id,
          description: `Sent notification to user: ${userId}`,
        });

        return res.json({ notification, message: 'Notification sent successfully' });
      }

      // If userRole is provided, send to all users with that role
      if (userRole) {
        const users = await prisma.user.findMany({
          where: { role: userRole },
          select: { id: true },
        });

        const notifications = users.length > 0
          ? await sendNotification({
            userId: users.map((user) => user.id),
            title,
            message,
            type,
            relatedEntityType: relatedEntityType || undefined,
            relatedEntityId: relatedEntityId || undefined,
          })
          : [];

        const notificationList = Array.isArray(notifications) ? notifications : [notifications];

        for (const notification of notificationList) {
          const updatedNotification = await prisma.notification.update({
            where: { id: notification.id },
            data: {
              isBroadcast: true,
              broadcastId,
              targetRole: userRole,
            },
          });

          broadcastUpdate('notifications', 'UPDATE', {
            userId: updatedNotification.userId,
            notificationId: updatedNotification.id,
            broadcastId,
          });
        }

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CREATE',
          entityType: 'notification',
          entityId: undefined,
          description: `Sent ${notificationList.length} notifications to all ${userRole}s (Broadcast ID: ${broadcastId})`,
        });

        return res.json({ notifications: notificationList, count: notificationList.length, message: 'Notifications sent successfully' });
      }

      // Global notification - send to all users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const notifications = users.length > 0
        ? await sendNotification({
          userId: users.map((user) => user.id),
          title,
          message,
          type,
          relatedEntityType: relatedEntityType || undefined,
          relatedEntityId: relatedEntityId || undefined,
        })
        : [];

      const notificationList = Array.isArray(notifications) ? notifications : [notifications];

      for (const notification of notificationList) {
        const updatedNotification = await prisma.notification.update({
          where: { id: notification.id },
          data: {
            isBroadcast: true,
            broadcastId,
            targetRole: 'ALL',
          },
        });

        broadcastUpdate('notifications', 'UPDATE', {
          userId: updatedNotification.userId,
          notificationId: updatedNotification.id,
          broadcastId,
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CREATE',
        entityType: 'notification',
        entityId: undefined,
        description: `Sent ${notificationList.length} global notifications (Broadcast ID: ${broadcastId})`,
      });

      return res.json({ notifications: notificationList, count: notificationList.length, message: 'Global notifications sent successfully' });
    } catch (error: any) {
      console.error('Send notification error:', error);
      return res.status(500).json({ error: 'Failed to send notification', details: error.message });
    }
  }
);

// Mark notification as read
router.put('/notifications/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    broadcastUpdate('notifications', 'UPDATE', {
      userId: notification.userId,
      notificationId: notification.id,
    });

    return res.json({ notification });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

// Delete notification (handles grouped deletes for broadcasts)
router.delete('/notifications/:id', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.isBroadcast && notification.broadcastId) {
      const affectedNotifications = await prisma.notification.findMany({
        where: { broadcastId: notification.broadcastId },
        select: { id: true, userId: true },
      });

      // Delete all notifications in this broadcast
      await prisma.notification.deleteMany({
        where: { broadcastId: notification.broadcastId },
      });

      affectedNotifications.forEach((item) => {
        broadcastUpdate('notifications', 'DELETE', {
          userId: item.userId,
          notificationId: item.id,
          broadcastId: notification.broadcastId,
        });
      });
    } else {
      // Delete single notification
      await prisma.notification.delete({
        where: { id: req.params.id },
      });

      broadcastUpdate('notifications', 'DELETE', {
        userId: notification.userId,
        notificationId: notification.id,
      });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'notification',
      entityId: req.params.id,
      description: notification.isBroadcast ? `Deleted broadcast notification group: ${notification.broadcastId}` : 'Deleted single notification',
    });

    return res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ error: 'Failed to delete notification', details: error.message });
  }
});

export default router;
