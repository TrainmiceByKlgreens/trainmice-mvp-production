import React from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Select } from '../common/Select';
import { formatDate } from '../../utils/helpers';
import { Calendar, MapPin, Users, MessageSquare, UserPlus, Trash2, ArrowLeft, Mail, Phone, User } from 'lucide-react';
import { Event } from '../../types';

interface EventDetailsViewProps {
    event: Event;
    onBack: () => void;
    onStatusChange: (eventId: string, status: string) => Promise<void>;
    onDelete: (event: Event) => Promise<void>;
    onShowQR: (event: Event) => void;
    onAddParticipants: (event: Event) => void;
    isUpdating: boolean;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
    event,
    onBack,
    onStatusChange,
    onDelete,
    onShowQR,
    onAddParticipants,
    isUpdating
}) => {
    const getStatusVariant = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'success';
            case 'COMPLETED': return 'info';
            case 'CANCELLED': return 'danger';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <Button variant="secondary" size="sm" onClick={onBack}>
                    <ArrowLeft size={18} className="mr-2" />
                    Back to list
                </Button>
                <h2 className="text-2xl font-bold text-gray-800 truncate">
                    {event.title || event.course?.title}
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Event Details */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Event Information</h3>
                                <Badge variant={getStatusVariant(event.status)} className="px-3 py-1 text-sm">
                                    {event.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Calendar size={20} className="mr-3 text-teal-600 mt-1" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date & Time</p>
                                            <p className="text-sm text-gray-800">
                                                {event.startDate && event.endDate
                                                    ? `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`
                                                    : event.eventDate ? formatDate(event.eventDate) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <MapPin size={20} className="mr-3 text-teal-600 mt-1" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Venue</p>
                                            <p className="text-sm text-gray-800">{event.venue || 'N/A'}</p>
                                            {(event.city || event.state) && (
                                                <p className="text-xs text-gray-600">
                                                    {event.city}{event.state ? `, ${event.state}` : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Users size={20} className="mr-3 text-teal-600 mt-1" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Trainer</p>
                                            <p className="text-sm text-gray-800 font-medium">{event.trainer?.fullName || 'N/A'}</p>
                                            {event.trainer?.email && <p className="text-xs text-gray-600">{event.trainer.email}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <Users size={20} className="mr-3 text-teal-600 mt-1" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Registrations</p>
                                            <p className="text-sm text-gray-800">
                                                <span className="font-bold">{event.totalParticipants || 0}</span>
                                                <span className="text-gray-500 ml-1">/ {event.maxPacks || '∞'} capacity</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t space-y-4">
                                <h4 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Management Actions</h4>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500 mb-1 ml-1">Update Status</p>
                                        <Select
                                            value={event.status}
                                            onChange={(e) => onStatusChange(event.id, e.target.value)}
                                            disabled={isUpdating}
                                            options={[
                                                { value: 'ACTIVE', label: 'Active' },
                                                { value: 'COMPLETED', label: 'Completed' },
                                                { value: 'CANCELLED', label: 'Cancelled' },
                                            ]}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button
                                            variant="danger"
                                            onClick={() => onDelete(event)}
                                            className="w-full sm:w-auto"
                                        >
                                            <Trash2 size={18} className="mr-2" />
                                            Delete Event
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                    <Button
                                        variant="primary"
                                        onClick={() => onAddParticipants(event)}
                                        className="w-full shadow-sm"
                                    >
                                        <UserPlus size={18} className="mr-2" />
                                        Add Participants
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => onShowQR(event)}
                                        className="w-full"
                                    >
                                        <MessageSquare size={18} className="mr-2" />
                                        Feedback Form
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Participant Details */}
                <div className="space-y-6">
                    <Card className="h-full">
                        <div className="p-6 flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Participants & Registrations</h3>
                                <Badge variant="info">{event.registrations?.length || 0} Bookings</Badge>
                            </div>

                            {!event.registrations || event.registrations.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 italic">
                                    <Users size={48} className="mb-3 opacity-20 text-gray-800" />
                                    <p>No registrations yet for this event.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden bg-white rounded-lg border border-gray-200">
                                    <ul className="divide-y divide-gray-200 overflow-y-auto max-h-[600px]">
                                        {event.registrations.map((reg) => (
                                            <li key={reg.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1.5 flex-1">
                                                        <div className="flex items-center">
                                                            <User size={16} className="text-teal-600 mr-2" />
                                                            <span className="font-bold text-gray-900">
                                                                {reg.clientsReference?.picName || reg.client?.userName || reg.clientName || 'N/A'}
                                                            </span>
                                                        </div>

                                                        <div className="flex flex-col space-y-1 ml-6">
                                                            <div className="flex items-center text-sm text-gray-700 font-medium">
                                                                <MapPin size={14} className="mr-2 text-gray-400" />
                                                                <span>{reg.clientsReference?.companyName || 'No company info'}</span>
                                                            </div>

                                                            <div className="flex items-center text-sm text-gray-600">
                                                                <Mail size={14} className="mr-2 text-gray-400" />
                                                                <span>{reg.clientsReference?.email || reg.client?.companyEmail || reg.clientEmail || 'No email provided'}</span>
                                                            </div>

                                                            {(reg.clientsReference?.contactNumber || reg.client?.contactNumber) && (
                                                                <div className="flex items-center text-sm text-gray-600">
                                                                    <Phone size={14} className="mr-2 text-gray-400" />
                                                                    <span>{reg.clientsReference?.contactNumber || reg.client?.contactNumber}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end space-y-2 ml-4">
                                                        <Badge variant={reg.status === 'APPROVED' ? 'success' : 'warning'}>
                                                            {reg.status}
                                                        </Badge>
                                                        {reg.packNumber && (
                                                            <p className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                                                                Pack #{reg.packNumber}
                                                            </p>
                                                        )}
                                                        {reg.numberOfParticipants && reg.numberOfParticipants > 1 && (
                                                            <p className="text-xs text-gray-500 font-medium">
                                                                {reg.numberOfParticipants} Participants
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
