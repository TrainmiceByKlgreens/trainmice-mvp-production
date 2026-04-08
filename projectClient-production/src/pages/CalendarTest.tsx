import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { InHouseCalendarBookingModal } from '../components/InHouseCalendarBookingModal';
import { Course, Trainer } from '../lib/api-client';

export function CalendarTest() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const testCourse: Course = {
    id: '99999999-9999-9999-9999-999999999999',
    title: 'Leadership Development Program',
    description: 'Comprehensive leadership training covering essential management skills, team dynamics, and strategic thinking.',
    learning_objectives: [
      'Develop effective leadership strategies',
      'Master team communication techniques',
      'Learn conflict resolution skills',
    ],
    course_rating: 4.8,
    price: 3500,
    slots_left: 20,
    venue: 'Your Company Location',
    teaching_method: 'Interactive Workshop',
    hrdc_claimable: true,
    brochure_url: null,
    learning_outcomes: null,
    target_audience: null,
    methodology: null,
    prerequisite: null,
    certificate: null,
    assessment: null,
    modules: null,
    course_type: 'In-House',
    event_date: null,
    category: 'Leadership',
    duration: 16,
    duration_unit: 'hours',
    duration_hours: 16,
    city: 'Kuala Lumpur',
    state: 'Selangor',
    trainer_id: '11111111-1111-1111-1111-111111111111',
    status: null,
    course_sequence: null,
    created_at: new Date().toISOString(),
  };

  const testTrainer1: Trainer = {
    id: '11111111-1111-1111-1111-111111111111',
    profile_pic: null,
    full_name: 'John Smith',
    job_title: 'Senior Corporate Trainer',
    professional_bio: 'Experienced corporate trainer specializing in leadership development and soft skills training with over 15 years of industry experience.',
    year_of_experience: 15,
    teaching_style: 'Interactive and engaging',
    ic_number: null,
    race: null,
    languages: ['English', 'Bahasa Malaysia'],
    languages_spoken: ['English', 'Bahasa Malaysia'],
    phone_number: null,
    email: null,
    topics: ['Leadership', 'Communication', 'Team Building'],
    areas_of_expertise: ['Leadership', 'Communication', 'Team Building'],
    city: 'Kuala Lumpur',
    state: 'Selangor',
    country: 'Malaysia',
    rating: 4.8,
    education_background: ['MBA - Harvard Business School'],
    industry_experience: ['Corporate Training', 'HR Development'],
    past_clients: ['Fortune 500 Companies'],
    custom_trainer_id: 'TR001',
    scheduling_type: 'slot_based',
    hrdc_registered: true,
    hrdc_registration_number: 'HRDC001',
    created_at: new Date().toISOString(),
  };

  const testTrainer2: Trainer = {
    id: '22222222-2222-2222-2222-222222222222',
    profile_pic: null,
    full_name: 'Sarah Johnson',
    job_title: 'Executive Coach & Trainer',
    professional_bio: 'Executive coach and trainer with extensive experience in organizational development and team building programs.',
    year_of_experience: 12,
    teaching_style: 'Coaching and mentoring',
    ic_number: null,
    race: null,
    languages: ['English'],
    languages_spoken: ['English'],
    phone_number: null,
    email: null,
    topics: ['Executive Coaching', 'Leadership', 'Organizational Development'],
    areas_of_expertise: ['Executive Coaching', 'Leadership', 'Organizational Development'],
    city: 'Kuala Lumpur',
    state: 'Selangor',
    country: 'Malaysia',
    rating: 4.9,
    education_background: ['PhD in Organizational Psychology'],
    industry_experience: ['Executive Coaching', 'Organizational Development'],
    past_clients: ['Global Corporations'],
    custom_trainer_id: 'TR002',
    scheduling_type: 'full_day',
    hrdc_registered: true,
    hrdc_registration_number: 'HRDC002',
    created_at: new Date().toISOString(),
  };

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer>(testTrainer1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Trainer Availability Calendar Test
          </h1>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">Test Information</h2>
              <div className="space-y-2 text-sm text-blue-800">
                <p><strong>Course:</strong> {testCourse.title}</p>
                <p><strong>Duration:</strong> 16 hours (requires 4 time slots)</p>
                <p><strong>Test Month:</strong> December 2024</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Trainer to Test:</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedTrainer(testTrainer1)}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    selectedTrainer.id === testTrainer1.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900">{testTrainer1.full_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{testTrainer1.job_title}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Slot-Based (Morning/Afternoon)
                  </span>
                  <div className="mt-3 text-xs text-gray-700 space-y-1">
                    <p>• Dec 2: Morning available, Afternoon booked</p>
                    <p>• Dec 3: Both slots available</p>
                    <p>• Dec 4: Morning tentative, Afternoon available</p>
                    <p>• Dec 5: Both unavailable</p>
                    <p>• More dates with varied statuses...</p>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedTrainer(testTrainer2)}
                  className={`p-6 border-2 rounded-lg text-left transition-all ${
                    selectedTrainer.id === testTrainer2.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900">{testTrainer2.full_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{testTrainer2.job_title}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Full-Day Only
                  </span>
                  <div className="mt-3 text-xs text-gray-700 space-y-1">
                    <p>• Dec 2-3: Available</p>
                    <p>• Dec 4: Booked</p>
                    <p>• Dec 5: Tentative</p>
                    <p>• Dec 6: Available</p>
                    <p>• More dates with varied statuses...</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Currently Testing:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Trainer:</strong> {selectedTrainer.full_name} ({selectedTrainer.custom_trainer_id})</p>
                <p><strong>Scheduling Type:</strong> {selectedTrainer.scheduling_type === 'slot_based' ? 'Slot-Based (Morning/Afternoon)' : 'Full-Day Only'}</p>
              </div>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02]"
            >
              <Calendar className="w-6 h-6" />
              <span>Open Calendar Booking Modal</span>
            </button>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Testing Checklist:</h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>✓ Trainer 1 shows slot indicators (●●, ●○, ○●, ⚠️●, ●⚠️)</li>
                <li>✓ Trainer 2 shows no indicators (full days only)</li>
                <li>✓ Click available dates to select slots</li>
                <li>✓ Tentative slots show warnings but are selectable</li>
                <li>✓ Booked/unavailable dates cannot be clicked</li>
                <li>✓ Selection summary updates in real-time</li>
                <li>✓ Progress bar fills correctly</li>
                <li>✓ Submit button enables only when complete</li>
                <li>✓ Remove slots with X button</li>
                <li>✓ All form fields are required</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <InHouseCalendarBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={{ ...testCourse, trainer_id: selectedTrainer.id }}
        trainer={selectedTrainer}
      />
    </div>
  );
}
