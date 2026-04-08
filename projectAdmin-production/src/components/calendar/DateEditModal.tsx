import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { CalendarDay } from '../../types/calendar';
import { showToast } from '../common/Toast';
import { Calendar, Save, Zap, Clock, Info } from 'lucide-react';

interface DateEditModalProps {
  day: CalendarDay | null;
  trainerId: string;
  onClose: () => void;
  onUpdate: () => void;
}

type EditableStatus = 'available' | 'not_available' | 'tentative' | 'booked';

export const DateEditModal: React.FC<DateEditModalProps> = ({ day, trainerId, onClose, onUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState<EditableStatus>('available');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (day) {
      setSelectedStatus((day.status as EditableStatus) || 'available');
      setNotes(day.manualBooking?.notes || '');
    }
  }, [day]);

  if (!day) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      const isManual = selectedStatus === 'booked' || selectedStatus === 'tentative';

      if (isManual) {
        const bookingStatus = selectedStatus === 'booked' ? 'CONFIRMED' : 'TENTATIVE';
        if (day.manualBooking) {
          await apiClient.updateTrainerBooking(day.manualBooking.id, {
            status: bookingStatus,
            notes: notes
          });
        } else {
          await apiClient.createTrainerBooking({
            trainerId,
            bookingDate: day.dateString,
            status: bookingStatus,
            notes: notes
          });
        }
      } else {
        // Simple availability update
        await apiClient.createTrainerAvailability(trainerId, {
          dates: [day.dateString],
          status: selectedStatus.toUpperCase() as 'AVAILABLE' | 'NOT_AVAILABLE'
        });
        
        // Clear manual booking if it existed
        if (day.manualBooking) {
          await apiClient.deleteTrainerBooking(day.manualBooking.id);
        }
      }

      showToast('Schedule updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to update schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  const STATUS_OPTIONS: { id: EditableStatus; label: string; desc: string; color: string; icon: any }[] = [
    { id: 'available', label: 'Available', desc: 'Open for new sessions', color: 'text-emerald-600', icon: Zap },
    { id: 'not_available', label: 'Not Available', desc: 'Mark as private or busy', color: 'text-gray-400', icon: Info },
    { id: 'tentative', label: 'Tentative', desc: 'Mark as tentatively booked', color: 'text-yellow-500', icon: Clock },
    { id: 'booked', label: 'Booked', desc: 'Manually block as booked', color: 'text-blue-600', icon: Save }
  ];

  return (
    <Modal
      isOpen={!!day}
      onClose={onClose}
      title="Edit Day Status"
      size="md"
    >
      <div className="space-y-6 py-2">
        {/* Date Header */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <Calendar className="w-5 h-5 text-teal-600" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Target Date</p>
            <p className="text-sm font-bold text-gray-700">{day.dateString}</p>
          </div>
        </div>

        {/* Status Options */}
        <div className="grid grid-cols-1 gap-2">
          {STATUS_OPTIONS.map((opt) => {
             const Icon = opt.icon;
             return (
              <button
                key={opt.id}
                onClick={() => setSelectedStatus(opt.id)}
                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                  selectedStatus === opt.id
                    ? 'border-teal-600 bg-teal-50/30'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedStatus === opt.id ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className={`text-xs font-bold uppercase tracking-wide ${selectedStatus === opt.id ? 'text-teal-700' : 'text-gray-600'}`}>{opt.label}</p>
                    <p className="text-[10px] text-gray-400">{opt.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Notes (Conditional) */}
        {(selectedStatus === 'booked' || selectedStatus === 'tentative') && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3" /> Notes / Reason
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Enter reason for ${selectedStatus} status...`}
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:border-teal-500 outline-none min-h-[80px] resize-none"
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1 py-3" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
