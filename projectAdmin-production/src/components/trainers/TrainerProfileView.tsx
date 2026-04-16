import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  FileClock,
  FileText,
  Globe,
  Languages,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  UserRound,
  Wallet,
} from 'lucide-react';

interface TrainerProfileViewProps {
  trainer: any;
  onBack: () => void;
  onEdit: () => void;
  onViewAnalytics: () => void;
  onOpenCalendar: () => void;
  onReviewProfile: (status: 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED') => void;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const currencyFormatter = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  maximumFractionDigits: 0,
});

const toDisplayDate = (value?: string | null) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const toDisplayMonthYear = (value?: string | null) => {
  if (!value) return 'Present';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-MY', {
    month: 'short',
    year: 'numeric',
  });
};

const toDisplayTime = (value?: string | null) => {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  const parsedHours = Number.parseInt(hours ?? '', 10);
  const parsedMinutes = Number.parseInt(minutes ?? '', 10);

  if (Number.isNaN(parsedHours) || Number.isNaN(parsedMinutes)) {
    return value;
  }

  const date = new Date();
  date.setHours(parsedHours, parsedMinutes, 0, 0);

  return date.toLocaleTimeString('en-MY', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const toStringArray = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const record = item as Record<string, unknown>;
          const preferredValue =
            record.label ??
            record.name ??
            record.title ??
            record.language ??
            record.value;
          return typeof preferredValue === 'string' ? preferredValue : '';
        }
        return '';
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return toStringArray(parsed);
    } catch {
      return trimmed
        .split(/[\n,|]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

const toInitials = (name?: string | null) =>
  (name || 'Trainer')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const normalizeProfileStatus = (value: unknown): 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED' => {
  if (value === 'APPROVED' || value === 'DENIED') {
    return value;
  }
  return 'PENDING_APPROVAL';
};

const getProfileStatusBadge = (status: 'PENDING_APPROVAL' | 'APPROVED' | 'DENIED') => {
  switch (status) {
    case 'APPROVED':
      return {
        label: 'Profile Approved',
        variant: 'success' as const,
        accent: 'text-emerald-700',
      };
    case 'DENIED':
      return {
        label: 'Changes Requested',
        variant: 'danger' as const,
        accent: 'text-red-700',
      };
    default:
      return {
        label: 'Pending Review',
        variant: 'warning' as const,
        accent: 'text-amber-700',
      };
  }
};

const InfoRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
    <div className="mt-0.5 rounded-lg bg-white p-2 text-teal-600 shadow-sm">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <div className="mt-1 text-sm text-gray-800 break-words">{value}</div>
    </div>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, icon, subtitle, children }) => (
  <Card className="overflow-hidden border border-gray-100 shadow-sm">
    <div className="border-b border-gray-100 bg-gray-50/70 px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-teal-50 p-2 text-teal-600">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
        </div>
      </div>
    </div>
    <div className="p-6">{children}</div>
  </Card>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-sm text-gray-500">
    {message}
  </div>
);

