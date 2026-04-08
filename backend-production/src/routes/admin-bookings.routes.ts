import express from 'express';
import prisma from '../config/database';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { createActivityLog } from '../utils/utils/activityLogger';
import { releaseTrainerAvailability } from '../utils/utils/availabilityHelper';
import { broadcastUpdate } from '../lib/socket';

const router = express.Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all bookings
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, requestType, includeHidden } = req.query;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (requestType) {
      where.requestType = requestType;
    }

    // Hide hidden bookings by default
    if (includeHidden !== 'true') {
      where.isHidden = false;
    }

    const bookings = await prisma.bookingRequest.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            courseType: true,
            durationHours: true,
            durationUnit: true,
            category: true,
          },
        },
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            userName: true,
            companyEmail: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Item-level mark-as-read is handled in the individual GET /:id route

    return res.json({ bookings });
  } catch (error: any) {
    console.error('Get bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

// Get single booking
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
      include: {
        course: true,
        trainer: true,
        client: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Mark as read when individual booking is fetched
    if (!booking.isRead) {
      await prisma.bookingRequest.update({
        where: { id: req.params.id },
        data: { isRead: true },
      });
      broadcastUpdate('booking_requests', 'UPDATE', {});
    }

    return res.json({ booking });
  } catch (error: any) {
    console.error('Get booking error:', error);
    return res.status(500).json({ error: 'Failed to fetch booking', details: error.message });
  }
});

// Get conflicting bookings (APPROVED but not CONFIRMED on same date)
router.get('/:id/conflicting', async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!booking || !booking.trainerId || !booking.requestedDate) {
      return res.json({ conflictingBookings: [] });
    }

    // Get bookings on the same date that are APPROVED but not CONFIRMED
    const conflictingBookings = await prisma.bookingRequest.findMany({
      where: {
        trainerId: booking.trainerId,
        requestedDate: booking.requestedDate,
        status: 'APPROVED',
        id: { not: booking.id }, // Exclude current booking
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            userName: true,
            companyEmail: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Show older bookings first
    });

    return res.json({ conflictingBookings });
  } catch (error: any) {
    console.error('Get conflicting bookings error:', error);
    return res.status(500).json({ error: 'Failed to fetch conflicting bookings', details: error.message });
  }
});

