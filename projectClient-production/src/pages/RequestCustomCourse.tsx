import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Mail, BookOpen, MessageSquare, Briefcase, Info, X, MapPin, CalendarDays, Hash, Monitor, Users, Globe } from 'lucide-react';
import { apiClient } from '../lib/api-client';
import { useCourseRequestAuth } from '../hooks/useCourseRequestAuth';
import { LoginModal } from '../components/LoginModal';
import { SignupModal } from '../components/SignupModal';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
  'Hospitality',
  'Construction',
  'Transportation',
  'Real Estate',
  'Professional Services',
  'Media & Entertainment',
  'Other',
];

export function RequestCustomCourse() {
  const navigate = useNavigate();

  // custom auth hook (handles mock & real auth)
  const { user, isLoading: isLoadingAuth, companyData } = useCourseRequestAuth();

  // Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [showHelpMessage, setShowHelpMessage] = useState(true);

  // Tab and Step Management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (currentStep === 5) {
      setIsUnlocked(true);
    }
  }, [currentStep]);

  const [courseData, setCourseData] = useState({
    courseName: '',
    reason: '',
    industry: '',
    companyName: '',
    contactPerson: '',
    email: '',
    trainingType: 'In-House' as 'In-House' | 'Public',
    trainingMode: 'Physical' as 'Physical' | 'Online' | 'Hybrid',
    proposedVenue: '',
    numberOfTrainingDays: '',
    proposedTrainingDate: '',
  });


  const [courseErrors, setCourseErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Sync hook data to local form state when available
  useEffect(() => {
    if (companyData) {
      setCourseData((prev) => ({
        ...prev,
        contactPerson: companyData.contactPerson,
        email: companyData.email,
        companyName: companyData.companyName,
      }));
    }
  }, [companyData]);

  const handleAuthSuccess = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(false);
  };



  const validateCourseRequest = () => {
    const errors: Record<string, string> = {};

    if (!courseData.courseName.trim()) {
      errors.courseName = 'Course name is required';
    }

    if (!courseData.reason.trim()) {
      errors.reason = 'Please explain why you need this course';
    }

    if (!courseData.industry) {
      errors.industry = 'Industry is required';
    }

    if (!courseData.companyName.trim()) {
      errors.companyName = 'Company name is required';
    }

    if (!courseData.contactPerson.trim()) {
      errors.contactPerson = 'Contact person is required';
    }

    if (!courseData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(courseData.email)) {
      errors.email = 'Invalid email format';
    }

    setCourseErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCourseRequest()) {
      return;
    }

    if (!user) {
      setCourseErrors({ submit: 'You must be logged in to submit a request' });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await apiClient.createCustomRequest({
        clientId: user.id,
        courseName: courseData.courseName,
        reason: courseData.reason,
        industry: courseData.industry,
        companyName: courseData.companyName,
        contactPerson: courseData.contactPerson,
        email: courseData.email,
        preferredMode: courseData.trainingType.toUpperCase().replace('-', '_') as any,
        trainingMode: courseData.trainingMode.toUpperCase(),
        proposedVenue: courseData.proposedVenue || undefined,
        numberOfTrainingDays: courseData.numberOfTrainingDays ? parseInt(courseData.numberOfTrainingDays) : undefined,
        proposedTrainingDate: courseData.proposedTrainingDate || undefined,
      });

      setSubmitStatus('success');
      setCourseData({
        courseName: '',
        reason: '',
        industry: '',
        companyName: '',
        contactPerson: courseData.contactPerson,
        email: courseData.email,
        trainingType: 'In-House',
        trainingMode: 'Physical',
        proposedVenue: '',
        numberOfTrainingDays: '',
        proposedTrainingDate: '',
      });

      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      console.error('Error submitting course request:', error);
      setSubmitStatus('error');
      setCourseErrors({ submit: error.message || 'Failed to submit request' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">

          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl shadow-lg mb-4">
            <BookOpen className="w-8 h-8 text-gray-900" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Request Custom Course</h1>
          <p className="text-lg text-gray-600">Tailor-made training solutions for your organization</p>
        </div>



        {/* Auth Modals */}
        <LoginModal
          isOpen={isLoginOpen && !user}
          onClose={() => setIsLoginOpen(false)}
          onSwitchToSignup={() => {
            setIsLoginOpen(false);
            setIsSignupOpen(true);
          }}
          onLoginSuccess={handleAuthSuccess}
        />

        <SignupModal
          isOpen={isSignupOpen && !user}
          onClose={() => setIsSignupOpen(false)}
          onSwitchToLogin={() => {
            setIsSignupOpen(false);
            setIsLoginOpen(true);
          }}
          onSignupSuccess={handleAuthSuccess}
        />

        {/* Gated Content Card - Shown when unauthenticated */}
        {!user && !isLoadingAuth && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20 pointer-events-auto">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Login Required</h2>
              <p className="text-gray-600 mb-8">
                Please log in or create an account to request a custom course tailored to your needs.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full py-3 px-4 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Log In
                </button>
                <button
                  onClick={() => setIsSignupOpen(true)}
                  className="w-full py-3 px-4 bg-white text-gray-700 font-bold rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Blurred when unauthenticated */}
        <div className={!user ? 'filter blur-sm pointer-events-none select-none' : ''}>
          {/* Always render content (even if unauthenticated) so it can be blurred */}
          <>
            {/* Split Layout - Current UI */}

            <div className="max-w-4xl mx-auto">
              {/* User Guidance Banner */}
              {isUnlocked && (
                <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start justify-between animate-fade-in relative z-20">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 bg-blue-100 rounded-full">
                      <Info className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 mb-1">Navigation Tip</h4>
                      <p className="text-sm text-blue-700">
                        You can click on any step number to jump between sections, or use the "Edit" buttons on the review page.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              <div className="mb-12">
                <div className="flex items-center justify-center">
                  {[1, 2, 3, 4, 5].map((step, index) => (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (isUnlocked) setCurrentStep(step as 1 | 2 | 3 | 4 | 5);
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${currentStep === step
                            ? 'bg-yellow-400 text-gray-900 shadow-lg scale-110 ring-4 ring-yellow-100'
                            : currentStep > step
                              ? `bg-green-500 text-white shadow-sm ${isUnlocked ? 'hover:bg-green-600 hover:shadow-md cursor-pointer' : 'cursor-default'}`
                              : `bg-gray-100 text-gray-400 ${isUnlocked ? 'hover:bg-gray-200 hover:text-gray-600 cursor-pointer' : 'cursor-default'}`
                            }`}
                        >
                          {currentStep > step ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            step
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (isUnlocked) setCurrentStep(step as 1 | 2 | 3 | 4 | 5);
                          }}
                          className={`mt-2 text-sm font-medium transition-colors ${currentStep === step
                            ? 'text-gray-900'
                            : isUnlocked
                              ? 'text-gray-500 hover:text-gray-700 cursor-pointer'
                              : 'text-gray-400 cursor-default'
                            }`}
                        >
                          {step === 1 && 'Training Type'}
                          {step === 2 && 'Training Mode'}
                          {step === 3 && 'Company'}
                          {step === 4 && 'Course Info'}
                          {step === 5 && 'Review'}
                        </button>
                      </div>
                      {index < 4 && (
                        <div
                          className={`w-16 h-1 mx-2 transition-all duration-500 ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Training Type */}
              {currentStep === 1 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Choose Your Training Type</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* In-House Card */}
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, trainingType: 'In-House' })}
                      className={`p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${courseData.trainingType === 'In-House'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${courseData.trainingType === 'In-House' ? 'bg-yellow-400' : 'bg-yellow-100'
                          }`}>
                          <Building2 className={`w-10 h-10 ${courseData.trainingType === 'In-House' ? 'text-gray-900' : 'text-yellow-600'
                            }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">In-House</h3>
                        <p className="text-sm text-gray-600">Customized training at your location</p>
                      </div>
                    </button>

                    {/* Public Card */}
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, trainingType: 'Public' })}
                      className={`p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${courseData.trainingType === 'Public'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${courseData.trainingType === 'Public' ? 'bg-yellow-400' : 'bg-yellow-100'
                          }`}>
                          <Users className={`w-10 h-10 ${courseData.trainingType === 'Public' ? 'text-gray-900' : 'text-yellow-600'
                            }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Public</h3>
                        <p className="text-sm text-gray-600">Join scheduled public sessions</p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!courseData.trainingType}
                      className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Training Mode */}
              {currentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Choose Your Training Mode</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Physical */}
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, trainingMode: 'Physical' })}
                      className={`p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${courseData.trainingMode === 'Physical'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${courseData.trainingMode === 'Physical' ? 'bg-yellow-400' : 'bg-yellow-100'
                          }`}>
                          <Building2 className={`w-10 h-10 ${courseData.trainingMode === 'Physical' ? 'text-gray-900' : 'text-yellow-600'
                            }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Physical</h3>
                        <p className="text-sm text-gray-600">Face-to-face classroom training</p>
                      </div>
                    </button>

                    {/* Online */}
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, trainingMode: 'Online' })}
                      className={`p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${courseData.trainingMode === 'Online'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${courseData.trainingMode === 'Online' ? 'bg-yellow-400' : 'bg-yellow-100'
                          }`}>
                          <Monitor className={`w-10 h-10 ${courseData.trainingMode === 'Online' ? 'text-gray-900' : 'text-yellow-600'
                            }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Online</h3>
                        <p className="text-sm text-gray-600">Remote virtual learning</p>
                      </div>
                    </button>

                    {/* Hybrid */}
                    <button
                      type="button"
                      onClick={() => setCourseData({ ...courseData, trainingMode: 'Hybrid' })}
                      className={`p-8 rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-xl ${courseData.trainingMode === 'Hybrid'
                        ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-yellow-200'
                        }`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-4 ${courseData.trainingMode === 'Hybrid' ? 'bg-yellow-400' : 'bg-yellow-100'
                          }`}>
                          <Globe className={`w-10 h-10 ${courseData.trainingMode === 'Hybrid' ? 'text-gray-900' : 'text-yellow-600'
                            }`} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hybrid</h3>
                        <p className="text-sm text-gray-600">Mix of physical and online</p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setCurrentStep(1)}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setCurrentStep(3)}
                      disabled={!courseData.trainingMode}
                      className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Company Details */}
              {currentStep === 3 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Company Details</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Building2 className="inline w-4 h-4 mr-1" />
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courseData.companyName}
                        onChange={(e) => setCourseData({ ...courseData, companyName: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.companyName ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white`}
                        placeholder="Your Company Sdn Bhd"
                      />
                      {courseErrors.companyName && <p className="mt-1 text-sm text-red-500">{courseErrors.companyName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="inline w-4 h-4 mr-1" />
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courseData.contactPerson}
                        onChange={(e) => setCourseData({ ...courseData, contactPerson: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.contactPerson ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white`}
                        placeholder="John Doe"
                      />
                      {courseErrors.contactPerson && <p className="mt-1 text-sm text-red-500">{courseErrors.contactPerson}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Mail className="inline w-4 h-4 mr-1" />
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={courseData.email}
                        onChange={(e) => setCourseData({ ...courseData, email: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.email ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white`}
                        placeholder="contact@company.com"
                      />
                      {courseErrors.email && <p className="mt-1 text-sm text-red-500">{courseErrors.email}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button type="button" onClick={() => setCurrentStep(2)}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setCurrentStep(4)}
                      disabled={!courseData.companyName || !courseData.contactPerson || !courseData.email}
                      className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Course Information */}
              {currentStep === 4 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Course Information</h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <BookOpen className="inline w-4 h-4 mr-1" />
                        Topic Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={courseData.courseName}
                        onChange={(e) => setCourseData({ ...courseData, courseName: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.courseName ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white`}
                        placeholder="e.g., Advanced Leadership Training"
                      />
                      {courseErrors.courseName && <p className="mt-1 text-sm text-red-500">{courseErrors.courseName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare className="inline w-4 h-4 mr-1" />
                        Expected Learning Outcomes <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={courseData.reason}
                        onChange={(e) => setCourseData({ ...courseData, reason: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.reason ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white resize-none`}
                        placeholder="Tell us about your training needs and objectives..."
                      />
                      {courseErrors.reason && <p className="mt-1 text-sm text-red-500">{courseErrors.reason}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Briefcase className="inline w-4 h-4 mr-1" />
                        Industry <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={courseData.industry}
                        onChange={(e) => setCourseData({ ...courseData, industry: e.target.value })}
                        className={`w-full px-4 py-3 border ${courseErrors.industry ? 'border-red-500' : 'border-gray-300'
                          } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white`}
                      >
                        <option value="">Select your industry</option>
                        {INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry}>
                            {industry}
                          </option>
                        ))}
                      </select>
                      {courseErrors.industry && <p className="mt-1 text-sm text-red-500">{courseErrors.industry}</p>}
                    </div>

                    {/* Proposed Training Venue */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Proposed Training Venue
                      </label>
                      <input
                        type="text"
                        value={courseData.proposedVenue}
                        onChange={(e) => setCourseData({ ...courseData, proposedVenue: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                        placeholder="e.g., Company HQ, Level 5 Training Room"
                      />
                    </div>

                    {/* Number of Training Days */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Hash className="inline w-4 h-4 mr-1" />
                        Number of Training Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={courseData.numberOfTrainingDays}
                        onChange={(e) => setCourseData({ ...courseData, numberOfTrainingDays: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                        placeholder="e.g., 2"
                      />
                    </div>

                    {/* Proposed Training Date */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <CalendarDays className="inline w-4 h-4 mr-1" />
                        Proposed Training Date
                      </label>
                      <input
                        type="date"
                        value={courseData.proposedTrainingDate}
                        onChange={(e) => setCourseData({ ...courseData, proposedTrainingDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button type="button" onClick={() => setCurrentStep(3)}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all">
                      ← Back
                    </button>
                    <button type="button" onClick={() => setCurrentStep(5)}
                      disabled={!courseData.courseName || !courseData.reason || !courseData.industry}
                      className="px-8 py-3 bg-yellow-400 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition-all shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed">
                      Continue →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">Review Your Request</h2>

                  <div className="space-y-6 mb-8">
                    {/* Training Type */}
                    <div className="p-4 bg-gray-50 rounded-lg group hover:bg-yellow-50/50 transition-colors border border-transparent hover:border-yellow-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Training Type</h3>
                        <button type="button" onClick={() => setCurrentStep(1)}
                          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          Edit
                        </button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{courseData.trainingType}</p>
                    </div>

                    {/* Training Mode */}
                    <div className="p-4 bg-gray-50 rounded-lg group hover:bg-yellow-50/50 transition-colors border border-transparent hover:border-yellow-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Training Mode</h3>
                        <button type="button" onClick={() => setCurrentStep(2)}
                          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          Edit
                        </button>
                      </div>
                      <p className="text-lg font-bold text-gray-900">{courseData.trainingMode}</p>
                    </div>

                    {/* Company Details */}
                    <div className="p-4 bg-gray-50 rounded-lg group hover:bg-yellow-50/50 transition-colors border border-transparent hover:border-yellow-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Company Details</h3>
                        <button type="button" onClick={() => setCurrentStep(3)}
                          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-900"><span className="font-semibold">Company:</span> {courseData.companyName}</p>
                        <p className="text-gray-900"><span className="font-semibold">Contact:</span> {courseData.contactPerson}</p>
                        <p className="text-gray-900"><span className="font-semibold">Email:</span> {courseData.email}</p>
                      </div>
                    </div>

                    {/* Course Information */}
                    <div className="p-4 bg-gray-50 rounded-lg group hover:bg-yellow-50/50 transition-colors border border-transparent hover:border-yellow-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase">Course Information</h3>
                        <button type="button" onClick={() => setCurrentStep(4)}
                          className="text-xs font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                          Edit
                        </button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-gray-900"><span className="font-semibold">Topic:</span> {courseData.courseName}</p>
                        <p className="text-gray-900"><span className="font-semibold">Industry:</span> {courseData.industry}</p>
                        {courseData.proposedVenue && (
                          <p className="text-gray-900"><span className="font-semibold">Proposed Venue:</span> {courseData.proposedVenue}</p>
                        )}
                        {courseData.numberOfTrainingDays && (
                          <p className="text-gray-900"><span className="font-semibold">Training Days:</span> {courseData.numberOfTrainingDays}</p>
                        )}
                        {courseData.proposedTrainingDate && (
                          <p className="text-gray-900"><span className="font-semibold">Proposed Date:</span> {new Date(courseData.proposedTrainingDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        )}
                        <p className="text-gray-900"><span className="font-semibold">Learning Outcomes:</span></p>
                        <p className="text-gray-700 text-sm">{courseData.reason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Success/Error Messages */}
                  {submitStatus === 'success' && (
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-gray-900 text-sm">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Thank you! Your request has been submitted. Redirecting...</span>
                      </div>
                    </div>
                  )}

                  {submitStatus === 'error' && courseErrors.submit && (
                    <div className="mb-4 p-4 bg-red-50 border-2 border-red-400 rounded-lg text-red-800 text-sm">
                      {courseErrors.submit}
                    </div>
                  )}

                  <div className="flex justify-between">
                    <button type="button" onClick={() => setCurrentStep(4)}
                      className="px-8 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-all">
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleCourseSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-yellow-400 text-gray-900 font-bold text-lg rounded-lg hover:bg-yellow-500 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        'Submit Course Request'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </>
        </div>
      </div>
    </div>
  );
}