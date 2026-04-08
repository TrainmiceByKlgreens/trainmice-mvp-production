import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) return;

    setIsLoading(true);

    const { error } = await signIn(formData.email, formData.password);

    setIsLoading(false);

    if (error) {
      // Show specific error message if it mentions verification
      const errorMessage = error.message || 'Invalid email or password. Please try again.';
      if (errorMessage.includes('verify') || errorMessage.includes('Email not verified')) {
        setApiError('Please verify your email address before logging in. Check your inbox for the verification email.');
      } else {
        setApiError(errorMessage);
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'string' && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Premium Background Architecture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary Gold Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent-gold/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent-gold-dark/5 rounded-full blur-[150px]" />

        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      <Card className="w-full max-w-[440px] bg-white border border-corporate-200 shadow-modern-2xl relative z-10 animate-scale-in rounded-[2.5rem] overflow-hidden">
        {/* Top Metallic Bar */}
        <div className="h-1.5 w-full bg-black shadow-lg shadow-black/10" />

        <CardHeader className="pt-10 pb-8 px-10 text-center border-b border-gray-50">
          <div className="w-20 h-20 bg-white rounded-[1.75rem] flex items-center justify-center mx-auto mb-8 shadow-modern-lg border border-corporate-100 overflow-hidden p-3 group hover:scale-105 transition-transform duration-500">
            <img src="/logo.png" alt="Trainmice Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight uppercase underline decoration-accent-gold decoration-4 underline-offset-8">Login</h1>
          <div className="flex items-center justify-center gap-2 mt-4">
            <p className="text-[11px] text-corporate-400 font-bold uppercase tracking-[0.25em]">Trainer Portal</p>
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

            <div className="space-y-5">
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
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center group cursor-pointer">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleChange('rememberMe', e.target.checked)}
                    className="w-4.5 h-4.5 text-black bg-gray-50 border-corporate-200 rounded-lg focus:ring-black/20 transition-all cursor-pointer"
                  />
                </div>
                <span className="ml-3 text-[11px] font-black text-corporate-500 uppercase tracking-widest group-hover:text-black transition-colors">Remember Me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-[11px] text-black hover:text-accent-gold font-black uppercase tracking-widest transition-colors hover:underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              className="py-4.5 text-xs font-black uppercase tracking-[0.25em] shadow-lg shadow-black/20 hover:shadow-xl transition-all rounded-2xl bg-black hover:bg-black/90 text-accent-gold group h-14"
            >
              Login
            </Button>

            <div className="pt-8 border-t border-gray-50 mt-4 text-center">
              <p className="text-[11px] text-corporate-400 font-bold uppercase tracking-widest leading-relaxed">
                New to the platform?{' '}
                <Link to="/signup" className="text-black hover:text-accent-gold ml-1 transition-colors font-black hover:underline underline-offset-4">
                  Register Account
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>

  );
}
