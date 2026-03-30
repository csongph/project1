import { useState } from 'react';
import { ClipboardList, ArrowLeft, ExternalLink, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import AssignmentDetail from './AssignmentDetail';

interface AssignmentsPageProps {
  assignments: any[];
  courses: any[];
  onBack: () => void;
}

export default function AssignmentsPage({ assignments, courses, onBack }: AssignmentsPageProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'overdue' | 'upcoming' | 'other'>('all');

  const formatDate = (dueDate: any) => {
    if (!dueDate || !dueDate.day) return 'ไม่มีกำหนดส่ง';
    return `${dueDate.day}/${dueDate.month}/${dueDate.year}`;
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course?.name || 'Unknown Course';
  };

  const handleSubmit = async (assignmentId: string, files: File[], comment: string) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Submitting assignment:', { assignmentId, files, comment });
        resolve();
      }, 2000);
    });
  };

  if (selectedAssignment) {
    return (
      <AssignmentDetail
        assignment={selectedAssignment}
        courseName={getCourseName(selectedAssignment.courseId)}
        onBack={() => setSelectedAssignment(null)}
        onSubmit={handleSubmit}
      />
    );
  }

  const isUpcoming = (dueDate: any) => {
    if (!dueDate || !dueDate.year) return false;
    const due = new Date(dueDate.year, (dueDate.month || 1) - 1, dueDate.day || 1);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const isOverdue = (dueDate: any) => {
    if (!dueDate || !dueDate.year) return false;
    const due = new Date(dueDate.year, (dueDate.month || 1) - 1, dueDate.day || 1);
    return due < new Date();
  };

  const filtered = assignments.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
      getCourseName(a.courseId).toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'overdue') return isOverdue(a.dueDate);
    if (filter === 'upcoming') return isUpcoming(a.dueDate) && !isOverdue(a.dueDate);
    if (filter === 'other') return !isUpcoming(a.dueDate) && !isOverdue(a.dueDate);
    return true;
  });

  const overdueAssignments = filtered.filter(a => isOverdue(a.dueDate));
  const upcomingAssignments = filtered.filter(a => isUpcoming(a.dueDate) && !isOverdue(a.dueDate));
  const otherAssignments = filtered.filter(a => !isUpcoming(a.dueDate) && !isOverdue(a.dueDate));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .ap-root {
          min-height: 100vh;
          background: #0a0a0a;
          font-family: 'DM Sans', 'Noto Sans Thai', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Subtle background blobs */
        .ap-bg {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }
        .ap-bg::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, #ff006618 0%, transparent 70%);
          top: -150px; right: -150px;
          animation: apBlob1 10s ease-in-out infinite;
        }
        .ap-bg::after {
          content: '';
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, #ff006610 0%, transparent 70%);
          bottom: -100px; left: -100px;
          animation: apBlob2 12s ease-in-out infinite;
        }
        .ap-grid {
          position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,0,102,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,102,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        @keyframes apBlob1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-60px,50px)} }
        @keyframes apBlob2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(50px,-40px)} }

        /* Header */
        .ap-header {
          position: sticky; top: 0; z-index: 10;
          background: rgba(10,10,10,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .ap-header-inner {
          max-width: 900px; margin: 0 auto;
          padding: 16px 24px;
          display: flex; align-items: center; gap: 16px;
        }
        .ap-back-btn {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          color: rgba(255,255,255,0.7);
          flex-shrink: 0;
        }
        .ap-back-btn:hover {
          background: rgba(255,0,102,0.15);
          border-color: rgba(255,0,102,0.4);
          color: #ff0066;
        }
        .ap-header-title {
          font-size: 18px; font-weight: 700;
          color: white; letter-spacing: -0.3px;
        }
        .ap-header-sub {
          font-size: 13px; color: rgba(255,255,255,0.35);
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* Main */
        .ap-main {
          max-width: 900px; margin: 0 auto;
          padding: 28px 24px 60px;
          position: relative; z-index: 1;
        }

        /* Search & Filter */
        .ap-toolbar {
          display: flex; gap: 12px; margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .ap-search-wrap {
          flex: 1; min-width: 200px;
          position: relative;
        }
        .ap-search-icon {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%);
          color: rgba(255,255,255,0.25);
          pointer-events: none;
        }
        .ap-search {
          width: 100%; padding: 10px 14px 10px 38px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          color: white; font-size: 14px;
          outline: none; transition: all 0.2s;
          font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
        }
        .ap-search::placeholder { color: rgba(255,255,255,0.2); }
        .ap-search:focus {
          border-color: #ff0066;
          background: rgba(255,0,102,0.06);
          box-shadow: 0 0 0 3px rgba(255,0,102,0.1);
        }
        .ap-filters {
          display: flex; gap: 6px; flex-wrap: wrap;
        }
        .ap-filter-btn {
          padding: 9px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          color: rgba(255,255,255,0.45);
          font-size: 13px; font-weight: 500;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .ap-filter-btn:hover { border-color: rgba(255,0,102,0.4); color: rgba(255,255,255,0.7); }
        .ap-filter-btn.active {
          background: #ff0066;
          border-color: #ff0066;
          color: white;
          box-shadow: 0 4px 14px rgba(255,0,102,0.3);
        }

        /* Section */
        .ap-section { margin-bottom: 32px; }
        .ap-section-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .ap-section-label {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.5);
          font-family: 'Noto Sans Thai', sans-serif;
          letter-spacing: 0.3px;
        }
        .ap-section-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .badge-overdue { background: rgba(239,68,68,0.15); color: #f87171; }
        .badge-upcoming { background: rgba(249,115,22,0.15); color: #fb923c; }
        .badge-other { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.4); }

        .ap-cards { display: flex; flex-direction: column; gap: 8px; }

        /* Card */
        .ap-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex; align-items: center;
          gap: 14px; cursor: pointer;
          transition: all 0.2s;
          animation: apFadeUp 0.3s ease both;
        }
        .ap-card:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,0,102,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .ap-card.overdue {
          border-color: rgba(239,68,68,0.2);
          background: rgba(239,68,68,0.04);
        }
        .ap-card.overdue:hover { border-color: rgba(239,68,68,0.4); }
        .ap-card.upcoming {
          border-color: rgba(249,115,22,0.2);
          background: rgba(249,115,22,0.04);
        }
        .ap-card.upcoming:hover { border-color: rgba(249,115,22,0.4); }

        @keyframes apFadeUp {
          from { opacity:0; transform:translateY(8px); }
          to { opacity:1; transform:translateY(0); }
        }

        .ap-card-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .icon-overdue { background: rgba(239,68,68,0.15); color: #f87171; }
        .icon-upcoming { background: rgba(249,115,22,0.15); color: #fb923c; }
        .icon-default { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
        .ap-card:hover .ap-card-icon {
          background: #ff0066 !important;
          color: white !important;
        }

        .ap-card-body { flex: 1; min-width: 0; }
        .ap-card-title {
          font-size: 14px; font-weight: 600;
          color: white;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 5px;
        }
        .ap-card-meta {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .ap-card-course {
          font-size: 12px; color: rgba(255,255,255,0.35);
          font-family: 'Noto Sans Thai', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 300px;
        }
        .ap-meta-dot { font-size: 10px; color: rgba(255,255,255,0.2); }
        .ap-card-date {
          font-size: 12px; color: rgba(255,255,255,0.35);
          display: flex; align-items: center; gap: 4px; white-space: nowrap;
        }
        .ap-card-points {
          font-size: 12px; font-weight: 600;
          color: rgba(255,0,102,0.7);
          white-space: nowrap;
        }

        .ap-ext-link {
          width: 32px; height: 32px; flex-shrink: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.25);
          transition: all 0.2s; text-decoration: none;
        }
        .ap-ext-link:hover {
          background: rgba(255,0,102,0.15);
          border-color: rgba(255,0,102,0.4);
          color: #ff0066;
        }

        /* Empty */
        .ap-empty {
          text-align: center; padding: 60px 20px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 20px;
        }
        .ap-empty-icon { color: rgba(255,255,255,0.1); margin: 0 auto 12px; }
        .ap-empty-text {
          font-size: 14px; color: rgba(255,255,255,0.25);
          font-family: 'Noto Sans Thai', sans-serif;
        }
      `}</style>

      <div className="ap-root">
        <div className="ap-bg" />
        <div className="ap-grid" />

        {/* Header */}
        <header className="ap-header">
          <div className="ap-header-inner">
            <button className="ap-back-btn" onClick={onBack}>
              <ArrowLeft size={18} strokeWidth={2.5} />
            </button>
            <div>
              <div className="ap-header-title">งานที่มอบหมาย</div>
              <div className="ap-header-sub">ทั้งหมด {assignments.length} งาน</div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="ap-main">
          {/* Toolbar */}
          <div className="ap-toolbar">
            <div className="ap-search-wrap">
              <svg className="ap-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="ap-search"
                placeholder="ค้นหางาน..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="ap-filters">
              {(['all','overdue','upcoming','other'] as const).map(f => (
                <button
                  key={f}
                  className={`ap-filter-btn${filter === f ? ' active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {{ all:'ทั้งหมด', overdue:'เลยกำหนด', upcoming:'ใกล้ครบกำหนด', other:'อื่นๆ' }[f]}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="ap-empty">
              <CheckCircle className="ap-empty-icon" size={48} strokeWidth={1.5} />
              <p className="ap-empty-text">ไม่พบงานที่ค้นหา</p>
            </div>
          ) : (
            <>
              {/* Overdue */}
              {overdueAssignments.length > 0 && (filter === 'all' || filter === 'overdue') && (
                <section className="ap-section">
                  <div className="ap-section-header">
                    <AlertCircle size={16} strokeWidth={2} color="#f87171" />
                    <span className="ap-section-label">เลยกำหนด</span>
                    <span className="ap-section-badge badge-overdue">{overdueAssignments.length}</span>
                  </div>
                  <div className="ap-cards">
                    {overdueAssignments.map((work: any) => (
                      <AssignmentCard
                        key={work.id}
                        work={work}
                        courseName={getCourseName(work.courseId)}
                        formatDate={formatDate}
                        variant="overdue"
                        onClick={() => setSelectedAssignment(work)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming */}
              {upcomingAssignments.length > 0 && (filter === 'all' || filter === 'upcoming') && (
                <section className="ap-section">
                  <div className="ap-section-header">
                    <Clock size={16} strokeWidth={2} color="#fb923c" />
                    <span className="ap-section-label">ใกล้ครบกำหนด</span>
                    <span className="ap-section-badge badge-upcoming">{upcomingAssignments.length}</span>
                  </div>
                  <div className="ap-cards">
                    {upcomingAssignments.map((work: any) => (
                      <AssignmentCard
                        key={work.id}
                        work={work}
                        courseName={getCourseName(work.courseId)}
                        formatDate={formatDate}
                        variant="upcoming"
                        onClick={() => setSelectedAssignment(work)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Other */}
              {otherAssignments.length > 0 && (filter === 'all' || filter === 'other') && (
                <section className="ap-section">
                  <div className="ap-section-header">
                    <ClipboardList size={16} strokeWidth={2} color="rgba(255,255,255,0.4)" />
                    <span className="ap-section-label">งานอื่นๆ</span>
                    <span className="ap-section-badge badge-other">{otherAssignments.length}</span>
                  </div>
                  <div className="ap-cards">
                    {otherAssignments.map((work: any) => (
                      <AssignmentCard
                        key={work.id}
                        work={work}
                        courseName={getCourseName(work.courseId)}
                        formatDate={formatDate}
                        variant="default"
                        onClick={() => setSelectedAssignment(work)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}

// Assignment Card Component
interface AssignmentCardProps {
  work: any;
  courseName: string;
  formatDate: (dueDate: any) => string;
  variant?: 'overdue' | 'upcoming' | 'default';
  onClick?: () => void;
}

function AssignmentCard({ work, courseName, formatDate, variant = 'default', onClick }: AssignmentCardProps) {
  return (
    <div
      onClick={onClick}
      className={`ap-card ${variant}`}
    >
      <div className={`ap-card-icon ${
        variant === 'overdue' ? 'icon-overdue' :
        variant === 'upcoming' ? 'icon-upcoming' : 'icon-default'
      }`}>
        <ClipboardList size={18} strokeWidth={2} />
      </div>

      <div className="ap-card-body">
        <div className="ap-card-title">{work.title}</div>
        <div className="ap-card-meta">
          <span className="ap-card-course">{courseName}</span>
          <span className="ap-meta-dot">•</span>
          <span className="ap-card-date">
            <Calendar size={11} strokeWidth={2} />
            {formatDate(work.dueDate)}
          </span>
          {work.maxPoints && (
            <>
              <span className="ap-meta-dot">•</span>
              <span className="ap-card-points">{work.maxPoints} คะแนน</span>
            </>
          )}
        </div>
      </div>

      <a
        href={work.alternateLink}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="ap-ext-link"
      >
        <ExternalLink size={14} strokeWidth={2} />
      </a>
    </div>
  );
}