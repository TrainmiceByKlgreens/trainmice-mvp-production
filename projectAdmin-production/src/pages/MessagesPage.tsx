import React, { useEffect, useState, useRef } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Select } from '../components/common/Select';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { apiClient } from '../lib/api-client';
import { useRealtime } from '../hooks/useRealtime';
import { MessageSquare, Mail, Send, CheckCircle, Search, ChevronDown, Paperclip, X, Download, FileText } from 'lucide-react';
import { showToast } from '../components/common/Toast';
import { formatDate } from '../utils/helpers';

// Helper function for WhatsApp-style time formatting
const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const diffTime = today.getTime() - messageDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today - show time only
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    // Older - show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
};

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
}

interface TrainerMessage {
  id: string;
  trainerId: string;
  lastMessage: string;
  lastMessageTime: string;
  isRead: boolean;
  trainer: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface MessageThread {
  id: string;
  trainerId: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageBy: string | null;
  unreadCount: number;
  trainer: {
    id: string;
    fullName: string;
    email: string;
  };
  messages?: Message[];
}

interface Message {
  id: string;
  senderType: 'TRAINER' | 'ADMIN';
  senderId: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface EventEnquiry {
  id: string;
  eventId: string;
  trainerId: string;
  message: string;
  subject: string | null;
  isRead: boolean;
  unreadCount: number;
  lastMessageTime: string | null;
  lastMessageBy: string | null;
  createdAt: string;
  trainer: {
    id: string;
    fullName: string;
    email: string;
  };
  event: {
    id: string;
    title: string;
    eventDate: string;
    venue: string | null;
    course: {
      id: string;
      title: string;
    };
  };
  messages?: EventEnquiryMessage[];
  _count?: {
    messages: number;
  };
}

interface EventEnquiryMessage {
  id: string;
  senderType: 'TRAINER' | 'ADMIN';
  senderId: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  createdAt: string;
}

const IMAGE_ATTACHMENT_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

const isImageAttachment = (attachmentUrl?: string | null, attachmentName?: string | null) => {
  if (!attachmentUrl) return false;
  if (attachmentUrl.startsWith('data:image/')) return true;
  const normalizedName = (attachmentName || attachmentUrl).split('?')[0].split('#')[0];
  return IMAGE_ATTACHMENT_PATTERN.test(normalizedName);
};

const normalizePreviewUrl = (attachmentUrl?: string | null, attachmentName?: string | null) => {
  if (!attachmentUrl) return null;

  const normalizedName = (attachmentName || '').toLowerCase();
  const isImageByName = IMAGE_ATTACHMENT_PATTERN.test(normalizedName);

  if (attachmentUrl.startsWith('data:application/octet-stream;base64,') && isImageByName) {
    const mimeType =
      normalizedName.endsWith('.png') ? 'image/png'
        : normalizedName.endsWith('.gif') ? 'image/gif'
          : normalizedName.endsWith('.webp') ? 'image/webp'
            : normalizedName.endsWith('.bmp') ? 'image/bmp'
              : normalizedName.endsWith('.svg') ? 'image/svg+xml'
                : 'image/jpeg';

    return attachmentUrl.replace('data:application/octet-stream', `data:${mimeType}`);
  }

  return attachmentUrl;
};

const downloadAttachment = (url: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'attachment';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ChatAttachmentPreview: React.FC<{
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isOwn?: boolean;
}> = ({ attachmentUrl, attachmentName, isOwn = false }) => {
  const resolvedAttachmentUrl = normalizePreviewUrl(
    apiClient.resolveImageUrl(attachmentUrl || null),
    attachmentName,
  );

  if (!resolvedAttachmentUrl) {
    return null;
  }

  const isImage = isImageAttachment(resolvedAttachmentUrl, attachmentName);

  if (isImage) {
    return (
      <div className={`mt-2 overflow-hidden rounded-2xl border ${isOwn
        ? 'bg-white/10 border-white/20'
        : 'bg-gray-50 border-gray-200'
        }`}>
        <a
          href={resolvedAttachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={resolvedAttachmentUrl}
            alt={attachmentName || 'Image attachment'}
            className="max-h-72 w-full object-cover"
          />
        </a>
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span
            className={`min-w-0 flex-1 truncate text-[10px] font-medium ${isOwn ? 'text-white/80' : 'text-gray-500'}`}
            title={attachmentName || 'Image attachment'}
          >
            {attachmentName || 'Image attachment'}
          </span>
          <button
            type="button"
            onClick={() => downloadAttachment(resolvedAttachmentUrl, attachmentName || 'image')}
            className={`p-1 rounded-md transition-colors ${isOwn
              ? 'hover:bg-white/20 text-white'
              : 'hover:bg-gray-200 text-gray-400 hover:text-teal-600'
              }`}
          >
            <Download size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-2 p-2 rounded-xl flex items-center gap-2 border ${isOwn
      ? 'bg-white/10 border-white/20'
      : 'bg-gray-50 border-gray-100'
      }`}>
      <FileText size={16} className={isOwn ? 'text-white' : 'text-teal-600'} />
      <span className={`text-[10px] font-medium truncate flex-1 ${isOwn ? 'text-white/80' : 'text-gray-500'}`}>
        {attachmentName || 'Attachment'}
      </span>
      <button
        type="button"
        onClick={() => downloadAttachment(resolvedAttachmentUrl, attachmentName || 'attachment')}
        className={`p-1 rounded-md transition-colors ${isOwn
          ? 'hover:bg-white/20 text-white'
          : 'hover:bg-gray-200 text-gray-400 hover:text-teal-600'
          }`}
      >
        <Download size={14} />
      </button>
    </div>
  );
};

const SearchableTrainerDropdown: React.FC<{
  trainers: Array<{ id: string; fullName: string; email: string; customTrainerId?: string }>;
  value: string;
  onChange: (id: string) => void;
}> = ({ trainers, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTrainers = trainers.filter(t =>
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.customTrainerId && t.customTrainerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTrainer = trainers.find(t => t.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Select Trainer (Name or ID searchable) *</label>
      <div
        className="w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer bg-white flex justify-between items-center hover:border-teal-500 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedTrainer ? 'text-gray-900' : 'text-gray-400'}>
          {selectedTrainer
            ? `${selectedTrainer.fullName} (${selectedTrainer.customTrainerId || 'No ID'})`
            : '-- Select a trainer --'}
        </span>
        <ChevronDown size={18} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="Search name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="py-1">
            {filteredTrainers.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 italic">No trainers found</div>
            ) : (
              filteredTrainers.map(trainer => (
                <div
                  key={trainer.id}
                  className={`px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${value === trainer.id ? 'bg-teal-50 border-teal-100' : ''}`}
                  onClick={() => {
                    onChange(trainer.id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="font-medium text-gray-900">{trainer.fullName}</div>
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>ID: {trainer.customTrainerId || 'N/A'}</span>
                    <span>{trainer.email}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const MessagesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'contact' | 'send' | 'trainer-messages' | 'event-enquiries'>('contact');
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [trainerMessages, setTrainerMessages] = useState<TrainerMessage[]>([]);
  const [messageThreads, setMessageThreads] = useState<MessageThread[]>([]);
  const [eventEnquiries, setEventEnquiries] = useState<EventEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [showEventEnquiryModal, setShowEventEnquiryModal] = useState(false);
  const [selectedEventEnquiry, setSelectedEventEnquiry] = useState<EventEnquiry | null>(null);
  const [eventEnquiryMessages, setEventEnquiryMessages] = useState<EventEnquiryMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [replying, setReplying] = useState(false);
  const [eventEnquiryReply, setEventEnquiryReply] = useState('');
  const [eventEnquiryReplyAttachment, setEventEnquiryReplyAttachment] = useState<File | null>(null);
  const [replyingToEnquiry, setReplyingToEnquiry] = useState(false);

  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('');
  const [enquirySearchTerm, setEnquirySearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Tab-specific pagination and filters to prevent state pollution
  const [tabPagination, setTabPagination] = useState<Record<string, number>>({
    contact: 1,
    'trainer-messages': 1,
    'event-enquiries': 1
  });

  const [tabFilters, setTabFilters] = useState<Record<string, string>>({
    'trainer-messages': 'all',
    'event-enquiries': 'all'
  });

  const [unreadCounts, setUnreadCounts] = useState({
    contact: 0,
    trainerMessages: 0,
    eventEnquiries: 0
  });

  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [allTrainers, setAllTrainers] = useState<Array<{ id: string; fullName: string; email: string; customTrainerId?: string }>>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const hasReplyContent = Boolean(replyMessage.trim() || replyAttachment);
  const hasEventEnquiryReplyContent = Boolean(eventEnquiryReply.trim() || eventEnquiryReplyAttachment);

  const [sendForm, setSendForm] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR',
    targetType: 'global' as 'global' | 'user' | 'role',
    userId: '',
    userRole: 'CLIENT' as 'CLIENT' | 'TRAINER' | 'ADMIN',
  });

  // Tracks whether the page has completed its first fetch — used to decide
  // whether to show a full spinner (first load) or a silent background refresh (tab switches)
  const hasFetchedOnce = useRef(false);

  useEffect(() => {
    fetchUnreadSummary();
  }, []);

  // On tab switch: if data already exists (hasFetchedOnce), do a SILENT background refresh
  // to avoid the "spinner flash" on every tab click. Only show spinner on very first load.
  useEffect(() => {
    const page = tabPagination[activeTab] || 1;
    const filter = tabFilters[activeTab] || 'all';
    const isBackground = hasFetchedOnce.current; // Silent if we've already loaded once
    fetchData(isBackground, page, filter);
  }, [activeTab]);

  // Separate effect for pagination/filter changes — always silent after first load
  useEffect(() => {
    if (!hasFetchedOnce.current) return;
    const page = tabPagination[activeTab] || 1;
    const filter = tabFilters[activeTab] || 'all';
    fetchData(true, page, filter);
  }, [tabPagination, tabFilters]);

  const fetchUnreadSummary = async () => {
    try {
      const [contactRes, trainerRes, enquiriesRes] = await Promise.all([
        apiClient.getContactSubmissions({ resolved: false, limit: 1 }),
        apiClient.getTrainerMessages({ limit: 1 }),
        apiClient.getEventEnquiries({ isRead: false, limit: 1 })
      ]);

      setUnreadCounts({
        contact: contactRes.total || 0,
        trainerMessages: trainerRes.unreadCount || 0,
        eventEnquiries: enquiriesRes.total || 0
      });

      // Also update trainerMessages unread count for the tab badge
      setUnreadCounts(prev => ({ ...prev, trainerMessages: trainerRes.unreadCount || 0 }));

      // Update unread status map if provided
      if (trainerRes.unreadStatus) {
        setUnreadStatusMap(trainerRes.unreadStatus);
      }
    } catch (err) {
      console.error('Error fetching unread summary:', err);
    }
  };

  // Real-time updates with true state access
  useRealtime((payload: any) => {
    const isRelevantTable = ['messages', 'trainer_messages', 'event_enquiries', 'contact_submissions'].includes(payload.table);
    if (!isRelevantTable) return;

    console.log('📬 Real-time update received in MessagesPage (High-End):', payload.table);

    // 1. Refresh global unread counts immediately
    fetchUnreadSummary();

    // 2. Refresh ALL categories in the background to ensure consistency when switching tabs
    // This provides the "high-end" experience where data is already there
    refreshAllCategoriesBackground();

    // 3. If a trainer thread is open and matches the update, refresh it
    if (activeTab === 'trainer-messages' && selectedTrainerId &&
      (payload.table === 'messages' || payload.table === 'trainer_messages')) {

      const data = payload.data;
      const isForCurrentTrainer = data?.trainerId === selectedTrainerId || data?.trainer_id === selectedTrainerId;

      if (isForCurrentTrainer) {
        apiClient.getTrainerThread(selectedTrainerId).then(response => {
          setThreadMessages(response.messages || []);
          if (response.thread) {
            setSelectedThread(response.thread);
          }
        }).catch(err => console.error('Error refreshing thread:', err));
      }
    }
  });

  useEffect(() => {
    const isMessagingTab = activeTab === 'trainer-messages' || activeTab === 'event-enquiries' || activeTab === 'contact';
    if (!isMessagingTab) return;
  }, [activeTab]);

  const fetchData = async (isBackground = false, page = 1, filter = 'all') => {
    try {
      if (!isBackground) setLoading(true);
      // Mark that we have completed at least one fetch — future tab switches will be silent
      hasFetchedOnce.current = true;

      // Always fetch all trainers (cached or background)
      apiClient.getTrainers().then(response => {
        const trainersList = (response.trainers || []).map((t: any) => ({
          id: t.id,
          fullName: t.fullName || '',
          email: t.email || '',
          customTrainerId: t.customTrainerId || '',
        }));
        setAllTrainers(trainersList);
      }).catch(err => console.error('Error fetching trainers:', err));

      if (activeTab === 'contact') {
        const response = await apiClient.getContactSubmissions({ page });
        setContactSubmissions(response.submissions || []);
        setTotalPages(response.totalPages || 1);
        
        // Update unread count based on fetched submissions
        const unreadContactCount = (response.submissions || []).filter((s: any) => !s.isRead).length;
        setUnreadCounts(prev => ({ ...prev, contact: unreadContactCount }));
      } else if (activeTab === 'trainer-messages') {
        const params: any = { page };

        if (filter === 'unread') {
          params.isRead = false;
        } else if (filter === 'read') {
          params.isRead = true;
        }

        const response = await apiClient.getTrainerMessages(params);

        const newUnreadStatusMap = response.unreadStatus || {};
        setUnreadStatusMap(newUnreadStatusMap);
        setUnreadCounts(prev => ({ ...prev, trainerMessages: response.unreadCount || 0 }));

        const updatedThreads = (response.threads || []).map((t: any) => {
          if (selectedTrainerId && t.trainerId === selectedTrainerId) {
            return { ...t, unreadCount: 0 };
          }
          return {
            ...t,
            unreadCount: newUnreadStatusMap[t.trainerId] || t.unreadCount || 0
          };
        });

        setMessageThreads(updatedThreads);
        setTrainerMessages(response.legacyMessages || []);
        setTotalPages(response.totalPages || 1);

      } else if (activeTab === 'event-enquiries') {
        const params: any = { page };
        if (filter === 'unread') {
          params.isRead = false;
        } else if (filter === 'read') {
          params.isRead = true;
        }
        const response = await apiClient.getEventEnquiries(params);
        setEventEnquiries(response.enquiries || []);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (!isBackground) showToast(error.message || 'Error fetching messages', 'error');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const refreshAllCategoriesBackground = async () => {
    try {
      // Parallel background refresh of all categories
      const page = 1; // Default to first page for background refresh

      const [contactRes, trainerRes, enquiriesRes] = await Promise.all([
        apiClient.getContactSubmissions({ page }),
        apiClient.getTrainerMessages({ page }),
        apiClient.getEventEnquiries({ page })
      ]);

      setContactSubmissions(contactRes.submissions || []);
      setUnreadCounts(prev => ({ ...prev, contact: (contactRes.submissions || []).filter((s: any) => !s.isRead).length }));

      // Update Trainer Messages khusus
      const newUnreadStatusMap = trainerRes.unreadStatus || {};
      setUnreadStatusMap(newUnreadStatusMap);

      const updatedThreads = (trainerRes.threads || []).map((t: any) => ({
        ...t,
        unreadCount: newUnreadStatusMap[t.trainerId] || t.unreadCount || 0
      }));
      setMessageThreads(updatedThreads);
      setTrainerMessages(trainerRes.legacyMessages || []);
      setUnreadCounts(prev => ({ ...prev, trainerMessages: trainerRes.unreadCount || 0 }));

      setEventEnquiries(enquiriesRes.enquiries || []);
      setUnreadCounts(prev => ({ ...prev, eventEnquiries: (enquiriesRes.enquiries || []).filter((e: any) => !e.isRead).length }));

      console.log('✨ All categories synchronized in background');
    } catch (err) {
      console.error('Error in background synchronization:', err);
    }
  };

  const handleResolveContact = async (id: string) => {
    try {
      await apiClient.resolveContactSubmission(id);
      showToast('Contact submission marked as resolved', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Error resolving submission', 'error');
    }
  };

  const handleSendNotification = async () => {
    try {
      const data: any = {
        title: sendForm.title,
        message: sendForm.message,
        type: sendForm.type,
      };

      if (sendForm.targetType === 'user' && sendForm.userId) {
        data.userId = sendForm.userId;
      } else if (sendForm.targetType === 'role') {
        data.userRole = sendForm.userRole;
      }

      await apiClient.sendNotification(data);
      showToast('Notification sent successfully', 'success');
      setShowSendModal(false);
      setSendForm({
        title: '',
        message: '',
        type: 'INFO',
        targetType: 'global',
        userId: '',
        userRole: 'CLIENT',
      });
      if (activeTab === 'contact') {
        fetchData();
      }
    } catch (error: any) {
      showToast(error.message || 'Error sending notification', 'error');
    }
  };

  const filteredSubmissions = contactSubmissions.filter((sub) => {
    if (contactSearchTerm) {
      return (
        sub.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        sub.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
        sub.message.toLowerCase().includes(contactSearchTerm.toLowerCase())
      );
    }
    return true;
  });

  // Unified contact interface
  interface Contact {
    trainerId: string;
    trainer: {
      id: string;
      fullName: string;
      email: string;
    };
    lastMessage: string | null;
    lastMessageTime: string | null;
    lastMessageBy: string | null;
    unreadCount: number;
    hasMessages: boolean;
  }

  const [unreadStatusMap, setUnreadStatusMap] = useState<Record<string, number>>({});

  // ... (existing state)

  // Get all contacts (combine threads, legacy messages, and all trainers)
  const allContacts = React.useMemo(() => {
    const contactsMap = new Map<string, Contact>();

    // First, add all trainers from database (even without messages)
    allTrainers.forEach((trainer) => {
      // Use the global unread map to populate unread count even if thread is not in current page
      const globalUnread = unreadStatusMap[trainer.id] || 0;

      contactsMap.set(trainer.id, {
        trainerId: trainer.id,
        trainer: {
          id: trainer.id,
          fullName: trainer.fullName || '',
          email: trainer.email || '',
        },
        lastMessage: null,
        lastMessageTime: null,
        lastMessageBy: null,
        unreadCount: globalUnread, // Initialize with global count
        hasMessages: globalUnread > 0, // If they have unread messages, they have messages
      });
    });

    // Update with threads (overwrite trainers that have messages)
    messageThreads.forEach((thread) => {
      // Use logic to preserve global unread count if thread says 0 but legacy/global says 1
      const globalUnread = unreadStatusMap[thread.trainerId] || 0;

      contactsMap.set(thread.trainerId, {
        trainerId: thread.trainerId,
        trainer: thread.trainer,
        lastMessage: thread.lastMessage,
        lastMessageTime: thread.lastMessageTime,
        lastMessageBy: thread.lastMessageBy,
        unreadCount: Math.max(thread.unreadCount, globalUnread), // Use the higher count (Global wins if thread is stale/read but legacy exists)
        hasMessages: true,
      });
    });

    // Update with legacy messages (only if not already in threads)
    trainerMessages.forEach((msg) => {
      const existing = contactsMap.get(msg.trainerId);
      if (!existing || !existing.hasMessages) {
        contactsMap.set(msg.trainerId, {
          trainerId: msg.trainerId,
          trainer: msg.trainer,
          lastMessage: msg.lastMessage,
          lastMessageTime: msg.lastMessageTime,
          lastMessageBy: 'TRAINER',
          unreadCount: !msg.isRead ? 1 : 0,
          hasMessages: true,
        });
      }
    });

    return Array.from(contactsMap.values());
  }, [messageThreads, trainerMessages, allTrainers]);

  // Filter contacts by search term
  const filteredContacts = allContacts.filter((contact) => {
    if (trainerSearchTerm) {
      const trainer = contact.trainer;
      const searchLower = trainerSearchTerm.toLowerCase();
      return (
        (trainer?.fullName && trainer.fullName.toLowerCase().includes(searchLower)) ||
        (trainer?.email && trainer.email.toLowerCase().includes(searchLower)) ||
        (contact.lastMessage && typeof contact.lastMessage === 'string' && contact.lastMessage.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Sort contacts: those with messages first (by time), then those without messages (by name)
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    // If both have messages, sort by time
    if (a.hasMessages && b.hasMessages) {
      const timeA = a.lastMessageTime;
      const timeB = b.lastMessageTime;
      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    }
    // If only one has messages, prioritize it
    if (a.hasMessages && !b.hasMessages) return -1;
    if (!a.hasMessages && b.hasMessages) return 1;
    // If neither has messages, sort by name
    return (a.trainer.fullName || '').localeCompare(b.trainer.fullName || '');
  });

  // Handle contact selection
  const handleContactSelect = async (trainerId: string) => {
    setSelectedTrainerId(trainerId);
    setIsLoadingConversation(true);

    // Optimistically update UI immediately for instant feedback
    if (activeTab === 'trainer-messages') {
      setMessageThreads((prev: any) => prev.map((t: any) =>
        t.trainerId === trainerId ? { ...t, unreadCount: 0 } : t
      ));
      setTrainerMessages((prev: any) => prev.map((m: any) =>
        m.trainerId === trainerId ? { ...m, isRead: true } : m
      ));

      // Optimistically decrement total unread count if we are opening a thread with unread messages
      // We check if the thread was previously unread
      const threadWasUnread = messageThreads.some((t: any) => t.trainerId === trainerId && t.unreadCount > 0);
      if (threadWasUnread) {
        setUnreadCounts(prev => ({ ...prev, trainerMessages: Math.max(0, prev.trainerMessages - 1) }));
        // Also update the map optimistically
        setUnreadStatusMap(prev => ({
          ...prev,
          [trainerId]: 0
        }));
      }
    }

    try {
      // Backend automatically marks all trainer messages as read when fetching thread
      const response = await apiClient.getTrainerThread(trainerId);
      const foundContact = allContacts.find((c: any) => c.trainer.id === trainerId);
      const thread = response.thread || {
        id: '',
        trainerId,
        lastMessage: null,
        lastMessageTime: null,
        lastMessageBy: null,
        unreadCount: 0,
        trainer: response.trainer || foundContact?.trainer || { id: trainerId, fullName: 'Trainer', email: '' },
      };

      setSelectedThread(thread);
      setThreadMessages(response.messages || []);

      // Refresh in background to sync sidebar counts
      fetchData(true);

    } catch (error: any) {
      showToast(error.message || 'Error loading conversation', 'error');
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Handle sending reply
  const handleSendReply = async () => {
    if (!hasReplyContent || !selectedThread) return;

    try {
      setReplying(true);
      await apiClient.replyToTrainer(selectedThread.trainerId, replyMessage.trim(), replyAttachment || undefined);
      showToast('Reply sent successfully', 'success');
      setReplyMessage('');
      setReplyAttachment(null);

      // Refresh thread messages
      const response = await apiClient.getTrainerThread(selectedThread.trainerId);
      setThreadMessages(response.messages || []);
      fetchData();

      // Scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      showToast(error.message || 'Error sending reply', 'error');
    } finally {
      setReplying(false);
    }
  };

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    if (threadMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [threadMessages.length]);



  if (loading && contactSubmissions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Messages & Notifications</h1>
        <Button variant="primary" onClick={() => setShowSendModal(true)}>
          <Send size={20} className="mr-2" />
          Send Notification
        </Button>
      </div>

      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm">
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'contact'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <Mail size={18} />
          Contact Submissions
          {unreadCounts.contact > 0 && (
            <Badge variant="danger">{unreadCounts.contact}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('trainer-messages')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'trainer-messages'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <MessageSquare size={18} />
          Messages from Trainer
          {unreadCounts.trainerMessages > 0 && (
            <Badge variant="danger">
              {unreadCounts.trainerMessages > 9 ? '9+' : unreadCounts.trainerMessages}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('event-enquiries')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 relative ${activeTab === 'event-enquiries'
            ? 'bg-teal-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <MessageSquare size={18} />
          Enquiry about Event
          {unreadCounts.eventEnquiries > 0 && (
            <Badge variant="danger">{unreadCounts.eventEnquiries}</Badge>
          )}
        </button>
      </div>

      {/* Search and Filters */}
      {activeTab !== 'trainer-messages' && (
        <Card>
          <div className="p-4 flex items-center space-x-4">
            <div className="flex-1">
              <Input
                label="Search"
                value={activeTab === 'contact' ? contactSearchTerm : (activeTab === 'event-enquiries' ? enquirySearchTerm : trainerSearchTerm)}
                onChange={(e) => {
                  if (activeTab === 'contact') setContactSearchTerm(e.target.value);
                  else if (activeTab === 'event-enquiries') setEnquirySearchTerm(e.target.value);
                  else setTrainerSearchTerm(e.target.value);
                }}
                placeholder="Search messages..."
              />
            </div>
            {activeTab === 'event-enquiries' && (
              <div className="flex flex-col space-y-2 min-w-[200px]">
                <span className="text-sm font-medium text-gray-700">Status</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setTabFilters(prev => ({ ...prev, 'event-enquiries': 'all' }));
                      setTabPagination(prev => ({ ...prev, 'event-enquiries': 1 }));
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tabFilters['event-enquiries'] === 'all'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setTabFilters(prev => ({ ...prev, 'event-enquiries': 'unread' }));
                      setTabPagination(prev => ({ ...prev, 'event-enquiries': 1 }));
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tabFilters['event-enquiries'] === 'unread'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => {
                      setTabFilters(prev => ({ ...prev, 'event-enquiries': 'read' }));
                      setTabPagination(prev => ({ ...prev, 'event-enquiries': 1 }));
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${tabFilters['event-enquiries'] === 'read'
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Read
                  </button>
                </div>
              </div>
            )}

          </div>
        </Card>
      )}

      {/* Contact Submissions Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          {filteredSubmissions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Mail className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No contact submissions found</p>
              </div>
            </Card>
          ) : (
            filteredSubmissions.map((submission) => (
              <Card key={submission.id} className="hover:shadow-md transition-shadow">
                <div className={`p-6 ${!submission.isRead ? 'border-l-4 border-l-red-500 bg-red-50/10' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{submission.name}</h3>
                        <Badge variant="info">{submission.email}</Badge>
                        {!submission.isRead && (
                          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" title="New submission" />
                        )}
                      </div>
                      {submission.phone && (
                        <p className="text-sm text-gray-600 mb-2">Phone: {submission.phone}</p>
                      )}
                      <p className="text-gray-700 mb-3">{submission.message}</p>

                      {submission.attachmentUrl && (
                        <div className="mb-3 max-w-sm">
                          <ChatAttachmentPreview
                            attachmentUrl={submission.attachmentUrl}
                            attachmentName={submission.attachmentName}
                          />
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Received: {formatDate(submission.createdAt)}
                      </p>
                    </div>
                    {(!submission.isRead) ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveContact(submission.id)}
                        className="bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-100"
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Mark as Read
                      </Button>
                    ) : (
                      <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle size={12} className="mr-1" />
                        Read
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Trainer Messages Tab - WhatsApp Style */}
      {activeTab === 'trainer-messages' && (
        <div className="flex h-[calc(100vh-300px)] border border-gray-200 rounded-lg overflow-hidden bg-white">
          {/* Left Sidebar - Contact List */}
          <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
            {/* Search Bar & Filters */}
            <div className="p-4 border-b border-gray-200 bg-white space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={trainerSearchTerm}
                  onChange={(e) => setTrainerSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setTabFilters(prev => ({ ...prev, 'trainer-messages': 'all' }));
                    setTabPagination(prev => ({ ...prev, 'trainer-messages': 1 }));
                  }}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${tabFilters['trainer-messages'] === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => {
                    setTabFilters(prev => ({ ...prev, 'trainer-messages': 'unread' }));
                    setTabPagination(prev => ({ ...prev, 'trainer-messages': 1 }));
                  }}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${tabFilters['trainer-messages'] === 'unread'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => {
                    setTabFilters(prev => ({ ...prev, 'trainer-messages': 'read' }));
                    setTabPagination(prev => ({ ...prev, 'trainer-messages': 1 }));
                  }}
                  className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-md transition-colors ${tabFilters['trainer-messages'] === 'read'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Read
                </button>
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <LoadingSpinner size="lg" />
                </div>
              ) : sortedContacts.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600">No messages from trainers</p>
                </div>
              ) : (
                sortedContacts.map((contact) => {
                  const trainer = contact.trainer;
                  const lastMessage = contact.lastMessage;
                  const lastMessageTime = contact.lastMessageTime;
                  const unreadCount = contact.unreadCount;
                  const isSelected = selectedTrainerId === trainer.id;
                  const hasUnread = unreadCount > 0;

                  return (
                    <div
                      key={trainer.id}
                      onClick={() => handleContactSelect(trainer.id)}
                      className={`flex items-center p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-100 transition-colors ${isSelected ? 'bg-teal-50 border-l-4 border-l-teal-500' : ''
                        } ${hasUnread ? 'bg-blue-50' : ''}`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm mr-3">
                        {getInitials(trainer.fullName)}
                      </div>

                      {/* Contact Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {trainer.fullName}
                          </h3>
                          {lastMessageTime && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatMessageTime(lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <p className={`text-sm truncate flex-1 ${contact.hasMessages ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                            {lastMessage || 'No messages yet'}
                          </p>
                          {hasUnread && (
                            <div className="ml-2 flex-shrink-0 bg-green-500 rounded-full w-3 h-3 shadow-sm" title="Unread messages" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel - Conversation View */}
          <div className="hidden md:flex flex-col flex-1 bg-gray-100">
            {!selectedTrainerId ? (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageSquare className="mx-auto text-gray-400 mb-4" size={64} />
                  <p className="text-gray-600 text-lg">Select a contact to start conversation</p>
                </div>
              </div>
            ) : isLoadingConversation ? (
              <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : selectedThread ? (
              <>
                {/* Conversation Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm mr-3">
                      {getInitials(selectedThread.trainer?.fullName || 'T')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedThread.trainer?.fullName || 'Trainer'}
                      </h3>
                      <p className="text-sm text-gray-500">{selectedThread.trainer?.email}</p>
                    </div>
                  </div>
                  {selectedThread.unreadCount > 0 && (
                    <Badge className="bg-teal-600 text-white">
                      {selectedThread.unreadCount} unread
                    </Badge>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {threadMessages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="min-h-full flex flex-col justify-end gap-4">
                      {threadMessages.map((msg) => {
                        const isAdmin = msg.senderType === 'ADMIN';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                          >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isAdmin
                              ? 'bg-teal-600 text-white rounded-tr-sm'
                              : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                              }`}
                          >
                              {msg.message?.trim() && (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                              )}

                              <ChatAttachmentPreview
                                attachmentUrl={msg.attachmentUrl}
                                attachmentName={msg.attachmentName}
                                isOwn={isAdmin}
                              />

                              <p
                                className={`text-xs mt-1 ${isAdmin ? 'text-teal-100' : 'text-gray-500'
                                  }`}
                              >
                                {formatMessageTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1 space-y-2">
                      {replyAttachment && (
                        <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-100 animate-fade-in text-xs font-medium">
                          <FileText size={14} />
                          <span className="max-w-[150px] truncate">{replyAttachment.name}</span>
                          <button onClick={() => setReplyAttachment(null)} className="hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <div className="relative flex items-center">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => {
                            setReplyMessage(e.target.value);
                            // Auto-resize textarea
                            e.target.style.height = 'auto';
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (hasReplyContent && !replying) {
                                handleSendReply();
                              }
                            }
                          }}
                          placeholder="Type a message..."
                          rows={1}
                          disabled={replying}
                          className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                          style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
                        />
                        <label className="absolute right-3 cursor-pointer text-gray-400 hover:text-teal-600 transition-colors">
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
                          />
                          <Paperclip size={18} />
                        </label>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleSendReply}
                      disabled={!hasReplyContent || replying}
                      className="px-6 py-2 rounded-lg"
                    >
                      <Send size={18} className="mr-1" />
                      {replying ? 'Sending...' : 'Send'}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Mobile View - Show modal when contact selected */}
          {selectedTrainerId && (
            <div className="md:hidden fixed inset-0 z-50 bg-white flex flex-col">
              {/* Mobile Header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      setSelectedTrainerId(null);
                      setSelectedThread(null);
                      setThreadMessages([]);
                      setReplyMessage('');
                    }}
                    className="mr-3 text-gray-600"
                  >
                    ← Back
                  </button>
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-xs mr-2">
                    {selectedThread?.trainer && getInitials(selectedThread.trainer.fullName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedThread?.trainer?.fullName || 'Trainer'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Mobile Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {isLoadingConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : threadMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <div className="min-h-full flex flex-col justify-end gap-4">
                    {threadMessages.map((msg) => {
                      const isAdmin = msg.senderType === 'ADMIN';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${isAdmin
                              ? 'bg-teal-600 text-white rounded-tr-sm'
                              : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                              }`}
                          >
                            {msg.message?.trim() && (
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                            )}
                            <ChatAttachmentPreview
                              attachmentUrl={msg.attachmentUrl}
                              attachmentName={msg.attachmentName}
                              isOwn={isAdmin}
                            />
                            <p
                              className={`text-xs mt-1 ${isAdmin ? 'text-teal-100' : 'text-gray-500'
                                }`}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Mobile Input */}
              <div className="bg-white border-t border-gray-200 p-3">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 space-y-2">
                    {replyAttachment && (
                      <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-2 py-1 rounded-lg border border-teal-100 animate-fade-in text-[10px] font-medium">
                        <FileText size={12} />
                        <span className="max-w-[100px] truncate">{replyAttachment.name}</span>
                        <button onClick={() => setReplyAttachment(null)}>
                          <X size={12} />
                        </button>
                      </div>
                    )}
                    <div className="relative flex items-center">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => {
                          setReplyMessage(e.target.value);
                          // Auto-resize textarea
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                        }}
                        placeholder="Type a message..."
                        rows={1}
                        disabled={replying}
                        className="flex-1 pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                        style={{ minHeight: '40px', maxHeight: '100px', overflowY: 'auto' }}
                      />
                      <label className="absolute right-2 cursor-pointer text-gray-400">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)}
                        />
                        <Paperclip size={16} />
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleSendReply}
                    disabled={!hasReplyContent || replying}
                    size="sm"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}


      {/* Event Enquiries Tab */}
      {activeTab === 'event-enquiries' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <LoadingSpinner size="lg" />
            </div>
          ) : eventEnquiries.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No event enquiries found</p>
              </div>
            </Card>
          ) : (
            eventEnquiries
              .filter((enquiry) => {
                if (enquirySearchTerm) {
                  return (
                    enquiry.trainer.fullName.toLowerCase().includes(enquirySearchTerm.toLowerCase()) ||
                    enquiry.event.title.toLowerCase().includes(enquirySearchTerm.toLowerCase()) ||
                    enquiry.message.toLowerCase().includes(enquirySearchTerm.toLowerCase())
                  );
                }
                return true;
              })
              .map((enquiry) => (
                <Card key={enquiry.id} className={`hover:shadow-md transition-shadow ${enquiry.unreadCount > 0 || !enquiry.isRead ? 'border-l-4 border-l-green-500 bg-green-50' : ''
                  }`}>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {enquiry.subject || 'Event Enquiry'}
                          </h3>
                          {(enquiry.unreadCount > 0 || !enquiry.isRead) && (
                            <Badge className="bg-green-500 text-white shadow-sm">
                              {enquiry.unreadCount > 0 ? `${enquiry.unreadCount} new` : 'New'}
                            </Badge>
                          )}
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Event:</span> {enquiry.event.title}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Date:</span> {formatDate(enquiry.event.eventDate)}
                          </p>
                          {enquiry.event.venue && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Venue:</span> {enquiry.event.venue}
                            </p>
                          )}
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">From:</span> {enquiry.trainer.fullName} ({enquiry.trainer.email})
                          </p>
                          {enquiry.messages && enquiry.messages.length > 0 ? (
                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-2">
                              {enquiry.messages[0].message}
                            </p>
                          ) : (
                            <p className="text-gray-700 whitespace-pre-wrap line-clamp-2">
                              {enquiry.message}
                            </p>
                          )}
                          {enquiry._count && enquiry._count.messages > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {enquiry._count.messages} message{enquiry._count.messages > 1 ? 's' : ''} in conversation
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {enquiry.lastMessageTime ? `Last: ${formatDate(enquiry.lastMessageTime)}` : `Received: ${formatDate(enquiry.createdAt)}`}
                          {enquiry.lastMessageBy && ` • ${enquiry.lastMessageBy === 'TRAINER' ? 'From trainer' : 'From admin'}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const response = await apiClient.getEventEnquiryConversation(enquiry.id);
                              setSelectedEventEnquiry(response.enquiry);
                              setEventEnquiryMessages(response.messages || []);
                              setShowEventEnquiryModal(true);

                              // Mark as read if unread
                              if (enquiry.unreadCount > 0 || !enquiry.isRead) {
                                await apiClient.markEventEnquiryAsRead(enquiry.id);
                              }

                              fetchData(true);
                            } catch (error: any) {
                              showToast(error.message || 'Error loading conversation', 'error');
                            }
                          }}
                        >
                          <MessageSquare size={16} className="mr-1" />
                          Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <div className="p-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Send Notification Modal */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Notification"
      >
        <div className="space-y-4">
          <Input
            label="Title *"
            value={sendForm.title}
            onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
            placeholder="Notification title"
            required
          />

          <Textarea
            label="Message *"
            value={sendForm.message}
            onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
            rows={4}
            placeholder="Notification message"
            required
          />

          <Select
            label="Type *"
            value={sendForm.type}
            onChange={(e) => setSendForm({ ...sendForm, type: e.target.value as any })}
            options={[
              { value: 'INFO', label: 'Info' },
              { value: 'WARNING', label: 'Warning' },
              { value: 'SUCCESS', label: 'Success' },
              { value: 'ERROR', label: 'Error' },
            ]}
          />

          <Select
            label="Send To *"
            value={sendForm.targetType}
            onChange={(e) => setSendForm({ ...sendForm, targetType: e.target.value as any })}
            options={[
              { value: 'global', label: 'All Users (Global)' },
              { value: 'role', label: 'All Users by Role' },
              { value: 'user', label: 'Specific User' },
            ]}
          />

          {sendForm.targetType === 'role' && (
            <Select
              label="User Role *"
              value={sendForm.userRole}
              onChange={(e) => setSendForm({ ...sendForm, userRole: e.target.value as any })}
              options={[
                { value: 'CLIENT', label: 'All Clients' },
                { value: 'TRAINER', label: 'All Trainers' },
                { value: 'ADMIN', label: 'All Admins' },
              ]}
            />
          )}

          {sendForm.targetType === 'user' && (
            <SearchableTrainerDropdown
              trainers={allTrainers}
              value={sendForm.userId}
              onChange={(id) => setSendForm({ ...sendForm, userId: id })}
            />
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSendNotification}
              disabled={!sendForm.title || !sendForm.message}
            >
              <Send size={18} className="mr-2" />
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Thread Conversation Modal */}
      <Modal
        isOpen={showThreadModal}
        onClose={() => {
          setShowThreadModal(false);
          setSelectedThread(null);
          setThreadMessages([]);
          setReplyMessage('');
          fetchData();
        }}
        title={selectedThread ? `Conversation with ${selectedThread.trainer?.fullName || 'Trainer'}` : 'Conversation'}
        size="lg"
      >
        {selectedThread && (
          <div className="space-y-4">
            {/* Messages Display */}
            <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {threadMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No messages yet</p>
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isAdmin = msg.senderType === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${isAdmin
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {isAdmin ? 'You (Admin)' : 'Trainer'}
                          </span>
                        </div>
                        {msg.message?.trim() && (
                          <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        )}
                        <ChatAttachmentPreview
                          attachmentUrl={msg.attachmentUrl}
                          attachmentName={msg.attachmentName}
                          isOwn={isAdmin}
                        />
                        <p className={`text-xs mt-1 opacity-75`}>
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Form */}
            <div className="space-y-3">
              {replyAttachment && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-xs">
                  <FileText size={14} />
                  <span className="truncate flex-1">{replyAttachment.name}</span>
                  <button onClick={() => setReplyAttachment(null)}><X size={14} /></button>
                </div>
              )}
              <div className="relative">
                <Textarea
                  label="Reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  disabled={replying}
                />
                <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-teal-600">
                  <input type="file" className="hidden" onChange={(e) => setReplyAttachment(e.target.files?.[0] || null)} />
                  <Paperclip size={18} />
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowThreadModal(false);
                    setSelectedThread(null);
                    setThreadMessages([]);
                    setReplyMessage('');
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!hasReplyContent || !selectedThread) return;

                    try {
                      setReplying(true);
                      await apiClient.replyToTrainer(selectedThread.trainerId, replyMessage.trim(), replyAttachment || undefined);
                      showToast('Reply sent successfully', 'success');
                      setReplyMessage('');
                      setReplyAttachment(null);

                      // Refresh thread messages
                      const response = await apiClient.getTrainerThread(selectedThread.trainerId);
                      setThreadMessages(response.messages || []);
                      fetchData();
                    } catch (error: any) {
                      showToast(error.message || 'Error sending reply', 'error');
                    } finally {
                      setReplying(false);
                    }
                  }}
                  disabled={!hasReplyContent || replying}
                >
                  <Send size={18} className="mr-2" />
                  {replying ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Event Enquiry Conversation Modal */}
      <Modal
        isOpen={showEventEnquiryModal}
        onClose={() => {
          setShowEventEnquiryModal(false);
          setSelectedEventEnquiry(null);
          setEventEnquiryMessages([]);
          setEventEnquiryReply('');
          fetchData();
        }}
        title={selectedEventEnquiry ? `Event Enquiry: ${selectedEventEnquiry.event.title}` : 'Event Enquiry Conversation'}
        size="lg"
      >
        {selectedEventEnquiry && (
          <div className="space-y-4">
            {/* Event Info */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedEventEnquiry.event.title}</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Date:</span> {formatDate(selectedEventEnquiry.event.eventDate)}
                </div>
                {selectedEventEnquiry.event.venue && (
                  <div>
                    <span className="font-medium">Venue:</span> {selectedEventEnquiry.event.venue}
                  </div>
                )}
                <div className="col-span-2">
                  <span className="font-medium">From:</span> {selectedEventEnquiry.trainer.fullName} ({selectedEventEnquiry.trainer.email})
                </div>
              </div>
            </div>

            {/* Messages Display */}
            <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
              {eventEnquiryMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No messages yet</p>
                </div>
              ) : (
                eventEnquiryMessages.map((msg) => {
                  const isAdmin = msg.senderType === 'ADMIN';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${isAdmin
                          ? 'bg-teal-600 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium opacity-75">
                            {isAdmin ? 'You (Admin)' : 'Trainer'}
                          </span>
                        </div>
                        {msg.message?.trim() && (
                          <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                        )}
                        <ChatAttachmentPreview
                          attachmentUrl={msg.attachmentUrl}
                          attachmentName={msg.attachmentName}
                          isOwn={isAdmin}
                        />
                        <p className={`text-xs mt-1 opacity-75`}>
                          {formatDate(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Form */}
            <div className="space-y-3">
              {eventEnquiryReplyAttachment && (
                <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded text-xs">
                  <FileText size={14} />
                  <span className="truncate flex-1">{eventEnquiryReplyAttachment.name}</span>
                  <button onClick={() => setEventEnquiryReplyAttachment(null)}><X size={14} /></button>
                </div>
              )}
              <div className="relative">
                <Textarea
                  label="Reply"
                  value={eventEnquiryReply}
                  onChange={(e) => setEventEnquiryReply(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                  disabled={replyingToEnquiry}
                />
                <label className="absolute right-3 bottom-3 cursor-pointer text-gray-400 hover:text-teal-600">
                  <input type="file" className="hidden" onChange={(e) => setEventEnquiryReplyAttachment(e.target.files?.[0] || null)} />
                  <Paperclip size={18} />
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowEventEnquiryModal(false);
                    setSelectedEventEnquiry(null);
                    setEventEnquiryMessages([]);
                    setEventEnquiryReply('');
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!hasEventEnquiryReplyContent || !selectedEventEnquiry) return;

                    try {
                      setReplyingToEnquiry(true);
                      await apiClient.replyToEventEnquiry(selectedEventEnquiry.id, eventEnquiryReply.trim(), eventEnquiryReplyAttachment || undefined);
                      showToast('Reply sent successfully', 'success');
                      setEventEnquiryReply('');
                      setEventEnquiryReplyAttachment(null);

                      // Refresh conversation
                      const response = await apiClient.getEventEnquiryConversation(selectedEventEnquiry.id);
                      setEventEnquiryMessages(response.messages || []);
                      fetchData();
                    } catch (error: any) {
                      showToast(error.message || 'Error sending reply', 'error');
                    } finally {
                      setReplyingToEnquiry(false);
                    }
                  }}
                  disabled={!hasEventEnquiryReplyContent || replyingToEnquiry}
                >
                  <Send size={18} className="mr-2" />
                  {replyingToEnquiry ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
