import { useState } from 'react';
import { Mail, Phone, MapPin, Facebook, Linkedin, Instagram, MessageSquare, CheckCircle } from 'lucide-react';
import { apiClient } from '../lib/api-client';

export function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
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
    setSubmitStatus('idle');

    try {
      await apiClient.submitContact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactImages = [
    'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184611/pexels-photo-3184611.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Yellow Gradient with Form */}
      <div className="lg:w-1/2 bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 p-8 lg:p-16 flex items-center justify-center animate-slide-in-left">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Let's Get In Touch</h1>
            <p className="text-lg text-gray-800">
              We'd love to hear from you. Reach out for any inquiries or support.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur-xl backdrop-saturate-[180%] rounded-2xl shadow-2xl border border-white/20 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all hover:border-yellow-300`}
                  placeholder="Your name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Email Field */}
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all hover:border-yellow-300`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              {/* Phone Field */}
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 border ${errors.phone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all hover:border-yellow-300`}
                  placeholder="+60 12-345 6789"
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              {/* Message Field */}
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Comment or Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className={`w-full px-4 py-3 border ${errors.message ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all hover:border-yellow-300 resize-none`}
                  placeholder="Let us know how we can help — feel free to ask about training, HRDC claims, group bookings, or anything else!"
                />
                {errors.message && <p className="mt-1 text-sm text-red-500">{errors.message}</p>}
              </div>

              {/* Success Message */}
              {submitStatus === 'success' && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg text-gray-900 flex items-center gap-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <span className="font-medium">Thank you! Your message has been sent successfully.</span>
                </div>
              )}

              {/* Error Message */}
              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg text-red-800 animate-fade-in">
                  Sorry, there was an error sending your message. Please try again.
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-yellow-400 text-gray-900 font-bold text-lg rounded-lg hover:bg-yellow-500 transition-all duration-200 hover:-translate-y-0.5 shadow-glow-yellow-sm hover:shadow-glow-yellow disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none animate-fade-in"
                style={{ animationDelay: '0.5s' }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'SUBMIT'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Contact Info & Image */}
      <div className="lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-8 lg:p-16 flex items-center justify-center animate-slide-in-right">
        <div className="w-full max-w-xl space-y-8">
          {/* Image Carousel */}
          <div className="relative h-80 bg-gray-200 rounded-2xl overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <img
              src={contactImages[currentImageIndex]}
              alt="Contact"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
              {contactImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === currentImageIndex ? 'bg-yellow-400 w-8 shadow-glow-yellow-sm' : 'bg-white/70 w-2'
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white/70 backdrop-blur-xl backdrop-saturate-[180%] rounded-2xl shadow-xl border border-white/20 p-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
              <span className="w-2 h-8 bg-yellow-400 rounded-full"></span>
              You Can Find Us At
            </h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Mail className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="pt-2">
                  <p className="text-gray-900 font-semibold">enquiry@klgreens.com</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <Phone className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="pt-2">
                  <p className="text-gray-900 font-semibold">+60 11-5135 8993</p>
                  <p className="text-gray-900 font-semibold">+60 37887411</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4 group hover:translate-x-1 transition-transform">
                <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                  <MapPin className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="pt-2">
                  <p className="text-gray-900 font-medium">
                    928, Block A, Kelana Centre Point, No 3, Jalan SS 7/19,
                  </p>
                  <p className="text-gray-900 font-medium">
                    Kelana Jaya, 47301 Petaling Jaya, Selangor, Malaysia.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4">Connect with us</p>
              <div className="flex gap-3">
                <a
                  href="https://wa.me/60111513589993"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center hover:bg-green-600 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <MessageSquare className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <Facebook className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center hover:bg-blue-800 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <Linkedin className="w-6 h-6 text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center hover:from-purple-700 hover:to-pink-600 transition-all hover:-translate-y-1 shadow-lg hover:shadow-xl"
                >
                  <Instagram className="w-6 h-6 text-white" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
