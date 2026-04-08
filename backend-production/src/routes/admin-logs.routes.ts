import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get activity logs
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const {
      actionType,
      entityType,
      userRole,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const where: any = {};
    if (actionType) {
      where.actionType = actionType;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (userRole) {
      where.user = {
        role: userRole,
      };
    }
    if (search) {
      where.description = { contains: search as string, mode: 'insensitive' };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs', details: error.message });
  }
});

// Get admin logs (filtered activity logs for admin actions)
router.get('/admin', async (req: AuthRequest, res: Response) => {
  try {
    const {
      action,
      startDate,
      endDate,
      search,
      page = '1',
    } = req.query;

    const where: any = {
      entityType: {
        in: ['trainer', 'course', 'booking', 'custom_course_request', 'trainer_document', 'admin'],
      },
    };

    if (action) {
      where.actionType = action;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }
    if (search) {
      where.description = { contains: search as string, mode: 'insensitive' };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where }),
    ]);

    res.json({
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch admin logs', details: error.message });
  }
});

export default router;

