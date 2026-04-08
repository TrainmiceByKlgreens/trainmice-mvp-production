import React from 'react';
import { Badge } from '../common/Badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalizedStatus = (status || '').toLowerCase();

  switch (normalizedStatus) {
    case 'available':
      return <Badge variant="success">Available</Badge>;
    case 'booked':
    case 'confirmed':
    case 'approved':
      return <Badge variant="info">Booked</Badge>;
    case 'blocked':
      return <Badge variant="danger">Blocked</Badge>;
    case 'tentative':
    case 'pending':
    case 'paperwork_in_progress':
      return <Badge variant="warning">Tentative</Badge>;
    case 'not_available':
      return <Badge variant="default">Not Available</Badge>;
    case 'denied':
    case 'canceled':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
