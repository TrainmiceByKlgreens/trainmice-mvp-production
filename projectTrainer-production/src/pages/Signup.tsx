import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export function Signup() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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
    setApiError('');

    if (!validateForm()) return;

    setIsLoading(true);
    setApiError('');
    setSuccessMessage('');

    const result = await signUp(
      formData.email,
      formData.password,
      formData.fullName,
      'trainer'
    );

    setIsLoading(false);

    if (result.error) {
      setApiError(result.error.message || 'Failed to create account. Please try again.');
    } else if ((result as any).requiresVerification) {
      setSuccessMessage(
        (result as any).message || 'Verification email sent. Please verify your email to activate your account. Check your inbox for the verification link.'
      );
      // Clear form after showing message
      setTimeout(() => {
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });
        setSuccessMessage('');
      }, 5000);
    } else {
      navigate('/profile');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans py-20">
      {/* Premium Background Architecture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Gold Glows */}
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent-gold/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-gold-dark/5 rounded-full blur-[150px]" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <Card className="w-full max-w-[480px] bg-white border border-corporate-200 shadow-modern-2xl relative z-10 animate-scale-in rounded-[2.5rem] overflow-hidden">
        {/* Top Metallic Bar */}
        <div className="h-1.5 w-full bg-black shadow-lg shadow-black/10" />

        <CardHeader className="pt-10 pb-8 px-10 text-center border-b border-gray-50">
          <div className="w-20 h-20 bg-white rounded-[1.75rem] flex items-center justify-center mx-auto mb-8 shadow-modern-lg border border-corporate-100 overflow-hidden p-3 group hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="Trainmice Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight uppercase underline decoration-accent-gold decoration-4 underline-offset-8">Registration</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <p className="text-[11px] text-corporate-400 font-bold uppercase tracking-[0.25em]">Join Environment</p>
          </div>
        </CardHeader>

        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-7">
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider animate-fade-in flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
                {apiError}
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider animate-fade-in flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                {successMessage}
              </div>
            )}

            <div className="space-y-5">
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                error={errors.fullName}
                icon={<User className="w-5 h-5 text-corporate-300" />}
                className="rounded-xl border-corporate-200 bg-gray-50 focus:bg-white text-black transition-all shadow-sm"
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="user@corporate.network"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                icon={<Mail className="w-5 h-5 text-corporate-300" />}
                className="rounded-xl border-corporate-200 bg-gray-50 focus:bg-white text-black transition-all shadow-sm"
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
                icon={<Lock className="w-5 h-5 text-corporate-300" />}
                className="rounded-xl border-corporate-200 bg-gray-50 focus:bg-white text-black transition-all shadow-sm"
                helperText="Mix of uppercase, lowercase, numbers & 8+ characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                icon={<Lock className="w-5 h-5 text-corporate-300" />}
                className="rounded-xl border-corporate-200 bg-gray-50 focus:bg-white text-black transition-all shadow-sm"
              />
            </div>

            <Button
              type="submit"
              variant="gold-black"
              fullWidth
              isLoading={isLoading}
              className="py-4.5 text-xs font-black uppercase tracking-[0.25em] shadow-lg shadow-black/20 hover:shadow-xl mt-4 h-14"
            >
              Create Account
            </Button>

            <div className="pt-8 border-t border-gray-50 mt-4 text-center">
              <p className="text-[11px] text-corporate-400 font-bold uppercase tracking-widest leading-relaxed">
                Already registered?{' '}
                <Link to="/login" className="text-black hover:text-accent-gold ml-1 transition-colors font-black hover:underline underline-offset-4">
                  Access Portal
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
