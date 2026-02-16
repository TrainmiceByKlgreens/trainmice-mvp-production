import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';
import { admin } from '../config/firebaseAdmin';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all trainer message threads (with unread counts)
router.get('/trainer-messages', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', isRead } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for threads
    const where: any = {};
    if (isRead !== undefined) {
      // If filtering by read status, check if there are unread messages
      if (isRead === 'true') {
        where.unreadCount = 0;
      } else {
        where.unreadCount = { gt: 0 };
      }
    }

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where,
        include: {
          trainer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just get the latest message for preview
          },
        },
        orderBy: { lastMessageTime: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.messageThread.count({ where }),
    ]);

    // Also fetch legacy TrainerMessage for backward compatibility
    const legacyWhere: any = {};
    if (isRead !== undefined) {
      legacyWhere.isRead = isRead === 'true';
    }

    const [legacyMessages] = await Promise.all([
      prisma.trainerMessage.findMany({
        where: legacyWhere,
        include: {
          trainer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { lastMessageTime: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      threads,
      legacyMessages, // For backward compatibility
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      unreadCount: await (async () => {
        // Count unread threads
        const unreadThreadsCount = await prisma.messageThread.count({
          where: { unreadCount: { gt: 0 } },
        });

        // Count unread legacy messages that don't have a corresponding thread
        const unreadLegacyCount = await prisma.trainerMessage.count({
          where: { isRead: false },
        });

        return Math.max(unreadThreadsCount, unreadLegacyCount);
      })(),
      unreadStatus: await (async () => {
        // Get all unread thread counts
        const unreadThreads = await prisma.messageThread.findMany({
          where: { unreadCount: { gt: 0 } },
          select: { trainerId: true, unreadCount: true },
        });

        // Get all unread legacy counts (approximate as 1 per trainer for simplicity or count them)
        // Grouping by trainerId is ideal, but for now we find distinct trainers with unread legacy
        const unreadLegacyMessages = await prisma.trainerMessage.findMany({
          where: { isRead: false },
          select: { trainerId: true },
        });

        const statusMap: Record<string, number> = {};

        // Populate with threads first (source of truth)
        unreadThreads.forEach(t => {
          statusMap[t.trainerId] = t.unreadCount;
        });

        // Fill gaps with legacy (if not already set)
        unreadLegacyMessages.forEach(msg => {
          if (!statusMap[msg.trainerId]) {
            statusMap[msg.trainerId] = 1; // Assume 1 for legacy if not threaded
          }
        });

        return statusMap;
      })(),
    });
  } catch (error: any) {
    console.error('Get trainer messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch trainer messages', details: error.message });
  }
});

// Get specific thread with all messages
router.get('/trainer-messages/:trainerId/thread', async (req: AuthRequest, res: Response) => {
  try {
    const { trainerId } = req.params;

    let thread = await prisma.messageThread.findFirst({
      where: { trainerId },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // If no thread exists, return empty structure
    if (!thread) {
      const trainer = await prisma.trainer.findUnique({
        where: { id: trainerId },
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      });

      return res.json({
        thread: null,
        trainer,
        messages: [],
      });
    }

    // Mark trainer messages as read when admin views the thread
    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        senderType: 'TRAINER',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Also mark legacy trainer message as read
    await prisma.trainerMessage.updateMany({
      where: { trainerId: thread.trainerId },
      data: { isRead: true },
    });

    // Update thread unread count
    thread = await prisma.messageThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return res.json({
      thread,
      messages: thread.messages,
    });
  } catch (error: any) {
    console.error('Get thread error:', error);
    return res.status(500).json({ error: 'Failed to fetch thread', details: error.message });
  }
});

// Admin replies to trainer message
router.post(
  '/trainer-messages/:trainerId/reply',
  [
    body('message').notEmpty().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { trainerId } = req.params;
      const { message } = req.body;
      const adminId = req.user!.id;

      // Get or create thread
      let thread = await prisma.messageThread.findFirst({
        where: { trainerId },
      });

      if (!thread) {
        thread = await prisma.messageThread.create({
          data: {
            trainerId,
            lastMessage: message,
            lastMessageTime: new Date(),
            lastMessageBy: 'ADMIN',
            unreadCount: 0, // Trainer will see this as unread
          },
        });
      } else {
        thread = await prisma.messageThread.update({
          where: { id: thread.id },
          data: {
            lastMessage: message,
            lastMessageTime: new Date(),
            lastMessageBy: 'ADMIN',
            unreadCount: 0, // Reset unread count when admin sends new message
          },
        });
      }

      // Create the message
      const newMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          senderType: 'ADMIN',
          senderId: adminId,
          message: message.trim(),
          isRead: false, // Trainer needs to read it
        },
      });

      console.log('✅ Message saved to database:', newMessage.id);

      // Trigger Firebase Cloud Messaging if receiver has fcmToken
      try {
        const receiver = await prisma.user.findUnique({
          where: { id: trainerId },
          select: { fcmToken: true }
        });

        if (receiver?.fcmToken) {
          await admin.messaging().send({
            token: receiver.fcmToken,
            data: {
              type: 'MESSAGE',
              title: 'You have a new message',
              body: message.trim()
            },
            notification: {
              title: 'You have a new message',
              body: message.trim()
            }
          });
          console.log('✅ FCM push notification sent to trainer:', trainerId);
        }
      } catch (fcmError) {
        console.error('❌ FCM push notification failed:', fcmError);
        // Do not break the message creation flow if FCM fails
      }

      await createActivityLog({
        userId: adminId,
        actionType: 'CREATE',
        entityType: 'message',
        entityId: newMessage.id,
        description: `Replied to trainer message`,
      });

      return res.status(201).json({
        message: 'Reply sent successfully',
        thread,
        newMessage,
      });
    } catch (error: any) {
      console.error('Reply error:', error);
      return res.status(500).json({ error: 'Failed to send reply', details: error.message });
    }
  }
);

// Get all event enquiries
router.get('/event-enquiries', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', isRead, eventId } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }
    if (eventId) {
      where.eventId = eventId as string;
    }

    const [enquiries, total] = await Promise.all([
      prisma.eventEnquiry.findMany({
        where,
        include: {
          trainer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              venue: true,
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Just get the latest message for preview
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy: { lastMessageTime: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.eventEnquiry.count({ where }),
    ]);

    res.json({
      enquiries,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get event enquiries error:', error);
    res.status(500).json({ error: 'Failed to fetch event enquiries', details: error.message });
  }
});

// Mark trainer message thread as read (legacy support)
router.put('/trainer-messages/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const message = await prisma.trainerMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'trainer_message',
      entityId: message.id,
      description: 'Marked trainer message as read',
    });

    res.json({ message });
  } catch (error: any) {
    console.error('Mark trainer message as read error:', error);
    res.status(500).json({ error: 'Failed to mark message as read', details: error.message });
  }
});

// Mark event enquiry as read
router.put('/event-enquiries/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const enquiry = await prisma.eventEnquiry.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'event_enquiry',
      entityId: enquiry.id,
      description: 'Marked event enquiry as read',
    });

    // Also update unread count to 0
    await prisma.eventEnquiry.update({
      where: { id: req.params.id },
      data: { unreadCount: 0 },
    });

    res.json({ enquiry });
  } catch (error: any) {
    console.error('Mark event enquiry as read error:', error);
    res.status(500).json({ error: 'Failed to mark enquiry as read', details: error.message });
  }
});

export default router;
