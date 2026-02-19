import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../utils/utils/notificationHelper';

const router = express.Router();

// Get all booking requests
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const where: any = {};

    // Clients see their own bookings
    if (req.user!.role === 'CLIENT') {
      where.clientId = req.user!.id;
    }
    // Trainers see bookings for their courses
    else if (req.user!.role === 'TRAINER') {
      where.trainerId = req.user!.id;
    }
    // Admins see all

    const bookingRequests = await prisma.bookingRequest.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseType: true,
            durationHours: true,
            durationUnit: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
            profilePic: true,
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
    });

    // Map to include snake_case fields for frontend compatibility
    const mappedBookings = bookingRequests.map((br) => {
      // Format requestedDate as YYYY-MM-DD string to avoid timezone issues
      let requestedDateStr = null;
      if (br.requestedDate) {
        const date = new Date(br.requestedDate);
        // Extract YYYY-MM-DD using UTC methods to avoid timezone conversion
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        requestedDateStr = `${year}-${month}-${day}`;
      }

      let endDateStr = null;
      if (br.endDate) {
        const date = new Date(br.endDate);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        endDateStr = `${year}-${month}-${day}`;
      }

      return {
        ...br,
        course_id: br.courseId,
        trainer_id: br.trainerId,
        client_id: br.clientId,
        request_type: br.requestType,
        client_name: br.clientName,
        client_email: br.clientEmail,
        requested_date: requestedDateStr,
        end_date: endDateStr,
        requested_time: br.requestedTime,
        created_at: br.createdAt,
        processed_at: br.createdAt, // Use createdAt as processed_at for now
        courses: br.course ? {
          ...br.course,
          duration_hours: br.course.durationHours,
          duration_unit: br.course.durationUnit,
        } : null,
      };
    });

    return res.json({ bookingRequests: mappedBookings });
  } catch (error: any) {
    console.error('Get booking requests error:', error);
    return res.status(500).json({ error: 'Failed to fetch booking requests', details: error.message });
  }
});

// Get single booking request
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const bookingRequest = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
      include: {
        course: true,
        trainer: true,
        client: true,
      },
    });

    if (!bookingRequest) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    // Authorization check
    if (
      req.user!.role === 'CLIENT' && bookingRequest.clientId !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (
      req.user!.role === 'TRAINER' && bookingRequest.trainerId !== req.user!.id
    ) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    return res.json({ bookingRequest });
  } catch (error: any) {
    console.error('Get booking request error:', error);
    return res.status(500).json({ error: 'Failed to fetch booking request', details: error.message });
  }
});

// Create booking request (client or public)
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      courseId,
      trainerId,
      clientId,
      requestType,
      clientName,
      clientEmail,
      requestedDate,
      endDate,
      requestedTime,
      trainerAvailabilityId,
      status,
      location,
      city,
      state,
    } = req.body;

    // If authenticated client, always override clientId
    const effectiveClientId = req.user!.role === 'CLIENT' ? req.user!.id : clientId;

    const data: any = {
      courseId: courseId || null,
      trainerId: trainerId || null,
      clientId: effectiveClientId || null,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      trainerAvailabilityId: trainerAvailabilityId || null,
      location: location || null,
      city: city || null,
      state: state || null,
    };

    // Map requestType string -> enum (PUBLIC | INHOUSE)
    if (requestType) {
      const normalized = String(requestType).toUpperCase();
      if (normalized === 'PUBLIC' || normalized === 'INHOUSE') {
        data.requestType = normalized;
      }
    }

    // Map status string -> enum BookingStatus
    if (status) {
      const normalizedStatus = String(status).toUpperCase();
      const allowedStatuses = [
        'PENDING',
        'APPROVED',
        'DENIED',
        'TENTATIVE',
        'CONFIRMED',
        'CANCELLED',
        'COMPLETED',
      ];
      if (allowedStatuses.includes(normalizedStatus)) {
        data.status = normalizedStatus;
      }
    }

    // Handle requestedDate (string -> Date)
    // For MySQL DATE type, we need to use UTC to avoid timezone shifts
    if (requestedDate) {
      // If it's a plain 'YYYY-MM-DD' string, parse it as UTC date to avoid timezone issues
      if (typeof requestedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
        // Parse as UTC date (YYYY-MM-DD -> Date at UTC midnight)
        // This ensures the date stored in MySQL matches exactly what was selected
        const [year, month, day] = requestedDate.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        data.requestedDate = date;
      } else {
        // For ISO strings or Date objects, extract date part and use UTC
        const date = new Date(requestedDate);
        if (!isNaN(date.getTime())) {
          // Extract date components and create UTC date
          const year = date.getUTCFullYear();
          const month = date.getUTCMonth();
          const day = date.getUTCDate();
          data.requestedDate = new Date(Date.UTC(year, month, day));
        }
      }
    }

    // Handle endDate (string -> Date) for multi-day courses
    if (endDate) {
      if (typeof endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        const [year, month, day] = endDate.split('-').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        data.endDate = date;
      } else {
        const date = new Date(endDate);
        if (!isNaN(date.getTime())) {
          const year = date.getUTCFullYear();
          const month = date.getUTCMonth();
          const day = date.getUTCDate();
          data.endDate = new Date(Date.UTC(year, month, day));
        }
      }
    }

    // Optional requestedTime (store as-is)
    if (requestedTime) {
      data.requestedTime = String(requestedTime);
    }

    const bookingRequest = await prisma.bookingRequest.create({
      data,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseType: true,
            durationHours: true,
            durationUnit: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
            profilePic: true,
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
    });

    // Format the response with snake_case fields and proper date formatting
    const formattedBooking = {
      ...bookingRequest,
      course_id: bookingRequest.courseId,
      trainer_id: bookingRequest.trainerId,
      client_id: bookingRequest.clientId,
      request_type: bookingRequest.requestType,
      client_name: bookingRequest.clientName,
      client_email: bookingRequest.clientEmail,
      requested_date: bookingRequest.requestedDate
        ? (() => {
          const date = new Date(bookingRequest.requestedDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })()
        : null,
      requested_time: bookingRequest.requestedTime,
      created_at: bookingRequest.createdAt,
      processed_at: bookingRequest.createdAt,
      courses: bookingRequest.course ? {
        ...bookingRequest.course,
        duration_hours: bookingRequest.course.durationHours,
        duration_unit: bookingRequest.course.durationUnit,
      } : null,
    };

    // Notify trainer about the new booking request
    if (bookingRequest.trainerId) {
      await sendNotification({
        userId: bookingRequest.trainerId,
        title: 'New Booking Request',
        message: `You have received a new booking request for "${bookingRequest.course?.title || 'a course'}".`,
        type: 'INFO',
        relatedEntityType: 'booking_request',
        relatedEntityId: bookingRequest.id,
      }).catch((err) => {
        console.error('Error sending booking request notification:', err);
      });
    }

    return res.status(201).json({ bookingRequest: formattedBooking });
  } catch (error: any) {
    console.error('Create booking request error:', error);
    return res.status(500).json({ error: 'Failed to create booking request', details: error.message });
  }
});

