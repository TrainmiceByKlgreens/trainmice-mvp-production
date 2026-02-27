import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { TextareaWithLimit } from '../common/TextareaWithLimit';
import { Tabs, Tab } from '../common/Tabs';
import { TabPanel } from '../common/TabPanel';
import { MultiSelect } from '../common/MultiSelect';
import { apiClient } from '../../lib/api-client';
import { User, Briefcase, Award, Plus, Edit2, Trash2, MapPin, Globe } from 'lucide-react';
import { showToast } from '../common/Toast';

interface EnhancedTrainerFormProps {
    trainerId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const EnhancedTrainerForm: React.FC<EnhancedTrainerFormProps> = ({
    trainerId,
    onSuccess,
    onCancel
}) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trainer, setTrainer] = useState<any>(null);
    const [qualifications, setQualifications] = useState<any[]>([]);
    const [workHistory, setWorkHistory] = useState<any[]>([]);
    const [pastClients, setPastClients] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        loadAllData();
    }, [trainerId]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [trainerData, quals, work, clients] = await Promise.all([
                apiClient.getTrainer(trainerId),
                apiClient.getQualifications(trainerId),
                apiClient.getWorkHistory(trainerId),
                apiClient.getPastClients(trainerId)
            ]);

            setTrainer(trainerData);
            setQualifications(quals.qualifications || []);
            setWorkHistory(work.workHistory || []);
            setPastClients(clients.pastClients || []);
        } catch (error) {
            console.error('Error loading trainer data:', error);
            showToast('Failed to load trainer data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!trainer) return;
        setSaving(true);
        try {
            await apiClient.updateTrainerProfile(trainerId, trainer);
            showToast('Trainer profile updated successfully', 'success');
            loadAllData();
            onSuccess();
        } catch (error: any) {
            showToast(error.message || 'Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field: string, value: any) => {
        setTrainer((prev: any) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <LoadingSpinner />
            </div>
        );
    }

    const tabs: Tab[] = [
        { id: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
        { id: 'professional', label: 'Professional', icon: <Award className="w-4 h-4" />, badge: qualifications.length + workHistory.length },
        { id: 'other', label: 'Other Info', icon: <MapPin className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-6">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <TabPanel value="personal" activeTab={activeTab}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={trainer.full_name || ''}
                            onChange={(e) => handleFieldChange('full_name', e.target.value)}
                            required
                        />
                        <Input
                            label="Email"
                            value={trainer.email || ''}
                            disabled
                            helperText="Email is managed by authentication"
                        />
                        <Input
                            label="IC Number"
                            value={trainer.ic_number || ''}
                            onChange={(e) => handleFieldChange('ic_number', e.target.value)}
                            placeholder="XXXXXX-XX-XXXX"
                        />
                        <Input
                            label="Race"
                            value={trainer.race || ''}
                            onChange={(e) => handleFieldChange('race', e.target.value)}
                        />
                        <Input
                            label="Phone Number"
                            value={trainer.phone_number || ''}
                            onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                            placeholder="+60XXXXXXXXX"
                        />
                        <Input
                            label="HRDC Accreditation ID"
                            value={trainer.hrdc_accreditation_id || ''}
                            onChange={(e) => handleFieldChange('hrdc_accreditation_id', e.target.value)}
                        />
                        <Input
                            label="HRDC Accreditation Valid Until"
                            type="date"
                            value={trainer.hrdc_accreditation_valid_until ? new Date(trainer.hrdc_accreditation_valid_until).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('hrdc_accreditation_valid_until', e.target.value)}
                        />
                    </div>

                    <TextareaWithLimit
                        label="Professional Bio"
                        value={trainer.professional_bio || ''}
                        onChange={(e) => handleFieldChange('professional_bio', e.target.value)}
                        rows={5}
                        wordLimit={500}
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateProfile} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Personal Info'}
                        </Button>
                    </div>
                </div>
            </TabPanel>

            <TabPanel value="professional" activeTab={activeTab}>
                <div className="space-y-8">
                    <QualificationsSection
                        trainerId={trainerId}
                        qualifications={qualifications}
                        onUpdate={loadAllData}
                    />
                    <hr className="border-gray-200" />
                    <WorkHistorySection
                        trainerId={trainerId}
                        workHistory={workHistory}
                        onUpdate={loadAllData}
                    />
                </div>
            </TabPanel>

            <TabPanel value="other" activeTab={activeTab}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Country"
                            value={trainer.country || ''}
                            onChange={(e) => handleFieldChange('country', e.target.value)}
                        />
                        <Input
                            label="State"
                            value={trainer.state || ''}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                        />
                        <Input
                            label="City"
                            value={trainer.city || ''}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <MultiSelect
                            label="Areas of Expertise"
                            value={trainer.areas_of_expertise || []}
                            onChange={(val) => handleFieldChange('areas_of_expertise', val)}
                            placeholder="Add expertise..."
                        />
                        <MultiSelect
                            label="Languages Spoken"
                            value={trainer.languages_spoken || []}
                            onChange={(val) => handleFieldChange('languages_spoken', val)}
                            placeholder="Add language..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateProfile} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Other Info'}
                        </Button>
                    </div>

                    <hr className="border-gray-200 my-8" />

                    <PastClientsSection
                        trainerId={trainerId}
                        pastClients={pastClients}
                        onUpdate={loadAllData}
                    />
                </div>
            </TabPanel>
        </div>
    );
};

// --- Sub-components (porting logic from TrainerProfile.tsx) ---

const QualificationsSection: React.FC<{ trainerId: string; qualifications: any[]; onUpdate: () => void }> = ({
    trainerId,
    qualifications,
    onUpdate
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        institution: '',
        year_obtained: new Date().getFullYear(),
        description: ''
    });
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({ title: '', institution: '', year_obtained: new Date().getFullYear(), description: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                await apiClient.updateQualification(trainerId, editingId, formData);
            } else {
                await apiClient.addQualification(trainerId, formData);
            }
            resetForm();
            onUpdate();
            showToast('Qualification saved', 'success');
        } catch (error) {
            showToast('Failed to save qualification', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (qual: any) => {
        setFormData({
            title: qual.title,
            institution: qual.institution || '',
            year_obtained: qual.year_obtained || new Date().getFullYear(),
            description: qual.description || ''
        });
        setEditingId(qual.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this qualification?')) return;
        try {
            await apiClient.deleteQualification(trainerId, id);
            onUpdate();
            showToast('Qualification deleted', 'success');
        } catch (error) {
            showToast('Failed to delete qualification', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    Qualifications
                </h3>
                {!isAdding && (
                    <Button variant="outline" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="bg-gray-50 border-blue-100">
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Qualification Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <Input
                                label="Institution"
                                value={formData.institution}
                                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                            />
                            <Input
                                label="Year Obtained"
                                type="number"
                                value={formData.year_obtained.toString()}
                                onChange={(e) => setFormData({ ...formData, year_obtained: parseInt(e.target.value) })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid gap-3">
                {qualifications.length === 0 ? (
                    <p className="text-gray-500 italic">No qualifications listed.</p>
                ) : (
                    qualifications.map((qual) => (
                        <div key={qual.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div>
                                <p className="font-medium">{qual.title}</p>
                                <p className="text-sm text-gray-600">{qual.institution} {qual.year_obtained && `(${qual.year_obtained})`}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(qual)} className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(qual.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const WorkHistorySection: React.FC<{ trainerId: string; workHistory: any[]; onUpdate: () => void }> = ({
    trainerId,
    workHistory,
    onUpdate
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        company: '',
        position: '',
        start_date: '',
        end_date: '',
        description: ''
    });
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({ company: '', position: '', start_date: '', end_date: '', description: '' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                await apiClient.updateWorkHistory(trainerId, editingId, formData);
            } else {
                await apiClient.addWorkHistory(trainerId, formData);
            }
            resetForm();
            onUpdate();
            showToast('Work history saved', 'success');
        } catch (error) {
            showToast('Failed to save work history', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (work: any) => {
        setFormData({
            company: work.company,
            position: work.position,
            start_date: work.start_date ? new Date(work.start_date).toISOString().split('T')[0] : '',
            end_date: work.end_date ? new Date(work.end_date).toISOString().split('T')[0] : '',
            description: work.description || ''
        });
        setEditingId(work.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this work history entry?')) return;
        try {
            await apiClient.deleteWorkHistory(trainerId, id);
            onUpdate();
            showToast('Work history deleted', 'success');
        } catch (error) {
            showToast('Failed to delete work history', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                    Work Experience
                </h3>
                {!isAdding && workHistory.length < 5 && (
                    <Button variant="outline" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="bg-gray-50 border-blue-100">
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Company Name"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                required
                            />
                            <Input
                                label="Position"
                                value={formData.position}
                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                required
                            />
                            <Input
                                label="Start Date"
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                            <Input
                                label="End Date"
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                helperText="Leave empty if currently working here"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid gap-3">
                {workHistory.length === 0 ? (
                    <p className="text-gray-500 italic">No work history listed.</p>
                ) : (
                    workHistory.map((work) => (
                        <div key={work.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div>
                                <p className="font-medium">{work.position} at {work.company}</p>
                                <p className="text-sm text-gray-600">
                                    {work.start_date && new Date(work.start_date).getFullYear()} -
                                    {work.end_date ? new Date(work.end_date).getFullYear() : ' Present'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(work)} className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(work.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const PastClientsSection: React.FC<{ trainerId: string; pastClients: any[]; onUpdate: () => void }> = ({
    trainerId,
    pastClients,
    onUpdate
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        client_name: '',
        project_description: '',
        year: new Date().getFullYear()
    });
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({ client_name: '', project_description: '', year: new Date().getFullYear() });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingId) {
                await apiClient.updatePastClient(trainerId, editingId, formData);
            } else {
                await apiClient.addPastClient(trainerId, formData);
            }
            resetForm();
            onUpdate();
            showToast('Past client saved', 'success');
        } catch (error) {
            showToast('Failed to save past client', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (client: any) => {
        setFormData({
            client_name: client.client_name,
            project_description: client.project_description || '',
            year: client.year || new Date().getFullYear()
        });
        setEditingId(client.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this past client?')) return;
        try {
            await apiClient.deletePastClient(trainerId, id);
            onUpdate();
            showToast('Past client deleted', 'success');
        } catch (error) {
            showToast('Failed to delete past client', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Past Clients
                </h3>
                {!isAdding && pastClients.length < 10 && (
                    <Button variant="outline" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="bg-gray-50 border-blue-100">
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Client Name"
                                value={formData.client_name}
                                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                                required
                            />
                            <Input
                                label="Year"
                                type="number"
                                value={formData.year.toString()}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            />
                            <div className="md:col-span-2">
                                <Input
                                    label="Project Description"
                                    value={formData.project_description}
                                    onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid gap-3">
                {pastClients.length === 0 ? (
                    <p className="text-gray-500 italic">No past clients listed.</p>
                ) : (
                    pastClients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div>
                                <p className="font-medium">{client.client_name}</p>
                                <p className="text-sm text-gray-600">{client.project_description} {client.year && `(${client.year})`}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(client)} className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-500 hover:text-red-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
