import { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '../hooks/useNavigate';

export const AdminSignUpPage: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.fullName) {
      setError('All fields are required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate that email is from klgreens.com domain only
    const emailDomain = formData.email.split('@')[1]?.toLowerCase();
    if (emailDomain !== 'klgreens.com') {
      setError('Only email addresses from klgreens.com domain can sign up as Admin');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (signUpError) {
        setError(signUpError.message || 'An error occurred during sign up');
        return;
      }

      setSuccess('Admin account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Logo */}
        <div className="hidden md:flex flex-col items-center justify-center text-center">
          <img
            src="/TrainmiceTwinleaf.png"
            alt="Trainmice"
            className="h-64 w-auto mb-6 object-contain"
          />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
          <p className="text-gray-600">Set up your administrator credentials</p>
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center justify-center text-center mb-6">
          <img
            src="/TrainmiceTwinleaf.png"
            alt="Trainmice"
            className="h-32 w-auto mb-4 object-contain"
          />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
          <p className="text-gray-600 text-sm">Set up your administrator credentials</p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full">
          <Card>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <Input
                label="Full Name"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                required
                placeholder="John Doe"
              />

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                placeholder="admin@klgreens.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Only email addresses from klgreens.com domain are allowed
              </p>

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                placeholder="Enter password (min 6 characters)"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                placeholder="Confirm your password"
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !!success}
              >
                {loading ? 'Creating Account...' : 'Create Admin Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-2">Already have an account?</p>
              <button
                onClick={() => navigate('/')}
                className="text-teal-600 hover:text-teal-700 font-medium text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
          </Card>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Trainmice Admin Dashboard &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
};
