import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      setMessage({
        type: 'error',
        text: 'Invalid reset link. Please request a new password reset.',
      });
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm() || !token) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.resetPassword(token, formData.password);
      setMessage({
        type: 'success',
        text: response.message || 'Password has been reset successfully. You can now log in with your new password.',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reset password',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-corporate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-corporate-500/10 rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-white/20 shadow-modern-2xl relative z-10 animate-scale-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-corporate-500 via-emerald-400 to-accent-600" />
        <CardHeader className="pt-8 pb-6 px-8 border-b border-corporate-100">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-corporate-500 hover:text-corporate-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Gateway
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black text-corporate-900 tracking-tight uppercase">Regenerate Key</h1>
            <p className="text-[10px] text-corporate-500 mt-2 font-bold uppercase tracking-[0.2em]">
              Establish new access credentials
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

            <div className="relative">
              <label className="block text-[10px] font-black text-corporate-400 uppercase tracking-widest mb-2 px-1">
                New Cryptographic Key <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new key"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  className={`w-full pl-12 pr-12 py-3 bg-corporate-50 border rounded-2xl focus:outline-none focus:ring-2 text-sm font-bold text-corporate-700 transition-all duration-300 ${errors.password
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-corporate-100 focus:ring-accent-500/20 focus:border-accent-500 group-hover:border-corporate-300'
                    }`}
                />
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-corporate-400 group-focus-within:text-accent-500'}`} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-corporate-400 hover:text-corporate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 ml-1 text-[10px] font-bold text-red-600 uppercase tracking-wider">{errors.password}</p>
              )}
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-corporate-400 uppercase tracking-widest mb-2 px-1">
                Verify Cryptographic Key <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new key"
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData({ ...formData, confirmPassword: e.target.value });
                    if (errors.confirmPassword) {
                      setErrors({ ...errors, confirmPassword: '' });
                    }
                  }}
                  className={`w-full pl-12 pr-12 py-3 bg-corporate-50 border rounded-2xl focus:outline-none focus:ring-2 text-sm font-bold text-corporate-700 transition-all duration-300 ${errors.confirmPassword
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                    : 'border-corporate-100 focus:ring-accent-500/20 focus:border-accent-500 group-hover:border-corporate-300'
                    }`}
                />
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-corporate-400 group-focus-within:text-accent-500'}`} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-corporate-400 hover:text-corporate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 ml-1 text-[10px] font-bold text-red-600 uppercase tracking-wider">{errors.confirmPassword}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isSubmitting}
              disabled={!token}
              className="py-4 text-xs font-black uppercase tracking-[0.2em] shadow-modern-md hover:shadow-modern-lg transition-all mt-8"
            >
              Commit Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