export const TrainerProfileView: React.FC<TrainerProfileViewProps> = ({
  trainer,
  onBack,
  onEdit,
  onViewAnalytics,
  onOpenCalendar,
  onReviewProfile,
}) => {
  const profileApprovalStatus = normalizeProfileStatus(trainer?.profileApprovalStatus);
  const profileStatusMeta = getProfileStatusBadge(profileApprovalStatus);
  const expertise = toStringArray(trainer?.areasOfExpertise);
  const languageBadges =
    Array.isArray(trainer?.trainerLanguages) && trainer.trainerLanguages.length > 0
      ? trainer.trainerLanguages
          .map((item: any) =>
            [item.language, item.proficiency].filter(Boolean).join(' • ')
          )
          .filter(Boolean)
      : toStringArray(trainer?.languagesSpoken);
  const qualifications = Array.isArray(trainer?.qualifications) ? trainer.qualifications : [];
  const workHistory = Array.isArray(trainer?.workHistoryEntries) ? trainer.workHistoryEntries : [];
  const pastClients = Array.isArray(trainer?.pastClients) ? trainer.pastClients : [];
  const documents = Array.isArray(trainer?.trainerDocuments) ? trainer.trainerDocuments : [];
  const weeklyAvailability = Array.isArray(trainer?.weeklyAvailability) ? trainer.weeklyAvailability : [];
  const blockedDates = Array.isArray(trainer?.blockedDates) ? trainer.blockedDates : [];
  const assignedCourses = Array.isArray(trainer?.courseTrainers)
    ? trainer.courseTrainers
        .map((entry: any) => entry.course)
        .filter(Boolean)
    : [];
  const pendingDocuments = documents.filter((item: any) => !item?.verified).length;
  const pendingCourses = assignedCourses.filter((course: any) => course?.status === 'PENDING_APPROVAL').length;
  const location = [trainer?.city, trainer?.state, trainer?.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border border-emerald-100 shadow-md">
        <div className="border-b border-emerald-100 bg-gradient-to-r from-green-50 via-white to-teal-50 px-6 py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              {trainer?.profilePic ? (
                <img
                  src={trainer.profilePic}
                  alt={trainer?.fullName || 'Trainer'}
                  className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 text-2xl font-bold text-white shadow-md">
                  {toInitials(trainer?.fullName)}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-600">
                    Trainer Profile
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-gray-900">
                    {trainer?.fullName || 'Unnamed Trainer'}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">
                    {(trainer?.customTrainerId || 'No trainer ID').toString()}
                  </Badge>
                  <Badge variant={profileStatusMeta.variant}>{profileStatusMeta.label}</Badge>
                  {trainer?.hrdcAccreditationId ? (
                    <Badge variant="success">HRDC Certified</Badge>
                  ) : (
                    <Badge variant="default">HRDC Pending</Badge>
                  )}
                  {expertise.slice(0, 3).map((item) => (
                    <Badge key={item} className="bg-teal-50 text-teal-700">
                      {item}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
                  {trainer?.email ? (
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-teal-600" />
                      <span>{trainer.email}</span>
                    </div>
                  ) : null}
                  {trainer?.phoneNumber ? (
                    <div className="flex items-center gap-2">
                      <Phone size={15} className="text-teal-600" />
                      <span>{trainer.phoneNumber}</span>
                    </div>
                  ) : null}
                  {location ? (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-teal-600" />
                      <span>{location}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft size={16} className="mr-2" />
                Back to Trainers
              </Button>
              <Button variant="secondary" onClick={onViewAnalytics}>
                <BarChart3 size={16} className="mr-2" />
                Analytics
              </Button>
              <Button variant="secondary" onClick={onOpenCalendar}>
                <Calendar size={16} className="mr-2" />
                Availability
              </Button>
              <Button variant="primary" onClick={onEdit}>
                <UserRound size={16} className="mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-sm text-gray-500">Profile Status</p>
            <p className={`mt-2 text-lg font-bold ${profileStatusMeta.accent}`}>{profileStatusMeta.label}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-sm text-gray-500">Qualifications</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{qualifications.length}</p>
          </div>
          <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
            <p className="text-sm text-gray-500">Work History Entries</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{workHistory.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-sm text-gray-500">Pending Documents</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{pendingDocuments}</p>
          </div>
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <p className="text-sm text-gray-500">Courses Pending Approval</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{pendingCourses}</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.95fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Professional Overview"
            subtitle="Core identity, contact, and location details"
            icon={<UserRound size={20} />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <InfoRow
                icon={<Mail size={16} />}
                label="Email"
                value={trainer?.email || 'Not provided'}
              />
              <InfoRow
                icon={<Phone size={16} />}
                label="Phone"
                value={trainer?.phoneNumber || 'Not provided'}
              />
              <InfoRow
                icon={<MapPin size={16} />}
                label="Location"
                value={location || 'Not provided'}
              />
              <InfoRow
                icon={<Wallet size={16} />}
                label="Hourly Rate"
                value={
                  trainer?.hourlyRate !== null && trainer?.hourlyRate !== undefined && trainer?.hourlyRate !== ''
                    ? currencyFormatter.format(Number(trainer.hourlyRate))
                    : 'Not provided'
                }
              />
              <InfoRow
                icon={<BadgeCheck size={16} />}
                label="HRDC Valid Until"
                value={toDisplayDate(trainer?.hrdcAccreditationValidUntil)}
              />
              <InfoRow
                icon={<Globe size={16} />}
                label="Joined"
                value={toDisplayDate(trainer?.createdAt)}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Professional Bio</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">
                {trainer?.professionalBio || 'No professional bio has been added yet.'}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title="Qualifications"
            subtitle="Academic credentials and certifications"
            icon={<Award size={20} />}
          >
            {qualifications.length === 0 ? (
              <EmptyState message="No qualifications have been added for this trainer yet." />
            ) : (
              <div className="space-y-4">
                {qualifications.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {[item.institution, item.qualificationType].filter(Boolean).join(' • ') || 'Details not provided'}
                        </p>
                      </div>
                      <Badge variant="default">
                        {item.yearObtained ? item.yearObtained : 'Year not set'}
                      </Badge>
                    </div>
                    {item.description ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">{item.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Work History"
            subtitle="Professional experience and previous roles"
            icon={<Briefcase size={20} />}
          >
            {workHistory.length === 0 ? (
              <EmptyState message="No work history entries have been added yet." />
            ) : (
              <div className="space-y-4">
                {workHistory.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{item.position}</h4>
                        <p className="mt-1 text-sm text-gray-600">{item.company}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {toDisplayMonthYear(item.startDate)} - {toDisplayMonthYear(item.endDate)}
                      </div>
                    </div>
                    {item.description ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">{item.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Past Clients"
            subtitle="Client relationships and delivery history"
            icon={<Building2 size={20} />}
          >
            {pastClients.length === 0 ? (
              <EmptyState message="No past clients have been added yet." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {pastClients.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{item.clientName}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {item.year ? `Delivered in ${item.year}` : 'Year not provided'}
                        </p>
                      </div>
                      <Badge variant="info">Client</Badge>
                    </div>
                    {item.projectDescription ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">{item.projectDescription}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Profile Review"
            subtitle="Control whether this trainer profile can appear on the website"
            icon={<ShieldAlert size={20} />}
          >
            <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current Review State</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={profileStatusMeta.variant}>{profileStatusMeta.label}</Badge>
                    {trainer?.profileApprovalUpdatedAt ? (
                      <span className="text-sm text-gray-500">
                        Updated {toDisplayDate(trainer.profileApprovalUpdatedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <p>{pendingDocuments} document(s) awaiting verification</p>
                  <p>{pendingCourses} course(s) awaiting approval</p>
                </div>
              </div>

              {trainer?.profileApprovalNotes ? (
                <div className="mt-4 rounded-xl border border-amber-100 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Review Notes</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700">{trainer.profileApprovalNotes}</p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="success" onClick={() => onReviewProfile('APPROVED')}>
                  <CheckCircle2 size={16} className="mr-2" />
                  Approve Profile
                </Button>
                <Button variant="outline" onClick={() => onReviewProfile('DENIED')}>
                  <ShieldAlert size={16} className="mr-2" />
                  Request Changes
                </Button>
                {profileApprovalStatus !== 'PENDING_APPROVAL' ? (
                  <Button variant="secondary" onClick={() => onReviewProfile('PENDING_APPROVAL')}>
                    <FileClock size={16} className="mr-2" />
                    Move to Pending
                  </Button>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Expertise & Languages"
            subtitle="What this trainer covers and how they communicate"
            icon={<Languages size={20} />}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Areas of Expertise</p>
              {expertise.length === 0 ? (
                <div className="mt-3">
                  <EmptyState message="No areas of expertise have been added yet." />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {expertise.map((item) => (
                    <Badge key={item} className="bg-teal-50 px-3 py-1 text-sm text-teal-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Languages</p>
              {languageBadges.length === 0 ? (
                <div className="mt-3">
                  <EmptyState message="No language details have been added yet." />
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {languageBadges.map((item) => (
                    <Badge key={item} className="bg-green-50 px-3 py-1 text-sm text-green-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Availability & Scheduling"
            subtitle="Weekly schedule and currently blocked dates"
            icon={<Clock3 size={20} />}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Weekly Availability</p>
              {weeklyAvailability.length === 0 ? (
                <div className="mt-3">
                  <EmptyState message="No weekly availability has been configured yet." />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {weeklyAvailability.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3"
                    >
                      <span className="font-medium text-gray-800">
                        {dayNames[item.dayOfWeek] || `Day ${item.dayOfWeek}`}
                      </span>
                      <span className="text-sm text-gray-600">
                        {toDisplayTime(item.startTime)} - {toDisplayTime(item.endTime)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Blocked Dates</p>
              {blockedDates.length === 0 ? (
                <div className="mt-3">
                  <EmptyState message="No blocked dates are listed right now." />
                </div>
              ) : (
                <div className="mt-3 space-y-3">
                  {blockedDates.map((item: any) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-800">
                          {toDisplayDate(item.blockedDate)}
                        </span>
                        {item.reason ? <Badge variant="warning">{item.reason}</Badge> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Assigned Courses"
            subtitle="Courses currently linked to this trainer"
            icon={<Calendar size={20} />}
          >
            {assignedCourses.length === 0 ? (
              <EmptyState message="No assigned courses are attached to this trainer yet." />
            ) : (
              <div className="space-y-3">
                {assignedCourses.map((course: any) => (
                  <div
                    key={course.id}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{course.title || 'Untitled Course'}</p>
                        <p className="mt-1 text-sm text-gray-500">Course ID: {course.id}</p>
                      </div>
                      <Badge
                        variant={course.status === 'APPROVED' ? 'success' : course.status === 'DENIED' ? 'danger' : 'default'}
                      >
                        {course.status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Documents"
            subtitle="Reference files, certifications, and attachments"
            icon={<FileText size={20} />}
          >
            {documents.length === 0 ? (
              <EmptyState message="No trainer documents have been uploaded yet." />
            ) : (
              <div className="space-y-3">
                {documents.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {item.fileName || item.documentType || 'Trainer document'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span>{item.documentType || 'Document'}</span>
                          <span>{toDisplayDate(item.uploadedAt)}</span>
                          {item.verified ? (
                            <span className="font-medium text-green-700">Verified</span>
                          ) : (
                            <span>Pending verification</span>
                          )}
                        </div>
                      </div>
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          <Download size={15} className="mr-2" />
                          Open
                        </a>
                      ) : null}
                    </div>
                    {item.notes ? (
                      <p className="mt-3 text-sm leading-6 text-gray-700">{item.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
};
