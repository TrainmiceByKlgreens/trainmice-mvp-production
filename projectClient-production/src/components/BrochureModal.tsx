import { X, FileText } from 'lucide-react';

interface BrochureModalProps {
  isOpen: boolean;
  onClose: () => void;
  brochureUrl: string;
  courseTitle: string;
  learningOutcomes?: string[] | null;
}

export function BrochureModal({ isOpen, onClose, brochureUrl, courseTitle, learningOutcomes }: BrochureModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-800">Course Brochure - {courseTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {/* Learning Outcomes Section */}
            {learningOutcomes && learningOutcomes.length > 0 && (
              <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Learning Outcomes</h3>
                <ul className="space-y-2">
                  {learningOutcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-teal-600 mt-1">•</span>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Brochure PDF Viewer */}
            <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={brochureUrl}
                className="w-full h-full"
                title="Course Brochure"
              />
            </div>
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <a
              href={brochureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
            >
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

