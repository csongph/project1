import { useState } from 'react';
import { Save, X } from 'lucide-react';
import type { StudentSubmission, CourseWork, Student } from '../types/googleClassroom';

interface GradingFormProps {
  submission: StudentSubmission;
  student: Student;
  courseWork: CourseWork;
  onSave: (grade: number, feedback: string) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

function GradingForm({ submission, student, courseWork, onSave, onClose, loading = false }: GradingFormProps) {
  const [grade, setGrade] = useState<number>(submission.assignedGrade || 0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(grade, feedback);
      onClose();
    } catch (error) {
      console.error('Error saving grade:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const maxPoints = courseWork.maxPoints || 100;
  const percentage = maxPoints > 0 ? ((grade / maxPoints) * 100).toFixed(1) : '0';

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-blue-600';
    if (pct >= 70) return 'text-yellow-600';
    if (pct >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between border-b border-blue-800">
          <div>
            <h2 className="text-2xl font-black">Grade Submission</h2>
            <p className="text-blue-100">
              {student.profile?.name?.fullName} - {courseWork.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Student Information */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-3">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-bold text-gray-900">{student.profile?.name?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-bold text-gray-900">{student.profile?.emailAddress}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submission Status</p>
                <p className={`font-bold ${
                  submission.state === 'TURNED_IN' ? 'text-green-600' :
                  submission.state === 'NEW' ? 'text-amber-600' :
                  'text-gray-600'
                }`}>
                  {submission.state}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Submitted On</p>
                <p className="font-bold text-gray-900">
                  {new Date(submission.creationTime).toLocaleDateString()}
                </p>
              </div>
            </div>
            {submission.late && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <p className="text-sm font-bold text-red-700">This submission is marked as late</p>
              </div>
            )}
          </div>

          {/* Assignment Information */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-bold text-gray-900 mb-3">Assignment Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-bold text-gray-900">{courseWork.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-700">{courseWork.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Max Points</p>
                <p className="font-bold text-gray-900">{maxPoints}</p>
              </div>
            </div>
          </div>

          {/* Grading Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Assign Grade</h3>

            {/* Grade Input */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Grade (out of {maxPoints})
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max={maxPoints}
                  value={grade}
                  onChange={(e) => setGrade(Math.min(maxPoints, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold"
                  disabled={isSaving || loading}
                />
                <div className="text-right">
                  <p className={`text-3xl font-black ${getGradeColor(parseFloat(percentage))}`}>
                    {percentage}%
                  </p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>

              {/* Grade Scale */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range"
                  min="0"
                  max={maxPoints}
                  value={grade}
                  onChange={(e) => setGrade(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isSaving || loading}
                />
              </div>

              {/* Grade Reference */}
              <div className="grid grid-cols-5 gap-2 text-xs text-center mt-3">
                <div className="p-2 bg-green-50 rounded border border-green-200">
                  <p className="font-bold text-green-700">A</p>
                  <p className="text-green-600">90-100</p>
                </div>
                <div className="p-2 bg-blue-50 rounded border border-blue-200">
                  <p className="font-bold text-blue-700">B</p>
                  <p className="text-blue-600">80-89</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                  <p className="font-bold text-yellow-700">C</p>
                  <p className="text-yellow-600">70-79</p>
                </div>
                <div className="p-2 bg-orange-50 rounded border border-orange-200">
                  <p className="font-bold text-orange-700">D</p>
                  <p className="text-orange-600">60-69</p>
                </div>
                <div className="p-2 bg-red-50 rounded border border-red-200">
                  <p className="font-bold text-red-700">F</p>
                  <p className="text-red-600">0-59</p>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback to the student..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isSaving || loading}
              />
              <p className="text-xs text-gray-500">{feedback.length} characters</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              disabled={isSaving || loading}
              className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Grade
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradingForm;
