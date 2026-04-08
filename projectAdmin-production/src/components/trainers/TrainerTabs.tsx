import React, { useState, useEffect } from 'react';
import { Trainer, TrainerAvailability, BlockedDate, Qualification, WorkHistory, PastClient, TrainerDocument, Course } from '../../types';
import { supabase } from '../../utils/supabaseClient';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';
import { Select } from '../common/Select';
import { Badge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { formatDate, getDayName, formatTime } from '../../utils/helpers';
import { Plus, Trash2, Download, Upload } from 'lucide-react';

interface TrainerTabsProps {
  trainer: Trainer;
  onUpdate: () => void;
}

export const TrainerTabs: React.FC<TrainerTabsProps> = ({ trainer, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'availability' | 'blocked' | 'courses' | 'qualifications' | 'work' | 'clients' | 'documents'>('availability');

  const tabs = [
    { id: 'availability', label: 'Availability' },
    { id: 'blocked', label: 'Blocked Days' },
    { id: 'courses', label: 'Assigned Courses' },
    { id: 'qualifications', label: 'Qualifications' },
    { id: 'work', label: 'Work History' },
    { id: 'clients', label: 'Past Clients' },
    { id: 'documents', label: 'Documents' },
  ];

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'availability' && <AvailabilityTab trainer={trainer} onUpdate={onUpdate} />}
      {activeTab === 'blocked' && <BlockedDatesTab trainer={trainer} onUpdate={onUpdate} />}
      {activeTab === 'courses' && <CoursesTab trainer={trainer} />}
      {activeTab === 'qualifications' && <QualificationsTab trainer={trainer} onUpdate={onUpdate} />}
      {activeTab === 'work' && <WorkHistoryTab trainer={trainer} onUpdate={onUpdate} />}
      {activeTab === 'clients' && <PastClientsTab trainer={trainer} onUpdate={onUpdate} />}
      {activeTab === 'documents' && <DocumentsTab trainer={trainer} onUpdate={onUpdate} />}
    </div>
  );
};

const AvailabilityTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [availability, setAvailability] = useState<TrainerAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });

  useEffect(() => {
    fetchAvailability();
  }, [trainer.id]);

  const fetchAvailability = async () => {
    const { data } = await supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('day_of_week');
    setAvailability(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    await supabase.from('trainer_availability').insert({
      trainer_id: trainer.id,
      ...formData,
    });
    setShowForm(false);
    setFormData({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    fetchAvailability();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('trainer_availability').delete().eq('id', id);
    fetchAvailability();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Weekly Availability</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Slot
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <Select
              label="Day of Week"
              value={formData.day_of_week}
              onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
              options={[
                { value: 0, label: 'Sunday' },
                { value: 1, label: 'Monday' },
                { value: 2, label: 'Tuesday' },
                { value: 3, label: 'Wednesday' },
                { value: 4, label: 'Thursday' },
                { value: 5, label: 'Friday' },
                { value: 6, label: 'Saturday' },
              ]}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {availability.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No availability set</p>
        ) : (
          availability.map((slot) => (
            <Card key={slot.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{getDayName(slot.day_of_week)}</p>
                  <p className="text-sm text-gray-600">
                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(slot.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const BlockedDatesTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    blocked_date: '',
    reason: '',
  });

  useEffect(() => {
    fetchBlockedDates();
  }, [trainer.id]);

  const fetchBlockedDates = async () => {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('blocked_date');
    setBlockedDates(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    await supabase.from('blocked_dates').insert({
      trainer_id: trainer.id,
      ...formData,
    });
    setShowForm(false);
    setFormData({ blocked_date: '', reason: '' });
    fetchBlockedDates();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('blocked_dates').delete().eq('id', id);
    fetchBlockedDates();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Blocked Dates</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Date
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <Input
              label="Date"
              type="date"
              value={formData.blocked_date}
              onChange={(e) => setFormData({ ...formData, blocked_date: e.target.value })}
            />
            <Input
              label="Reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {blockedDates.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No blocked dates</p>
        ) : (
          blockedDates.map((blocked) => (
            <Card key={blocked.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{formatDate(blocked.blocked_date)}</p>
                  {blocked.reason && <p className="text-sm text-gray-600">{blocked.reason}</p>}
                </div>
                <button
                  onClick={() => handleDelete(blocked.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const CoursesTab: React.FC<{ trainer: Trainer }> = ({ trainer }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [trainer.id]);

  const fetchCourses = async () => {
    const { data: directCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('trainer_id', trainer.id);

    const { data: assignedCourses } = await supabase
      .from('course_trainers')
      .select('courses(*)')
      .eq('trainer_id', trainer.id);

    const allCourses = [
      ...(directCourses || []),
      ...(assignedCourses?.map(ct => (ct as any).courses) || [])
    ];

    setCourses(allCourses);
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Assigned Courses</h3>
      <div className="grid gap-4">
        {courses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No courses assigned</p>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{course.title}</h4>
                    <p className="text-gray-600 mt-1">{course.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={
                        course.status === 'APPROVED' ? 'success' :
                        course.status === 'PENDING_APPROVAL' ? 'warning' :
                        course.status === 'DENIED' ? 'danger' :
                        'default'
                      }>
                        {course.status}
                      </Badge>
                      {course.hrdc_claimable && <Badge variant="info">HRDC Claimable</Badge>}
                      {course.created_by_admin && <Badge variant="warning">Admin Created</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const QualificationsTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    institution: '',
    year_obtained: '',
    description: '',
  });

  useEffect(() => {
    fetchQualifications();
  }, [trainer.id]);

  const fetchQualifications = async () => {
    const { data } = await supabase
      .from('qualifications')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('year_obtained', { ascending: false });
    setQualifications(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    await supabase.from('qualifications').insert({
      trainer_id: trainer.id,
      ...formData,
      year_obtained: formData.year_obtained ? parseInt(formData.year_obtained) : null,
    });
    setShowForm(false);
    setFormData({ title: '', institution: '', year_obtained: '', description: '' });
    fetchQualifications();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('qualifications').delete().eq('id', id);
    fetchQualifications();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Qualifications</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Qualification
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <Input
              label="Title"
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
              value={formData.year_obtained}
              onChange={(e) => setFormData({ ...formData, year_obtained: e.target.value })}
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {qualifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No qualifications added</p>
        ) : (
          qualifications.map((qual) => (
            <Card key={qual.id}>
              <div className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{qual.title}</h4>
                  {qual.institution && <p className="text-gray-600">{qual.institution}</p>}
                  {qual.year_obtained && <p className="text-sm text-gray-500">Year: {qual.year_obtained}</p>}
                  {qual.description && <p className="text-sm text-gray-600 mt-2">{qual.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(qual.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const WorkHistoryTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [workHistory, setWorkHistory] = useState<WorkHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    position: '',
    start_date: '',
    end_date: '',
    description: '',
  });

  useEffect(() => {
    fetchWorkHistory();
  }, [trainer.id]);

  const fetchWorkHistory = async () => {
    const { data } = await supabase
      .from('work_history')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('start_date', { ascending: false });
    setWorkHistory(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    await supabase.from('work_history').insert({
      trainer_id: trainer.id,
      ...formData,
      end_date: formData.end_date || null,
    });
    setShowForm(false);
    setFormData({ company: '', position: '', start_date: '', end_date: '', description: '' });
    fetchWorkHistory();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('work_history').delete().eq('id', id);
    fetchWorkHistory();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Work History</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Work Experience
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Company"
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
              <Input
                label="End Date (Leave empty if current)"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {workHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No work history added</p>
        ) : (
          workHistory.map((work) => (
            <Card key={work.id}>
              <div className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{work.position}</h4>
                  <p className="text-gray-600">{work.company}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {work.start_date && formatDate(work.start_date)} - {work.end_date ? formatDate(work.end_date) : 'Present'}
                  </p>
                  {work.description && <p className="text-sm text-gray-600 mt-2">{work.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(work.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const PastClientsTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [clients, setClients] = useState<PastClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    project_description: '',
    year: '',
  });

  useEffect(() => {
    fetchClients();
  }, [trainer.id]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('past_clients')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('year', { ascending: false });
    setClients(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    await supabase.from('past_clients').insert({
      trainer_id: trainer.id,
      ...formData,
      year: formData.year ? parseInt(formData.year) : null,
    });
    setShowForm(false);
    setFormData({ client_name: '', project_description: '', year: '' });
    fetchClients();
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('past_clients').delete().eq('id', id);
    fetchClients();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Past Clients</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <div className="p-4 space-y-4">
            <Input
              label="Client Name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              required
            />
            <Input
              label="Year"
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            />
            <Textarea
              label="Project Description"
              value={formData.project_description}
              onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAdd}>
                Add
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {clients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No past clients added</p>
        ) : (
          clients.map((client) => (
            <Card key={client.id}>
              <div className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{client.client_name}</h4>
                  {client.year && <p className="text-sm text-gray-500">Year: {client.year}</p>}
                  {client.project_description && (
                    <p className="text-sm text-gray-600 mt-2">{client.project_description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const DocumentsTab: React.FC<{ trainer: Trainer; onUpdate: () => void }> = ({ trainer, onUpdate }) => {
  const [documents, setDocuments] = useState<TrainerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [trainer.id]);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from('trainer_documents')
      .select('*')
      .eq('trainer_id', trainer.id)
      .order('uploaded_at', { ascending: false });
    setDocuments(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileName = `${trainer.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('trainer-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('trainer-documents')
        .getPublicUrl(fileName);

      await supabase.from('trainer_documents').insert({
        trainer_id: trainer.id,
        document_name: file.name,
        document_url: urlData.publicUrl,
        document_type: file.type,
      });

      fetchDocuments();
      onUpdate();
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, url: string) => {
    const fileName = url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('trainer-documents').remove([`${trainer.id}/${fileName}`]);
    }
    await supabase.from('trainer_documents').delete().eq('id', id);
    fetchDocuments();
    onUpdate();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Documents</h3>
        <label className="cursor-pointer">
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <span className={`inline-block ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Button size="sm" disabled={uploading}>
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </span>
        </label>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No documents uploaded</p>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <div className="p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{doc.document_name}</h4>
                  <p className="text-sm text-gray-500">Uploaded: {formatDate(doc.uploaded_at)}</p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={doc.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-teal-600 hover:bg-teal-50 rounded"
                  >
                    <Download size={18} />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id, doc.document_url)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
