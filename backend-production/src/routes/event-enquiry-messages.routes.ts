import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);

// Get enquiries by eventId (for trainers to find existing enquiry)
router.get('/trainer/enquiries', authorize('TRAINER'), async (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.query;
    const trainerId = req.user!.id;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const enquiries = await prisma.eventEnquiry.findMany({
      where: {
        eventId: eventId as string,
        trainerId,
      },
      include: {
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
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ enquiries });
  } catch (error: any) {
    console.error('Get enquiries by eventId error:', error);
    return res.status(500).json({ error: 'Failed to fetch enquiries', details: error.message });
  }
});

// Get event enquiry conversation (for trainers)
router.get('/trainer/:enquiryId', authorize('TRAINER'), async (req: AuthRequest, res: Response) => {
  try {
    const { enquiryId } = req.params;
    const trainerId = req.user!.id;

    const enquiry = await prisma.eventEnquiry.findFirst({
      where: {
        id: enquiryId,
        trainerId, // Ensure trainer can only see their own enquiries
      },
      include: {
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

    if (!enquiry) {
      return res.status(404).json({ error: 'Event enquiry not found' });
    }

    // Mark admin messages as read when trainer views
    await prisma.eventEnquiryMessage.updateMany({
      where: {
        enquiryId: enquiry.id,
        senderType: 'ADMIN',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update enquiry unread count
    await prisma.eventEnquiry.update({
      where: { id: enquiry.id },
      data: { unreadCount: 0 },
    });

    // Refresh enquiry with updated data
    const updatedEnquiry = await prisma.eventEnquiry.findUnique({
      where: { id: enquiry.id },
      include: {
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
      enquiry: updatedEnquiry,
      messages: updatedEnquiry?.messages || [],
    });
  } catch (error: any) {
    console.error('Get event enquiry conversation error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation', details: error.message });
  }
});

// Trainer replies to event enquiry
router.post(
  '/trainer/:enquiryId/reply',
  authorize('TRAINER'),
  [body('message').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { enquiryId } = req.params;
      const { message } = req.body;
      const trainerId = req.user!.id;

      // Verify enquiry belongs to trainer
      const enquiry = await prisma.eventEnquiry.findFirst({
        where: {
          id: enquiryId,
          trainerId,
        },
      });

      if (!enquiry) {
        return res.status(404).json({ error: 'Event enquiry not found' });
      }

      // Create reply message
      const newMessage = await prisma.eventEnquiryMessage.create({
        data: {
          enquiryId: enquiry.id,
          senderType: 'TRAINER',
          senderId: trainerId,
          message: message.trim(),
          isRead: false, // Admin needs to read it
        },
      });

      // Update enquiry metadata
      await prisma.eventEnquiry.update({
        where: { id: enquiry.id },
        data: {
          lastMessageTime: new Date(),
          lastMessageBy: 'TRAINER',
          unreadCount: { increment: 1 }, // Increment unread count when trainer sends new message
        },
      });

      await createActivityLog({
        userId: trainerId,
        actionType: 'CREATE',
        entityType: 'event_enquiry_message',
        entityId: newMessage.id,
        description: `Replied to event enquiry`,
      });

      return res.status(201).json({
        message: 'Reply sent successfully',
        newMessage,
      });
    } catch (error: any) {
      console.error('Reply to event enquiry error:', error);
      return res.status(500).json({ error: 'Failed to send reply', details: error.message });
    }
  }
);

// Get event enquiry conversation (for admins)
router.get('/admin/:enquiryId', authorize('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { enquiryId } = req.params;

    const enquiry = await prisma.eventEnquiry.findUnique({
      where: { id: enquiryId },
      include: {
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

    if (!enquiry) {
      return res.status(404).json({ error: 'Event enquiry not found' });
    }

    // Mark trainer messages as read when admin views
    await prisma.eventEnquiryMessage.updateMany({
      where: {
        enquiryId: enquiry.id,
        senderType: 'TRAINER',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Update enquiry unread count and isRead status
    await prisma.eventEnquiry.update({
      where: { id: enquiry.id },
      data: {
        unreadCount: 0,
        isRead: true,
      },
    });

    // Refresh enquiry with updated data
    const updatedEnquiry = await prisma.eventEnquiry.findUnique({
      where: { id: enquiry.id },
      include: {
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
      enquiry: updatedEnquiry,
      messages: updatedEnquiry?.messages || [],
    });
  } catch (error: any) {
    console.error('Get event enquiry conversation error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation', details: error.message });
  }
});

// Admin replies to event enquiry
router.post(
  '/admin/:enquiryId/reply',
  authorize('ADMIN'),
  [body('message').notEmpty().trim()],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { enquiryId } = req.params;
      const { message } = req.body;
      const adminId = req.user!.id;

      const enquiry = await prisma.eventEnquiry.findUnique({
        where: { id: enquiryId },
      });

      if (!enquiry) {
        return res.status(404).json({ error: 'Event enquiry not found' });
      }

      // Create reply message
      const newMessage = await prisma.eventEnquiryMessage.create({
        data: {
          enquiryId: enquiry.id,
          senderType: 'ADMIN',
          senderId: adminId,
          message: message.trim(),
          isRead: false, // Trainer needs to read it
        },
      });

      // Update enquiry metadata
      await prisma.eventEnquiry.update({
        where: { id: enquiry.id },
        data: {
          lastMessageTime: new Date(),
          lastMessageBy: 'ADMIN',
          unreadCount: 0, // Reset unread count when admin sends new message
        },
      });

      await createActivityLog({
        userId: adminId,
        actionType: 'CREATE',
        entityType: 'event_enquiry_message',
        entityId: newMessage.id,
        description: `Replied to event enquiry`,
      });

      return res.status(201).json({
        message: 'Reply sent successfully',
        newMessage,
      });
    } catch (error: any) {
      console.error('Reply to event enquiry error:', error);
      return res.status(500).json({ error: 'Failed to send reply', details: error.message });
    }
  }
);

export default router;

