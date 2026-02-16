import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);
router.use(authorize('TRAINER'));

// Send message to admin (creates or updates thread)
router.post(
  '/',
  [
    body('message').notEmpty().trim(),
    body('subject').optional().trim(),
    body('relatedEntityType').optional().trim(),
    body('relatedEntityId').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { message, subject, relatedEntityType, relatedEntityId } = req.body;
      const trainerId = req.user!.id;

      // If it's an event enquiry, create EventEnquiry with first message
      if (relatedEntityType === 'event' && relatedEntityId) {
        // Check if enquiry already exists for this event and trainer
        let enquiry = await prisma.eventEnquiry.findFirst({
          where: {
            eventId: relatedEntityId,
            trainerId,
          },
        });

        if (!enquiry) {
          // Create new enquiry
          enquiry = await prisma.eventEnquiry.create({
            data: {
              eventId: relatedEntityId,
              trainerId,
              message: message.trim(), // Initial message stored in enquiry
              subject: subject || `Enquiry about event`,
              isRead: false,
              lastMessageTime: new Date(),
              lastMessageBy: 'TRAINER',
              unreadCount: 1,
            },
          });
        } else {
          // Update existing enquiry
          enquiry = await prisma.eventEnquiry.update({
            where: { id: enquiry.id },
            data: {
              lastMessageTime: new Date(),
              lastMessageBy: 'TRAINER',
              unreadCount: { increment: 1 },
            },
          });
        }

        // Create the message in the conversation
        await prisma.eventEnquiryMessage.create({
          data: {
            enquiryId: enquiry.id,
            senderType: 'TRAINER',
            senderId: trainerId,
            message: message.trim(),
            isRead: false,
          },
        });

        await createActivityLog({
          userId: trainerId,
          actionType: 'CREATE',
          entityType: 'event_enquiry',
          entityId: enquiry.id,
          description: `Sent event enquiry to admin`,
        });

        return res.status(201).json({
          message: 'Event enquiry sent successfully',
          isEventEnquiry: true,
          enquiry,
        });
      }

      // Regular message - create or update thread
      let thread = await prisma.messageThread.findFirst({
        where: { trainerId },
      });

      if (!thread) {
        thread = await prisma.messageThread.create({
          data: {
            trainerId,
            lastMessage: message,
            lastMessageTime: new Date(),
            lastMessageBy: 'TRAINER',
            unreadCount: 1, // First unread message for admin
          },
        });
      } else {
        thread = await prisma.messageThread.update({
          where: { id: thread.id },
          data: {
            lastMessage: message,
            lastMessageTime: new Date(),
            lastMessageBy: 'TRAINER',
            unreadCount: { increment: 1 }, // Increment unread count for admin
          },
        });
      }

      // Create the message
      const newMessage = await prisma.message.create({
        data: {
          threadId: thread.id,
          senderType: 'TRAINER',
          senderId: trainerId,
          message: message.trim(),
          isRead: false, // Admin needs to read it
        },
      });

      // Legacy: Update TrainerMessage for backward compatibility
      let trainerMessage = await prisma.trainerMessage.findUnique({
        where: { trainerId },
      });

      if (!trainerMessage) {
        trainerMessage = await prisma.trainerMessage.create({
          data: {
            trainerId,
            lastMessage: message,
            platform: 'WEBSITE',
            isRead: false,
          },
        });
      } else {
        trainerMessage = await prisma.trainerMessage.update({
          where: { trainerId },
          data: {
            lastMessage: message,
            lastMessageTime: new Date(),
            isRead: false,
          },
        });
      }

      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'message',
        entityId: newMessage.id,
        description: `Sent message to admin`,
      });

      return res.status(201).json({
        message: 'Message sent successfully',
        thread,
        newMessage,
      });
    } catch (error: any) {
      console.error('Send message error:', error);
      return res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
  }
);

// Get trainer's conversation thread with all messages
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = req.user!.id;

    // Get or create thread
    let thread = await prisma.messageThread.findFirst({
      where: { trainerId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // If no thread exists, return empty thread structure
    if (!thread) {
      return res.json({
        thread: null,
        messages: [],
      });
    }

    // Mark admin messages as read when trainer views the thread
    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        senderType: 'ADMIN',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update thread unread count
    thread = await prisma.messageThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return res.json({
      thread,
      messages: thread.messages,
    });
  } catch (error: any) {
    console.error('Get trainer message error:', error);
    return res.status(500).json({ error: 'Failed to fetch message history', details: error.message });
  }
});

// Mark messages as read
router.put('/read', async (req: AuthRequest, res: Response) => {
  try {
    const trainerId = req.user!.id;

    const thread = await prisma.messageThread.findFirst({
      where: { trainerId },
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    // Mark all admin messages as read
    await prisma.message.updateMany({
      where: {
        threadId: thread.id,
        senderType: 'ADMIN',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update thread unread count
    await prisma.messageThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
    });

    return res.json({ message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('Mark messages as read error:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read', details: error.message });
  }
});

export default router;
