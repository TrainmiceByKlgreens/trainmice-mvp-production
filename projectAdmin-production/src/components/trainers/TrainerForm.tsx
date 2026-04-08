import React, { useState } from 'react';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { Trainer } from '../../types';

type TrainerFormData = Partial<Trainer> & {
  password?: string;
  confirmPassword?: string;
};

interface TrainerFormProps {
  trainer?: Trainer;
  onSubmit: (data: TrainerFormData) => Promise<void>;
  onCancel: () => void;
}

export const TrainerForm: React.FC<TrainerFormProps> = ({
  trainer,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    full_name: trainer?.full_name || '',
    email: trainer?.email || '',
    phone: trainer?.phone || '',
    specialization: trainer?.specialization || '',
    bio: trainer?.bio || '',
    password: '',
    confirmPassword: '',
    // Removed hourly_rate - not editable
    // Removed hrdc_certified - HRDC verification should only be done via Verify HRDC Certification button
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!trainer) {
      if (!formData.password || formData.password.length < 8) {
        setError('Initial password must be at least 8 characters long');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      if (trainer) {
        // When editing, exclude disabled fields (full_name, phone, specialization)
        const { full_name, phone, specialization, password, confirmPassword, ...editableFields } = formData;
        await onSubmit(editableFields);
      } else {
        // When creating, include all fields
        await onSubmit(formData);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
          disabled={!!trainer}
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={!!trainer}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          disabled={!!trainer}
        />
        <Input
          label="Specialization"
          value={formData.specialization}
          onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
          disabled={!!trainer}
        />
      </div>

      <Textarea
        label="Bio"
        value={formData.bio}
        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
        rows={4}
      />

      {!trainer && (
        <>
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Manual trainer creation provisions a login account immediately. Share the initial password with the trainer securely.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Initial Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
        </>
      )}

      {/* HRDC Certification removed - use "Verify HRDC Certification" button in trainers list instead */}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? 'Saving...' : trainer ? 'Update Trainer' : 'Add Trainer'}
        </Button>
      </div>
    </form>
  );
};
