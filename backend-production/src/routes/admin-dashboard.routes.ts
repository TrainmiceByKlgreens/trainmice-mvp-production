import express, { Response } from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

const addDays = (date: Date, days: number) => {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
};

const normalizeCourseTypes = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item).toUpperCase()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).toUpperCase()).filter(Boolean);
        }
      } catch {
        // Fall back to treating the raw string as a single course type.
      }
    }

    return [trimmed.toUpperCase()];
  }

  return [];
};

const resolveTrainingType = (primary: unknown, fallback?: unknown) => {
  const courseTypes = [
    ...normalizeCourseTypes(primary),
    ...normalizeCourseTypes(fallback),
  ];

  if (courseTypes.includes('IN_HOUSE')) return 'IN_HOUSE';
  if (courseTypes.includes('PUBLIC')) return 'PUBLIC';

  return 'PUBLIC';
};

const buildLocationLabel = (...parts: Array<string | null | undefined>) =>
  parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(', ') || null;

// Get comprehensive dashboard metrics
router.get('/metrics', async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextSevenDays = addDays(today, 7);
    const nextThirtyDays = addDays(today, 30);

    const futureActiveEventWhere = {
      status: 'ACTIVE' as const,
      OR: [
        { endDate: { gte: today } },
        {
          endDate: null,
          eventDate: { gte: today },
        },
      ],
    };

    const [
      unreadNotifications,
      totalTrainers,
      activeCourses,
      pendingBookings,
      pendingRequests,
      activeEvents,
      upcomingEventsCount,
      pendingEventRegistrations,
      pendingConfirmations,
      totalClients,
      pendingHRDCVerifications,
      unreadMessages,
      upcomingCourses,
      upcomingInHouseTrainingsCount,
      upcomingInHouseTrainingsRaw,
      upcomingSessionsRaw,
      expiringDocumentsRaw,
      upcomingEventsRaw,
    ] = await Promise.all([
      prisma.notification.count({
        where: {
          userId: req.user!.id,
          isRead: false,
        },
      }),
      prisma.trainer.count(),
      prisma.course.count({ where: { status: 'APPROVED' } }),
      prisma.bookingRequest.count({ where: { status: 'PENDING' } }),
      prisma.customCourseRequest.count({ where: { status: 'PENDING' } }),
      prisma.event.count({ where: futureActiveEventWhere }),
      prisma.event.count({ where: futureActiveEventWhere }),
      prisma.eventRegistration.count({
        where: {
          status: {
            in: ['REGISTERED', 'PENDING'],
          },
          event: futureActiveEventWhere,
        },
      }),
      prisma.bookingRequest.count({
        where: {
          status: {
            in: ['APPROVED', 'TENTATIVE'],
          },
          requestedDate: {
            gte: today,
            lte: nextSevenDays,
          },
        },
      }),
      prisma.client.count(),
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
      prisma.bookingRequest.count({
        where: {
          requestType: 'INHOUSE',
          status: {
            in: ['APPROVED', 'CONFIRMED', 'TENTATIVE'],
          },
          requestedDate: {
            gte: today,
          },
        },
      }),
      prisma.bookingRequest.findMany({
        where: {
          requestType: 'INHOUSE',
          status: {
            in: ['APPROVED', 'CONFIRMED', 'TENTATIVE'],
          },
          requestedDate: {
            gte: today,
          },
        },
        include: {
          course: {
            select: {
              title: true,
              venue: true,
              city: true,
              state: true,
            },
          },
          trainer: {
            select: {
              fullName: true,
            },
          },
          client: {
            select: {
              companyName: true,
              userName: true,
            },
          },
        },
        orderBy: {
          requestedDate: 'asc',
        },
        take: 6,
      }),
      prisma.bookingRequest.findMany({
        where: {
          requestType: 'INHOUSE',
          status: {
            in: ['APPROVED', 'CONFIRMED', 'TENTATIVE'],
          },
          requestedDate: {
            gte: today,
            lte: nextSevenDays,
          },
        },
        include: {
          course: {
            select: {
              title: true,
              venue: true,
              city: true,
              state: true,
            },
          },
          trainer: {
            select: {
              fullName: true,
            },
          },
          client: {
            select: {
              companyName: true,
              userName: true,
            },
          },
        },
        orderBy: {
          requestedDate: 'asc',
        },
        take: 6,
      }),
      prisma.trainerDocument.findMany({
        where: {
          expiresAt: {
            gte: today,
            lte: nextThirtyDays,
          },
        },
        include: {
          trainer: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: {
          expiresAt: 'asc',
        },
        take: 5,
      }),
      prisma.event.findMany({
        where: futureActiveEventWhere,
        include: {
          trainer: {
            select: {
              fullName: true,
            },
          },
          course: {
            select: {
              title: true,
              courseType: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: {
          eventDate: 'asc',
        },
        take: 6,
      }),
    ]);

    const upcomingSessions = upcomingSessionsRaw.map((session) => ({
      id: session.id,
      course_title: session.course?.title || 'Untitled Course',
      trainer_name: session.trainer?.fullName || 'Trainer not assigned',
      client_name: session.client?.companyName || session.clientName || session.client?.userName || null,
      booking_date: session.requestedDate,
      requested_time: session.requestedTime,
      location: buildLocationLabel(
        session.location,
        session.city,
        session.state,
        session.course?.venue,
        session.course?.city,
        session.course?.state,
      ),
      status: session.status,
      request_type: session.requestType,
    }));

    const expiringDocuments = expiringDocumentsRaw.map((document) => {
      const expiresAt = document.expiresAt ? new Date(document.expiresAt) : null;
      const daysUntilExpiry = expiresAt
        ? Math.max(0, Math.ceil((expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : null;

      return {
        id: document.id,
        trainer_name: document.trainer?.fullName || 'Unknown trainer',
        document_type: document.documentType,
        expires_at: document.expiresAt,
        days_until_expiry: daysUntilExpiry,
      };
    });

    const upcomingEvents = upcomingEventsRaw.map((event) => ({
      id: event.id,
      title: event.title,
      course_title: event.course?.title || event.title,
      trainer_name: event.trainer?.fullName || 'Trainer not assigned',
      event_date: event.eventDate,
      end_date: event.endDate,
      venue: event.venue,
      city: event.city,
      state: event.state,
      status: event.status,
      registrations_count: event._count.registrations,
    }));

    const upcomingTrainings = [
      ...upcomingEventsRaw.map((event) => ({
        id: `event-${event.id}`,
        entity_id: event.id,
        source: 'EVENT' as const,
        training_type: resolveTrainingType(event.courseType, event.course?.courseType),
        title: event.title,
        course_title: event.course?.title || event.title,
        trainer_name: event.trainer?.fullName || 'Trainer not assigned',
        client_name: null,
        start_date: event.eventDate,
        end_date: event.endDate,
        requested_time: null,
        location: buildLocationLabel(event.venue, event.city, event.state),
        status: event.status,
        registrations_count: event._count.registrations,
      })),
      ...upcomingInHouseTrainingsRaw.map((session) => ({
        id: `booking-${session.id}`,
        entity_id: session.id,
        source: 'BOOKING' as const,
        training_type: 'IN_HOUSE' as const,
        title: session.course?.title || 'Untitled Course',
        course_title: session.course?.title || 'Untitled Course',
        trainer_name: session.trainer?.fullName || 'Trainer not assigned',
        client_name: session.client?.companyName || session.clientName || session.client?.userName || null,
        start_date: session.requestedDate,
        end_date: session.endDate,
        requested_time: session.requestedTime,
        location: buildLocationLabel(
          session.location,
          session.city,
          session.state,
          session.course?.venue,
          session.course?.city,
          session.course?.state,
        ),
        status: session.status,
        registrations_count: null,
      })),
    ]
      .filter((item) => item.start_date)
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())
      .slice(0, 8);

    res.json({
      unreadNotifications,
      pendingRequests,
      totalTrainers,
      totalClients,
      activeCourses,
      pendingBookings,
      pendingHRDCVerifications,
      unreadMessages,
      upcomingCourses,
      activeEvents,
      upcomingEventsCount,
      upcomingTrainingsCount: upcomingEventsCount + upcomingInHouseTrainingsCount,
      pendingEventRegistrations,
      pendingConfirmations,
      upcomingSessions,
      expiringDocuments,
      upcomingEvents,
      upcomingTrainings,
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
