import { ExternalLink, Send, RotateCcw, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import type { AssignmentWithCourseInfo } from '../types/googleClassroom';

interface AssignmentCardProps {
  assignment: AssignmentWithCourseInfo;
  onGoToClassroom: (url: string) => void;
  onSubmit: (courseId: string, courseWorkId: string, submissionId: string) => Promise<void>;
  onUnsubmit: (courseId: string, courseWorkId: string, submissionId: string) => Promise<void>;
  loading: boolean;
  formatDueDate: (assignment: AssignmentWithCourseInfo) => string;
  isOverdue: (assignment: AssignmentWithCourseInfo) => boolean;
}

export const AssignmentCard = ({
  assignment,
  onGoToClassroom,
  onSubmit,
  onUnsubmit,
  loading,
  formatDueDate,
  isOverdue
}: AssignmentCardProps) => {
  const isSubmitted = assignment.submission?.state === 'TURNED_IN' || assignment.submission?.state === 'RETURNED';
  const isPending = !assignment.submission || assignment.submission.state === 'NEW' || assignment.submission.state === 'RECLAIMED_BY_STUDENT';
  const overdue = isOverdue(assignment);

  const handleSubmit = async () => {
    if (assignment.submission?.id) {
      await onSubmit(assignment.courseId, assignment.id, assignment.submission.id);
    }
  };

  const handleUnsubmit = async () => {
    if (assignment.submission?.id) {
      await onUnsubmit(assignment.courseId, assignment.id, assignment.submission.id);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border transition-all p-5 ${
      overdue && isPending 
        ? 'border-red-200 shadow-md shadow-red-100' 
        : 'border-slate-100 hover:shadow-md'
    }`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-slate-800 text-lg line-clamp-2">{assignment.title}</h3>
            {isSubmitted && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />}
            {overdue && isPending && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate-400 mb-3">{assignment.courseName}</p>
        </div>
      </div>

      {assignment.description && (
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{assignment.description}</p>
      )}

      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-50">
        <div className="flex items-center gap-1 text-sm">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className={`font-semibold ${overdue && isPending ? 'text-red-600' : 'text-slate-600'}`}>
            {formatDueDate(assignment)}
          </span>
        </div>
        {assignment.maxPoints && (
          <div className="text-sm text-slate-500">
            <span className="font-semibold">{assignment.maxPoints}</span> คะแนน
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onGoToClassroom(assignment.alternateLink)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          เปิด
        </button>

        {isPending ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            ส่งงาน
          </button>
        ) : (
          <button
            onClick={handleUnsubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            ยกเลิก
          </button>
        )}
      </div>
    </div>
  );
};
