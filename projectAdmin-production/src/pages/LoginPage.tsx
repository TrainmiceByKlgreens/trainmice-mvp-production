import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { signIn, forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error: signInError, data } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
      } else if (data) {
        // Dispatch event to notify all useAuth hooks to re-check auth state
        // This ensures the App component's useAuth hook updates its user state
        // Use setTimeout to ensure the token is saved and state is ready
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth:login-success'));
        }, 50);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const { error: forgotError } = await forgotPassword(email);
      if (forgotError) {
        setError(forgotError.message || 'Failed to send password reset email');
      } else {
        setSuccess('If an account exists with this email, a password reset link has been sent. Please check your inbox.');
        setShowForgotPassword(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Logo */}
        <div className="hidden md:flex flex-col items-center justify-center text-center">
          <img
            src="/TrainmiceTwinleaf.png"
            alt="Trainmice"
            className="h-64 w-auto object-contain"
          />
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex flex-col items-center justify-center text-center mb-6">
          <img
            src="/TrainmiceTwinleaf.png"
            alt="Trainmice"
            className="h-32 w-auto mb-4 object-contain"
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600 text-sm md:text-base">Sign in to manage your training platform</p>
          </div>
          <Card>
          <div className="p-8">
            {!showForgotPassword ? (
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
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  required
                  placeholder="admin@klgreens.com"
                />

                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  required
                  placeholder="Enter your password"
                />

                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
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

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Password</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setSuccess('');
                  }}
                  required
                  placeholder="admin@klgreens.com"
                />

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError('');
                      setSuccess('');
                    }}
                    disabled={forgotPasswordLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                  </Button>
                </div>
              </form>
            )}

            {!showForgotPassword && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">Don't have an admin account?</p>
                <a
                  href="/admin-signup"
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  Create Admin Account
                </a>
              </div>
            )}
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
