import { Mail, User, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { Student, StudentSubmission, CourseWork } from '../types/googleClassroom';

interface StudentListProps {
  students: Student[];
  submissions: StudentSubmission[];
  courseWork: CourseWork[];
  onSelectStudent?: (student: Student) => void;
}

function StudentList({ students, submissions, courseWork, onSelectStudent }: StudentListProps) {
  // Calculate submission status for each student
  const studentStats = students.map(student => {
    const studentSubmissions = submissions.filter(s => s.userId === student.userId);
    const submitted = studentSubmissions.filter(s => s.state === 'TURNED_IN' || s.state === 'RETURNED').length;
    const pending = studentSubmissions.filter(s => s.state === 'NEW' || s.state === 'CREATED').length;
    const late = studentSubmissions.filter(s => s.late).length;
    const completionRate = courseWork.length > 0 ? ((submitted / courseWork.length) * 100).toFixed(1) : '0';

    return {
      ...student,
      submitted,
      pending,
      late,
      completionRate
    };
  });

  // Sort by completion rate (descending)
  const sortedStudents = [...studentStats].sort((a, b) => parseFloat(b.completionRate) - parseFloat(a.completionRate));

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <input
          type="text"
          placeholder="Search students by name or email..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-4 px-6 font-bold text-gray-700">Student Name</th>
                <th className="text-left py-4 px-6 font-bold text-gray-700">Email</th>
                <th className="text-center py-4 px-6 font-bold text-gray-700">Submitted</th>
                <th className="text-center py-4 px-6 font-bold text-gray-700">Pending</th>
                <th className="text-center py-4 px-6 font-bold text-gray-700">Late</th>
                <th className="text-center py-4 px-6 font-bold text-gray-700">Completion Rate</th>
                <th className="text-center py-4 px-6 font-bold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedStudents.length > 0 ? (
                sortedStudents.map((student, idx) => (
                  <tr 
                    key={student.userId} 
                    className={`border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                    onClick={() => onSelectStudent?.(student)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={student.profile?.photoUrl || 'https://via.placeholder.com/40'} 
                          alt={student.profile?.name?.fullName}
                          className="w-10 h-10 rounded-full border-2 border-gray-200"
                        />
                        <div>
                          <p className="font-bold text-gray-900">{student.profile?.name?.fullName}</p>
                          <p className="text-xs text-gray-500">{student.userId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{student.profile?.emailAddress}</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                        {student.submitted}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                        {student.pending}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      {student.late > 0 ? (
                        <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          {student.late}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              parseFloat(student.completionRate) >= 80 ? 'bg-green-500' :
                              parseFloat(student.completionRate) >= 50 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${student.completionRate}%` }}
                          />
                        </div>
                        <span className="font-bold text-gray-900 w-12 text-right">{student.completionRate}%</span>
                      </div>
                    </td>
                    <td className="text-center py-4 px-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent?.(student);
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold">No students found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm text-green-700 font-semibold">Average Completion</p>
              <p className="text-2xl font-black text-green-900">
                {students.length > 0 
                  ? (sortedStudents.reduce((sum, s) => sum + parseFloat(s.completionRate), 0) / students.length).toFixed(1)
                  : '0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-sm text-amber-700 font-semibold">Students with Pending Work</p>
              <p className="text-2xl font-black text-amber-900">
                {sortedStudents.filter(s => s.pending > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="text-sm text-red-700 font-semibold">Students with Late Submissions</p>
              <p className="text-2xl font-black text-red-900">
                {sortedStudents.filter(s => s.late > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentList;