// Send email to multiple clients
router.post('/send-email', async (req: AuthRequest, res) => {
  try {
    const { clientIds, title, message } = req.body;

    if (!Array.isArray(clientIds) || clientIds.length === 0 || !title || !message) {
      return res.status(400).json({ error: 'clientIds (array), title, and message are required' });
    }

    // Create notifications for all clients
    const notifications = await Promise.all(
      clientIds.map((clientId: string) =>
        prisma.notification.create({
          data: {
            userId: clientId,
            title,
            message,
            type: 'INFO',
            relatedEntityType: 'booking_request',
          },
        }).catch(() => null) // Ignore errors for individual notifications
      )
    );

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'CREATE',
      entityType: 'booking_request',
      description: `Sent email to ${clientIds.length} client(s)`,
      metadata: { title, clientCount: clientIds.length },
    });

    return res.json({
      message: `Email sent to ${notifications.filter(n => n !== null).length} client(s)`,
      sentCount: notifications.filter(n => n !== null).length,
    });
  } catch (error: any) {
    console.error('Send email error:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

// Confirm booking
router.put('/:id/confirm', async (req: AuthRequest, res) => {
  try {
    const { totalSlots, registeredParticipants, availabilityIds, price, venue, city, state } = req.body;

    // totalSlots is optional now
    const totalSlotsNum = totalSlots ? parseInt(String(totalSlots)) : undefined;
    if (totalSlots && isNaN(totalSlotsNum as number)) {
      return res.status(400).json({ error: 'Total slots must be a valid number' });
    }

    if (!registeredParticipants || parseInt(String(registeredParticipants)) < 1) {
      return res.status(400).json({ error: 'Registered participants is required and must be at least 1' });
    }

    if (!availabilityIds || !Array.isArray(availabilityIds) || availabilityIds.length === 0) {
      return res.status(400).json({ error: 'At least one trainer availability ID is required. Please select date(s) from trainer availability calendar.' });
    }

    const registeredParticipantsNum = parseInt(String(registeredParticipants));

    if (totalSlotsNum && registeredParticipantsNum > totalSlotsNum) {
      return res.status(400).json({ error: 'Registered participants cannot exceed total slots' });
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
      include: {
        course: true,
        trainer: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.courseId) {
      return res.status(400).json({ error: 'Booking must have an associated course' });
    }

    if (!booking.trainerId) {
      return res.status(400).json({ error: 'Booking must have an assigned trainer' });
    }

    // Fetch all selected availability records
    const availabilities = await prisma.trainerAvailability.findMany({
      where: { id: { in: availabilityIds } },
      orderBy: { date: 'asc' },
    });

    if (availabilities.length !== availabilityIds.length) {
      return res.status(404).json({ error: 'One or more trainer availability records not found' });
    }

    // Validate all availabilities belong to the booking's trainer and are available
    for (const availability of availabilities) {
      if (availability.trainerId !== booking.trainerId) {
        return res.status(400).json({ error: 'One or more availability records do not belong to the assigned trainer' });
      }
      if (availability.status !== 'AVAILABLE' && availability.status !== 'TENTATIVE') {
        return res.status(400).json({ error: `One or more selected dates are not available. Current status: ${availability.status}` });
      }
    }

    // Use first date as eventDate, last date as endDate
    const finalEventDate = new Date(availabilities[0].date);
    const lastDate = availabilities.length > 1 ? new Date(availabilities[availabilities.length - 1].date) : null;

    const course = booking.course;
    if (!course) {
      return res.status(400).json({ error: 'Booking must have an associated course' });
    }

    // Standardized: Check for duplicate events before creating
    const existingEvent = await prisma.event.findFirst({
      where: {
        courseId: course.id,
        eventDate: finalEventDate,
      },
    });

    if (existingEvent) {
      return res.status(400).json({ error: 'Event already exists for this course and date' });
    }

    // Release old availability if it's not in the new selection
    if (booking.trainerAvailabilityId && !availabilityIds.includes(booking.trainerAvailabilityId)) {
      try {
        await prisma.trainerAvailability.update({
          where: { id: booking.trainerAvailabilityId },
          data: { status: 'AVAILABLE' }
        });
        console.log(`[Booking Confirmation] Released old availability ${booking.trainerAvailabilityId} for trainer ${booking.trainerId}`);
      } catch (error: any) {
        console.error('Error releasing old trainer availability:', error);
      }
    }

    // Map selected availability records to date strings for consistent tracking (YYYY-MM-DD)
    const selectedDateStrings = availabilities.map(a => {
      const d = new Date(a.date);
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    });

    // Update booking status and store first availability ID for tracking
    const updated = await prisma.bookingRequest.update({
      where: { id: req.params.id },
      data: {
        status: 'CONFIRMED',
        trainerAvailabilityId: availabilityIds[0], // Store first availability ID for tracking
        requestedDate: finalEventDate,
        endDate: lastDate,
        selectedDates: selectedDateStrings as any,
        eventId: course ? undefined : undefined, // Placeholder, will set after event creation
      },
    });

    // Mark all selected availability records as BOOKED
    try {
      await prisma.trainerAvailability.updateMany({
        where: { id: { in: availabilityIds } },
        data: { status: 'BOOKED' },
      });
      console.log(`[Booking Confirmation] Marked ${availabilityIds.length} date(s) as BOOKED for trainer ${booking.trainerId}`);
    } catch (error: any) {
      console.error('Error updating trainer availability status:', error);
    }

    // Create Event from the confirmed booking
    if (course) {
      const startDate = finalEventDate;
      const endDate = lastDate;

      // Generate event code
      const eventCode = `EVT-${Date.now().toString(36).toUpperCase()}`;

      // Standardized: Handle courseMode as array (consistent with course event creation)
      let courseModeArray: string[] = [];
      if (course.courseMode) {
        if (Array.isArray(course.courseMode)) {
          courseModeArray = course.courseMode as string[];
        } else if (typeof course.courseMode === 'string') {
          try {
            const parsed = JSON.parse(course.courseMode);
            courseModeArray = Array.isArray(parsed) ? (parsed as string[]) : [parsed as string];
          } catch {
            courseModeArray = [course.courseMode];
          }
        } else {
          courseModeArray = [String(course.courseMode)];
        }
      }
      if (courseModeArray.length === 0) {
        courseModeArray = ['PHYSICAL'];
      }

      const event = await prisma.event.create({
        data: {
          courseId: course.id,
          trainerId: booking.trainerId || null,
          createdBy: req.user!.id,
          eventCode: eventCode,
          title: course.title || `Event: ${course.title}`,
          description: course.description || null,
          learningObjectives: course.learningObjectives ?? undefined,
          learningOutcomes: course.learningOutcomes ?? undefined,
          targetAudience: (course.targetAudience as any) || null,
          methodology: (course.methodology as any) || null,
          prerequisite: (course.prerequisite as any) || null,
          certificate: course.certificate || null,
          assessment: course.assessment || false,
          courseType: booking.requestType === 'PUBLIC' ? ['PUBLIC'] : ['IN_HOUSE'],
          courseMode: courseModeArray,
          durationHours: course.durationHours || 0,
          durationUnit: course.durationUnit || 'hours',
          venue: venue || booking.location || course.venue || null,
          price: price ? parseFloat(price) : (course.price || null),
          eventDate: finalEventDate,
          startDate: startDate,
          endDate: endDate,
          category: (course.category as any) || null,
          city: city || booking.city || course.city || null,
          state: state || booking.state || course.state || null,
          hrdcClaimable: course.hrdcClaimable || false,
          courseSequence: course.courseSequence || null,
          status: 'ACTIVE',
          maxPacks: totalSlotsNum || null,
          selectedDates: selectedDateStrings as any,
        },
      });

      // Update BookingRequest with the created Event ID
      await prisma.bookingRequest.update({
        where: { id: req.params.id },
        data: { eventId: event.id },
      });

      if (registeredParticipantsNum > 0 && booking.clientId) {
        await prisma.eventRegistration.create({
          data: {
            eventId: event.id,
            clientId: booking.clientId,
            clientName: booking.clientName || null,
            clientEmail: booking.clientEmail || null,
            numberOfParticipants: registeredParticipantsNum,
            status: 'APPROVED',
          },
        });
      }

      if (booking.clientId) {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: 'Booking Confirmed',
            message: `Booking for ${booking.requestedDate} has been confirmed and an event has been created.`,
            type: 'SUCCESS',
            relatedEntityType: 'booking',
            relatedEntityId: booking.id,
          },
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CONFIRM',
        entityType: 'booking',
        entityId: booking.id,
        description: `Confirmed booking for ${booking.clientName} and created event ${eventCode}`,
        metadata: { eventId: event.id, totalSlots: totalSlotsNum, registeredParticipants: registeredParticipantsNum },
      });

      broadcastUpdate('booking_requests', 'UPDATE', {});
      broadcastUpdate('registrations', 'UPDATE', {});

      return res.json({
        message: 'Booking confirmed successfully and event created',
        booking: updated,
        event,
      });
    } else {
      if (booking.clientId) {
        await prisma.notification.create({
          data: {
            userId: booking.clientId,
            title: 'Booking Confirmed',
            message: `Booking for ${booking.requestedDate} has been confirmed.`,
            type: 'SUCCESS',
            relatedEntityType: 'booking',
            relatedEntityId: booking.id,
          },
        });
      }

      await createActivityLog({
        userId: req.user!.id,
        actionType: 'CONFIRM',
        entityType: 'booking',
        entityId: booking.id,
        description: `Confirmed booking for ${booking.clientName}`,
      });

      broadcastUpdate('booking_requests', 'UPDATE', {});

      return res.json({ message: 'Booking confirmed successfully', booking: updated });
    }
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    return res.status(500).json({ error: 'Failed to confirm booking', details: error.message });
  }
});

// Update booking details (General update)
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { courseMode, trainerId, location, city, state, status } = req.body;

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id: req.params.id },
      data: {
        courseMode: courseMode !== undefined ? courseMode : undefined,
        trainerId: trainerId !== undefined ? trainerId : undefined,
        location: location !== undefined ? location : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        status: status !== undefined ? status : undefined,
      },
      include: {
        course: true,
        trainer: true,
        client: true,
      }
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'booking',
      entityId: booking.id,
      description: `Updated booking details for ${booking.clientName}`,
      metadata: { updates: req.body },
    });

    broadcastUpdate('bookings', 'UPDATE', {});

    return res.json({ message: 'Booking updated successfully', booking: updated });
  } catch (error: any) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Failed to update booking', details: error.message });
  }
});

