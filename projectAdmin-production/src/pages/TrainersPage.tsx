import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TrainerForm } from '../components/trainers/TrainerForm';
import { TrainerTabs } from '../components/trainers/TrainerTabs';
import { apiClient } from '../lib/api-client';
import { Trainer } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

export const TrainersPage: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await apiClient.getTrainers();
      const trainersData = response.trainers || [];

      // Map backend camelCase to frontend snake_case
      const mappedTrainers: Trainer[] = trainersData.map((t: any) => ({
        id: t.id,
        user_id: t.userId || null,
        email: t.email || '',
        full_name: t.fullName || '',
        phone: t.phoneNumber || null,
        specialization: Array.isArray(t.areasOfExpertise) && t.areasOfExpertise.length > 0 
          ? t.areasOfExpertise[0] 
          : null,
        bio: t.professionalBio || null,
        hourly_rate: t.hourlyRate ? parseFloat(t.hourlyRate) : null,
        hrdc_certified: !!t.hrdcAccreditationId,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
      }));

      setTrainers(mappedTrainers);
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      alert(error.message || 'Error fetching trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrainer = async (data: Partial<Trainer>) => {
    try {
      // Map frontend snake_case to backend camelCase
      const trainerData: any = {
        fullName: data.full_name,
        email: data.email,
        phoneNumber: data.phone,
        professionalBio: data.bio,
      };
      if (data.specialization) {
        trainerData.areasOfExpertise = [data.specialization];
      }
      await apiClient.addTrainer(trainerData);
      setShowAddModal(false);
      fetchTrainers();
    } catch (error: any) {
      console.error('Error adding trainer:', error);
      alert(error.message || 'Error adding trainer');
    }
  };

  const handleUpdateTrainer = async (data: Partial<Trainer>) => {
    if (!editingTrainer) return;

    try {
      // Map frontend snake_case to backend expected format
      // Backend expects 'bio' (not 'professionalBio') and maps it internally
      const updateData: any = {};
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.email !== undefined) updateData.email = data.email;
      
      // Only send the fields that are actually being updated
      if (Object.keys(updateData).length > 0) {
        await apiClient.updateTrainer(editingTrainer.id, updateData);
      }
      
      setShowEditModal(false);
      setEditingTrainer(null);
      fetchTrainers();
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      alert(error.message || 'Error updating trainer');
    }
  };

  const handleDeleteTrainer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this trainer?')) return;

    try {
      await apiClient.deleteTrainer(id);
      fetchTrainers();
    } catch (error: any) {
      console.error('Error deleting trainer:', error);
      alert(error.message || 'Error deleting trainer');
    }
  };

  const openEditModal = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setShowEditModal(true);
  };

  const openDetailsModal = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Trainers</h1>
          <p className="text-gray-600 mt-1">{trainers.length} total trainers</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={18} className="mr-2" />
          Add Trainer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-800">{trainer.full_name}</h3>
                  <p className="text-sm text-gray-600">{trainer.email}</p>
                  {trainer.specialization && (
                    <p className="text-sm text-teal-600 mt-1">{trainer.specialization}</p>
                  )}
                </div>
                {trainer.hrdc_certified && (
                  <Badge variant="success">HRDC</Badge>
                )}
              </div>

              {trainer.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">{trainer.bio}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openDetailsModal(trainer)}
                >
                  View Details
                </Button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(trainer)}
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteTrainer(trainer.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Trainer"
        size="lg"
      >
        <TrainerForm
          onSubmit={handleAddTrainer}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingTrainer(null);
        }}
        title="Edit Trainer"
        size="lg"
      >
        {editingTrainer && (
          <TrainerForm
            trainer={editingTrainer}
            onSubmit={handleUpdateTrainer}
            onCancel={() => {
              setShowEditModal(false);
              setEditingTrainer(null);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTrainer(null);
        }}
        title={selectedTrainer?.full_name || 'Trainer Details'}
        size="xl"
      >
        {selectedTrainer && (
          <TrainerTabs
            trainer={selectedTrainer}
            onUpdate={fetchTrainers}
          />
        )}
      </Modal>
    </div>
  );
};
