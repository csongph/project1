import { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  fetchUserProfile,
  fetchCourses,
  fetchAllAssignmentsWithSubmissions,
  turnInAssignment,
  reclaimAssignment,
  fetchGlobalUserRoles,
} from './services/classroomService';
import type {
  GoogleUser,
  Course,
  AssignmentWithCourseInfo,
  CourseRole,
  Notification,
} from './types/googleClassroom';
import { Loader2 } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import {
  initializeEmailJS,
  sendDeadlineNotificationEmail,
  getNotificationsFromAssignments,
} from './services/emailService';

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthMode = 'login' | 'register';
type UserRole = 'student' | 'teacher';

interface LocalUser {
  id: number;
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [, setLocalUserRole] = useState<UserRole | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<AssignmentWithCourseInfo[]>([]);
  const [userRoles, setUserRoles] = useState<CourseRole[]>([]);
  const [currentRole, setCurrentRole] = useState<CourseRole | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [accessToken, setAccessToken] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    initializeEmailJS();
    const saved = localStorage.getItem('lms_current_user');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (saved && isLoggedIn === 'true') {
      const localUser: LocalUser = JSON.parse(saved);
      setUser({ id: String(localUser.id), name: localUser.fullName, email: localUser.email, picture: '', verified_email: true, given_name: '', family_name: '', locale: 'th' });
      setLocalUserRole(localUser.role);
      const defaultCourseRole: CourseRole = localUser.role === 'teacher' ? 'TEACHER' : 'STUDENT';
      setCurrentRole(defaultCourseRole);
      setUserRoles([defaultCourseRole]);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    scope:
      'https://www.googleapis.com/auth/classroom.courses.readonly ' +
      'https://www.googleapis.com/auth/classroom.coursework.me ' +
      'https://www.googleapis.com/auth/classroom.coursework.students ' +
      'https://www.googleapis.com/auth/classroom.rosters.readonly ' +
      'https://www.googleapis.com/auth/classroom.profile.emails ' +
      'https://www.googleapis.com/auth/classroom.profile.photos',
    prompt: 'consent',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const token = tokenResponse.access_token;
        setAccessToken(token);
        const [profile, fetchedCourses] = await Promise.all([
          fetchUserProfile(token),
          fetchCourses(token),
        ]);
        setUser(profile);
        setCourses(fetchedCourses);
        // ─ Detect teacher role: direct API call (works even with 0 courses) ─
        let detectedRoles: CourseRole[] = ['STUDENT'];
        try {
          const teacherRes = await fetch(
            'https://classroom.googleapis.com/v1/courses?teacherId=me&pageSize=1',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const teacherJson = await teacherRes.json();
          if (teacherJson.courses && teacherJson.courses.length > 0) {
            detectedRoles = ['TEACHER', 'STUDENT'];
          }
        } catch {
          // fallback: use classroomService helper
          if (fetchedCourses.length > 0) {
            try { detectedRoles = await fetchGlobalUserRoles(fetchedCourses, token); } catch {}
          }
        }

        // Always set roles regardless of course count
        setUserRoles(detectedRoles);
        const defaultRole = detectedRoles.includes('TEACHER') ? 'TEACHER' : 'STUDENT';
        setCurrentRole(defaultRole);

        if (fetchedCourses.length > 0) {
          const allAssignments = await fetchAllAssignmentsWithSubmissions(fetchedCourses, token);
          const sortedAssignments = allAssignments.sort(
            (a, b) => new Date(b.updateTime || 0).getTime() - new Date(a.updateTime || 0).getTime()
          );
          setAssignments(sortedAssignments);
          const newNotifications = getNotificationsFromAssignments(sortedAssignments);
          setNotifications(newNotifications);
          if (newNotifications.filter((n) => n.type === 'URGENT').length > 0) {
            await sendDeadlineNotificationEmail(profile.email, profile.name, sortedAssignments);
          }
        }
      } catch (err) {
        console.error('API Fetch Error:', err);
        setError('ไม่สามารถดึงข้อมูลจาก Google Classroom ได้');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่');
      setLoading(false);
    },
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const loginWithLocal = (localUser: LocalUser) => {
    setUser({ id: String(localUser.id), name: localUser.fullName, email: localUser.email, picture: '', verified_email: true, given_name: '', family_name: '', locale: 'th' });
    setLocalUserRole(localUser.role);
    const defaultCourseRole: CourseRole = localUser.role === 'teacher' ? 'TEACHER' : 'STUDENT';
    setCurrentRole(defaultCourseRole);
    setUserRoles([defaultCourseRole]);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lms_current_user', JSON.stringify(localUser));
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.email || !formData.password) {
      setFormError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const users: LocalUser[] = JSON.parse(localStorage.getItem('lms_users') || '[]');
    const found = users.find((u) => u.email === formData.email && u.password === formData.password);
    if (found) {
      loginWithLocal(found);
    } else {
      setFormError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setFormLoading(false);
  };

  const handleLocalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.fullName || !formData.email || !formData.password) {
      setFormError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setFormLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const users: LocalUser[] = JSON.parse(localStorage.getItem('lms_users') || '[]');
    if (users.find((u) => u.email === formData.email)) {
      setFormError('อีเมลนี้ถูกใช้งานแล้ว');
      setFormLoading(false);
      return;
    }
    const newUser: LocalUser = {
      id: Date.now(),
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };
    users.push(newUser);
    localStorage.setItem('lms_users', JSON.stringify(users));
    loginWithLocal(newUser);
    setFormLoading(false);
  };

  const switchAuthMode = (newMode: AuthMode) => {
    setAuthMode(newMode);
    setFormError('');
    setError(null);
    setFormData({ email: '', password: '', confirmPassword: '', fullName: '', role: 'student' });
  };

  const handleGoToClassroom = (url: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert('ไม่พบลิงก์สำหรับงานนี้');
  };

  const handleSubmitAssignment = async (courseId: string, courseWorkId: string, submissionId: string) => {
    try {
      setLoading(true);
      await turnInAssignment(courseId, courseWorkId, submissionId, accessToken);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === courseWorkId && a.courseId === courseId
            ? { ...a, submission: a.submission ? { ...a.submission, state: 'TURNED_IN' } : null }
            : a
        ) as AssignmentWithCourseInfo[]
      );
      alert('✅ ส่งงานสำเร็จแล้ว!');
    } catch (err: any) {
      alert('❌ ไม่สามารถส่งงานได้: ' + (err.response?.data?.error?.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubmitAssignment = async (courseId: string, courseWorkId: string, submissionId: string) => {
    try {
      setLoading(true);
      await reclaimAssignment(courseId, courseWorkId, submissionId, accessToken);
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === courseWorkId && a.courseId === courseId
            ? { ...a, submission: a.submission ? { ...a.submission, state: 'RECLAIMED_BY_STUDENT' } : null }
            : a
        ) as AssignmentWithCourseInfo[]
      );
      alert('✅ ยกเลิกการส่งงานสำเร็จแล้ว!');
    } catch (err: any) {
      alert('❌ ไม่สามารถยกเลิกการส่งงานได้: ' + (err.response?.data?.error?.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLocalUserRole(null);
    setCourses([]);
    setAssignments([]);
    setUserRoles([]);
    setCurrentRole(null);
    setNotifications([]);
    setAccessToken('');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('lms_current_user');
  };

  // ─── Dashboards ────────────────────────────────────────────────────────────
  if (user) {
    if (currentRole === 'TEACHER') {
      return (
        <TeacherDashboard
          user={user}
          courses={courses}
          accessToken={accessToken}
          userRoles={userRoles}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
          onLogout={handleLogout}
        />
      );
    }
    return (
      <Dashboard
        user={user}
        courses={courses}
        assignments={assignments}
        notifications={notifications}
        userRoles={userRoles}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        loading={loading}
        onGoToClassroom={handleGoToClassroom}
        onSubmitAssignment={handleSubmitAssignment}
        onUnsubmitAssignment={handleUnsubmitAssignment}
        onLogout={handleLogout}
      />
    );
  }

  // ─── Auth Page ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ar { min-height:100vh; display:flex; font-family:'DM Sans','Noto Sans Thai',sans-serif; background:#080808; overflow:hidden; position:relative; }

        /* background blobs */
        .ar-bg { position:fixed; inset:0; z-index:0; overflow:hidden; pointer-events:none; }
        .ar-bg::before { content:''; position:absolute; width:700px; height:700px; background:radial-gradient(circle, rgba(255,0,102,0.18) 0%, transparent 65%); top:-250px; left:-250px; animation:ab1 9s ease-in-out infinite; }
        .ar-bg::after  { content:''; position:absolute; width:500px; height:500px; background:radial-gradient(circle, rgba(255,0,102,0.12) 0%, transparent 65%); bottom:-180px; right:-180px; animation:ab2 11s ease-in-out infinite; }
        .ar-bg-mid { position:absolute; width:400px; height:400px; background:radial-gradient(circle, rgba(255,0,102,0.08) 0%, transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%); animation:ab3 7s ease-in-out infinite; }
        @keyframes ab1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(90px,70px) scale(1.12)} }
        @keyframes ab2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-70px,-90px) scale(0.88)} }
        @keyframes ab3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.18)} }

        .ar-grid { position:fixed; inset:0; z-index:0; background-image: linear-gradient(rgba(255,0,102,0.035) 1px,transparent 1px), linear-gradient(90deg,rgba(255,0,102,0.035) 1px,transparent 1px); background-size:52px 52px; pointer-events:none; }

        /* hero left */
        .ar-left { display:none; flex:1; flex-direction:column; justify-content:center; padding:72px; position:relative; z-index:1; }
        @media(min-width:940px){ .ar-left { display:flex; } }

        .brand { display:inline-flex; align-items:center; gap:12px; margin-bottom:72px; }
        .brand-icon { width:40px; height:40px; background:#ff0066; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(255,0,102,0.35); }
        .brand-icon svg { width:20px; height:20px; }
        .brand-name { font-size:20px; font-weight:700; color:#fff; letter-spacing:-0.4px; }

        .hero-hl { font-size:clamp(40px,4.5vw,64px); font-weight:700; line-height:1.05; color:#fff; letter-spacing:-2px; margin-bottom:22px; }
        .hero-hl em { color:#ff0066; font-style:normal; display:block; }
        .hero-sub { font-size:15px; color:rgba(255,255,255,0.42); line-height:1.8; max-width:380px; font-family:'Noto Sans Thai',sans-serif; }

        .stats { display:flex; gap:36px; margin-top:60px; }
        .stat-val { font-size:28px; font-weight:700; color:#fff; letter-spacing:-1px; display:block; }
        .stat-lbl { font-size:11px; color:rgba(255,255,255,0.32); letter-spacing:0.5px; font-family:'Noto Sans Thai',sans-serif; margin-top:3px; display:block; }

        /* auth right panel */
        .ar-right { width:100%; max-width:500px; margin:auto; display:flex; flex-direction:column; justify-content:center; padding:24px; position:relative; z-index:1; }
        @media(min-width:940px){ .ar-right { padding:52px 60px; } }

        /* ══ TOP TAB BAR ══
           Sits above the card, flush with its top border.
           Active tab "connects" to the card by removing the bottom border under it.
        */
        .tab-bar {
          display: flex;
          align-items: stretch;
          position: relative;
          z-index: 2;
          /* matches card border color */
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .tab-btn {
          position: relative;
          flex: 1;
          padding: 13px 0 14px;
          background: transparent;
          border: 1px solid transparent;
          border-bottom: none;
          color: rgba(255,255,255,0.32);
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.1px;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          font-family: 'Noto Sans Thai','DM Sans',sans-serif;
          outline: none;
          border-radius: 12px 12px 0 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .tab-btn:hover { color: rgba(255,255,255,0.6); }

        /* Active tab: looks like it's part of the card below */
        .tab-btn.on {
          color: #fff;
          font-weight: 600;
          background: rgba(255,255,255,0.038);
          border-color: rgba(255,255,255,0.08);
          /* overlap the tab-bar bottom border to connect seamlessly */
          margin-bottom: -1px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.038); /* same as card bg */
        }

        /* Hot pink accent line on top of active tab */
        .tab-btn.on::before {
          content: '';
          position: absolute;
          top: -1px; left: 12px; right: 12px;
          height: 2px;
          background: #ff0066;
          border-radius: 0 0 3px 3px;
          box-shadow: 0 0 10px rgba(255,0,102,0.6);
          animation: tabLine 0.25s ease;
        }
        @keyframes tabLine { from{opacity:0;left:50%;right:50%} to{opacity:1;left:12px;right:12px} }

        /* Small dot badge */
        .tab-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #ff0066;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(255,0,102,0.7);
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.7)} }

        /* Card: no top border/radius — the tabs act as the top */
        .ar-card {
          background: rgba(255,255,255,0.038);
          border: 1px solid rgba(255,255,255,0.08);
          border-top: none;
          border-radius: 0 0 20px 20px;
          padding: 28px 28px 26px;
          backdrop-filter: blur(28px);
          animation: slideUp 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        /* Form fields */
        .fg { margin-bottom: 14px; }
        .fl { display:block; font-size:11px; font-weight:500; color:rgba(255,255,255,0.38); margin-bottom:6px; letter-spacing:0.6px; text-transform:uppercase; }
        .fi { width:100%; padding:11px 13px; background:rgba(255,255,255,0.055); border:1px solid rgba(255,255,255,0.09); border-radius:10px; color:#fff; font-size:14px; transition:all 0.2s; outline:none; font-family:'DM Sans',sans-serif; }
        .fi::placeholder { color:rgba(255,255,255,0.18); }
        .fi:focus { border-color:#ff0066; background:rgba(255,0,102,0.07); box-shadow:0 0 0 3px rgba(255,0,102,0.1); }

        /* Role cards */
        .role-row { display:flex; gap:10px; }
        .rc { flex:1; padding:12px 10px 11px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.09); border-radius:11px; cursor:pointer; transition:all 0.2s; display:flex; flex-direction:column; align-items:center; gap:6px; position:relative; user-select:none; }
        .rc:hover { border-color:rgba(255,0,102,0.35); }
        .rc.on { border-color:#ff0066; background:rgba(255,0,102,0.09); box-shadow:0 0 0 3px rgba(255,0,102,0.08); }
        .rc-icon { width:32px; height:32px; background:rgba(255,255,255,0.07); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; transition:background 0.2s; }
        .rc.on .rc-icon { background:rgba(255,0,102,0.22); }
        .rc-name { font-size:12px; font-weight:600; color:rgba(255,255,255,0.5); font-family:'Noto Sans Thai',sans-serif; transition:color 0.2s; }
        .rc.on .rc-name { color:#fff; }
        .rc-check { position:absolute; top:7px; right:7px; width:14px; height:14px; background:#ff0066; border-radius:50%; display:flex; align-items:center; justify-content:center; opacity:0; transform:scale(0.4); transition:all 0.2s; }
        .rc.on .rc-check { opacity:1; transform:scale(1); }
        .rc-check::after { content:'✓'; font-size:8px; color:#fff; font-weight:700; }

        /* Error */
        .err { background:rgba(255,0,102,0.09); border:1px solid rgba(255,0,102,0.25); border-radius:10px; padding:9px 13px; font-size:13px; color:#ff7aaa; margin-bottom:14px; font-family:'Noto Sans Thai',sans-serif; }

        /* Primary CTA */
        .btn-p { width:100%; padding:12px; background:#ff0066; border:none; border-radius:11px; color:#fff; font-size:15px; font-weight:600; cursor:pointer; transition:all 0.2s; font-family:'Noto Sans Thai','DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px; position:relative; overflow:hidden; box-shadow:0 4px 20px rgba(255,0,102,0.28); }
        .btn-p::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 55%); opacity:0; transition:opacity 0.2s; }
        .btn-p:hover { background:#e6005c; box-shadow:0 6px 28px rgba(255,0,102,0.42); }
        .btn-p:hover::before { opacity:1; }
        .btn-p:active { transform:scale(0.985); }
        .btn-p:disabled { opacity:0.55; cursor:not-allowed; }

        /* Google CTA */
        .btn-g { width:100%; padding:11px 14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:11px; color:rgba(255,255,255,0.65); font-size:14px; font-weight:500; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; display:flex; align-items:center; justify-content:center; gap:10px; }
        .btn-g:hover { background:rgba(255,255,255,0.09); border-color:rgba(255,255,255,0.18); color:#fff; }
        .btn-g img { width:16px; height:16px; border-radius:2px; }

        .spinner { width:15px; height:15px; border:2px solid rgba(255,255,255,0.25); border-top-color:#fff; border-radius:50%; animation:spin 0.6s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .div-row { display:flex; align-items:center; gap:12px; margin:16px 0; }
        .div-line { flex:1; height:1px; background:rgba(255,255,255,0.07); }
        .div-txt { font-size:11px; color:rgba(255,255,255,0.22); white-space:nowrap; font-family:'Noto Sans Thai',sans-serif; letter-spacing:0.3px; }

        /* Loading overlay */
        .ov { position:fixed; inset:0; z-index:9999; background:rgba(8,8,8,0.82); backdrop-filter:blur(10px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; }
        .ov-txt { font-size:14px; color:rgba(255,255,255,0.5); font-family:'Noto Sans Thai',sans-serif; }

        .footer { text-align:center; margin-top:20px; font-size:11px; color:rgba(255,255,255,0.14); font-family:'Noto Sans Thai',sans-serif; letter-spacing:0.3px; }
      `}</style>

      <div className="ar">
        <div className="ar-bg"><div className="ar-bg-mid" /></div>
        <div className="ar-grid" />

        {loading && (
          <div className="ov">
            <Loader2 style={{ width:40, height:40, color:'#ff0066', animation:'spin 0.8s linear infinite' }} />
            <p className="ov-txt">กำลังซิงค์ข้อมูลจาก Google Classroom...</p>
          </div>
        )}

        {/* ── Hero Left ── */}
        <div className="ar-left">
          <div className="brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="brand-name">LMS Portal</span>
          </div>
          <div>
            <h1 className="hero-hl">เรียนรู้<em>ไร้ขีดจำกัด.</em></h1>
            <p className="hero-sub">
              แพลตฟอร์มการเรียนรู้ออนไลน์<br/>
              สำหรับครูและนักเรียน ครบในที่เดียว
            </p>
          </div>
          <div className="stats">
            <div><span className="stat-val">12k+</span><span className="stat-lbl">นักเรียน</span></div>
            <div><span className="stat-val">840+</span><span className="stat-lbl">ครูผู้สอน</span></div>
            <div><span className="stat-val">3.2k+</span><span className="stat-lbl">รายวิชา</span></div>
          </div>
        </div>

        {/* ── Auth Right ── */}
        <div className="ar-right">

          {/* ══ TOP TAB BAR ══ */}
          <div className="tab-bar">
            <button
              className={`tab-btn${authMode === 'login' ? ' on' : ''}`}
              onClick={() => switchAuthMode('login')}
            >
              เข้าสู่ระบบ
            </button>
            <button
              className={`tab-btn${authMode === 'register' ? ' on' : ''}`}
              onClick={() => switchAuthMode('register')}
            >
              สมัครสมาชิก
              {authMode === 'login' && <span className="tab-dot" />}
            </button>
          </div>

          {/* ══ CARD (attached to tab bar) ══ */}
          <div className="ar-card">

            {(error || formError) && (
              <div className="err">⚠ {formError || error}</div>
            )}

            {/* LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLocalLogin}>
                <div className="fg">
                  <label className="fl">อีเมล</label>
                  <input className="fi" type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleFormChange} autoComplete="email" />
                </div>
                <div className="fg" style={{ marginBottom:20 }}>
                  <label className="fl">รหัสผ่าน</label>
                  <input className="fi" type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleFormChange} autoComplete="current-password" />
                </div>
                <button className="btn-p" type="submit" disabled={formLoading}>
                  {formLoading ? <><span className="spinner" />กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleLocalRegister}>
                <div className="fg">
                  <label className="fl">ชื่อ-นามสกุล</label>
                  <input className="fi" type="text" name="fullName" placeholder="ชื่อ นามสกุล" value={formData.fullName} onChange={handleFormChange} />
                </div>
                <div className="fg">
                  <label className="fl">อีเมล</label>
                  <input className="fi" type="email" name="email" placeholder="your@email.com" value={formData.email} onChange={handleFormChange} autoComplete="email" />
                </div>
                <div className="fg">
                  <label className="fl">รหัสผ่าน</label>
                  <input className="fi" type="password" name="password" placeholder="อย่างน้อย 6 ตัวอักษร" value={formData.password} onChange={handleFormChange} autoComplete="new-password" />
                </div>
                <div className="fg">
                  <label className="fl">ยืนยันรหัสผ่าน</label>
                  <input className="fi" type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleFormChange} autoComplete="new-password" />
                </div>
                <div className="fg" style={{ marginBottom:20 }}>
                  <label className="fl">บทบาท</label>
                  <div className="role-row">
                    <div className={`rc${formData.role === 'student' ? ' on' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'student' }))}>
                      <div className="rc-check" />
                      <div className="rc-icon">🎓</div>
                      <span className="rc-name">นักเรียน</span>
                    </div>
                    <div className={`rc${formData.role === 'teacher' ? ' on' : ''}`} onClick={() => setFormData(p => ({ ...p, role: 'teacher' }))}>
                      <div className="rc-check" />
                      <div className="rc-icon">👨‍🏫</div>
                      <span className="rc-name">ครู / อาจารย์</span>
                    </div>
                  </div>
                </div>
                <button className="btn-p" type="submit" disabled={formLoading}>
                  {formLoading ? <><span className="spinner" />กำลังสร้างบัญชี...</> : 'สร้างบัญชี'}
                </button>
              </form>
            )}

            <div className="div-row">
              <div className="div-line" />
              <span className="div-txt">หรือเข้าด้วยบัญชีระบบ</span>
              <div className="div-line" />
            </div>

            {/* Google Classroom — auto-detects teacher / student role */}
            <div style={{ background:'rgba(255,0,102,0.06)', border:'1px solid rgba(255,0,102,0.2)', borderRadius:13, padding:'13px 15px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff0066', boxShadow:'0 0 6px rgba(255,0,102,.8)', animation:'blink 1.8s ease-in-out infinite', flexShrink:0 }} />
                <span style={{ fontSize:11, fontWeight:600, color:'rgba(255,0,102,.9)', letterSpacing:.3 }}>แนะนำ — ถ้าคุณมีบัญชี Google Classroom</span>
              </div>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.45)', marginBottom:11, lineHeight:1.65, fontFamily:"'Noto Sans Thai',sans-serif" }}>
                ระบบจะ<span style={{ color:'rgba(255,255,255,.75)', fontWeight:600 }}>ตรวจสอบบทบาทอัตโนมัติ</span> — ถ้าบัญชีของคุณเป็นครูใน Classroom จะเข้าหน้าครูทันที ไม่ต้องเลือกบทบาท
              </p>
              <button className="btn-g" onClick={() => { setError(null); googleLogin(); }} disabled={loading}
                style={{ background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.15)', color:'#fff' }}>
                <img src="https://www.google.com/favicon.ico" alt="Google" />
                เข้าสู่ระบบด้วย Google Classroom
              </button>
            </div>

            <p className="footer">© 2026 LMS Portal · All rights reserved</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;