// Update booking status (trainer or admin)
router.put(
  '/:id/status',
  authenticate,
  authorize('TRAINER', 'ADMIN'),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const existing = await prisma.bookingRequest.findUnique({
        where: { id },
        include: {
          course: true,
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Booking request not found' });
      }

      // Trainers can only update their own bookings
      if (
        req.user!.role === 'TRAINER' &&
        existing.trainerId !== req.user!.id
      ) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const bookingRequest = await prisma.bookingRequest.update({
        where: { id },
        data: { status },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              courseType: true,
              durationHours: true,
              durationUnit: true,
            },
          },
          trainer: {
            select: {
              id: true,
              fullName: true,
              profilePic: true,
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
      });

      // Format the response with snake_case fields and proper date formatting
      const formattedBooking = {
        ...bookingRequest,
        course_id: bookingRequest.courseId,
        trainer_id: bookingRequest.trainerId,
        client_id: bookingRequest.clientId,
        request_type: bookingRequest.requestType,
        client_name: bookingRequest.clientName,
        client_email: bookingRequest.clientEmail,
        requested_date: bookingRequest.requestedDate
          ? (() => {
            const date = new Date(bookingRequest.requestedDate);
            // Use UTC methods to avoid timezone conversion
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })()
          : null,
        end_date: bookingRequest.endDate
          ? (() => {
            const date = new Date(bookingRequest.endDate);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })()
          : null,
        requested_time: bookingRequest.requestedTime,
        created_at: bookingRequest.createdAt,
        processed_at: bookingRequest.createdAt,
        courses: bookingRequest.course ? {
          ...bookingRequest.course,
          duration_hours: bookingRequest.course.durationHours,
          duration_unit: bookingRequest.course.durationUnit,
        } : null,
      };

      // If status is APPROVED and it's an INHOUSE request with a date, create tentative availability
      if (
        status === 'APPROVED' &&
        existing.requestType === 'INHOUSE' &&
        existing.requestedDate &&
        existing.trainerId
      ) {
        // Parse start date using UTC to avoid timezone issues
        const startDateObj = new Date(existing.requestedDate);
        const startYear = startDateObj.getUTCFullYear();
        const startMonth = startDateObj.getUTCMonth();
        const startDay = startDateObj.getUTCDate();
        const startDate = new Date(Date.UTC(startYear, startMonth, startDay));

        // Parse end date if available (for multi-day courses)
        let endDate = startDate;
        if (existing.endDate) {
          const endDateObj = new Date(existing.endDate);
          const endYear = endDateObj.getUTCFullYear();
          const endMonth = endDateObj.getUTCMonth();
          const endDay = endDateObj.getUTCDate();
          endDate = new Date(Date.UTC(endYear, endMonth, endDay));
        }

        // Create tentative availability for all dates in the range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          // Check if availability already exists for this date
          const existingAvailability = await prisma.trainerAvailability.findFirst({
            where: {
              trainerId: existing.trainerId,
              date: currentDate,
            },
          });

          if (!existingAvailability) {
            // Create tentative availability
            await prisma.trainerAvailability.create({
              data: {
                trainerId: existing.trainerId,
                date: new Date(currentDate),
                status: 'TENTATIVE',
              },
            });
          } else if (existingAvailability.status !== 'TENTATIVE' && existingAvailability.status !== 'BOOKED') {
            // Update to tentative if not already booked
            await prisma.trainerAvailability.update({
              where: { id: existingAvailability.id },
              data: { status: 'TENTATIVE' },
            });
          }

          // Move to next day
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        }
      }

      return res.json({ bookingRequest: formattedBooking });
    } catch (error: any) {
      console.error('Update booking status error:', error);
      return res.status(500).json({ error: 'Failed to update booking status', details: error.message });
    }
  }
);

export default router;

