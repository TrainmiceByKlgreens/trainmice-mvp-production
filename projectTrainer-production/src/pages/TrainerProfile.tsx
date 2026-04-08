import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { TextareaWithLimit } from '../components/ui/TextareaWithLimit';
import { Tabs } from '../components/ui/Tabs';
import { TabPanel } from '../components/ui/TabPanel';
import { User, Briefcase, Award, Plus, Edit2, Trash2, Save, X, Camera, AlertCircle, MapPin, Globe } from 'lucide-react';
import { validatePersonalInfo, isProfileComplete, ValidationErrors } from '../lib/trainerProfileValidation';
import {
  fetchTrainerProfile,
  updateTrainerProfile,
  uploadTrainerProfileImage,
  fetchQualifications,
  createQualification,
  updateQualification,
  deleteQualificationWithTrainerId,
  fetchWorkHistory,
  createWorkHistory,
  updateWorkHistory,
  deleteWorkHistoryWithTrainerId,
  validateWorkHistoryLimit,
  fetchPastClients,
  fetchTrainerLanguages,
  createTrainerLanguage,
  updateTrainerLanguage,
  deleteTrainerLanguage,
  calculateDuration,
  formatQualificationType,
  getYearOptions
} from '../lib/trainerProfileService';
import {
  Trainer,
  TrainerQualification,
  TrainerWorkHistory,
  TrainerPastClient,
  TrainerLanguage
} from '../types/database';
import { MultiSelect } from '../components/ui/MultiSelect';
import { PastClientsSection } from '../components/profile/PastClientsSection';

