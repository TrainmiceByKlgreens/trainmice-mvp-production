import prisma from '../../config/database';

/**
 * Safely releases trainer availability for a specific event or booking.
 * Only marks dates as AVAILABLE if no other ACTIVE events are using them.
 */
export async function releaseTrainerAvailability(trainerId: string, eventId: string | null, dates: (string | Date)[]) {
  if (!trainerId || dates.length === 0) return;

  console.log(`[AvailabilityHelper] Releasing dates for trainer ${trainerId}, excluding event ${eventId || 'none'}`);

  // Convert all dates to YYYY-MM-DD strings for consistent comparison
  const dateStrings = dates.map(d => {
    if (typeof d === 'string') {
      // Handle potential ISO strings or full timestamps
      return d.split('T')[0];
    }
    return d.toISOString().split('T')[0];
  });

  // Remove duplicates
  const uniqueDateStrings = Array.from(new Set(dateStrings));

  for (const dateStr of uniqueDateStrings) {
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    // Check if any OTHER active event is using this specific date
    // We check both eventDate (legacy/fixed) and selectedDates (multi-day/non-sequential)
    const otherEvent = await prisma.event.findFirst({
      where: {
        trainerId,
        id: eventId ? { not: eventId } : undefined,
        status: 'ACTIVE',
        OR: [
          { eventDate: targetDate },
          {
            selectedDates: {
              array_contains: dateStr,
            },
          },
        ],
      },
    });

    if (!otherEvent) {
      // No other event is using this date, safe to release
      const result = await prisma.trainerAvailability.updateMany({
        where: {
          trainerId,
          date: targetDate,
          status: 'BOOKED',
        },
        data: { status: 'AVAILABLE' },
      });
      
      if (result.count > 0) {
        console.log(`[AvailabilityHelper] Released ${dateStr} for trainer ${trainerId}`);
      }
    } else {
      console.log(`[AvailabilityHelper] Retained ${dateStr} for trainer ${trainerId} (used by event ${otherEvent.id})`);
    }
  }
}
