import { useState } from 'react';
import { auth } from '../lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import trainMICELogo from '../TrainMICE logo.png';

type SignupModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;
};

export function SignupModal({ isOpen, onClose, onSwitchToLogin, onSignupSuccess }: SignupModalProps) {
  const [formData, setFormData] = useState({
    companyEmail: '',
    userName: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    position: '',
    companyName: '',
    companyAddress: '',
    city: '',
    state: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyEmail) {
      newErrors.companyEmail = 'Company email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.companyEmail)) {
      newErrors.companyEmail = 'Please enter a valid email address';
    } else {
      // Check for blocked domains (client-side validation)
      const emailDomain = formData.companyEmail.split('@')[1]?.toLowerCase();
      const blockedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'protonmail.com', 'zoho.com', 'me.com', 'aol.com', 'live.com'];
      if (emailDomain && blockedDomains.includes(emailDomain)) {
        newErrors.companyEmail = 'Please use your company email address. Personal email addresses are not allowed.';
      }
    }

    if (!formData.userName) {
      newErrors.userName = 'User name is required';
    }

    if (!formData.contactNumber) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[0-9+\-\s()]{8,}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Please enter a valid contact number';
    }

    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    if (!formData.companyName) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.companyAddress) {
      newErrors.companyAddress = 'Company address is required';
    }

    if (!formData.city) {
      newErrors.city = 'City is required';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Sign up the user - backend will create user and client profile
      const { data, error: signUpError } = await auth.signUp({
        email: formData.companyEmail,
        password: formData.password,
        fullName: formData.userName,
        userName: formData.userName,
        contactNumber: formData.contactNumber,
        position: formData.position,
        companyName: formData.companyName,
        companyAddress: formData.companyAddress,
        city: formData.city,
        state: formData.state,
        role: 'CLIENT',
      });

      if (signUpError) {
        // Handle specific error messages
        if (signUpError.message.includes('company email') || signUpError.message.includes('Company email')) {
          setErrors({ companyEmail: signUpError.message });
        }
        throw new Error(signUpError.message);
      }

      if (data?.user) {
        // Show verification message
        setSubmitMessage({
          type: 'success',
          text: data.requiresVerification
            ? 'Verification email sent. Please verify your email to activate your account. Check your inbox for the verification link.'
            : 'Account created successfully! You can now log in.',
        });

        // Keep modal open longer if verification is required
        setTimeout(() => {
          if (!data.requiresVerification) {
            onClose();
          }
          setFormData({
            companyEmail: '',
            userName: '',
            contactNumber: '',
            password: '',
            confirmPassword: '',
            position: '',
            companyName: '',
            companyAddress: '',
            city: '',
            state: '',
          });
          setErrors({});
          if (onSignupSuccess && !data.requiresVerification) {
            onSignupSuccess();
          }
        }, data.requiresVerification ? 5000 : 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to create account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative animate-scaleIn max-w-[700px] w-full">
        {/* Red Circular Close Button - Top Left */}
        <button
          onClick={onClose}
          className="absolute -top-3 -left-3 w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:rotate-90 hover:scale-110 z-10 font-bold text-xl"
        >
          ✕
        </button>

        {/* Auth Card */}
        <div className="bg-white rounded-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header Section with Logo, Emoji, Title */}
          <div className="text-center pt-12 px-12 pb-6">
            <img src={trainMICELogo} alt="TrainMICE" className="h-12 mx-auto mb-2" />
            <div className="text-5xl mb-3">🚀</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Create Your Account</h2>
            <p className="text-gray-600 text-sm">Start your learning journey today</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-12 pb-12 space-y-4">
            {/* Row 1: Email and Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="companyEmail"
                  required
                  value={formData.companyEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, companyEmail: e.target.value });
                    setErrors({ ...errors, companyEmail: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.companyEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="you@company.com"
                />
                {errors.companyEmail && (
                  <p className="text-red-500 text-xs mt-1">{errors.companyEmail}</p>
                )}
              </div>

              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="userName"
                  required
                  value={formData.userName}
                  onChange={(e) => {
                    setFormData({ ...formData, userName: e.target.value });
                    setErrors({ ...errors, userName: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.userName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="John Doe"
                />
                {errors.userName && (
                  <p className="text-red-500 text-xs mt-1">{errors.userName}</p>
                )}
              </div>
            </div>

            {/* Row 2: Contact and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, contactNumber: e.target.value });
                    setErrors({ ...errors, contactNumber: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="+60123456789"
                />
                {errors.contactNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>
                )}
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="position"
                  required
                  value={formData.position}
                  onChange={(e) => {
                    setFormData({ ...formData, position: e.target.value });
                    setErrors({ ...errors, position: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.position ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Manager, HR Executive"
                />
                {errors.position && (
                  <p className="text-red-500 text-xs mt-1">{errors.position}</p>
                )}
              </div>
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                required
                value={formData.companyName}
                onChange={(e) => {
                  setFormData({ ...formData, companyName: e.target.value });
                  setErrors({ ...errors, companyName: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.companyName ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Your Company Sdn Bhd"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
              )}
            </div>

            {/* Company Address */}
            <div>
              <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Company Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="companyAddress"
                required
                value={formData.companyAddress}
                onChange={(e) => {
                  setFormData({ ...formData, companyAddress: e.target.value });
                  setErrors({ ...errors, companyAddress: '' });
                }}
                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.companyAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter full company address"
                rows={2}
              />
              {errors.companyAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.companyAddress}</p>
              )}
            </div>

            {/* Row 3: City and State */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    setErrors({ ...errors, city: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Kuala Lumpur"
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  id="state"
                  required
                  value={formData.state}
                  onChange={(e) => {
                    setFormData({ ...formData, state: e.target.value });
                    setErrors({ ...errors, state: '' });
                  }}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select state</option>
                  <option value="Johor">Johor</option>
                  <option value="Kedah">Kedah</option>
                  <option value="Kelantan">Kelantan</option>
                  <option value="Melaka">Melaka</option>
                  <option value="Negeri Sembilan">Negeri Sembilan</option>
                  <option value="Pahang">Pahang</option>
                  <option value="Penang">Penang</option>
                  <option value="Perak">Perak</option>
                  <option value="Perlis">Perlis</option>
                  <option value="Sabah">Sabah</option>
                  <option value="Sarawak">Sarawak</option>
                  <option value="Selangor">Selangor</option>
                  <option value="Terengganu">Terengganu</option>
                  <option value="Kuala Lumpur">Kuala Lumpur</option>
                  <option value="Labuan">Labuan</option>
                  <option value="Putrajaya">Putrajaya</option>
                </select>
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Row 4: Password and Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      setErrors({ ...errors, password: '' });
                    }}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setErrors({ ...errors, confirmPassword: '' });
                    }}
                    className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xl"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
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
              {isSubmitting ? 'Creating Account...' : 'Sign Up →'}
            </button>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-yellow-600 hover:text-yellow-700 font-semibold"
              >
                Log In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
