import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    Briefcase,
    Building2,
    MapPin,
    Edit3,
    Save,
    X,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react';
import { auth } from '../lib/auth';
import { apiClient } from '../lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientProfile {
    id: string;
    userName: string;
    companyEmail: string;
    contactNumber: string;
    position: string;
    companyName: string;
    companyAddress: string;
    city: string;
    state: string;
}

const EMPTY_PROFILE: ClientProfile = {
    id: '',
    userName: '',
    companyEmail: '',
    contactNumber: '',
    position: '',
    companyName: '',
    companyAddress: '',
    city: '',
    state: '',
};

// ─── Field Component ──────────────────────────────────────────────────────────

function ProfileField({
    icon: Icon,
    label,
    value,
    editValue,
    editing,
    fieldKey,
    type = 'text',
    readOnly = false,
    onChange,
}: {
    icon: any;
    label: string;
    value: string;
    editValue: string;
    editing: boolean;
    fieldKey: string;
    type?: string;
    readOnly?: boolean;
    onChange: (key: string, val: string) => void;
}) {
    return (
        <div className="flex items-start gap-4 py-4 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
                {editing && !readOnly ? (
                    <input
                        type={type}
                        value={editValue}
                        onChange={(e) => onChange(fieldKey, e.target.value)}
                        className="w-full text-sm font-semibold text-gray-900 bg-gray-50 border border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-xl px-3 py-2 outline-none transition-all"
                    />
                ) : (
                    <p className={`text-sm font-semibold ${value ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                        {value || (readOnly ? '—' : 'Not set')}
                    </p>
                )}
                {editing && readOnly && (
                    <p className="text-[10px] text-gray-400 mt-0.5">This field cannot be changed.</p>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function MyProfile() {
    const [profile, setProfile] = useState<ClientProfile>(EMPTY_PROFILE);
    const [editData, setEditData] = useState<ClientProfile>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        auth.getSession().then(({ user }) => {
            if (!user) {
                setIsLoggedIn(false);
                setLoading(false);
            } else {
                setIsLoggedIn(true);
                fetchProfile();
            }
        });
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { client } = await apiClient.getClientProfile();
            const mapped: ClientProfile = {
                id: client?.id || '',
                userName: client?.userName || client?.user_name || '',
                companyEmail: client?.companyEmail || client?.company_email || client?.email || '',
                contactNumber: client?.contactNumber || client?.contact_number || '',
                position: client?.position || '',
                companyName: client?.companyName || client?.company_name || '',
                companyAddress: client?.companyAddress || client?.company_address || '',
                city: client?.city || '',
                state: client?.state || '',
            };
            setProfile(mapped);
            setEditData(mapped);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setEditData({ ...profile });
        setEditing(true);
        setFeedback(null);
    };

    const handleCancel = () => {
        setEditing(false);
        setEditData({ ...profile });
        setFeedback(null);
    };

    const handleChange = (key: string, val: string) => {
        setEditData((prev) => ({ ...prev, [key]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        setFeedback(null);
        try {
            await apiClient.updateClientProfile({
                userName: editData.userName,
                contactNumber: editData.contactNumber,
                position: editData.position,
                companyName: editData.companyName,
                companyAddress: editData.companyAddress,
                city: editData.city,
                state: editData.state,
            });
            setProfile({ ...editData });
            setEditing(false);
            setFeedback({ type: 'success', message: 'Profile updated successfully!' });
            setTimeout(() => setFeedback(null), 4000);
        } catch (err: any) {
            setFeedback({
                type: 'error',
                message: err?.message || 'Failed to update profile. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    // ── Not Logged In ──────────────────────────────────────────────────────────
    if (isLoggedIn === false) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4">
                <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center border border-gray-100">
                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login Required</h2>
                    <p className="text-gray-500 text-sm mb-6">Please log in to view and edit your profile.</p>
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
                        className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-all"
                    >
                        Log In
                    </button>
                </div>
            </div>
        );
    }

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mb-4" />
                    <p className="text-gray-500 font-medium">Loading profile…</p>
                </div>
            </div>
        );
    }

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.userName || 'User')}&background=FBBF24&color=fff&size=128&bold=true&length=1`;

    const fields = [
        { icon: User, label: 'Username', key: 'userName' },
        { icon: Mail, label: 'Company Email', key: 'companyEmail', readOnly: true },
        { icon: Phone, label: 'Contact Number', key: 'contactNumber', type: 'tel' },
        { icon: Briefcase, label: 'Position / Job Title', key: 'position' },
        { icon: Building2, label: 'Company Name', key: 'companyName' },
        { icon: MapPin, label: 'Company Address', key: 'companyAddress' },
        { icon: MapPin, label: 'City', key: 'city' },
        { icon: MapPin, label: 'State', key: 'state' },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">

                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
                            <p className="text-sm text-gray-400 font-medium">Manage your account information</p>
                        </div>
                    </div>
                </div>

                {/* Feedback Banner */}
                {feedback && (
                    <div
                        className={`mb-5 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium border ${feedback.type === 'success'
                                ? 'bg-green-50 border-green-100 text-green-700'
                                : 'bg-red-50 border-red-100 text-red-600'
                            }`}
                    >
                        {feedback.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        )}
                        {feedback.message}
                    </div>
                )}

                {/* Card */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Avatar Header */}
                    <div className="bg-gradient-to-br from-amber-400 to-amber-500 px-6 pt-8 pb-14 relative">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1">Account</p>
                                <h2 className="text-white font-extrabold text-xl leading-tight">
                                    {profile.userName || 'Your Profile'}
                                </h2>
                                {profile.companyName && (
                                    <p className="text-amber-100 text-sm mt-0.5">{profile.companyName}</p>
                                )}
                            </div>
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-2xl border-4 border-white/50 shadow-lg object-cover"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 px-6 -mt-5 relative z-10 mb-2">
                        {editing ? (
                            <>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl shadow-md transition-all disabled:opacity-70"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    {saving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 px-5 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all"
                            >
                                <Edit3 className="w-4 h-4" /> Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Fields */}
                    <div className="px-6 pb-6">
                        <div className="bg-gray-50/50 rounded-2xl px-4 py-1 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                            {fields.map(({ icon, label, key, type, readOnly }) => (
                                <ProfileField
                                    key={key}
                                    icon={icon}
                                    label={label}
                                    value={(profile as any)[key]}
                                    editValue={(editData as any)[key]}
                                    editing={editing}
                                    fieldKey={key}
                                    type={type}
                                    readOnly={readOnly}
                                    onChange={handleChange}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Member Since */}
                <p className="text-center text-xs text-gray-400 font-medium mt-4">
                    TrainMICE Client Account · {profile.companyEmail}
                </p>
            </div>
        </div>
    );
}
