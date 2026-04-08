import { TrainerAvailability, SelectedSlot } from '../lib/api-client';
import { format, parseISO } from 'date-fns';

function normalizeTime(time: string | null): string | null {
  if (!time) return null;
  return time.substring(0, 5);
}

export function parseDuration(duration: number | null, durationUnit: string | null): number {
  if (!duration) return 0;

  if (durationUnit === 'days' || durationUnit === 'day') {
    return duration * 9;
  }

  return duration;
}

export function calculateRequiredSlots(duration: number | null, durationUnit: string | null): number {
  const hours = parseDuration(duration, durationUnit);
  return Math.ceil(hours / 4);
}

export function formatDuration(duration: number | null, durationUnit: string | null): string {
  if (!duration) return 'Not specified';

  if (durationUnit === 'days' || durationUnit === 'day') {
    return duration === 1 ? '1 day' : `${duration} days`;
  }

  return duration === 1 ? '1 hour' : `${duration} hours`;
}

export function formatSlotTime(slot: 'morning' | 'afternoon' | 'full_day'): string {
  switch (slot) {
    case 'morning':
      return '09:00-13:00';
    case 'afternoon':
      return '14:00-18:00';
    case 'full_day':
      return '09:00-18:00';
  }
}

export function getSlotLabel(slot: 'morning' | 'afternoon' | 'full_day'): string {
  switch (slot) {
    case 'morning':
      return 'Morning';
    case 'afternoon':
      return 'Afternoon';
    case 'full_day':
      return 'Full Day';
  }
}

export function getSlotIndicator(
  dateAvailability: TrainerAvailability[]
): string {
  if (dateAvailability.length === 0) return '';

  if (dateAvailability.length === 1 &&
      normalizeTime(dateAvailability[0].start_time) === '09:00' &&
      normalizeTime(dateAvailability[0].end_time) === '18:00') {
    return '';
  }

  const morning = dateAvailability.find(
    a => normalizeTime(a.start_time) === '09:00' && normalizeTime(a.end_time) === '13:00'
  );
  const afternoon = dateAvailability.find(
    a => normalizeTime(a.start_time) === '14:00' && normalizeTime(a.end_time) === '18:00'
  );

  if (!morning && !afternoon) return '';

  const morningAvailable = morning?.status === 'available';
  const morningTentative = morning?.status === 'tentative';
  const morningBooked = morning?.status === 'booked';

  const afternoonAvailable = afternoon?.status === 'available';
  const afternoonTentative = afternoon?.status === 'tentative';
  const afternoonBooked = afternoon?.status === 'booked';

  if (morningAvailable && afternoonAvailable) return '●●';
  if (morningAvailable && afternoonTentative) return '●⚠️';
  if (morningAvailable && (afternoonBooked || !afternoon)) return '●○';
  if (morningTentative && afternoonAvailable) return '⚠️●';
  if ((morningBooked || !morning) && afternoonAvailable) return '○●';
  if (morningTentative && (afternoonBooked || !afternoon)) return '⚠️○';
  if ((morningBooked || !morning) && afternoonTentative) return '○⚠️';

  return '';
}

export function getDateStatus(
  dateAvailability: TrainerAvailability[],
  schedulingType: 'slot_based' | 'full_day'
): 'available' | 'tentative' | 'booked' | 'unavailable' {
  if (dateAvailability.length === 0) return 'unavailable';

  if (schedulingType === 'full_day') {
    return dateAvailability[0].status;
  }

  const statuses = dateAvailability.map(a => a.status);

  if (statuses.every(s => s === 'booked')) return 'booked';
  if (statuses.some(s => s === 'available')) return 'available';
  if (statuses.some(s => s === 'tentative')) return 'tentative';

  return 'unavailable';
}

export function isSlotAvailable(
  dateAvailability: TrainerAvailability[],
  slot: 'morning' | 'afternoon' | 'full_day'
): boolean {
  if (slot === 'full_day') {
    const fullDay = dateAvailability.find(
      a => normalizeTime(a.start_time) === '09:00' && normalizeTime(a.end_time) === '18:00'
    );
    return fullDay?.status === 'available' || fullDay?.status === 'tentative';
  }

  const targetTime = slot === 'morning'
    ? { start: '09:00', end: '13:00' }
    : { start: '14:00', end: '18:00' };

  const slotAvail = dateAvailability.find(
    a => normalizeTime(a.start_time) === targetTime.start && normalizeTime(a.end_time) === targetTime.end
  );

  return slotAvail?.status === 'available' || slotAvail?.status === 'tentative';
}

export function isSlotTentative(
  dateAvailability: TrainerAvailability[],
  slot: 'morning' | 'afternoon' | 'full_day'
): boolean {
  if (slot === 'full_day') {
    const fullDay = dateAvailability.find(
      a => normalizeTime(a.start_time) === '09:00' && normalizeTime(a.end_time) === '18:00'
    );
    return fullDay?.status === 'tentative';
  }

  const targetTime = slot === 'morning'
    ? { start: '09:00', end: '13:00' }
    : { start: '14:00', end: '18:00' };

  const slotAvail = dateAvailability.find(
    a => normalizeTime(a.start_time) === targetTime.start && normalizeTime(a.end_time) === targetTime.end
  );

  return slotAvail?.status === 'tentative';
}

export function calculateProgress(selected: number, required: number): number {
  if (required === 0) return 0;
  return Math.min(100, Math.round((selected / required) * 100));
}

export function formatDateDisplay(dateString: string, slot: 'morning' | 'afternoon' | 'full_day'): string {
  const date = parseISO(dateString);
  const formattedDate = format(date, 'MMM d');
  const slotLabel = getSlotLabel(slot);
  const time = formatSlotTime(slot);

  return `${formattedDate} - ${slotLabel} (${time})`;
}

export function slotsToDays(slots: number): string {
  const days = slots / 2;
  return days === 1 ? '1 day' : days % 1 === 0 ? `${days} days` : `${days} days`;
}
