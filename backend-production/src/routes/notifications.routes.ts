import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/utils/notificationHelper';
import { broadcastUpdate } from '../lib/socket';

const router = express.Router();

router.use(authenticate);

// Get notifications for authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '50', type, isRead } = req.query;
    const userId = req.user!.id;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (type) {
      where.type = type as string;
    }
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    return res.json({
      notifications,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Ensure user can only mark their own notifications as read
    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    broadcastUpdate('notifications', 'UPDATE', { userId: notification.userId });

    return res.json({ notification: updated });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);
    return res.status(500).json({ error: 'Failed to mark notification as read', details: error.message });
  }
});

// Mark all notifications as read for current user
router.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    broadcastUpdate('notifications', 'UPDATE', { userId });

    return res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read', details: error.message });
  }
});

// ========== Firebase Cloud Messaging Endpoints ==========

// Send message notification to trainer via FCM
router.post('/admin/send-message', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, messageText } = req.body;

    // Validate input
    if (!trainerId || !messageText) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'trainerId and messageText are required'
      });
    }

    // Fetch trainer's user record to get FCM token
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { fcmToken: true, fullName: true, role: true }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Check if user is actually a trainer
    if (trainer.role !== 'TRAINER') {
      return res.status(400).json({ error: 'User is not a trainer' });
    }

    // Check if trainer has FCM token
    if (!trainer.fcmToken) {
      console.warn(`Trainer ${trainerId} does not have an FCM token registered`);
      return res.status(200).json({
        success: true,
        message: 'Trainer does not have FCM token registered. Notification not sent.',
        fcmTokenMissing: true
      });
    }

    // Send notification using helper (this will create a DB record and send FCM)
    await sendNotification({
      userId: trainerId,
      title: 'New Message from Admin',
      message: messageText,
      type: 'INFO',
      relatedEntityType: 'message',
    });

    console.log(`✅ Message notification sent to trainer ${trainerId}`);
    return res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error: any) {
    console.error('Send message notification error:', error);

    // Handle Firebase-specific errors
    if (error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered') {
      return res.status(400).json({
        error: 'Invalid or expired FCM token',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// Send general notification to trainer via FCM
router.post('/admin/send-notification', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, notificationText } = req.body;

    // Validate input
    if (!trainerId || !notificationText) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'trainerId and notificationText are required'
      });
    }

    // Fetch trainer's user record to get FCM token
    const trainer = await prisma.user.findUnique({
      where: { id: trainerId },
      select: { fcmToken: true, fullName: true, role: true }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Check if user is actually a trainer
    if (trainer.role !== 'TRAINER') {
      return res.status(400).json({ error: 'User is not a trainer' });
    }

    // Check if trainer has FCM token
    if (!trainer.fcmToken) {
      console.warn(`Trainer ${trainerId} does not have an FCM token registered`);
      return res.status(200).json({
        success: true,
        message: 'Trainer does not have FCM token registered. Notification not sent.',
        fcmTokenMissing: true
      });
    }

    // Send notification using helper
    await sendNotification({
      userId: trainerId,
      title: 'New Notification',
      message: notificationText,
      type: 'INFO',
      relatedEntityType: 'notification',
    });

    console.log(`✅ General notification sent to trainer ${trainerId}`);
    return res.json({ success: true, message: 'Notification sent successfully' });
  } catch (error: any) {
    console.error('Send general notification error:', error);

    // Handle Firebase-specific errors
    if (error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered') {
      return res.status(400).json({
        error: 'Invalid or expired FCM token',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// Send Training Request pop-up notification to trainer via FCM
router.post('/admin/send-training-request', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId, courseTitle } = req.body;

    if (!trainerId || !courseTitle) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'trainerId and courseTitle are required'
      });
    }

    // Send notification using helper
    await sendNotification({
      userId: trainerId,
      title: 'New Training Request',
      message: `There's a new training request for "${courseTitle}".`,
      type: 'WARNING',
      relatedEntityType: 'training_request',
    });

    console.log(`✅ Training Request notification sent to trainer ${trainerId}`);
    return res.json({ success: true, message: 'Training request notification sent successfully' });
  } catch (error: any) {
    console.error('Send training request notification error:', error);
    return res.status(500).json({
      error: 'Failed to send notification',
      details: error.message
    });
  }
});

