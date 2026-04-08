import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setError('');

    // Basic email validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.forgotPassword(email);
      setMessage({
        type: 'success',
        text: response.message || 'If an account exists with this email, a password reset link has been sent.',
      });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to send password reset email',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-corporate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-corporate-500/10 rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/20 shadow-modern-2xl relative z-10 animate-scale-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-corporate-500 via-mustard-400 to-accent-600" />
        <CardHeader className="pt-8 pb-6 px-8 border-b border-corporate-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-corporate-500 hover:text-corporate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Abort Recovery
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black text-corporate-900 tracking-tight uppercase">Credential Recovery</h1>
            <p className="text-[10px] text-corporate-500 mt-2 font-bold uppercase tracking-[0.2em] leading-relaxed">
              Initialize secure password reset protocol via email verification
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {message && (
              <div
                className={`p-4 rounded-xl text-xs font-bold uppercase tracking-wider backdrop-blur-sm animate-fade-in ${message.type === 'success'
                  ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50/80 border border-red-200 text-red-700'
                  }`}
              >
                {message.text}
              </div>
            )}

            <Input
              label="Secure Identifier (Email)"
              type="email"
              placeholder="user@corporate.network"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              error={error}
              icon={<Mail className="w-5 h-5 text-corporate-400" />}
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              className="py-4 text-xs font-black uppercase tracking-[0.2em] shadow-modern-md hover:shadow-modern-lg transition-all mt-6"
            >
              Transmit Recovery Link
            </Button>

            <div className="pt-6 border-t border-corporate-100 mt-8 text-center">
              <p className="text-[10px] text-corporate-500 font-bold uppercase tracking-widest">
                Memory restored?{' '}
                <Link to="/login" className="text-accent-600 hover:text-accent-700 ml-1 transition-colors">
                  Return to Auth
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

