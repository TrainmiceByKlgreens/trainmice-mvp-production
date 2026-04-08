import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get comprehensive dashboard metrics
router.get('/metrics', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalTrainers,
      totalClients,
      activeCourses,
      pendingBookings,
      pendingHRDCVerifications,
      unreadMessages,
      upcomingCourses,
    ] = await Promise.all([
      prisma.trainer.count(),
      prisma.client.count(),
      prisma.course.count({ where: { status: 'APPROVED' } }),
      prisma.bookingRequest.count({ where: { status: 'PENDING' } }),
      prisma.trainerDocument.count({
        where: {
          documentType: {
            contains: 'hrdc',
            mode: 'insensitive',
          },
          verified: false,
        },
      }),
      prisma.trainerMessage.count({ where: { isRead: false } }),
      prisma.course.count({
        where: {
          status: 'APPROVED',
          startDate: { gte: new Date() },
        },
      }),
    ]);

    res.json({
      totalTrainers,
      totalClients,
      activeCourses,
      pendingBookings,
      pendingHRDCVerifications,
      unreadMessages,
      upcomingCourses,
    });
  } catch (error: any) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics', details: error.message });
  }
});

// Get activity timeline
router.get('/activity-timeline', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 50 } = req.query;

    const activities = await prisma.activityLog.findMany({
      take: parseInt(limit as string),
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
    });

    res.json({ activities });
  } catch (error: any) {
    console.error('Get activity timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch activity timeline', details: error.message });
  }
});

// Get upcoming courses with details
router.get('/upcoming-courses', async (_req: AuthRequest, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: new Date() },
      },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        courseTrainers: {
          include: {
            trainer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 10,
    });

    res.json({ courses });
  } catch (error: any) {
    console.error('Get upcoming courses error:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming courses', details: error.message });
  }
});

// Get pending bookings summary
router.get('/pending-bookings', async (_req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.bookingRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        client: {
          select: {
            id: true,
            userName: true,
            companyEmail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({ bookings });
  } catch (error: any) {
    console.error('Get pending bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch pending bookings', details: error.message });
  }
});

export default router;
