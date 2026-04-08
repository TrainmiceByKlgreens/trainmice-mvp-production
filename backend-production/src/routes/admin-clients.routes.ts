import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import { createActivityLog } from '../utils/utils/activityLogger';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all clients
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, page = '1', limit = '50' } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { userName: { contains: search as string, mode: 'insensitive' } },
        { companyEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
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
      prisma.client.count({ where }),
    ]);

    res.json({
      clients,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients', details: error.message });
  }
});

// Get single client with full details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
          },
        },
        bookingRequests: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseType: true,
              },
            },
            trainer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        customCourseRequests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    return res.json({ client });
  } catch (error: any) {
    console.error('Get client error:', error);
    return res.status(500).json({ error: 'Failed to fetch client', details: error.message });
  }
});

// Update client profile
router.put(
  '/:id',
  [
    body('userName').optional().trim(),
    body('contactNumber').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
      });

      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }

      const updateData: any = {};
      if (req.body.userName !== undefined) updateData.userName = req.body.userName;
      if (req.body.contactNumber !== undefined) updateData.contactNumber = req.body.contactNumber;

      const updated = await prisma.client.update({
        where: { id: req.params.id },
        data: updateData,
      });

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'UPDATE',
        entityType: 'client',
        entityId: client.id,
        description: `Updated client profile`,
      });

      return res.json({ client: updated, message: 'Client updated successfully' });
    } catch (error: any) {
      console.error('Update client error:', error);
      return res.status(500).json({ error: 'Failed to update client', details: error.message });
    }
  }
);

// Get client training history
router.get('/:id/training-history', async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.bookingRequest.findMany({
      where: {
        clientId: req.params.id,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseType: true,
            category: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { requestedDate: 'desc' },
    });

    res.json({ history: bookings });
  } catch (error: any) {
    console.error('Get training history error:', error);
    res.status(500).json({ error: 'Failed to fetch training history', details: error.message });
  }
});

// Get client feedback
router.get('/:id/feedback', async (req: AuthRequest, res: Response) => {
  try {
    // Get feedbacks for courses booked by this client
    const bookings = await prisma.bookingRequest.findMany({
      where: { clientId: req.params.id },
      select: { courseId: true },
    });

    // Get event registrations for this client
    const eventRegistrations = await prisma.eventRegistration.findMany({
      where: { clientId: req.params.id },
      select: { eventId: true },
    });

    const courseIds = bookings.map((b) => b.courseId).filter(Boolean) as string[];
    const eventIds = eventRegistrations.map((er) => er.eventId).filter(Boolean) as string[];

    const feedbacks = await prisma.feedback.findMany({
      where: {
        OR: [
          { courseId: { in: courseIds } },
          { eventId: { in: eventIds } },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ feedbacks });
  } catch (error: any) {
    console.error('Get client feedback error:', error);
    res.status(500).json({ error: 'Failed to fetch client feedback', details: error.message });
  }
});

// Get client analytics
router.get('/:id/analytics', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalBookings,
      completedBookings,
      totalSpending,
      coursesTaken,
      categories,
    ] = await Promise.all([
      prisma.bookingRequest.count({
        where: { clientId: req.params.id },
      }),
      prisma.bookingRequest.count({
        where: {
          clientId: req.params.id,
          status: 'COMPLETED',
        },
      }),
      prisma.bookingRequest.findMany({
        where: {
          clientId: req.params.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        include: {
          course: {
            select: { price: true },
          },
        },
      }),
      prisma.bookingRequest.findMany({
        where: {
          clientId: req.params.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      }),
      prisma.bookingRequest.findMany({
        where: {
          clientId: req.params.id,
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        include: {
          course: {
            select: { category: true },
          },
        },
      }),
    ]);

    const spending = totalSpending.reduce((sum, booking) => {
      const price = booking.course?.price ? parseFloat(booking.course.price.toString()) : 0;
      return sum + price;
    }, 0);

    const categoryCounts: Record<string, number> = {};
    categories.forEach((booking) => {
      const categoryRaw = booking.course?.category;
      let category = 'Uncategorized';
      if (Array.isArray(categoryRaw) && categoryRaw.length > 0) {
        category = String(categoryRaw[0]);
      } else if (typeof categoryRaw === 'string') {
        category = categoryRaw;
      }
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    res.json({
      totalBookings,
      completedBookings,
      totalSpending: Math.round(spending * 100) / 100,
      coursesTaken: coursesTaken.length,
      topCategories,
    });
  } catch (error: any) {
    console.error('Get client analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch client analytics', details: error.message });
  }
});

export default router;