// Update FCM token for authenticated user
router.put('/fcm-token', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;

    if (!token) {
      return res.status(400).json({
        error: 'Missing required field',
        details: 'FCM token is required'
      });
    }

    // Update user's FCM token in database
    await prisma.user.update({
      where: { id: userId },
      data: { fcmToken: token }
    });

    console.log(`✅ FCM token updated for user ${userId}`);
    return res.json({
      success: true,
      message: 'FCM token updated successfully'
    });
  } catch (error: any) {
    console.error('Update FCM token error:', error);
    return res.status(500).json({
      error: 'Failed to update FCM token',
      details: error.message
    });
  }
});

// Get sidebar notification counts for red dots
router.get('/sidebar-counts', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    if (userRole === 'ADMIN') {
      const [
        unreadMessages,
        pendingCourses,
        unreadInHouseBookings,
        unreadPublicBookings,
        unreadCourseRequests,
        unreadTrainerNotes,
        unreadEventRegistrations,
        unreadContactSubmissions,
        unreadEventEnquiries
      ] = await Promise.all([
        prisma.trainerMessage.count({ where: { isRead: false } }),
        prisma.course.count({ where: { status: 'PENDING_APPROVAL' } }),
        prisma.bookingRequest.count({ where: { isRead: false, requestType: 'INHOUSE' } }),
        prisma.bookingRequest.count({ where: { isRead: false, requestType: 'PUBLIC' } }),
        prisma.customCourseRequest.count({ where: { isRead: false } }),
        prisma.courseNote.count({ where: { isRead: false } }),
        prisma.eventRegistration.count({ where: { isRead: false } }),
        prisma.contactSubmission.count({ where: { isRead: false } }),
        prisma.eventEnquiry.count({ where: { isRead: false } }),
      ]);

      return res.json({
        unreadMessages,
        pendingCourses,
        unreadInHouseBookings,
        unreadPublicBookings,
        unreadCourseRequests,
        unreadTrainerNotes,
        unreadEventRegistrations,
        unreadContactSubmissions,
        unreadEventEnquiries,
        // Legacy support
        unreadBookings: unreadInHouseBookings + unreadPublicBookings,
      });

    } else if (userRole === 'TRAINER') {
      const trainer = await prisma.trainer.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!trainer) {
        return res.status(404).json({ error: 'Trainer record not found' });
      }

      const [unreadAdminNotes, newCourseStatus, unreadMessages, unreadBookingRequests] = await Promise.all([
        // Unread notes from admin for courses this trainer is associated with
        prisma.adminCourseNote.count({
          where: {
            course: {
              OR: [
                { trainerId: trainer.id },
                { courseTrainers: { some: { trainerId: trainer.id } } }
              ]
            },
            type: 'TO_TRAINER',
            isRead: false
          }
        }),
        // Courses with status changes that haven't been read (owner or co-trainer)
        prisma.course.count({
          where: {
            OR: [
              { trainerId: trainer.id },
              { courseTrainers: { some: { trainerId: trainer.id } } }
            ],
            isRead: false,
            status: { in: ['APPROVED', 'DENIED'] }
          }
        }),
        // Unread messages in the main thread
        prisma.messageThread.findFirst({
          where: { trainerId: userId },
          select: { unreadCount: true }
        }).then(thread => thread?.unreadCount || 0),
        // UNREAD Booking Requests for this trainer
        prisma.bookingRequest.count({
          where: {
            trainerId: trainer.id,
            isRead: false,
            status: 'PENDING'
          }
        })
      ]);

      return res.json({
        unreadAdminNotes,
        newCourseStatus,
        unreadMessages,
        unreadBookingRequests
      });
    }

    return res.json({});
  } catch (error: any) {
    console.error('Get sidebar counts error:', error);
    return res.status(500).json({ error: 'Failed to fetch sidebar counts', details: error.message });
  }
});

export default router;

