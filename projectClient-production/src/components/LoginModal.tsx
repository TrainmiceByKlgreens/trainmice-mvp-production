import { useState } from 'react';
import { auth } from '../lib/auth';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import trainMICELogo from '../TrainMICE logo.png';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onLoginSuccess?: () => void;
};

export function LoginModal({ isOpen, onClose, onSwitchToSignup, onLoginSuccess }: LoginModalProps) {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const { data, error } = await auth.signIn(formData.email, formData.password);

      // Check if login was blocked due to unverified email
      if ((data as any)?.requiresVerification) {
        throw new Error('Please verify your email address before logging in. Check your inbox for the verification email.');
      }

      if (error) throw new Error(error.message);

      if (data?.user) {
        setSubmitMessage({
          type: 'success',
          text: 'Login successful! Redirecting...',
        });

        setTimeout(() => {
          onClose();
          setFormData({ email: '', password: '' });
          setSubmitMessage(null);
          setShowForgotPassword(false);
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 1000);
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to log in',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await apiClient.forgotPassword(resetEmail);
      setSubmitMessage({
        type: 'success',
        text: response.message || 'If an account exists with this email, a password reset link has been sent.',
      });
      setResetEmail('');
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send password reset email',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setShowForgotPassword(false);
    setFormData({ email: '', password: '' });
    setResetEmail('');
    setSubmitMessage(null);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative animate-scaleIn max-w-[480px] w-full">
        {/* Red Circular Close Button - Top Left */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -left-3 w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:rotate-90 hover:scale-110 z-10 font-bold text-xl"
        >
          ✕
        </button>

        {/* Auth Card */}
        <div className="bg-white rounded-lg w-full shadow-2xl">
          {!showForgotPassword ? (
            // LOGIN VIEW
            <>
              {/* Header Section with Logo, Emoji, Title */}
              <div className="text-center pt-12 px-12 pb-6">
                <img src={trainMICELogo} alt="TrainMICE" className="h-12 mx-auto mb-2" />
                <div className="text-5xl mb-3">👋</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Welcome Back!</h2>
                <p className="text-gray-600 text-sm">Sign in to continue your learning journey</p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="px-12 pb-12 space-y-4">
                {/* Email Input with Emoji Icon */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Password Input with Emoji Icon */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-12 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Auth Options */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Message */}
                {submitMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isSubmitting ? 'Logging in...' : 'Login →'}
                </button>

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-yellow-600 hover:text-yellow-700 font-semibold"
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </>
          ) : (
            // FORGOT PASSWORD VIEW
            <>
              {/* Header Section with Logo, Emoji, Title */}
              <div className="text-center pt-12 px-12 pb-6">
                <img src={trainMICELogo} alt="TrainMICE" className="h-12 mx-auto mb-2" />
                <div className="text-5xl mb-3">🔑</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Reset Your Password</h2>
                <p className="text-gray-600 text-sm">Enter your email to receive a reset link</p>
              </div>

              {/* Form */}
              <form onSubmit={handleForgotPassword} className="px-12 pb-12 space-y-4">
                {/* Email Input with Emoji Icon */}
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      id="reset-email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                {/* Submit Message */}
                {submitMessage && (
                  <div
                    className={`p-3 rounded-lg text-sm ${submitMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                  >
                    {submitMessage.text}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isSubmitting ? 'Sending...' : 'Send Reset Link →'}
                </button>

                {/* Footer */}
                <div className="text-center text-sm text-gray-600 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                      setSubmitMessage(null);
                    }}
                    className="text-yellow-600 hover:text-yellow-700 font-semibold"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