export function TrainerProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [qualifications, setQualifications] = useState<TrainerQualification[]>([]);
  const [workHistory, setWorkHistory] = useState<TrainerWorkHistory[]>([]);
  const [pastClients, setPastClients] = useState<TrainerPastClient[]>([]);
  const [languages, setLanguages] = useState<TrainerLanguage[]>([]);

  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'other'>('personal');
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingOther, setIsEditingOther] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [originalTrainer, setOriginalTrainer] = useState<Trainer | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [trainerData, quals, work, clients, langs] = await Promise.all([
        fetchTrainerProfile(user.id),
        fetchQualifications(user.id),
        fetchWorkHistory(user.id),
        fetchPastClients(user.id),
        fetchTrainerLanguages(user.id)
      ]);

      // Set email from user if trainer doesn't have it
      if (trainerData && user?.email && !trainerData.email) {
        trainerData.email = user.email;
      }

      setTrainer(trainerData);
      setOriginalTrainer(trainerData);
      setQualifications(quals);
      setWorkHistory(work);
      setPastClients(clients);
      setLanguages(langs);
    } catch (error) {
      console.error('Error loading profile data:', error);
      alert('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePersonalInfo = async () => {
    if (!user?.id || !trainer) return;

    // Ensure email is set from user for validation
    const trainerWithEmail = {
      ...trainer,
      email: user.email || trainer.email
    };

    const validationErrors = validatePersonalInfo(trainerWithEmail);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      alert('Please fix the validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      // Exclude email from update since it's read-only
      const { email, ...updateData } = trainer;
      await updateTrainerProfile(user.id, updateData);
      alert('Personal information updated successfully');
      setIsEditingPersonal(false);
      setErrors({});
      await loadAllData();
    } catch (error) {
      console.error('Error updating personal info:', error);
      alert(error instanceof Error ? error.message : 'Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalTrainer) {
      setTrainer(originalTrainer);
    }
    setIsEditingPersonal(false);
    setErrors({});
  };

  const handleUpdateOtherInfo = async () => {
    if (!user?.id || !trainer) return;

    setSaving(true);
    try {
      await updateTrainerProfile(user.id, {
        state: trainer.state,
        city: trainer.city,
        country: trainer.country,
        areas_of_expertise: trainer.areas_of_expertise
      });
      alert('Other information updated successfully');
      setIsEditingOther(false);
      await loadAllData();
    } catch (error) {
      console.error('Error updating other info:', error);
      alert(error instanceof Error ? error.message : 'Failed to update other information');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOtherEdit = () => {
    if (originalTrainer) {
      setTrainer(originalTrainer);
    }
    setIsEditingOther(false);
  };

  const handleFieldChange = (field: keyof Trainer, value: any) => {
    setTrainer(prev => prev ? { ...prev, [field]: value } : null);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or WEBP image.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Profile picture must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    setUploadingProfileImage(true);
    try {
      const updatedTrainer = await uploadTrainerProfileImage(user.id, file);
      setTrainer(updatedTrainer);
      setOriginalTrainer(updatedTrainer);
      alert('Profile picture updated successfully.');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setUploadingProfileImage(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner />
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-900 font-medium mb-2">No Trainer Profile Found</p>
        <p className="text-gray-600 text-sm">
          Your trainer profile could not be loaded. Please contact support if this issue persists.
        </p>
      </div>
    );
  }

  const tabs = [
    {
      id: 'personal',
      label: 'Personal',
      icon: <User className="w-4 h-4" />
    },
    {
      id: 'professional',
      label: 'Professional',
      icon: <Award className="w-4 h-4" />,
      badge: qualifications.length + workHistory.length
    },
    {
      id: 'other',
      label: 'Other Information',
      icon: <MapPin className="w-4 h-4" />
    }
  ];

  const profileIncomplete = !isProfileComplete(trainer);

  return (
    <div className="space-y-10 max-w-[1400px] animate-fade-in mb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-corporate-900 tracking-tight">Trainer Profile</h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">Manage your professional credentials and system presence.</p>
        </div>
        {!isEditingPersonal && (
          <Button
            variant="primary"
            onClick={() => setIsEditingPersonal(true)}
            className="shadow-modern shadow-accent-600/10"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Profile Credentials
          </Button>
        )}
      </div>

      {profileIncomplete && (
        <div className="bg-accent-50/50 border border-accent-100 rounded-2xl p-6 flex items-start gap-5 shadow-modern-sm animate-scale-in">
          <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-accent-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-corporate-900 uppercase tracking-[0.15em] mb-1">Profile Synchronization Required</h3>
            <p className="text-sm text-corporate-600 leading-relaxed font-medium">
              Update your account with critical metadata: IC Number, Phone Number, and Professional Bio. This ensures your profile meets system standards for administration and client verification.
            </p>
          </div>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as 'personal' | 'professional' | 'other')} />

      <TabPanel value="personal" activeTab={activeTab}>
        <Card className="overflow-hidden">
          <CardHeader className="bg-corporate-50/30 border-b border-corporate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                <h2 className="text-xl font-bold text-corporate-900 tracking-tight uppercase text-sm tracking-widest">Personal Identification</h2>
              </div>
              {isEditingPersonal && (
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Discard
                  </Button>
                  <Button variant="primary" onClick={handleUpdatePersonalInfo} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Commiting Changes...' : 'Save Updates'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="flex flex-col sm:flex-row items-center gap-8 py-4 px-2">
              <input
                ref={profileImageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-modern-lg transition-all duration-500 group-hover:scale-[1.02]">
                  {trainer.profile_pic ? (
                    <img
                      src={trainer.profile_pic}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-corporate-50 to-corporate-100 flex items-center justify-center">
                      <User className="w-16 h-16 text-corporate-300" />
                    </div>
                  )}
                </div>
                {isEditingPersonal && (
                  <button
                    type="button"
                    onClick={() => profileImageInputRef.current?.click()}
                    disabled={uploadingProfileImage}
                    className="absolute -bottom-3 -right-3 bg-accent-600 text-white p-3 rounded-2xl hover:bg-accent-700 transition-all duration-300 shadow-xl shadow-accent-600/30 ring-4 ring-white"
                    title="Update Profile Image"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="text-center sm:text-left">
                <p className="font-bold text-2xl text-corporate-900 tracking-tight">{trainer.full_name || 'System User'}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2">
                  <span className="inline-flex items-center px-3 py-1 bg-corporate-50 text-corporate-500 rounded-lg text-xs font-bold uppercase tracking-widest border border-corporate-100">
                    ID: {trainer.custom_trainer_id}
                  </span>
                  <span className="flex items-center text-corporate-400 text-sm font-medium">
                    <Globe className="w-4 h-4 mr-2 text-accent-500" />
                    {user?.email || trainer.email || 'No email associated'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <Input
                label="System Identifier"
                value={trainer.custom_trainer_id}
                disabled
                helperText="Permanent internal system identifier"
              />
              <Input
                label="Full Name"
                value={trainer.full_name || ''}
                onChange={(e) => handleFieldChange('full_name', e.target.value)}
                disabled={!isEditingPersonal}
                required
                error={errors.full_name}
              />
              <Input
                label="IC Number"
                value={trainer.ic_number || ''}
                onChange={(e) => handleFieldChange('ic_number', e.target.value)}
                disabled={!isEditingPersonal}
                placeholder="XXXXXX-XX-XXXX"
                helperText="Format: 123456-12-1234"
                error={errors.ic_number}
              />
              <Input
                label="Race/Ethnicity"
                value={trainer.race || ''}
                onChange={(e) => handleFieldChange('race', e.target.value)}
                disabled={!isEditingPersonal}
                placeholder="e.g., Malay, Chinese, Indian"
                error={errors.race}
              />
              <div className="w-full group">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">
                  Phone Identification
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 group-focus-within:text-accent-500 transition-colors z-10">
                    <span className="text-lg">🇲🇾</span>
                    <span className="text-corporate-500 font-bold text-sm">+60</span>
                  </div>
                  <input
                    type="tel"
                    value={trainer.phone_number?.replace(/^\+60/, '') || ''}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      handleFieldChange('phone_number', digitsOnly ? `+60${digitsOnly}` : '');
                    }}
                    disabled={!isEditingPersonal}
                    placeholder="123456789"
                    maxLength={10}
                    className={`w-full pl-24 pr-4 py-2.5 bg-white border rounded-xl transition-all duration-300 outline-none shadow-sm text-sm placeholder:text-corporate-400 ${errors.phone_number
                      ? 'border-red-400 focus:ring-4 focus:ring-red-500/10'
                      : 'border-corporate-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10'
                      } ${!isEditingPersonal ? 'bg-corporate-50 cursor-not-allowed opacity-60' : ''}`}
                  />
                </div>
                {errors.phone_number && (
                  <p className="mt-2 text-xs text-red-600 font-medium ml-1">{errors.phone_number}</p>
                )}
                {!errors.phone_number && (
                  <p className="mt-2 text-xs text-corporate-400 font-medium ml-1">Standard Malaysian format (exclude +60)</p>
                )}
              </div>
              <Input
                label="Email Address"
                type="email"
                value={user?.email || trainer.email || ''}
                onChange={() => { }} // No-op since disabled
                disabled={true}
                required
                helperText="Email cannot be changed. This is your signup email."
                error={errors.email}
              />
              <Input
                label="HRDC Accreditation ID"
                value={trainer.hrdc_accreditation_id || ''}
                onChange={(e) => handleFieldChange('hrdc_accreditation_id', e.target.value)}
                disabled={!isEditingPersonal}
                placeholder="HRD-XXXXX"
                error={errors.hrdc_accreditation_id}
              />
              <Input
                label="HRDC Accreditation Valid Until"
                type="date"
                value={trainer.hrdc_accreditation_valid_until || ''}
                onChange={(e) => handleFieldChange('hrdc_accreditation_valid_until', e.target.value)}
                disabled={!isEditingPersonal}
                min={new Date().toISOString().split('T')[0]}
                error={errors.hrdc_accreditation_valid_until}
              />
            </div>

            <div className="mt-4">
              <TextareaWithLimit
                label="Professional Bio"
                value={trainer.professional_bio || ''}
                onChange={(e) => handleFieldChange('professional_bio', e.target.value)}
                disabled={!isEditingPersonal}
                rows={6}
                wordLimit={500}
                placeholder="Tell us about your professional experience, expertise, and training philosophy..."
                error={errors.professional_bio}
              />
            </div>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value="professional" activeTab={activeTab}>
        <div className="space-y-6">
          <QualificationsSection
            qualifications={qualifications}
            trainerId={user?.id || ''}
            onUpdate={loadAllData}
          />

          <WorkHistorySection
            workHistory={workHistory}
            trainerId={user?.id || ''}
            onUpdate={loadAllData}
          />
        </div>
      </TabPanel>

      <TabPanel value="other" activeTab={activeTab}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-corporate-50/30 border-b border-corporate-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                  <h2 className="text-xl font-bold text-corporate-900 tracking-tight uppercase text-sm tracking-widest">Geographical Metadata</h2>
                </div>
                {!isEditingOther ? (
                  <Button variant="outline" onClick={() => setIsEditingOther(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancelOtherEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button variant="primary" onClick={handleUpdateOtherInfo} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Input
                  label="Country"
                  value={trainer.country || ''}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  disabled={!isEditingOther}
                  placeholder="e.g., Malaysia"
                />
                <Input
                  label="State"
                  value={trainer.state || ''}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  disabled={!isEditingOther}
                  placeholder="e.g., Selangor"
                />
                <Input
                  label="City"
                  value={trainer.city || ''}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  disabled={!isEditingOther}
                  placeholder="e.g., Petaling Jaya"
                />
              </div>

              <MultiSelect
                label="Areas of Expertise"
                value={trainer.areas_of_expertise || []}
                onChange={(value) => handleFieldChange('areas_of_expertise', value)}
                disabled={!isEditingOther}
                placeholder="Type and press Enter to add expertise area"
                helperText="e.g., Leadership, Communication, Project Management"
              />

              <LanguagesSection
                languages={languages}
                trainerId={user?.id || ''}
                onUpdate={loadAllData}
              />
            </CardContent>
          </Card>

          <PastClientsSection
            pastClients={pastClients}
            trainerId={user?.id || ''}
            onUpdate={loadAllData}
          />
        </div>
      </TabPanel>
    </div>
  );
}

// Qualifications Section Component
function QualificationsSection({
  qualifications,
  trainerId,
  onUpdate
}: {
  qualifications: TrainerQualification[];
  trainerId: string;
  onUpdate: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    qualification_name: '',
    institute_name: '',
    year_awarded: new Date().getFullYear(),
    qualification_type: 'undergraduate' as TrainerQualification['qualification_type']
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      qualification_name: '',
      institute_name: '',
      year_awarded: new Date().getFullYear(),
      qualification_type: 'undergraduate'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateQualification(editingId, { ...formData, trainer_id: trainerId });
      } else {
        await createQualification({ ...formData, trainer_id: trainerId });
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save qualification');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (qual: TrainerQualification) => {
    setFormData({
      qualification_name: qual.qualification_name,
      institute_name: qual.institute_name,
      year_awarded: qual.year_awarded,
      qualification_type: qual.qualification_type
    });
    setEditingId(qual.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this qualification?')) return;
    try {
      await deleteQualificationWithTrainerId(trainerId, id);
      onUpdate();
    } catch (error) {
      alert('Failed to delete qualification');
    }
  };

  return (
    <Card>
      <CardHeader className="bg-corporate-50/30 border-b border-corporate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-accent-500" />
              <h2 className="text-xl font-bold text-corporate-900 tracking-tight uppercase text-sm tracking-widest">Academic & Professional Credentials</h2>
            </div>
          </div>
          {!isAdding && (
            <Button variant="primary" onClick={() => setIsAdding(true)} className="shadow-modern shadow-accent-600/10">
              <Plus className="w-4 h-4 mr-2" />
              Register Credential
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {isAdding && (
          <div className="mb-10 p-8 bg-corporate-50/50 rounded-2xl border border-corporate-100 animate-scale-in">
            <h3 className="font-bold text-corporate-900 mb-6 uppercase tracking-wider text-xs">
              {editingId ? 'Modify Credential Data' : 'Initialize New Credential Entry'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Qualification Title"
                value={formData.qualification_name}
                onChange={(e) => setFormData({ ...formData, qualification_name: e.target.value })}
                placeholder="e.g., Doctor of Philosophy in Strategic Management"
                required
              />
              <Input
                label="Issuing Institution"
                value={formData.institute_name}
                onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })}
                placeholder="e.g., National University of Singapore"
                required
              />
              <div className="w-full">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">Vector Year</label>
                <select
                  value={formData.year_awarded}
                  onChange={(e) => setFormData({ ...formData, year_awarded: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-corporate-200 rounded-xl transition-all duration-300 outline-none shadow-sm text-sm focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10"
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">Classification</label>
                <select
                  value={formData.qualification_type}
                  onChange={(e) => setFormData({ ...formData, qualification_type: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white border border-corporate-200 rounded-xl transition-all duration-300 outline-none shadow-sm text-sm focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10"
                >
                  <option value="postgraduate">Postgraduate (PhD, Masters)</option>
                  <option value="undergraduate">Undergraduate (Bachelor's)</option>
                  <option value="academic">Academic (Certificates, Diplomas)</option>
                  <option value="professional">Professional (Certifications)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={resetForm}>Discard</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Processing...' : 'Commit Credential'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {qualifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-corporate-50/50 rounded-2xl border-dashed border-2 border-corporate-200">
              <Award className="w-12 h-12 text-corporate-200 mb-4" />
              <p className="text-corporate-500 font-medium">No system-verified credentials located.</p>
              <p className="text-xs text-corporate-400 mt-1 uppercase tracking-widest font-bold">Credential Registry Empty</p>
            </div>
          ) : (
            qualifications.map(qual => (
              <div key={qual.id} className="tech-border bg-white border rounded-2xl p-6 group hover:translate-x-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 text-[10px] font-bold bg-accent-50 text-accent-700 rounded-lg border border-accent-100 uppercase tracking-widest">
                        {formatQualificationType(qual.qualification_type)}
                      </span>
                      <span className="text-xs font-bold text-corporate-400 bg-corporate-50 px-2 py-1 rounded-md">
                        AWARDED {qual.year_awarded}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-corporate-900 tracking-tight group-hover:text-accent-600 transition-colors">{qual.qualification_name}</h4>
                    <p className="text-sm text-corporate-500 font-medium mt-1">{qual.institute_name}</p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button variant="outline" onClick={() => handleEdit(qual)} className="p-2 w-10 h-10 min-w-0">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(qual.id)} className="p-2 w-10 h-10 min-w-0 border-red-100 hover:bg-red-50 hover:border-red-200">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Work History Section Component
function WorkHistorySection({
  workHistory,
  trainerId,
  onUpdate
}: {
  workHistory: TrainerWorkHistory[];
  trainerId: string;
  onUpdate: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    position: '',
    year_from: new Date().getFullYear() - 5,
    year_to: new Date().getFullYear()
  });
  const [saving, setSaving] = useState(false);
  const [canAdd, setCanAdd] = useState(true);

  useEffect(() => {
    checkLimit();
  }, [workHistory]);

  const checkLimit = async () => {
    const allowed = await validateWorkHistoryLimit(trainerId);
    setCanAdd(allowed);
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      position: '',
      year_from: new Date().getFullYear() - 5,
      year_to: new Date().getFullYear()
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        await updateWorkHistory(editingId, { ...formData, trainer_id: trainerId });
      } else {
        await createWorkHistory({ ...formData, trainer_id: trainerId });
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save work history');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (work: TrainerWorkHistory) => {
    setFormData({
      company_name: work.company_name,
      position: work.position,
      year_from: work.year_from,
      year_to: work.year_to
    });
    setEditingId(work.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this work history entry?')) return;
    try {
      await deleteWorkHistoryWithTrainerId(trainerId, id);
      onUpdate();
    } catch (error) {
      alert('Failed to delete work history');
    }
  };

  return (
    <Card>
      <CardHeader className="bg-corporate-50/30 border-b border-corporate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-accent-500" />
              <h2 className="text-xl font-bold text-corporate-900 tracking-tight uppercase text-sm tracking-widest">
                Professional Trajectory <span className="text-xs text-corporate-400 font-bold ml-2 tracking-normal">({workHistory.length}/5 ENTRIES)</span>
              </h2>
            </div>
          </div>
          {!isAdding && (
            <Button variant="primary" onClick={() => setIsAdding(true)} disabled={!canAdd} className="shadow-modern shadow-accent-600/10">
              <Plus className="w-4 h-4 mr-2" />
              Log Work History
            </Button>
          )}
        </div>
        {!canAdd && (
          <div className="mt-4 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Registry Capacity Reached (Max 5)</p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-8">
        {isAdding && (
          <div className="mb-10 p-8 bg-corporate-50/50 rounded-2xl border border-corporate-100 animate-scale-in">
            <h3 className="font-bold text-corporate-900 mb-6 uppercase tracking-wider text-xs">
              {editingId ? 'Modify Professional Record' : 'Initialize New Career Entry'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Enterprise Name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="e.g., Global Strategic Solutions"
                required
              />
              <Input
                label="Professional Designation"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Senior Training Director"
                required
              />
              <div className="w-full">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">Commencement Year</label>
                <select
                  value={formData.year_from}
                  onChange={(e) => setFormData({ ...formData, year_from: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-corporate-200 rounded-xl transition-all duration-300 outline-none shadow-sm text-sm focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10"
                >
                  {getYearOptions().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="w-full">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">Conclusion Year</label>
                <select
                  value={formData.year_to}
                  onChange={(e) => setFormData({ ...formData, year_to: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-white border border-corporate-200 rounded-xl transition-all duration-300 outline-none shadow-sm text-sm focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10"
                >
                  {getYearOptions().filter(y => y >= formData.year_from).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={resetForm}>Discard</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Processing...' : 'Commit Record'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {workHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-corporate-50/50 rounded-2xl border-dashed border-2 border-corporate-200">
              <Briefcase className="w-12 h-12 text-corporate-200 mb-4" />
              <p className="text-corporate-500 font-medium">No professional engagement history located.</p>
              <p className="text-xs text-corporate-400 mt-1 uppercase tracking-widest font-bold">Career Ledger Empty</p>
            </div>
          ) : (
            workHistory.map(work => (
              <div key={work.id} className="tech-border bg-white border rounded-2xl p-6 group hover:translate-x-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-corporate-400 bg-corporate-50 px-2 py-1 rounded-md">
                        {work.year_from} — {work.year_to}
                      </span>
                      <span className="px-3 py-1 text-[10px] font-bold bg-accent-50 text-accent-700 rounded-lg border border-accent-100 uppercase tracking-widest">
                        {calculateDuration(work.year_from, work.year_to)} TENURE
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-corporate-900 tracking-tight group-hover:text-accent-600 transition-colors uppercase">{work.position}</h4>
                    <p className="text-sm text-corporate-500 font-medium mt-1 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-corporate-300" />
                      {work.company_name}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <Button variant="outline" onClick={() => handleEdit(work)} className="p-2 w-10 h-10 min-w-0">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => handleDelete(work.id)} className="p-2 w-10 h-10 min-w-0 border-red-100 hover:bg-red-50 hover:border-red-200">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Languages Section Component
function LanguagesSection({
  languages,
  trainerId,
  onUpdate
}: {
  languages: TrainerLanguage[];
  trainerId: string;
  onUpdate: () => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    language: '',
    proficiency: 'Professional' as TrainerLanguage['proficiency']
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      language: '',
      proficiency: 'Professional'
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.language.trim()) {
      alert('Please enter a language');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await updateTrainerLanguage(trainerId, editingId, formData.proficiency);
      } else {
        await createTrainerLanguage({
          trainer_id: trainerId,
          language: formData.language,
          proficiency: formData.proficiency
        });
      }
      resetForm();
      onUpdate();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save language');
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
    if (!confirm('Remove this language?')) return;
    try {
      await deleteTrainerLanguage(trainerId, id);
      onUpdate();
    } catch (error) {
      alert('Failed to remove language');
    }
  };

  return (
    <Card className="mt-12 overflow-hidden">
      <CardHeader className="bg-corporate-50/30 border-b border-corporate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-accent-500" />
              <h2 className="text-xl font-bold text-corporate-900 tracking-tight uppercase text-sm tracking-widest">Linguistic Vectors & Proficiency</h2>
            </div>
          </div>
          {!isAdding && (
            <Button variant="primary" onClick={() => setIsAdding(true)} className="shadow-modern shadow-accent-600/10">
              <Plus className="w-4 h-4 mr-2" />
              Register Language
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-8">
        {isAdding && (
          <div className="mb-10 p-8 bg-corporate-50/50 rounded-2xl border border-corporate-100 animate-scale-in">
            <h3 className="font-bold text-corporate-900 mb-6 uppercase tracking-wider text-xs">
              {editingId ? 'Modify Proficiency Calibration' : 'Initialize New Language Entry'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Linguistic Identifier"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                placeholder="e.g., English, Malay, Mandarin"
                required
                disabled={!!editingId}
              />
              <div className="w-full">
                <label className="block text-sm font-semibold text-corporate-700 mb-1.5 ml-0.5">Proficiency Tier</label>
                <select
                  value={formData.proficiency}
                  onChange={(e) => setFormData({ ...formData, proficiency: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-white border border-corporate-200 rounded-xl transition-all duration-300 outline-none shadow-sm text-sm focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10"
                >
                  <option value="Native">Native Mastery</option>
                  <option value="Professional">Professional Competence</option>
                  <option value="Intermediate">Intermediate Proficiency</option>
                  <option value="Beginner">Foundational Skills</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={resetForm}>Discard</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Processing...' : 'Commit Entry'}
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languages.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-corporate-50/50 rounded-2xl border-dashed border-2 border-corporate-200">
              <Globe className="w-10 h-10 text-corporate-200 mb-4" />
              <p className="text-corporate-500 font-medium">No linguistic capabilities registered.</p>
            </div>
          ) : (
            languages.map(lang => (
              <div key={lang.id} className="tech-border bg-white border rounded-2xl p-5 group hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-corporate-50 rounded-xl flex items-center justify-center text-lg shadow-inner">
                      {lang.language.toLowerCase().includes('english') ? '🇺🇸' :
                        lang.language.toLowerCase().includes('malay') ? '🇲🇾' :
                          lang.language.toLowerCase().includes('mandarin') || lang.language.toLowerCase().includes('chinese') ? '🇨🇳' :
                            lang.language.toLowerCase().includes('tamil') ? '🇮🇳' : '🌐'}
                    </div>
                    <div>
                      <p className="font-bold text-corporate-900 tracking-tight">{lang.language}</p>
                      <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${lang.proficiency === 'Native' ? 'text-emerald-500' :
                          lang.proficiency === 'Professional' ? 'text-accent-500' :
                            lang.proficiency === 'Intermediate' ? 'text-amber-500' :
                              'text-corporate-400'
                        }`}>
                        {lang.proficiency} LEVEL
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="p-2 w-9 h-9 min-w-0 border-transparent hover:bg-corporate-50" onClick={() => handleEdit(lang)}>
                      <Edit2 className="w-4 h-4 text-corporate-400" />
                    </Button>
                    <Button variant="outline" className="p-2 w-9 h-9 min-w-0 border-transparent hover:bg-red-50" onClick={() => handleDelete(lang.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
