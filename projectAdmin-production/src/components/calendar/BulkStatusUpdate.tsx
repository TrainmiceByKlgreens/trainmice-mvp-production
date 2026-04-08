import React, { useState } from 'react';
import { apiClient } from '../../lib/api-client';
import { Card, CardHeader, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { showToast } from '../common/Toast';
import { Calendar, Info } from 'lucide-react';

interface BulkStatusUpdateProps {
  trainerId: string;
  onUpdate: () => void;
}

type BulkStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'TENTATIVE' | 'BOOKED';

export const BulkStatusUpdate: React.FC<BulkStatusUpdateProps> = ({ trainerId, onUpdate }) => {
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    status: 'AVAILABLE' as BulkStatus,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!form.startDate || !form.endDate) {
      showToast('Please select both start and end dates', 'error');
      return;
    }

    setLoading(true);
    try {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const dates: string[] = [];
      const current = new Date(start);
      
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }

      if (form.status === 'TENTATIVE' || form.status === 'BOOKED') {
        const bookingStatus = form.status === 'BOOKED' ? 'CONFIRMED' : 'TENTATIVE';
        // Creating multiple individual manual bookings for the range
        // In a production app, we would ideally have a bulk API for this.
        await Promise.all(dates.map(date => 
           apiClient.createTrainerBooking({
            trainerId,
            bookingDate: date,
            status: bookingStatus,
            notes: form.notes
          })
        ));
      } else {
        // Simple availability update
        await apiClient.createTrainerAvailability(trainerId, {
          dates,
          status: form.status
        });
      }

      showToast(`Successfully updated ${dates.length} days`, 'success');
      onUpdate();
      setForm({ startDate: '', endDate: '', status: 'AVAILABLE', notes: '' });
    } catch (error: any) {
      showToast(error.message || 'Failed to update availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-gray-200 bg-white">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          Bulk Schedule Update
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <Select
            label="Target Status"
            value={form.status}
            onChange={e => setForm({ ...form, status: e.target.value as any })}
            options={[
              { value: 'AVAILABLE', label: 'Available' },
              { value: 'NOT_AVAILABLE', label: 'Not Available' },
              { value: 'TENTATIVE', label: 'Tentative' },
              { value: 'BOOKED', label: 'Booked' }
            ]}
          />
          
          {(form.status === 'TENTATIVE' || form.status === 'BOOKED') && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
               <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-1">
                <Info className="w-3 h-3" /> Reason / Notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder={`Enter reason for ${form.status} status...`}
                className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:border-teal-500 outline-none min-h-[80px] resize-none transition-all"
              />
            </div>
          )}
        </div>
        <Button
          onClick={handleUpdate}
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 font-bold uppercase tracking-widest text-[10px] shadow-sm transform active:scale-[0.98] transition-transform"
        >
          {loading ? 'Processing...' : 'Apply Schedule Update'}
        </Button>
      </CardContent>
    </Card>
  );
};
