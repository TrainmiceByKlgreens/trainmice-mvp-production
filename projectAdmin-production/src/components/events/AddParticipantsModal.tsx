import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { showToast } from '../common/Toast';

interface AddParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  onSuccess: (newRegistration?: any) => void;
}

export const AddParticipantsModal: React.FC<AddParticipantsModalProps> = ({
  isOpen,
  onClose,
  eventId,
  eventTitle,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    state: '',
    city: '',
    picName: '',
    email: '',
    contactNumber: '',
    numberOfParticipants: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.picName.trim()) {
      newErrors.picName = 'PIC name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    }
    if (!formData.numberOfParticipants.trim()) {
      newErrors.numberOfParticipants = 'Number of participants is required';
    } else {
      const num = parseInt(formData.numberOfParticipants);
      if (isNaN(num) || num < 1) {
        newErrors.numberOfParticipants = 'Number of participants must be at least 1';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.addParticipantsNewClient(eventId, {
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
        state: formData.state.trim() || undefined,
        city: formData.city.trim() || undefined,
        picName: formData.picName.trim(),
        email: formData.email.trim(),
        contactNumber: formData.contactNumber.trim(),
        numberOfParticipants: parseInt(formData.numberOfParticipants),
      });

      showToast('Participants added successfully', 'success');
      handleClose();
      onSuccess(response.registration);
    } catch (error: any) {
      console.error('Error adding participants:', error);
      showToast(error.message || 'Failed to add participants', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      address: '',
      state: '',
      city: '',
      picName: '',
      email: '',
      contactNumber: '',
      numberOfParticipants: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Participants (New Client) - ${eventTitle}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <p className="text-sm text-gray-600">
            Enter the company and contact information for the new client. The participants will be automatically added to this event.
          </p>
        </div>

        <Input
          label="Company Name *"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          error={errors.companyName}
          required
        />

        <Textarea
          label="Address *"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          rows={3}
          error={errors.address}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            error={errors.state}
          />

          <Input
            label="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            error={errors.city}
          />
        </div>

        <Input
          label="PIC Name *"
          value={formData.picName}
          onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
          error={errors.picName}
          required
        />

        <Input
          label="Email *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
          required
        />

        <Input
          label="Contact Number *"
          value={formData.contactNumber}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          error={errors.contactNumber}
          required
        />

        <Input
          label="Number of People Participating *"
          type="number"
          min="1"
          value={formData.numberOfParticipants}
          onChange={(e) => setFormData({ ...formData, numberOfParticipants: e.target.value })}
          error={errors.numberOfParticipants}
          required
        />

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Adding...
              </>
            ) : (
              'Add Participants'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};


