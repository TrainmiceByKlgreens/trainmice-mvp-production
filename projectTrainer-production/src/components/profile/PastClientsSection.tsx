import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextareaWithLimit } from '../ui/TextareaWithLimit';
import { Plus, Edit2, Trash2, Save, X, Users } from 'lucide-react';
import {
  createPastClient,
  updatePastClient,
  deletePastClientWithTrainerId,
  getYearOptions
} from '../../lib/trainerProfileService';
import { TrainerPastClient } from '../../types/database';

interface PastClientsSectionProps {
  pastClients: TrainerPastClient[];
  trainerId: string;
  onUpdate: () => Promise<void>;
}

export function PastClientsSection({ pastClients, trainerId, onUpdate }: PastClientsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '',
    project_description: '',
    year: ''
  });

  const yearOptions = getYearOptions();

  const resetForm = () => {
    setFormData({
      client_name: '',
      project_description: '',
      year: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (pastClients.length >= 5) {
      alert('Maximum 5 past clients allowed');
      return;
    }
    resetForm();
    setIsAdding(true);
  };

  const handleEdit = (client: TrainerPastClient) => {
    setFormData({
      client_name: client.client_name,
      project_description: client.project_description || '',
      year: client.year?.toString() || ''
    });
    setEditingId(client.id);
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!formData.client_name.trim()) {
      alert('Client name is required');
      return;
    }

    setSaving(true);
    try {
      const clientData = {
        trainer_id: trainerId,
        client_name: formData.client_name.trim(),
        project_description: formData.project_description.trim() || null,
        year: formData.year ? parseInt(formData.year) : null
      };

      if (editingId) {
        await updatePastClient(editingId, clientData);
      } else {
        await createPastClient(clientData);
      }

      await onUpdate();
      resetForm();
    } catch (error) {
      console.error('Error saving past client:', error);
      alert(error instanceof Error ? error.message : 'Failed to save past client');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this past client?')) {
      return;
    }

    try {
      await deletePastClientWithTrainerId(trainerId, id);
      await onUpdate();
    } catch (error) {
      console.error('Error deleting past client:', error);
      alert('Failed to delete past client');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Past Clients
              <span className="ml-2 text-sm text-gray-500">({pastClients.length}/5)</span>
            </h3>
          </div>
          {!isAdding && !editingId && pastClients.length < 5 && (
            <Button variant="primary" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {(isAdding || editingId) && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="space-y-4">
              <Input
                label="Client Name"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                required
                placeholder="Company or Organization Name"
              />

              <TextareaWithLimit
                label="Project Description"
                value={formData.project_description}
                onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                rows={3}
                wordLimit={200}
                placeholder="Brief description of the work or training provided..."
              />

              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Year</option>
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={resetForm}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {pastClients.length === 0 && !isAdding ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No past clients added yet</p>
            <p className="text-gray-400 text-xs mt-1">Add up to 5 clients you have worked with</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pastClients.map((client) => (
              <div
                key={client.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{client.client_name}</h4>
                      {client.year && (
                        <span className="text-sm text-gray-500">({client.year})</span>
                      )}
                    </div>
                    {client.project_description && (
                      <p className="text-sm text-gray-600 mt-1">{client.project_description}</p>
                    )}
                  </div>
                  {!isAdding && !editingId && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(client)}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
