import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { Settings, Users, Shield, Trash2, Plus, Edit, Save } from 'lucide-react';
import { showToast } from '../components/common/Toast';
import { formatDate } from '../utils/helpers';

interface Admin {
  id: string;
  email: string;
  fullName: string | null;
  adminCode: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    emailVerified: boolean;
  };
}

interface PlatformSettings {
  platformName: string;
  maintenanceMode: boolean;
  allowTrainerRegistration: boolean;
  allowClientRegistration: boolean;
  emailNotificationsEnabled: boolean;
  hrdcExpiryAlertDays: number;
}

export const SystemSettingsPage: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    fullName: '',
    adminCode: '',
  });

  const [editAdminForm, setEditAdminForm] = useState({
    fullName: '',
    adminCode: '',
    password: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsResponse, settingsResponse] = await Promise.all([
        apiClient.getAdmins(),
        apiClient.getPlatformSettings(),
      ]);

      setAdmins(adminsResponse.admins || []);
      setPlatformSettings(settingsResponse.settings || null);
    } catch (error: any) {
      console.error('Error fetching settings data:', error);
      showToast(error.message || 'Error fetching settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.email || !adminForm.password) {
      showToast('Email and password are required', 'error');
      return;
    }

    try {
      await apiClient.createAdmin({
        email: adminForm.email,
        password: adminForm.password,
        fullName: adminForm.fullName || undefined,
        adminCode: adminForm.adminCode || undefined,
      });
      showToast('Admin account created successfully', 'success');
      setShowAddAdminModal(false);
      setAdminForm({ email: '', password: '', fullName: '', adminCode: '' });
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error creating admin account', 'error');
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;

    try {
      await apiClient.updateAdmin(editingAdmin.id, {
        fullName: editAdminForm.fullName || undefined,
        adminCode: editAdminForm.adminCode || undefined,
        password: editAdminForm.password || undefined,
      });
      showToast('Admin account updated successfully', 'success');
      setShowEditAdminModal(false);
      setEditingAdmin(null);
      setEditAdminForm({ fullName: '', adminCode: '', password: '' });
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error updating admin account', 'error');
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin account?')) return;

    try {
      await apiClient.deleteAdmin(adminId);
      showToast('Admin account deleted successfully', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error deleting admin account', 'error');
    }
  };

  const handleUpdatePlatformSettings = async () => {
    if (!platformSettings) return;

    try {
      await apiClient.updatePlatformSettings({
        maintenanceMode: platformSettings.maintenanceMode,
        allowTrainerRegistration: platformSettings.allowTrainerRegistration,
        allowClientRegistration: platformSettings.allowClientRegistration,
      });
      showToast('Platform settings updated successfully', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error updating platform settings', 'error');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
      </div>

      {/* Platform Settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="text-teal-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Platform Settings</h2>
          </div>

          {platformSettings && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable access to the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.maintenanceMode}
                    onChange={(e) =>
                      setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Allow Trainer Registration</p>
                  <p className="text-sm text-gray-600">Enable public trainer registration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.allowTrainerRegistration}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        allowTrainerRegistration: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">Allow Client Registration</p>
                  <p className="text-sm text-gray-600">Enable public client registration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.allowClientRegistration}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        allowClientRegistration: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <Button variant="primary" onClick={handleUpdatePlatformSettings}>
                  <Save size={18} className="mr-2" />
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Admin Accounts */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Users className="text-teal-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Admin Accounts</h2>
            </div>
            <Button variant="primary" onClick={() => setShowAddAdminModal(true)}>
              <Plus size={18} className="mr-2" />
              Add Admin
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No admin accounts found
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {admin.fullName || admin.user?.fullName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{admin.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {admin.adminCode ? (
                          <Badge variant="info">{admin.adminCode}</Badge>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingAdmin(admin);
                              setEditAdminForm({
                                fullName: admin.fullName || '',
                                adminCode: admin.adminCode || '',
                                password: '',
                              });
                              setShowEditAdminModal(true);
                            }}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Add Admin Modal */}
      <Modal
        isOpen={showAddAdminModal}
        onClose={() => {
          setShowAddAdminModal(false);
          setAdminForm({ email: '', password: '', fullName: '', adminCode: '' });
        }}
        title="Add Admin Account"
      >
        <div className="space-y-4">
          <Input
            label="Email *"
            type="email"
            value={adminForm.email}
            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
            placeholder="admin@example.com"
            required
          />
          <Input
            label="Password *"
            type="password"
            value={adminForm.password}
            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
            placeholder="Minimum 6 characters"
            required
          />
          <Input
            label="Full Name"
            value={adminForm.fullName}
            onChange={(e) => setAdminForm({ ...adminForm, fullName: e.target.value })}
            placeholder="Optional"
          />
          <Input
            label="Admin Code"
            value={adminForm.adminCode}
            onChange={(e) => setAdminForm({ ...adminForm, adminCode: e.target.value })}
            placeholder="Optional admin code"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddAdminModal(false);
                setAdminForm({ email: '', password: '', fullName: '', adminCode: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddAdmin}>
              <Plus size={18} className="mr-2" />
              Create Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={showEditAdminModal}
        onClose={() => {
          setShowEditAdminModal(false);
          setEditingAdmin(null);
          setEditAdminForm({ fullName: '', adminCode: '', password: '' });
        }}
        title={`Edit Admin - ${editingAdmin?.email || ''}`}
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={editAdminForm.fullName}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, fullName: e.target.value })}
            placeholder="Optional"
          />
          <Input
            label="Admin Code"
            value={editAdminForm.adminCode}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, adminCode: e.target.value })}
            placeholder="Optional admin code"
          />
          <Input
            label="New Password (leave blank to keep current)"
            type="password"
            value={editAdminForm.password}
            onChange={(e) => setEditAdminForm({ ...editAdminForm, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditAdminModal(false);
                setEditingAdmin(null);
                setEditAdminForm({ fullName: '', adminCode: '', password: '' });
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateAdmin}>
              <Save size={18} className="mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