// Update booking status (APPROVED, DENIED, TENTATIVE, QUOTED)
router.put('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['APPROVED', 'DENIED', 'TENTATIVE', 'QUOTED'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Status must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id: req.params.id },
      data: { status },
    });

    if (booking.clientId) {
      const notifMessages: Record<string, string> = {
        APPROVED: 'Your booking request has been approved.',
        DENIED: 'Your booking request has been denied.',
        TENTATIVE: 'Your booking has been set to tentative.',
        QUOTED: 'A quotation has been sent for your booking.',
      };
      await prisma.notification.create({
        data: {
          userId: booking.clientId,
          title: `Booking ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          message: notifMessages[status] || `Booking status updated to ${status}.`,
          type: status === 'DENIED' ? 'WARNING' : 'INFO',
          relatedEntityType: 'booking',
          relatedEntityId: booking.id,
        },
      });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: status === 'APPROVED' ? 'APPROVE' : status === 'DENIED' ? 'REJECT' : 'UPDATE',
      entityType: 'booking',
      entityId: booking.id,
      description: `Updated booking status to ${status} for ${booking.clientName}`,
      metadata: { previousStatus: booking.status, newStatus: status },
    });

    broadcastUpdate('bookings', 'UPDATE', {});

    return res.json({ message: `Booking status updated to ${status}`, booking: updated });
  } catch (error: any) {
    console.error('Update booking status error:', error);
    return res.status(500).json({ error: 'Failed to update booking status', details: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body;

    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A cancellation reason is required' });
    }

    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
      include: { event: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const cancelledAtStatus = booking.status;

    const updated = await prisma.bookingRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    // Synchronize Cancellation: If there's an associated event, cancel it too
    if (booking.eventId) {
      try {
        await prisma.event.update({
          where: { id: booking.eventId },
          data: { status: 'CANCELLED' },
        });
        console.log(`[Booking Cancellation] Automatically cancelled associated event ${booking.eventId}`);
        
        // Release trainer availability safely
        if (booking.trainerId) {
          const datesToRelease: (string | Date)[] = (booking.selectedDates as string[]) || (booking.requestedDate ? [booking.requestedDate] : []);
          if (datesToRelease.length > 0) {
            await releaseTrainerAvailability(booking.trainerId, booking.eventId, datesToRelease);
          }
        }
      } catch (error: any) {
        console.error('Error synchronizing event cancellation:', error);
      }
    }

    await prisma.bookingReasoning.upsert({
      where: { bookingRequestId: req.params.id },
      create: {
        bookingRequestId: req.params.id,
        reasoning: String(reason).trim(),
        cancelledAtStatus,
      },
      update: {
        reasoning: String(reason).trim(),
        cancelledAtStatus,
      },
    });

    if (booking.clientId) {
      await prisma.notification.create({
        data: {
          userId: booking.clientId,
          title: 'Booking Cancelled',
          message: `Your booking has been cancelled. Reason: ${String(reason).trim()}`,
          type: 'WARNING',
          relatedEntityType: 'booking',
          relatedEntityId: booking.id,
        },
      });
    }

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'CANCEL',
      entityType: 'booking',
      entityId: booking.id,
      description: `Cancelled booking for ${booking.clientName} (was: ${cancelledAtStatus})`,
      metadata: { reason: String(reason).trim(), cancelledAtStatus },
    });

    broadcastUpdate('bookings', 'UPDATE', {});

    return res.json({ message: 'Booking cancelled successfully', booking: updated });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ error: 'Failed to cancel booking', details: error.message });
  }
});

// Toggle hide status
router.patch('/:id/toggle-hide', async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updated = await prisma.bookingRequest.update({
      where: { id: req.params.id },
      data: { isHidden: !(booking as any).isHidden } as any,
    }) as any;

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'UPDATE',
      entityType: 'booking',
      entityId: booking.id,
      description: `${updated.isHidden ? 'Hidden' : 'Showed'} booking for ${booking.clientName}`,
      metadata: { isHidden: updated.isHidden },
    });

    broadcastUpdate('bookings', 'UPDATE', {});

    return res.json({ message: `Booking ${updated.isHidden ? 'hidden' : 'unhidden'} successfully`, booking: updated });
  } catch (error: any) {
    console.error('Toggle hide booking error:', error);
    return res.status(500).json({ error: 'Failed to toggle hide status', details: error.message });
  }
});

// Delete booking
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const booking = await prisma.bookingRequest.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await prisma.bookingRequest.delete({
      where: { id: req.params.id },
    });

    await createActivityLog({
      userId: req.user!.id,
      actionType: 'DELETE',
      entityType: 'booking',
      entityId: req.params.id,
      description: `Permanently deleted booking for ${booking.clientName}`,
      metadata: { clientName: booking.clientName, clientEmail: booking.clientEmail },
    });

    broadcastUpdate('bookings', 'UPDATE', {});

    return res.json({ message: 'Booking permanently deleted successfully' });
  } catch (error: any) {
    console.error('Delete booking error:', error);
    return res.status(500).json({ error: 'Failed to delete booking', details: error.message });
  }
});

export default router;
