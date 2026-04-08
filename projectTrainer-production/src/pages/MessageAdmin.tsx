import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, MapPin, FileText, Paperclip, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api-client';

interface LocationState {
  eventId: string;
  courseTitle: string;
  location: string;
  date: string | null;
  time: string | null;
}

export function MessageAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const eventDetails = location.state as LocationState | null;

  const formatDate = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    const dateFormatted = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
    return timeStr ? `${dateFormatted} at ${timeStr}` : dateFormatted;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !eventDetails) return;

    setIsLoading(true);
    try {
      const subject = `Message from Trainer - Event ${eventDetails.eventId.slice(0, 8)}`;
      const fullMessage = `Event: ${eventDetails.courseTitle}\nVenue: ${eventDetails.location}\nDate: ${formatDate(
        eventDetails.date,
        eventDetails.time
      )}\n\nMessage:\n${message}`;

      await apiClient.sendMessageToAdmin({
        message: fullMessage,
        subject,
        relatedEntityType: 'event', // This ensures it shows up as an "Event Enquiry"
        relatedEntityId: eventDetails.eventId,
        attachment: attachment || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!eventDetails) {
    return (
      <div className="flex items-center justify-center min-h-96 font-sans">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No event details available</p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto animate-fade-in mb-20 px-4 md:px-0 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-slide-in-right">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-1 bg-accent-500 rounded-full" />
            <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.3em]">Direct Channel</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-corporate-900 tracking-tighter">
            Administrative <span className="text-accent-600">Inquiry</span>
          </h1>
          <p className="text-corporate-500 mt-2 text-lg font-medium tracking-tight">Constructing a context-aware message payload for rapid response.</p>
        </div>
        <Button
          onClick={() => navigate('/dashboard')}
          variant="outline"
          className="bg-white/80 backdrop-blur-md border-corporate-200 hover:bg-corporate-50 rounded-2xl shadow-sm h-12 px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-accent-600" />
          <span className="text-xs font-black uppercase tracking-widest text-corporate-600">Abort Injection</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden h-full border-none shadow-modern-lg bg-corporate-950 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <CardHeader className="bg-white/5 border-b border-white/10 relative z-10 py-8">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-accent-500 rounded-full" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em]">Context Metadata</h2>
              </div>
              <p className="text-[9px] text-corporate-400 font-bold uppercase tracking-[0.2em] mt-3 opacity-60">
                Included automatically in transmission
              </p>
            </CardHeader>
            <CardContent className="pt-10 pb-12 space-y-10 relative z-10">
              <div className="space-y-2 group">
                <p className="text-[9px] text-accent-400 font-black uppercase tracking-[0.3em] group-hover:text-accent-300 transition-colors">System Identifier</p>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 group-hover:bg-white/10 transition-colors">
                  <p className="text-xs font-mono text-corporate-200 truncate tracking-wider">{eventDetails?.eventId}</p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-accent-500/20 group-hover:border-accent-500/30 transition-all duration-500">
                  <FileText className="w-6 h-6 text-accent-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-corporate-400 font-black uppercase tracking-[0.3em] mb-1.5">Enrolled Course</p>
                  <p className="text-sm font-bold text-white leading-tight tracking-tight group-hover:text-accent-100 transition-colors">{eventDetails?.courseTitle}</p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/30 transition-all duration-500">
                  <MapPin className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-corporate-400 font-black uppercase tracking-[0.3em] mb-1.5">Operational Venue</p>
                  <p className="text-sm font-bold text-white leading-tight tracking-tight group-hover:text-emerald-100 transition-colors">{eventDetails?.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-5 group">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-110 group-hover:bg-amber-500/20 group-hover:border-amber-500/30 transition-all duration-500">
                  <Calendar className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] text-corporate-400 font-black uppercase tracking-[0.3em] mb-1.5">Temporal Data</p>
                  <p className="text-sm font-bold text-white leading-tight tracking-tight group-hover:text-amber-100 transition-colors">
                    {formatDate(eventDetails?.date ?? null, eventDetails?.time ?? null)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card className="h-full border-none shadow-modern-xl overflow-hidden rounded-3xl group/card">
            <CardHeader className="bg-white border-b border-corporate-50 py-8 px-10">
              <div className="flex items-center gap-4">
                <div className="w-2 h-8 bg-accent-600 rounded-full" />
                <div>
                  <h2 className="text-xl font-black text-corporate-900 tracking-tight uppercase text-sm tracking-[0.2em]">Inquiry Construction</h2>
                  <p className="text-xs text-corporate-500 font-bold mt-1 uppercase tracking-widest opacity-60">
                    Formulate your specific query for rapid administrative review
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="space-y-8">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent-500/20 to-corporate-500/20 rounded-[2.1rem] blur opacity-0 group-focus-within/card:opacity-100 transition duration-1000"></div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide a detailed description of your request. Include any specific requirements or issues you need decoded..."
                    rows={14}
                    disabled={success}
                    className="relative w-full px-8 py-8 border border-corporate-100 rounded-[2rem] bg-corporate-50/30 focus:bg-white focus:border-accent-500 focus:ring-4 focus:ring-accent-500/5 transition-all duration-500 resize-none font-medium text-corporate-800 disabled:bg-corporate-100 disabled:cursor-not-allowed text-base shadow-inner"
                  />
                  <div className="absolute right-8 bottom-8 flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="attachment-upload"
                        className="hidden"
                        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                      />
                      {attachment ? (
                        <div className="flex items-center gap-2 bg-accent-50 text-accent-700 px-3 py-1.5 rounded-full border border-accent-100 animate-fade-in text-[10px] font-black uppercase tracking-tighter">
                          <FileText className="w-3 h-3" />
                          <span className="max-w-[100px] truncate">{attachment.name}</span>
                          <button onClick={() => setAttachment(null)} className="hover:text-red-500 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="attachment-upload"
                          className="flex items-center gap-2 text-corporate-400 hover:text-accent-500 cursor-pointer transition-colors text-[10px] font-black uppercase tracking-widest"
                        >
                          <Paperclip className="w-4 h-4" />
                          ATTACH DOCUMENT
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-16 bg-corporate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent-500 transition-all duration-300"
                          style={{ width: `${Math.min((message.length / 500) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-corporate-400 uppercase tracking-[0.2em] group-focus-within/card:text-accent-500 transition-colors">
                        {message.length} BYTES
                      </span>
                    </div>
                  </div>
                </div>

                {success && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-8 flex items-center gap-6 animate-scale-in">
                    <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
                      <span className="text-white text-2xl font-bold">✓</span>
                    </div>
                    <div>
                      <p className="text-emerald-900 font-black text-lg uppercase tracking-tight">Transmission Initialized</p>
                      <p className="text-emerald-700 text-xs font-bold mt-1 uppercase tracking-[0.2em]">Redirecting to operations hub...</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-5 pt-8 border-t border-corporate-50">
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isLoading || success}
                    className={`flex-1 h-14 rounded-2xl shadow-modern shadow-accent-600/20 gap-3 group/btn relative overflow-hidden transition-all duration-500 ${!message.trim() ? 'grayscale' : 'hover:scale-[1.02] active:scale-95'}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-600 to-accent-400 opacity-0 group-hover/btn:opacity-10 dark:opacity-0" />
                    <Send className={`w-5 h-5 relative z-10 ${isLoading ? 'animate-bounce' : 'group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform duration-500'}`} />
                    <span className="text-sm font-black uppercase tracking-[0.3em] relative z-10">
                      {isLoading ? 'Synchronizing...' : 'Transmit Inquiry'}
                    </span>
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    disabled={isLoading}
                    variant="outline"
                    className="sm:w-40 h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border-corporate-200 hover:bg-corporate-50 transition-all duration-300"
                  >
                    Abort
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
