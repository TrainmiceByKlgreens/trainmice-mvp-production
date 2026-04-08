import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CoursesDirectory } from './pages/CoursesDirectory';
import { CourseDetail } from './pages/CourseDetail';
import { TrainerProfile } from './pages/TrainerProfile';
import { CompareTrainers } from './pages/CompareTrainers';
import { CalendarTest } from './pages/CalendarTest';
import { ContactUs } from './pages/ContactUs';
import { RequestCustomCourse } from './pages/RequestCustomCourse';
import { PublicTraining } from './pages/PublicTraining';
import { VerifyEmailSuccess } from './pages/VerifyEmailSuccess';
import { FeedbackForm } from './pages/FeedbackForm';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { MyBookings } from './pages/MyBookings';
import { MyProfile } from './pages/MyProfile';
import { HelpCenter } from './pages/HelpCenter';
import { Header } from './components/Header';
import { SignupModal } from './components/SignupModal';
import { LoginModal } from './components/LoginModal';

function App() {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const handleOpenSignup = () => setIsSignupOpen(true);
    const handleOpenLogin = () => setIsLoginOpen(true);

    window.addEventListener('openSignup', handleOpenSignup);
    window.addEventListener('openLogin', handleOpenLogin);

    return () => {
      window.removeEventListener('openSignup', handleOpenSignup);
      window.removeEventListener('openLogin', handleOpenLogin);
    };
  }, []);

  return (
    <BrowserRouter>
      <Header
        onLoginClick={() => setIsLoginOpen(true)}
        onSignupClick={() => setIsSignupOpen(true)}
      />
      <Routes>
        <Route path="/" element={<CoursesDirectory />} />
        <Route path="/courses/:slug" element={<CourseDetail />} />
        <Route path="/trainers/:id" element={<TrainerProfile />} />
        <Route path="/compare-trainers" element={<CompareTrainers />} />
        <Route path="/calendar-test" element={<CalendarTest />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/public-training" element={<PublicTraining />} />
        <Route path="/request-custom-course" element={<RequestCustomCourse />} />
        <Route path="/verify-email-success" element={<VerifyEmailSuccess />} />
        <Route path="/feedback/:eventId" element={<FeedbackForm />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-profile" element={<MyProfile />} />
        <Route path="/help-center" element={<HelpCenter />} />
      </Routes>
      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />
    </BrowserRouter>
  );
}

export default App;
