import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import type { StudentSubmission, CourseWork } from '../types/googleClassroom';

interface CourseStatsTeacherProps {
  courseWork: CourseWork[];
  submissions: StudentSubmission[];
  studentCount: number;
}

function CourseStatsTeacher({ courseWork, submissions, studentCount }: CourseStatsTeacherProps) {
  // Calculate submission statistics
  const submissionStats = courseWork.map(work => {
    const workSubmissions = submissions.filter(s => s.courseWorkId === work.id);
    const submitted = workSubmissions.filter(s => s.state === 'TURNED_IN' || s.state === 'RETURNED').length;
    const pending = workSubmissions.filter(s => s.state === 'NEW' || s.state === 'CREATED').length;
    const late = workSubmissions.filter(s => s.late).length;

    return {
      name: work.title.length > 20 ? work.title.substring(0, 17) + '...' : work.title,
      submitted,
      pending,
      late,
      total: studentCount,
      submissionRate: studentCount > 0 ? ((submitted / studentCount) * 100).toFixed(1) : '0'
    };
  });

  // Calculate overall statistics
  const submittedCount = submissions.filter(s => s.state === 'TURNED_IN' || s.state === 'RETURNED').length;
  const pendingCount = submissions.filter(s => s.state === 'NEW' || s.state === 'CREATED').length;
  const lateCount = submissions.filter(s => s.late).length;
  const averageSubmissionRate = courseWork.length > 0 
    ? (submissionStats.reduce((sum, stat) => sum + parseFloat(stat.submissionRate), 0) / courseWork.length).toFixed(1)
    : '0';

  const overallStats = [
    { name: 'Submitted', value: submittedCount, color: '#10B981' },
    { name: 'Pending', value: pendingCount, color: '#F59E0B' },
    { name: 'Late', value: lateCount, color: '#EF4444' }
  ];

  const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Total Students</p>
              <p className="text-3xl font-black text-gray-900">{studentCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Submitted</p>
              <p className="text-3xl font-black text-gray-900">{submittedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Pending</p>
              <p className="text-3xl font-black text-gray-900">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-semibold">Late Submissions</p>
              <p className="text-3xl font-black text-gray-900">{lateCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submission Rate by Assignment */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">Submission Rate by Assignment</h3>
          <div className="overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={submissionStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="submitted" fill="#10B981" name="Submitted" />
                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overall Submission Status */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-black text-gray-900 mb-4">Overall Submission Status</h3>
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={overallStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {overallStats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Average Submission Rate</p>
              <p className="text-3xl font-black text-gray-900">{averageSubmissionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Assignment Stats */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-black text-gray-900 mb-4">Assignment Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-bold text-gray-700">Assignment</th>
                <th className="text-center py-3 px-4 font-bold text-gray-700">Submitted</th>
                <th className="text-center py-3 px-4 font-bold text-gray-700">Pending</th>
                <th className="text-center py-3 px-4 font-bold text-gray-700">Late</th>
                <th className="text-center py-3 px-4 font-bold text-gray-700">Rate</th>
              </tr>
            </thead>
            <tbody>
              {submissionStats.map((stat, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{stat.name}</td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                      {stat.submitted}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
                      {stat.pending}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="inline-block bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                      {stat.late}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full" 
                          style={{ width: `${stat.submissionRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 w-12 text-right">{stat.submissionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CourseStatsTeacher;
