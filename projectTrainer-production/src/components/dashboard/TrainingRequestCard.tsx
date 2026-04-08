import { Calendar, MapPin, Check, X, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { BookingWithCourse } from '../../types/database';
import { useState } from 'react';

interface TrainingRequestCardProps {
  request: BookingWithCourse;
  onConfirm: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
  onMarkRead?: (requestId: string) => void;
}

export function TrainingRequestCard({ request, onConfirm, onDecline, onMarkRead }: TrainingRequestCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (hours: number | null, unit: string | null) => {
    if (!hours) return 'Duration TBD';
    if (unit === 'days') {
      return `${hours} ${hours === 1 ? 'day' : 'days'}`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm(request.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsLoading(true);
    try {
      await onDecline(request.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card 
      onClick={() => request.isRead === false && onMarkRead?.(request.id)}
      className={`hover:shadow-modern-lg transition-all duration-300 border-l-4 border-l-black bg-white border border-corporate-100 relative overflow-hidden group h-full flex flex-col cursor-pointer ${request.isRead === false ? 'ring-2 ring-black/10' : ''}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-accent-gold/[0.03] ml-1 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardContent className="p-5 relative z-10 flex flex-col h-full bg-white">
        <div className="space-y-4">
          <div className="mb-auto">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-sm font-black text-corporate-950 group-hover:text-black transition-colors tracking-tight line-clamp-2 uppercase leading-relaxed">
                {request.courses?.title || 'Course Request'}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-block px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-black text-accent-gold border border-black rounded-lg shadow-sm">
                  Pending
                </span>
                {request.isRead === false && (
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse shrink-0 border-2 border-white shadow-sm" title="New Request" />
                )}
              </div>
            </div>
            {request.client_name && (
              <p className="text-[10px] font-black text-corporate-400 uppercase tracking-widest">Requester: <span className="text-corporate-600">{request.client_name}</span></p>
            )}
          </div>

          <div className="space-y-4 my-6">
            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <Clock className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span className="truncate">
                {formatDuration(
                  request.courses?.duration_hours || null,
                  request.courses?.duration_unit || null
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span className="truncate">
                {formatDate(request.requested_date)}
                {request.requested_time && <span className="ml-2 py-0.5 px-1.5 bg-black text-accent-gold rounded-lg text-[9px] font-black uppercase tracking-tighter">{request.requested_time}</span>}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-corporate-600">
              <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center border border-corporate-100 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-corporate-400 group-hover:text-black transition-colors" />
              </div>
              <span className="truncate">
                {request.city && request.state
                  ? `${request.city}, ${request.state}`
                  : request.location || 'Location TBD'}
              </span>
            </div>
          </div>

          <div className="pt-4 mt-auto flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              size="sm"
              className="flex-1 bg-black hover:bg-black/90 text-accent-gold disabled:opacity-50 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-black/10 h-10 px-2 rounded-xl"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Confirm
            </Button>
            <Button
              onClick={handleDecline}
              disabled={isLoading}
              size="sm"
              variant="outline"
              className="flex-1 border-corporate-200 text-red-500 hover:border-red-600 hover:text-red-700 disabled:opacity-50 font-black text-[10px] uppercase tracking-[0.2em] h-10 px-2 transition-all rounded-xl"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
