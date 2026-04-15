import { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, AlertCircle, CheckCircle2, MessageSquare, Clock, Download, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { apiClient } from '../../lib/api-client';
import { formatDate } from '../../utils/helpers';

interface Message {
  id: string;
  senderType: 'TRAINER' | 'ADMIN';
  senderId: string;
  message: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
}

const IMAGE_ATTACHMENT_PATTERN = /\.(png|jpe?g|gif|webp|bmp|svg)$/i;

const isImageAttachment = (attachmentUrl?: string | null, attachmentName?: string | null) => {
  if (!attachmentUrl) return false;
  if (attachmentUrl.startsWith('data:image/')) return true;
  return IMAGE_ATTACHMENT_PATTERN.test(attachmentName || attachmentUrl);
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

interface EventEnquirySummary {
  id: string;
}

interface MessageAdminModalProps {
  engagement: {
    id: string;
    type?: 'booking' | 'event';
    course?: { title: string };
    courses?: { title: string };
    eventDate?: string;
    requested_date?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export function MessageAdminModal({ engagement, onClose, onSuccess }: MessageAdminModalProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [eventEnquiryId, setEventEnquiryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isEventEngagement = engagement.type === 'event';
  const hasSendableContent = Boolean(message.trim() || attachment);

  const engagementTitle = engagement.type === 'event'
    ? engagement.course?.title || 'Event'
    : engagement.courses?.title || 'Course';

  useEffect(() => {
    fetchConversation();
  }, [engagement.id, isEventEngagement]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversation = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      if (isEventEngagement) {
        const enquiriesResponse = await apiClient.get<{ enquiries: EventEnquirySummary[] }>(
          `/event-enquiry-messages/trainer/enquiries?eventId=${engagement.id}`
        );

        const existingEnquiry = enquiriesResponse.enquiries?.[0];

        if (!existingEnquiry) {
          setEventEnquiryId(null);
          setMessages([]);
          return;
        }

        setEventEnquiryId(existingEnquiry.id);

        const response = await apiClient.getEventEnquiryConversation(existingEnquiry.id);
        setMessages(response.messages || []);
        return;
      }

      setEventEnquiryId(null);
      const response = await apiClient.getMessageThread();
      const allMessages: Message[] = response.messages || [];
      setMessages(
        allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    } catch (error) {
      console.error('Error fetching context conversation:', error);
      setError('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSendableContent || sending) return;

    setSending(true);
    setError(null);

    try {
      if (isEventEngagement && eventEnquiryId) {
        await apiClient.replyToEventEnquiry(eventEnquiryId, message.trim(), attachment || undefined);
      } else {
        await apiClient.sendMessageToAdmin({
          message: message.trim(),
          relatedEntityType: isEventEngagement ? 'event' : 'booking',
          relatedEntityId: engagement.id,
          attachment: attachment || undefined,
        });
      }

      setSuccess(true);
      setMessage('');
      setAttachment(null);
      await fetchConversation(true);
      
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const truncateFileName = (name: string, maxLen: number = 24) => {
    if (!name || name.length <= maxLen) return name;
    const parts = name.split('.');
    const ext = parts.pop();
    const rest = parts.join('.');
    if (rest.length <= maxLen - 8) return name;
    return rest.substring(0, maxLen - 8) + '...' + (ext ? `.${ext}` : '');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-corporate-950 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] border border-white/5 max-w-2xl w-full h-[85vh] flex flex-col overflow-hidden animate-slide-in-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-corporate-900 px-8 py-5 border-b border-white/5 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-corporate-950 border border-accent-gold/20 flex items-center justify-center text-accent-gold">
               <MessageSquare className="w-5 h-5 shadow-gold-glow" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">Message Administrator</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 bg-accent-gold rounded-full animate-pulse shadow-gold-glow" />
                <p className="text-[10px] text-accent-gold/80 font-black uppercase tracking-widest leading-none truncate max-w-[300px]">
                  {engagementTitle}
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 hover:bg-white/5 rounded-full transition-colors text-corporate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-black/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-4 border-accent-gold/10 border-t-accent-gold rounded-full animate-spin" />
              <p className="text-[10px] font-black text-corporate-500 uppercase tracking-widest">Hydrating conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-10">
              <div className="w-20 h-20 bg-corporate-900/50 rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                <Clock className="w-10 h-10 text-corporate-700" />
              </div>
              <h3 className="text-base font-black text-corporate-300 uppercase tracking-widest">Quiet Frequency</h3>
              <p className="text-xs text-corporate-500 mt-2 max-w-[280px] font-medium leading-relaxed italic">
                No active signals detected. Initiate the first sequence below to contact administration regarding this engagement.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((msg) => {
                const isTrainer = msg.senderType === 'TRAINER';
                return (
                  <div key={msg.id} className={`flex ${isTrainer ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`flex flex-col ${isTrainer ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      <div
                        className={`px-5 py-4 shadow-2xl break-words w-full ${isTrainer
                          ? 'bg-accent-gold rounded-2xl rounded-tr-none text-black font-medium shadow-gold-glow/5'
                          : 'bg-corporate-900 border border-white/5 rounded-2xl rounded-tl-none text-corporate-100'
                          }`}
                      >
                        {msg.message?.trim() && (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed tracking-tight break-words">{msg.message}</p>
                        )}

                        {msg.attachmentUrl && (() => {
                          const resolvedAttachmentUrl = apiClient.resolveImageUrl(msg.attachmentUrl || null);
                          if (!resolvedAttachmentUrl) return null;

                          const isImage = isImageAttachment(resolvedAttachmentUrl, msg.attachmentName);

                          if (isImage) {
                            return (
                              <div className={`mt-3 overflow-hidden rounded-2xl border ${isTrainer
                                ? 'border-black/20 bg-black/10'
                                : 'border-white/5 bg-corporate-950'
                                }`}>
                                <a
                                  href={resolvedAttachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={resolvedAttachmentUrl}
                                    alt={msg.attachmentName || 'Image attachment'}
                                    className="max-h-72 w-full object-cover"
                                  />
                                </a>
                                <div className="flex items-center justify-between gap-3 px-3 py-2">
                                  <p
                                    className={`min-w-0 flex-1 truncate text-[10px] font-black uppercase tracking-widest ${isTrainer ? 'text-black/60' : 'text-corporate-500'}`}
                                    title={msg.attachmentName || 'Image attachment'}
                                  >
                                    {truncateFileName(msg.attachmentName || 'Image attachment')}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => downloadAttachment(resolvedAttachmentUrl, msg.attachmentName || 'image')}
                                    className={`p-1.5 rounded-lg transition-all ${isTrainer
                                      ? 'hover:bg-black/10 text-black'
                                      : 'hover:bg-accent-gold/10 text-corporate-400 hover:text-accent-gold'
                                      }`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className={`mt-3 p-3 rounded-xl flex items-center gap-3 border ${isTrainer
                              ? 'bg-black/10 border-black/20'
                              : 'bg-corporate-950 border-white/5'
                              }`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isTrainer ? 'bg-black/20' : 'bg-corporate-900'}`}>
                                <FileText className={`w-4 h-4 ${isTrainer ? 'text-black' : 'text-accent-gold'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[10px] font-black uppercase tracking-widest truncate ${isTrainer ? 'text-black/60' : 'text-corporate-500'}`} title={msg.attachmentName || 'Attachment'}>
                                  {truncateFileName(msg.attachmentName || 'Attachment')}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => downloadAttachment(resolvedAttachmentUrl, msg.attachmentName || 'attachment')}
                                className={`p-1.5 rounded-lg transition-all ${isTrainer
                                  ? 'hover:bg-black/10 text-black'
                                  : 'hover:bg-accent-gold/10 text-corporate-400 hover:text-accent-gold'
                                  }`}
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                      <div className={`flex items-center gap-2 mt-2 px-1 ${isTrainer ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${isTrainer ? 'text-accent-gold' : 'text-corporate-500'}`}>
                          {isTrainer ? 'YOU' : 'ADMIN'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-corporate-700" />
                        <span className="text-[9px] font-bold text-corporate-500 tabular-nums uppercase">
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

        {/* Input Form */}
        <div className="p-8 border-t border-white/5 shrink-0 bg-corporate-900/50 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shadow-lg shadow-emerald-500/50" />
                <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Transmission Successful</span>
              </div>
            )}

            <div className="relative group overflow-visible">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Inquire administration about this sequence..."
                disabled={sending}
                className="w-full min-h-[100px] resize-none border-white/10 focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all duration-500 rounded-2xl p-5 text-sm font-medium bg-corporate-950 text-white"
              />
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="modal-attachment"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    {attachment ? (
                      <div className="flex items-center gap-2 bg-accent-gold/10 text-accent-gold px-3 py-1.5 rounded-xl border border-accent-gold/20 animate-fade-in text-[10px] font-black uppercase tracking-tighter shadow-gold-glow/5">
                        <FileText className="w-3.5 h-3.5" />
                        <span className="max-w-[120px] truncate">{attachment.name}</span>
                        <button onClick={(e) => { e.preventDefault(); setAttachment(null); }} className="hover:text-red-500 transition-colors ml-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="modal-attachment"
                        className="flex items-center gap-2 text-corporate-500 hover:text-accent-gold cursor-pointer transition-all text-[10px] font-black uppercase tracking-widest px-1 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-corporate-950 border border-white/5 flex items-center justify-center group-hover:border-accent-gold/30 transition-all">
                          <Paperclip className="w-3.5 h-3.5" />
                        </div>
                        Attach Assets
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  {error && (
                    <div className="mr-4 flex items-center gap-2 text-red-500 animate-fade-in">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">Transmission Failed</span>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    variant="gold-black"
                    disabled={sending || !hasSendableContent}
                    className="rounded-xl px-8 shadow-gold-glow/20 active:scale-95 h-11"
                  >
                    <div className="flex items-center gap-2">
                       <Send className={`w-3.5 h-3.5 ${sending ? 'animate-bounce' : ''}`} />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">{sending ? 'TRANSMITTING...' : 'SEND MESSAGE'}</span>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
