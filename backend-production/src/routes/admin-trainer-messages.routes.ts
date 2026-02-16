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

    // CRITICAL FIX: First, calculate GLOBAL unread status map for ALL trainers
    // This is the source of truth and must be calculated BEFORE filtering
    const allUnreadThreads = await prisma.messageThread.findMany({
      where: { unreadCount: { gt: 0 } },
      select: { trainerId: true, unreadCount: true },
    });

    const allUnreadLegacyMessages = await prisma.trainerMessage.findMany({
      where: { isRead: false },
      select: { trainerId: true },
      distinct: ['trainerId'],
    });

    // Build the GLOBAL unread status map (source of truth)
    const unreadStatusMap: Record<string, number> = {};

    // Populate with threads first (most accurate)
    allUnreadThreads.forEach(t => {
      unreadStatusMap[t.trainerId] = t.unreadCount;
    });

    // Fill gaps with legacy (if not already set)
    allUnreadLegacyMessages.forEach(msg => {
      if (!unreadStatusMap[msg.trainerId]) {
        unreadStatusMap[msg.trainerId] = 1; // Assume 1 for legacy if not threaded
      }
    });

    // Calculate total unread count from the global map
    const totalUnreadCount = Object.values(unreadStatusMap).reduce((sum, count) => sum + count, 0);

    // NOW build the where clause for PAGINATED threads
    const where: any = {};
    if (isRead === 'true') {
      // Show only threads with NO unread messages
      where.unreadCount = 0;
    } else if (isRead === 'false') {
      // Show only threads WITH unread messages
      where.unreadCount = { gt: 0 };
    }
    // If isRead is undefined (filterType='all'), don't filter - show everything

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

    // Legacy messages for backward compatibility
    const legacyWhere: any = {};
    if (isRead === 'true') {
      legacyWhere.isRead = true;
    } else if (isRead === 'false') {
      legacyWhere.isRead = false;
    }

    const legacyMessages = await prisma.trainerMessage.findMany({
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
    });

    return res.json({
      threads,
      legacyMessages,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      unreadCount: totalUnreadCount, // CRITICAL: Use the calculated global count
      unreadStatus: unreadStatusMap, // CRITICAL: Always return the FULL global map
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
            fcmToken: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Determine read/unread status of the thread *before* marking as read
    // This helps in returning the correct state for optimistic UI updates if needed
    // But mainly we want to return the thread with its messages.

    // If no thread exists, it might be a legacy conversation or new
    // We can try to find legacy messages to build a "virtual" thread or just return empty
    // But for now, let's just return what we have (or lack thereof)
    // Actually, we must handle legacy messages if thread doesn't exist or even if it does (to merge them)
    // However, the prompt implies we have a migration to threads.
    // Let's assume for this specific route we just return the thread.
    // Wait, the original code had handling for marking as read.
    // We should include the "mark as read" logic here if it was present, or rely on a separate endpoint.
    // The previous code had a side-effect of marking as read when fetching?
    // Let's check the original file content provided in the prompt's context.
    // The prompt only asked to replace the GET /trainer-messages route.
    // I should preserve the REST of the file.

    // STOP. I am writing the WHOLE file. I need the REST of the file content.
    // I will use the `view_file` output from the previous step to reconstruction the rest.
    // But I haven't seen the whole file in one go recently.
    // I will use the `view_file` output I *just requested* in this turn to get the full content.
    // Since I can't see the output of the tool I just called in the same turn, I must split this.
    // I will ONLY call `view_file` now.
  } catch (error) { }
});
// ... wait, I cannot write the file yet because I don't have the full content in memory.
// I will cancel the `write_to_file` call and ONLY do `view_file` this turn.
