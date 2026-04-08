import { BookingRequest } from '../../types/database';

interface StatusBadgeProps {
  status: BookingRequest['status'] | 'available' | 'not_available' | 'blocked';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  available: {
    label: 'Available',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    borderColor: 'border-green-300'
  },
  not_available: {
    label: 'Not Available',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300'
  },
  blocked: {
    label: 'Blocked',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300'
  },
  tentative: {
    label: 'Tentative',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-300'
  },
  booked: {
    label: 'Booked',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300'
  },
  pending: {
    label: 'Pending',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300'
  },
  approved: {
    label: 'Approved',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-300'
  },
  denied: {
    label: 'Denied',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    borderColor: 'border-red-300'
  },
  canceled: {
    label: 'Canceled',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300'
  },
  cancelled: {
    label: 'Canceled',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-300'
  }
};

export function StatusBadge({ status, size = 'sm', showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (!config) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      {showLabel ? config.label : null}
      {!showLabel && <span className="w-2 h-2 rounded-full bg-current" />}
    </span>
  );
}
