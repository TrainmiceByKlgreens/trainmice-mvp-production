import { useState, useEffect, useRef } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { apiClient } from '../../lib/api-client';
import { formatDate } from '../../utils/helpers';

interface EventEnquiryMessage {
  id: string;
  senderType: 'TRAINER' | 'ADMIN';
  senderId: string;
  message: string;
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
  trainer: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface EventChatModalProps {
  event: {
    id: string;
    eventDate: string;
    course: {
      id: string;
      title: string;
    };
    venue: string | null;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function EventChatModal({ event, onClose, onSuccess }: EventChatModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState<EventEnquiry | null>(null);
  const [messages, setMessages] = useState<EventEnquiryMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversation();
  }, [event.id]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async () => {
    try {
      setLoading(true);
      // First, check if enquiry exists for this event
      const enquiriesResponse = await apiClient.get<{ enquiries: EventEnquiry[] }>(
        `/event-enquiry-messages/trainer/enquiries?eventId=${event.id}`
      );

      let enquiryId: string | null = null;
      if (enquiriesResponse.enquiries && enquiriesResponse.enquiries.length > 0) {
        enquiryId = enquiriesResponse.enquiries[0].id;
        // Fetch conversation
        const response = await apiClient.getEventEnquiryConversation(enquiryId);
        setEnquiry(response.enquiry);
        setMessages(response.messages || []);
      } else {
        // No enquiry exists yet - user can create one by sending a message
        setEnquiry(null);
        setMessages([]);
      }
    } catch (error: any) {
      console.error('Error fetching conversation:', error);
      // If enquiry doesn't exist, that's okay - user can start a new conversation
      setEnquiry(null);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    if (!enquiry) {
      // Create enquiry first
      try {
        setSending(true);
        const createResponse = await apiClient.post<{ enquiry?: EventEnquiry; isEventEnquiry?: boolean; message?: string }>(
          '/trainer/messages',
          {
            message: message.trim(),
            relatedEntityType: 'event',
            relatedEntityId: event.id,
            subject: `Enquiry about ${event.course.title}`,
          }
        );

        if (createResponse.isEventEnquiry) {
          // Refresh to get the created enquiry and messages
          await fetchConversation();
        }
        setMessage('');
        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error('Error sending message:', error);
        alert(error.message || 'Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    } else {
      // Send reply to existing enquiry
      try {
        setSending(true);
        await apiClient.replyToEventEnquiry(enquiry.id, message.trim());
        setMessage('');
        await fetchConversation(); // Refresh messages
        if (onSuccess) onSuccess();
      } catch (error: any) {
        console.error('Error sending message:', error);
        alert(error.message || 'Failed to send message. Please try again.');
      } finally {
        setSending(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 border-b border-corporate-900 bg-corporate-950 text-white relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-accent-500/10 rounded-full blur-3xl -mr-24 -mt-24" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-accent-500/20 flex items-center justify-center border border-accent-500/30 shadow-lg shadow-accent-500/20">
                <MessageSquare className="w-6 h-6 text-accent-400" />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight leading-none mb-1.5">{event.course.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-2 py-0.5 bg-accent-500/10 rounded-full border border-accent-500/20">
                    <span className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    <p className="text-[9px] text-accent-300 font-black uppercase tracking-widest">Protocol: Active</p>
                  </div>
                  <p className="text-[10px] text-corporate-400 font-bold uppercase tracking-widest opacity-80">
                    {formatDate(event.eventDate)} {event.venue && `• ${event.venue}`}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors p-2.5 hover:bg-white/10 rounded-2xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-corporate-50/20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-10">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-corporate-100">
                <MessageSquare className="w-8 h-8 text-corporate-200" />
              </div>
              <h3 className="text-sm font-black text-corporate-900 uppercase tracking-[0.2em]">Buffer Empty</h3>
              <p className="text-xs text-corporate-500 mt-2 font-medium leading-relaxed">No transmission packets detected in this local context channel.</p>
            </div>
          ) : (
            <div className="space-y-8 pb-4">
              {messages.map((msg) => {
                const isTrainer = msg.senderType === 'TRAINER';
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isTrainer ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`flex flex-col ${isTrainer ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div
                        className={`px-5 py-4 shadow-sm h-auto transition-all duration-300 ${isTrainer
                          ? 'bg-accent-600 rounded-3xl rounded-tr-none text-white'
                          : 'bg-white border border-corporate-100 rounded-3xl rounded-tl-none text-corporate-800'
                          }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium tracking-tight">
                          {msg.message}
                        </p>
                      </div>
                      <div className={`flex items-center gap-2.5 mt-2.5 px-1 ${isTrainer ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[9px] font-black text-corporate-400 uppercase tracking-widest">
                          {isTrainer ? 'TRAINER NODE' : 'ADMIN CONTROL'}
                        </span>
                        <div className={`w-1 h-1 rounded-full ${isTrainer ? 'bg-accent-400' : 'bg-corporate-300'}`} />
                        <span className="text-[9px] font-bold text-corporate-300 tabular-nums lowercase">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-corporate-100 bg-white relative">
          <div className="flex gap-4">
            <div className="flex-1 relative group">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type transmission..."
                rows={2}
                disabled={sending}
                className="w-full resize-none border-corporate-100 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/5 transition-all duration-300 rounded-[1.5rem] p-5 text-sm font-medium bg-corporate-50/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-4 bottom-4">
                <span className="text-[9px] font-black text-corporate-300 uppercase tracking-widest">
                  {message.length} BYTES
                </span>
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sending}
              className="self-end w-14 h-14 rounded-2xl bg-corporate-900 hover:bg-accent-600 text-white shadow-modern shadow-corporate-900/10 p-0"
            >
              <Send className={`w-5 h-5 ${sending ? 'animate-bounce' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


