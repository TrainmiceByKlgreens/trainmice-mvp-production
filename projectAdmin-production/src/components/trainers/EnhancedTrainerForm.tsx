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
import { Qualification, WorkHistory, PastClient, TrainerLanguage } from '../../types';

interface MappedTrainer {
    id: string;
    full_name: string;
    email: string;
    ic_number?: string;
    race?: string;
    phone_number?: string;
    hrdc_accreditation_id?: string;
    hrdc_accreditation_valid_until?: string;
    professional_bio?: string;
    profile_pic?: string;
    areas_of_expertise?: string[];
    country?: string;
    state?: string;
    city?: string;
}

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
    const [trainer, setTrainer] = useState<MappedTrainer | null>(null);
    const [qualifications, setQualifications] = useState<Qualification[]>([]);
    const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
    const [pastClients, setPastClients] = useState<PastClient[]>([]);
    const [languages, setLanguages] = useState<TrainerLanguage[]>([]);
    const [activeTab, setActiveTab] = useState('personal');

    useEffect(() => {
        loadAllData();
    }, [trainerId]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [trainerData, quals, work, clients, langs] = await Promise.all([
                apiClient.getTrainer(trainerId),
                apiClient.getQualifications(trainerId),
                apiClient.getWorkHistory(trainerId),
                apiClient.getPastClients(trainerId),
                apiClient.getTrainerLanguages(trainerId)
            ]);

            // Map backend camelCase to frontend snake_case
            const t = trainerData.trainer;
            const mappedTrainer = {
                ...t,
                full_name: t.fullName,
                phone_number: t.phoneNumber,
                ic_number: t.icNumber,
                hrdc_accreditation_id: t.hrdcAccreditationId,
                hrdc_accreditation_valid_until: t.hrdcAccreditationValidUntil,
                professional_bio: t.professionalBio,
                profile_pic: t.profilePic,
                areas_of_expertise: t.areasOfExpertise
            };

            setTrainer(mappedTrainer);
            setQualifications((quals.qualifications || []).map((q: Qualification) => ({
                ...q,
                year_obtained: q.year_obtained,
                qualification_type: (q as unknown as { qualificationType: string }).qualificationType
            })));
            setWorkHistory((work.workHistory || []).map((w: WorkHistory) => ({
                ...w,
                start_date: w.start_date,
                end_date: w.end_date
            })));
            setPastClients((clients.pastClients || []).map((c: PastClient) => ({
                ...c,
                client_name: c.client_name,
                project_description: c.project_description
            })));
            setLanguages(langs.languages || []);
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
            // Map back to camelCase for the backend if needed, 
            // but admin-trainers.routes.ts's PUT /:id handles some snake_case conversion,
            // however it's safer to map the main fields here.
            const updateData = {
                fullName: trainer.full_name,
                phoneNumber: trainer.phone_number,
                icNumber: trainer.ic_number,
                hrdcAccreditationId: trainer.hrdc_accreditation_id,
                hrdcAccreditationValidUntil: trainer.hrdc_accreditation_valid_until,
                bio: trainer.professional_bio,
                race: trainer.race,
                state: trainer.state,
                city: trainer.city,
                country: trainer.country,
                specialization: trainer.areas_of_expertise // Backend expects 'specialization' or 'areasOfExpertise'
            };

            await apiClient.updateTrainer(trainerId, updateData);
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
        setTrainer((prev: MappedTrainer | null) => prev ? ({ ...prev, [field]: value }) : null);
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
        { id: 'other', label: 'Other Info', icon: <MapPin className="w-4 h-4" />, badge: languages.length }
    ];

    return (
        <div className="space-y-6">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            <TabPanel value="personal" activeTab={activeTab}>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="Full Name"
                            value={trainer?.full_name || ''}
                            onChange={(e) => handleFieldChange('full_name', e.target.value)}
                            required
                        />
                        <Input
                            label="Email"
                            value={trainer?.email || ''}
                            disabled
                            helperText="Email is managed by authentication"
                        />
                        <Input
                            label="IC Number"
                            value={trainer?.ic_number || ''}
                            onChange={(e) => handleFieldChange('ic_number', e.target.value)}
                            placeholder="XXXXXX-XX-XXXX"
                        />
                        <Input
                            label="Race"
                            value={trainer?.race || ''}
                            onChange={(e) => handleFieldChange('race', e.target.value)}
                        />
                        <Input
                            label="Phone Number"
                            value={trainer?.phone_number || ''}
                            onChange={(e) => handleFieldChange('phone_number', e.target.value)}
                            placeholder="+60XXXXXXXXX"
                        />
                        <Input
                            label="HRDC Accreditation ID"
                            value={trainer?.hrdc_accreditation_id || ''}
                            onChange={(e) => handleFieldChange('hrdc_accreditation_id', e.target.value)}
                        />
                        <Input
                            label="HRDC Accreditation Valid Until"
                            type="date"
                            value={trainer?.hrdc_accreditation_valid_until ? new Date(trainer.hrdc_accreditation_valid_until).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleFieldChange('hrdc_accreditation_valid_until', e.target.value)}
                        />
                    </div>

                    <TextareaWithLimit
                        label="Professional Bio"
                        value={trainer?.professional_bio || ''}
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
                            value={trainer?.country || ''}
                            onChange={(e) => handleFieldChange('country', e.target.value)}
                        />
                        <Input
                            label="State"
                            value={trainer?.state || ''}
                            onChange={(e) => handleFieldChange('state', e.target.value)}
                        />
                        <Input
                            label="City"
                            value={trainer?.city || ''}
                            onChange={(e) => handleFieldChange('city', e.target.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <MultiSelect
                            label="Areas of Expertise"
                            value={trainer?.areas_of_expertise || []}
                            onChange={(val) => handleFieldChange('areas_of_expertise', val)}
                            placeholder="Add expertise..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateProfile} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Other Info'}
                        </Button>
                    </div>

                    <hr className="border-gray-200 my-8" />

                    <LanguagesSection
                        trainerId={trainerId}
                        languages={languages}
                        onUpdate={loadAllData}
                    />

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
            const data = {
                title: formData.title,
                institution: formData.institution,
                yearObtained: formData.year_obtained, // Map back
                description: formData.description
            };
            if (editingId) {
                await apiClient.updateQualification(trainerId, editingId, data);
            } else {
                await apiClient.addQualification(trainerId, data);
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

    const handleEdit = (qual: Qualification) => {
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
            const data = {
                company: formData.company,
                position: formData.position,
                startDate: formData.start_date, // Map back
                endDate: formData.end_date, // Map back
                description: formData.description
            };
            if (editingId) {
                await apiClient.updateWorkHistory(trainerId, editingId, data);
            } else {
                await apiClient.addWorkHistory(trainerId, data);
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

    const handleEdit = (work: WorkHistory) => {
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
            const data = {
                clientName: formData.client_name, // Map back
                projectDescription: formData.project_description, // Map back
                year: formData.year
            };
            if (editingId) {
                await apiClient.updatePastClient(trainerId, editingId, data);
            } else {
                await apiClient.addPastClient(trainerId, data);
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

    const handleEdit = (client: PastClient) => {
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

const LanguagesSection: React.FC<{ trainerId: string; languages: TrainerLanguage[]; onUpdate: () => void }> = ({
    trainerId,
    languages,
    onUpdate
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        language: '',
        proficiency: 'Professional'
    });
    const [saving, setSaving] = useState(false);

    const resetForm = () => {
        setFormData({ language: '', proficiency: 'Professional' });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!formData.language.trim()) {
            showToast('Please enter a language', 'error');
            return;
        }

        setSaving(true);
        try {
            if (editingId) {
                await apiClient.updateTrainerLanguage(trainerId, editingId, { proficiency: formData.proficiency });
            } else {
                await apiClient.addTrainerLanguage(trainerId, {
                    language: formData.language,
                    proficiency: formData.proficiency
                });
            }
            resetForm();
            onUpdate();
            showToast('Language proficiency saved', 'success');
        } catch (error) {
            showToast('Failed to save language proficiency', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (lang: TrainerLanguage) => {
        setFormData({
            language: lang.language,
            proficiency: lang.proficiency
        });
        setEditingId(lang.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this language proficiency?')) return;
        try {
            await apiClient.deleteTrainerLanguage(trainerId, id);
            onUpdate();
            showToast('Language proficiency removed', 'success');
        } catch (error) {
            showToast('Failed to remove language proficiency', 'error');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Languages & Proficiency
                </h3>
                {!isAdding && (
                    <Button variant="outline" onClick={() => setIsAdding(true)}>
                        <Plus className="w-4 h-4 mr-1" /> Add Language
                    </Button>
                )}
            </div>

            {isAdding && (
                <Card className="bg-gray-50 border-blue-100">
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Language"
                                value={formData.language}
                                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                placeholder="e.g., English, Malay, Mandarin"
                                required
                                disabled={!!editingId}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Level</label>
                                <select
                                    value={formData.proficiency}
                                    onChange={(e) => setFormData({ ...formData, proficiency: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="Native">Native</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Beginner">Beginner</option>
                                </select>
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

            <div className="grid gap-3 sm:grid-cols-2">
                {languages.length === 0 ? (
                    <p className="text-gray-500 italic col-span-full text-center py-4 bg-gray-50 rounded-lg border border-dashed">No languages listed.</p>
                ) : (
                    languages.map((lang) => (
                        <div key={lang.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-sm shadow-inner">
                                    {lang.language.toLowerCase().includes('english') ? '🇺🇸' :
                                        lang.language.toLowerCase().includes('malay') ? '🇲🇾' :
                                            lang.language.toLowerCase().includes('mandarin') || lang.language.toLowerCase().includes('chinese') ? '🇨🇳' :
                                                lang.language.toLowerCase().includes('tamil') ? '🇮🇳' : '🌐'}
                                </div>
                                <div>
                                    <p className="font-medium">{lang.language}</p>
                                    <span className={`text-[10px] font-bold uppercase ${lang.proficiency === 'Native' ? 'text-green-600' :
                                        lang.proficiency === 'Professional' ? 'text-blue-600' :
                                            lang.proficiency === 'Intermediate' ? 'text-orange-600' :
                                                'text-gray-500'
                                        }`}>
                                        {lang.proficiency}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => handleEdit(lang)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(lang.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
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
