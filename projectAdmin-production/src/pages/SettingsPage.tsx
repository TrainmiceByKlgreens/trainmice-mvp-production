import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { useAuth } from '../hooks/useAuth';
import { Admin, Trainer } from '../types';
import { Shield, Users, Settings as SettingsIcon } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'trainers' | 'system'>('profile');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const [adminResponse, trainersResponse] = await Promise.all([
        apiClient.getAdminProfile(),
        apiClient.getTrainers(),
      ]);

      // Map backend to frontend format
      setAdmin({
        id: adminResponse.id,
        email: adminResponse.email,
        full_name: adminResponse.fullName || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Map trainers
      const mappedTrainers: Trainer[] = (trainersResponse.trainers || []).map((t: any) => ({
        id: t.id,
        user_id: t.userId || null,
        email: t.email || '',
        full_name: t.fullName || '',
        phone: t.phoneNumber || null,
        specialization: Array.isArray(t.areasOfExpertise) && t.areasOfExpertise.length > 0 
          ? t.areasOfExpertise[0] 
          : null,
        bio: t.professionalBio || null,
        hourly_rate: null,
        hrdc_certified: !!t.hrdcAccreditationId,
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString(),
      }));

      setTrainers(mappedTrainers);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !admin) return;

    try {
      const formData = new FormData(e.currentTarget);
      await apiClient.updateAdminProfile({
        fullName: formData.get('full_name') as string,
      });
      alert('Profile updated successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Error updating profile');
    }
  };

  const handleToggleHRDC = async (trainerId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Update trainer with HRDC status
      await apiClient.updateTrainer(trainerId, {
        hrdcCertified: newStatus,
      });
      
      fetchData();
    } catch (error: any) {
      console.error('Error updating HRDC status:', error);
      alert(error.message || 'Error updating HRDC status');
    }
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
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'profile'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SettingsIcon size={18} />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('trainers')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'trainers'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield size={18} />
            <span>HRDC Certification</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'system'
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={18} />
            <span>System</span>
          </button>
        </nav>
      </div>

      {activeTab === 'profile' && (
        <Card title="Admin Profile">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              defaultValue={admin?.email || user?.email || ''}
              disabled
            />
            <Input
              label="Full Name"
              name="full_name"
              defaultValue={admin?.full_name || ''}
            />
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'trainers' && (
        <Card title="Trainer HRDC Certification Management">
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">
              Manage HRDC certification status for all trainers. Certified trainers can offer
              HRDC-claimable courses.
            </p>
            <div className="space-y-3">
              {trainers.map((trainer) => (
                <div
                  key={trainer.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{trainer.full_name}</h4>
                    <p className="text-sm text-gray-600">{trainer.email}</p>
                    {trainer.specialization && (
                      <p className="text-sm text-teal-600">{trainer.specialization}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    {trainer.hrdc_certified ? (
                      <Badge variant="success">HRDC Certified</Badge>
                    ) : (
                      <Badge variant="default">Not Certified</Badge>
                    )}
                    <Button
                      size="sm"
                      variant={trainer.hrdc_certified ? 'danger' : 'success'}
                      onClick={() => handleToggleHRDC(trainer.id, trainer.hrdc_certified)}
                    >
                      {trainer.hrdc_certified ? 'Revoke' : 'Certify'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'system' && (
        <Card title="System Information">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Total Trainers</h3>
                <p className="text-3xl font-bold">{trainers.length}</p>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
                <h3 className="text-lg font-semibold mb-2">HRDC Certified</h3>
                <p className="text-3xl font-bold">
                  {trainers.filter(t => t.hrdc_certified).length}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Database</h3>
                <p className="text-sm">MySQL</p>
                <p className="text-xs opacity-80 mt-1">Connected</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Application Version</h4>
              <p className="text-sm text-gray-600">Trainmice Admin Dashboard v1.0.0</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
