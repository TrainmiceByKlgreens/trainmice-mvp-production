import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { admin } from '../config/firebaseAdmin';
import { createActivityLog } from '../utils/utils/activityLogger';

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

    res.json({
      submissions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get contact submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch contact submissions', details: error.message });
  }
});

// Mark contact submission as resolved
router.put('/contact-submissions/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    // Note: ContactSubmission doesn't have a 'resolved' field
    // You may need to add this field to the schema or use adminNotes
    const submission = await prisma.contactSubmission.findUnique({
      where: { id: req.params.id },
    });

    if (!submission) {
      return res.status(404).json({ error: 'Contact submission not found' });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'contact_submission',
      entityId: submission.id,
      description: `Marked contact submission as resolved`,
    });

    return res.json({ message: 'Contact submission marked as resolved' });
  } catch (error: any) {
    console.error('Resolve contact submission error:', error);
    return res.status(500).json({ error: 'Failed to resolve contact submission', details: error.message });
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

    res.json({
      notifications: paginatedNotifs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
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
        const notification = await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            relatedEntityType: relatedEntityType || null,
            relatedEntityId: relatedEntityId || null,
          },
        });

        // Send FCM notification
        const receiver = await prisma.user.findUnique({
          where: { id: userId },
          select: { fcmToken: true }
        });

        if (receiver?.fcmToken) {
          admin.messaging().send({
            token: receiver.fcmToken,
            data: {
              type: 'MESSAGE',
              title,
              body: message
            },
            notification: {
              title,
              body: message
            }
          }).catch((err) => console.error(`Failed to send FCM to user ${userId}:`, err));
        }

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

        const notifications = await Promise.all(
          users.map((user) =>
            prisma.notification.create({
              data: {
                userId: user.id,
                title,
                message,
                type,
                isBroadcast: true,
                broadcastId,
                targetRole: userRole,
                relatedEntityType: relatedEntityType || null,
                relatedEntityId: relatedEntityId || null,
              },
            })
          )
        );

        // Send FCM notifications to all users with tokens
        const usersWithToken = await prisma.user.findMany({
          where: { role: userRole, fcmToken: { not: null } },
          select: { fcmToken: true }
        });

        if (usersWithToken.length > 0) {
          Promise.all(usersWithToken.map(u =>
            admin.messaging().send({
              token: u.fcmToken!,
              data: {
                type: 'MESSAGE',
                title,
                body: message
              },
              notification: {
                title,
                body: message
              }
            }).catch(() => null)
          ));
        }

        await createActivityLog({
          userId: req.user!.id,
          actionType: 'CREATE',
          entityType: 'notification',
          entityId: undefined,
          description: `Sent ${notifications.length} notifications to all ${userRole}s (Broadcast ID: ${broadcastId})`,
        });

        return res.json({ notifications, count: notifications.length, message: 'Notifications sent successfully' });
      }

      // Global notification - send to all users
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const notifications = await Promise.all(
        users.map((user) =>
          prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type,
              isBroadcast: true,
              broadcastId,
              targetRole: 'ALL',
              relatedEntityType: relatedEntityType || null,
              relatedEntityId: relatedEntityId || null,
            },
          })
        )
      );

      // Send Global FCM notifications
      const usersWithToken = await prisma.user.findMany({
        where: { fcmToken: { not: null } },
        select: { fcmToken: true }
      });

      if (usersWithToken.length > 0) {
        Promise.all(usersWithToken.map(u =>
          admin.messaging().send({
            token: u.fcmToken!,
            data: {
              type: 'MESSAGE',
              title,
              body: message
            },
            notification: {
              title,
              body: message
            }
          }).catch(() => null)
        ));
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CREATE',
        entityType: 'notification',
        entityId: undefined,
        description: `Sent ${notifications.length} global notifications (Broadcast ID: ${broadcastId})`,
      });

      return res.json({ notifications, count: notifications.length, message: 'Global notifications sent successfully' });
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

    res.json({ notification });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
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
      // Delete all notifications in this broadcast
      await prisma.notification.deleteMany({
        where: { broadcastId: notification.broadcastId },
      });
    } else {
      // Delete single notification
      await prisma.notification.delete({
        where: { id: req.params.id },
      });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'notification',
      entityId: req.params.id,
      description: notification.isBroadcast ? `Deleted broadcast notification group: ${notification.broadcastId}` : 'Deleted single notification',
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification', details: error.message });
  }
});

export default router;
