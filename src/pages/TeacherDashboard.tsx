import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { GoogleUser, Course, CourseWork, Student, StudentSubmission, CourseRole } from '../types/googleClassroom';
import {
  LogOut, BookOpen, Users, BarChart3, Plus, Menu, X,
  Home, ChevronRight, Palette, Check, Sun, Moon,
  TrendingUp, Clock, CheckCircle2, AlertCircle, Award,
  RefreshCw, Loader2, WifiOff
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { fetchTeacherCourseData } from '../services/classroomTeacherService';

interface TeacherDashboardProps {
  user: GoogleUser;
  courses: Course[];
  accessToken: string;               // ← รับ token จาก App.tsx
  userRoles?: CourseRole[];
  currentRole?: CourseRole | null;
  onRoleChange?: (role: CourseRole) => void;
  onLogout: () => void;
}

const THEMES = [
  { id:'pink',    label:'Pink',    hex:'#ff0066', dark:'#cc0052' },
  { id:'violet',  label:'Violet',  hex:'#7c3aed', dark:'#5b21b6' },
  { id:'blue',    label:'Blue',    hex:'#2563eb', dark:'#1d4ed8' },
  { id:'cyan',    label:'Cyan',    hex:'#06b6d4', dark:'#0891b2' },
  { id:'emerald', label:'Emerald', hex:'#10b981', dark:'#059669' },
  { id:'amber',   label:'Amber',   hex:'#f59e0b', dark:'#d97706' },
  { id:'rose',    label:'Rose',    hex:'#f43f5e', dark:'#e11d48' },
  { id:'orange',  label:'Orange',  hex:'#f97316', dark:'#ea580c' },
] as const;
type ThemeId = typeof THEMES[number]['id'];

function hexToRgb(h: string) {
  return { r:parseInt(h.slice(1,3),16), g:parseInt(h.slice(3,5),16), b:parseInt(h.slice(5,7),16) };
}

export default function TeacherDashboard({
  user, courses, accessToken,
  userRoles=[], currentRole='TEACHER', onRoleChange, onLogout,
}: TeacherDashboardProps) {
  // ── UI state ──────────────────────────────────────────────────────
  const [page, setPage]             = useState<'overview'|'students'|'assignments'>('overview');
  const [menuOpen, setMenuOpen]     = useState(false);
  const [themeOpen, setThemeOpen]   = useState(false);
  const [themeId, setThemeId]       = useState<ThemeId>('pink');
  const [customHex, setCustomHex]   = useState('');
  const [isDark, setIsDark]         = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course|null>(courses[0]??null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle]     = useState('');
  const [newDesc, setNewDesc]       = useState('');
  const [newDue, setNewDue]         = useState('');
  const [newPts, setNewPts]         = useState('100');
  const themeRef = useRef<HTMLDivElement>(null);

  // ── Data state ────────────────────────────────────────────────────
  const [courseWorkList,  setCourseWorkList]  = useState<CourseWork[]>([]);
  const [studentsList,    setStudentsList]    = useState<Student[]>([]);
  const [submissionsList, setSubmissionsList] = useState<StudentSubmission[]>([]);
  const [dataLoading, setDataLoading]         = useState(false);
  const [dataError,   setDataError]           = useState<string|null>(null);
  const [lastFetched, setLastFetched]         = useState<string|null>(null); // courseId

  // ── Fetch real data from Classroom API ───────────────────────────
  const loadCourseData = useCallback(async (course: Course) => {
    if (!accessToken) return;
    setDataLoading(true);
    setDataError(null);
    try {
      const { courseWork, students, submissions } =
        await fetchTeacherCourseData(course.id, accessToken);
      setCourseWorkList(courseWork);
      setStudentsList(students);
      setSubmissionsList(submissions);
      setLastFetched(course.id);
    } catch (err: any) {
      setDataError(err.message ?? 'ไม่สามารถดึงข้อมูลได้');
      setCourseWorkList([]);
      setStudentsList([]);
      setSubmissionsList([]);
    } finally {
      setDataLoading(false);
    }
  }, [accessToken]);

  // Auto-load when selected course changes
  useEffect(() => {
    if (selectedCourse && selectedCourse.id !== lastFetched) {
      loadCourseData(selectedCourse);
    }
  }, [selectedCourse, loadCourseData, lastFetched]);

  // ── Theme setup ───────────────────────────────────────────────────
  const activeTheme = useMemo(() => {
    if (customHex && /^#[0-9a-fA-F]{6}$/.test(customHex))
      return { id:'custom' as ThemeId, label:'Custom', hex:customHex, dark:customHex };
    return THEMES.find(t=>t.id===themeId) ?? THEMES[0];
  }, [themeId, customHex]);

  useEffect(() => {
    const {r,g,b} = hexToRgb(activeTheme.hex);
    const el = document.getElementById('lms-theme') ?? (() => {
      const e=document.createElement('style'); e.id='lms-theme'; document.head.appendChild(e); return e;
    })();
    el.textContent = isDark ? `
      :root{--accent:${activeTheme.hex};--accent-dark:${activeTheme.dark};
        --accent-dim:rgba(${r},${g},${b},.12);--accent-glow:rgba(${r},${g},${b},.35);--accent-border:rgba(${r},${g},${b},.28);
        --bg:#090909;--bg2:#111;--surface:rgba(255,255,255,.04);--surface2:rgba(255,255,255,.07);
        --border:rgba(255,255,255,.08);--border2:rgba(255,255,255,.14);
        --text:#fff;--text2:rgba(255,255,255,.7);--muted:rgba(255,255,255,.4);--hint:rgba(255,255,255,.22);
        --nav-bg:rgba(9,9,9,.92);--input-bg:rgba(255,255,255,.05);--tooltip-bg:#1c1c1c;--shadow:rgba(0,0,0,.5);
        --chart-grid:rgba(255,255,255,.06);--perf-grad:linear-gradient(135deg,${activeTheme.hex},${activeTheme.dark});}` : `
      :root{--accent:${activeTheme.hex};--accent-dark:${activeTheme.dark};
        --accent-dim:rgba(${r},${g},${b},.1);--accent-glow:rgba(${r},${g},${b},.22);--accent-border:rgba(${r},${g},${b},.3);
        --bg:#f1f3f6;--bg2:#e8eaed;--surface:rgba(255,255,255,.92);--surface2:#fff;
        --border:rgba(0,0,0,.08);--border2:rgba(0,0,0,.15);
        --text:#0f0f10;--text2:#333;--muted:#666;--hint:#999;
        --nav-bg:rgba(255,255,255,.96);--input-bg:rgba(0,0,0,.04);--tooltip-bg:#fff;--shadow:rgba(0,0,0,.12);
        --chart-grid:rgba(0,0,0,.06);--perf-grad:linear-gradient(135deg,${activeTheme.hex},${activeTheme.dark});}`;
    localStorage.setItem('lms-theme', JSON.stringify({id:themeId,custom:customHex,dark:isDark}));
  }, [activeTheme, isDark, themeId, customHex]);

  useEffect(() => {
    try {
      const s=JSON.parse(localStorage.getItem('lms-theme')||'{}');
      if (s.id) setThemeId(s.id);
      if (s.custom) setCustomHex(s.custom);
      if (typeof s.dark==='boolean') setIsDark(s.dark);
    } catch {}
    const outside=(e:MouseEvent)=>{
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', outside);
    return ()=>document.removeEventListener('mousedown', outside);
  }, []);

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total  = submissionsList.length;
    const turned = submissionsList.filter(s=>s.state==='TURNED_IN').length;
    const pending= submissionsList.filter(s=>s.state==='NEW').length;
    const late   = submissionsList.filter(s=>s.late).length;
    const graded = submissionsList.filter(s=>s.assignedGrade!=null);
    const avg    = graded.length ? Math.round(graded.reduce((a,s)=>a+(s.assignedGrade??0),0)/graded.length) : 0;
    const subRate= total ? Math.round((turned/total)*100) : 0;
    return { total, turned, pending, late, avg, subRate, students:studentsList.length };
  }, [submissionsList, studentsList]);

  // ── Chart data ────────────────────────────────────────────────────
  const barData = useMemo(() => courseWorkList.map(w => {
    const ws = submissionsList.filter(s=>s.courseWorkId===w.id);
    return {
      name: w.title.length>18 ? w.title.slice(0,16)+'…' : w.title,
      ส่งแล้ว: ws.filter(s=>s.state==='TURNED_IN').length,
      รอส่ง:   ws.filter(s=>s.state==='NEW').length,
      ส่งสาย:  ws.filter(s=>s.late).length,
    };
  }), [courseWorkList, submissionsList]);

  const pieData = useMemo(() => [
    { name:'ส่งแล้ว', value:stats.turned,  color:activeTheme.hex },
    { name:'รอส่ง',   value:stats.pending, color:'#f59e0b' },
    { name:'ส่งสาย',  value:stats.late,    color:'#f43f5e' },
  ].filter(d=>d.value>0), [stats, activeTheme]);

  const navItems   = [
    { id:'overview',    label:'ภาพรวม',  icon:Home },
    { id:'students',    label:'นักเรียน', icon:Users },
    { id:'assignments', label:'งาน',      icon:BarChart3 },
  ] as const;

  const initials     = user.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  const tooltipStyle = { background:'var(--tooltip-bg)', border:'1px solid var(--border)', borderRadius:10, fontSize:12, color:'var(--text)' };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--accent:#ff0066;--accent-dark:#cc0052;--accent-dim:rgba(255,0,102,.12);--accent-glow:rgba(255,0,102,.35);--accent-border:rgba(255,0,102,.28);--bg:#090909;--bg2:#111;--surface:rgba(255,255,255,.04);--surface2:rgba(255,255,255,.07);--border:rgba(255,255,255,.08);--border2:rgba(255,255,255,.14);--text:#fff;--text2:rgba(255,255,255,.7);--muted:rgba(255,255,255,.4);--hint:rgba(255,255,255,.22);--nav-bg:rgba(9,9,9,.92);--input-bg:rgba(255,255,255,.05);--tooltip-bg:#1c1c1c;--shadow:rgba(0,0,0,.5);--chart-grid:rgba(255,255,255,.06);--perf-grad:linear-gradient(135deg,#ff0066,#cc0052);--font:'DM Sans','Noto Sans Thai',sans-serif;--r:14px;--rs:10px;--rl:16px}
        .t{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text);transition:background .25s,color .25s}
        .t::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(255,0,102,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,102,.02) 1px,transparent 1px);background-size:52px 52px}

        /* NAV */
        .nav{position:sticky;top:0;z-index:200;background:var(--nav-bg);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);transition:background .25s,border-color .25s}
        .nav-strip{display:grid;grid-template-columns:auto 1fr auto;align-items:stretch;height:56px;padding:0 20px}
        .nav-brand{display:flex;align-items:center;gap:10px;padding-right:20px;border-right:1px solid var(--border);flex-shrink:0}
        .nb-icon{width:32px;height:32px;background:var(--accent);border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px var(--accent-glow);flex-shrink:0;transition:background .3s}
        .nb-icon svg{width:16px;height:16px}
        .nb-name{font-size:15px;font-weight:700;letter-spacing:-.3px;white-space:nowrap;color:var(--text)}
        .nb-badge{font-size:9px;font-weight:700;background:var(--accent-dim);color:var(--accent);border:1px solid var(--accent-border);border-radius:6px;padding:2px 8px;white-space:nowrap;letter-spacing:.3px}
        .nav-tabs{display:none;align-items:stretch;padding:0 4px;gap:2px}
        @media(min-width:768px){.nav-tabs{display:flex}}
        .nav-tab{position:relative;display:flex;align-items:center;gap:7px;padding:0 14px;height:100%;background:transparent;border:none;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .18s;font-family:var(--font)}
        .nav-tab svg{width:14px;height:14px;flex-shrink:0}
        .nav-tab:hover{color:var(--text2)}
        .nav-tab.on{color:var(--text);font-weight:600}
        .nav-tab.on::after{content:'';position:absolute;bottom:0;left:12px;right:12px;height:2px;background:var(--accent);border-radius:2px 2px 0 0;box-shadow:0 0 8px var(--accent-glow);animation:tabIn .22s ease}
        @keyframes tabIn{from{left:50%;right:50%;opacity:0}to{left:12px;right:12px;opacity:1}}
        .nav-right{display:flex;align-items:center;gap:8px;padding-left:16px;border-left:1px solid var(--border)}
        .icon-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s}
        .icon-btn:hover{background:var(--surface2);color:var(--text)}
        .icon-btn.logout:hover{background:var(--accent-dim);border-color:var(--accent-border);color:var(--accent)}
        .icon-btn svg{width:14px;height:14px}
        .icon-btn.aic{background:var(--accent-dim);border-color:var(--accent-border);color:var(--accent)}
        .ham{display:flex}
        @media(min-width:768px){.ham{display:none}}
        .mode-toggle{display:flex;align-items:center;width:56px;height:28px;border-radius:14px;background:var(--surface);border:1px solid var(--border);cursor:pointer;padding:3px;transition:all .25s;position:relative;flex-shrink:0}
        .mode-thumb{width:22px;height:22px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;transition:transform .25s cubic-bezier(.22,1,.36,1);box-shadow:0 2px 8px var(--accent-glow);flex-shrink:0}
        .mode-thumb.lt{transform:translateX(28px)}
        .mode-thumb svg{width:12px;height:12px;color:#fff}
        .role-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:20px}
        .role-pill span{font-size:10px;color:var(--hint)}
        .role-pill select{background:transparent;border:none;color:var(--text2);font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:var(--font)}
        .role-pill select option{background:var(--bg2)}
        .user-chip{display:flex;align-items:center;gap:7px;padding:3px 8px 3px 4px;background:var(--surface);border:1px solid var(--border);border-radius:20px}
        .user-chip img{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--accent-border);flex-shrink:0}
        .uc-init{width:26px;height:26px;border-radius:50%;background:var(--accent-dim);border:1.5px solid var(--accent-border);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);flex-shrink:0}
        .uc-info{display:none}
        @media(min-width:520px){.uc-info{display:block}}
        .uc-name{font-size:12px;font-weight:600;line-height:1.2;color:var(--text)}
        .uc-role{font-size:10px;color:var(--hint)}
        .theme-wrap{position:relative}
        .theme-picker{position:absolute;top:calc(100% + 10px);right:0;background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:16px;width:232px;z-index:300;box-shadow:0 16px 40px var(--shadow);animation:popIn .18s cubic-bezier(.22,1,.36,1)}
        @keyframes popIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .tp-ttl{font-size:11px;font-weight:600;color:var(--hint);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px}
        .tp-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
        .tp-sw{width:100%;aspect-ratio:1;border-radius:10px;border:2px solid transparent;cursor:pointer;transition:transform .15s,border-color .15s;display:flex;align-items:center;justify-content:center}
        .tp-sw:hover{transform:scale(1.08)}
        .tp-sw.sel{border-color:rgba(255,255,255,.55)}
        .tp-sw svg{width:14px;height:14px;color:#fff;opacity:0;transition:opacity .15s}
        .tp-sw.sel svg{opacity:1}
        .tp-lbl{font-size:10px;color:var(--hint);text-align:center;margin-top:3px}
        .tp-div{height:1px;background:var(--border);margin:0 0 12px}
        .tp-cttl{font-size:11px;font-weight:600;color:var(--hint);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px}
        .tp-row{display:flex;align-items:center;gap:8px}
        .tp-ci{width:36px;height:36px;border-radius:9px;border:1px solid var(--border);background:var(--surface);cursor:pointer;padding:3px;overflow:hidden}
        .tp-ci::-webkit-color-swatch-wrapper{padding:0;border-radius:6px}
        .tp-ci::-webkit-color-swatch{border:none;border-radius:6px}
        .tp-hi{flex:1;padding:7px 10px;background:var(--surface);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:12px;font-family:'DM Sans',monospace;outline:none;transition:border-color .18s}
        .tp-hi:focus{border-color:var(--accent)}
        .tp-hi::placeholder{color:var(--hint)}
        .mob-nav{display:flex;flex-direction:column;gap:3px;padding:10px 12px 14px;border-top:1px solid var(--border);background:var(--nav-bg)}
        @media(min-width:768px){.mob-nav{display:none !important}}
        .mob-item{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:transparent;border:1px solid transparent;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;width:100%;transition:all .18s;font-family:var(--font)}
        .mob-item:hover{background:var(--surface);color:var(--text2)}
        .mob-item.on{background:var(--accent-dim);color:var(--text);font-weight:600;border-color:var(--accent-border)}
        .mob-item svg{width:15px;height:15px;flex-shrink:0}
        .mob-logout{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:transparent;border:none;color:var(--hint);font-size:13px;cursor:pointer;width:100%;transition:all .18s;font-family:var(--font);margin-top:4px}
        .mob-logout:hover{background:var(--accent-dim);color:var(--accent)}
        .mob-logout svg{width:15px;height:15px}

        /* PAGE */
        .page{position:relative;z-index:1;padding:24px 24px 48px;max-width:1440px;margin:0 auto;animation:up .3s cubic-bezier(.22,1,.36,1)}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* sub-header */
        .sub-hd{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px}
        .sub-hd-l{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
        .ph-title{font-size:20px;font-weight:700;letter-spacing:-.5px;color:var(--text)}
        .ph-div{color:var(--border);font-size:18px}
        .course-sel{padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;font-weight:500;outline:none;cursor:pointer;font-family:var(--font);transition:border-color .18s;max-width:220px}
        .course-sel option{background:var(--bg2)}
        .course-sel:focus{border-color:var(--accent)}
        .btn-cre{display:inline-flex;align-items:center;gap:7px;padding:8px 16px;background:var(--accent);border:none;border-radius:var(--rs);color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--font);box-shadow:0 4px 16px var(--accent-glow)}
        .btn-cre:hover{filter:brightness(1.1)}
        .btn-cre svg{width:14px;height:14px}
        .btn-refresh{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;transition:all .2s;font-family:var(--font)}
        .btn-refresh:hover{border-color:var(--accent-border);color:var(--accent)}
        .btn-refresh svg{width:13px;height:13px}
        .btn-refresh.spinning svg{animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        /* loading / error states */
        .loading-box{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:80px 20px;color:var(--muted);font-size:13px;font-family:'Noto Sans Thai',sans-serif}
        .loading-box svg{animation:spin .8s linear infinite;color:var(--accent)}
        .error-box{display:flex;align-items:flex-start;gap:12px;padding:16px 18px;background:rgba(244,63,94,.08);border:1px solid rgba(244,63,94,.2);border-radius:var(--r);margin-bottom:20px}
        .error-box svg{color:#f87171;flex-shrink:0;margin-top:1px}
        .error-title{font-size:13px;font-weight:600;color:#f87171;margin-bottom:3px}
        .error-msg{font-size:12px;color:var(--hint);font-family:'Noto Sans Thai',sans-serif;line-height:1.5}
        .btn-retry{margin-top:8px;padding:6px 14px;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.25);border-radius:8px;color:#f87171;font-size:12px;font-weight:600;cursor:pointer;font-family:var(--font);transition:all .18s}
        .btn-retry:hover{background:rgba(244,63,94,.2)}

        /* stat grid */
        .sg{display:grid;gap:10px;margin-bottom:20px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:640px){.sg{grid-template-columns:repeat(3,1fr)}}
        @media(min-width:1200px){.sg{grid-template-columns:repeat(6,1fr)}}
        .sc{padding:14px 16px 12px;border-radius:var(--r);background:var(--surface);border:1px solid var(--border);border-top:2.5px solid var(--accent);position:relative;overflow:hidden;transition:transform .18s,border-color .18s,background .25s}
        .sc:hover{transform:translateY(-2px)}
        .sc.g{border-top-color:#22c55e}.sc.a{border-top-color:#f59e0b}.sc.p{border-top-color:#a855f7}.sc.b{border-top-color:#06b6d4}.sc.r{border-top-color:#f43f5e}
        .sc-label{font-size:10px;font-weight:500;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
        .sc-val{font-size:26px;font-weight:700;letter-spacing:-1px;line-height:1;color:var(--text)}
        .sc-ico{position:absolute;bottom:10px;right:10px;width:24px;height:24px;border-radius:7px;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center}
        .sc.g .sc-ico{background:rgba(34,197,94,.12);color:rgba(34,197,94,.8)}
        .sc.a .sc-ico{background:rgba(245,158,11,.12);color:rgba(245,158,11,.8)}
        .sc.p .sc-ico{background:rgba(168,85,247,.12);color:rgba(168,85,247,.8)}
        .sc.b .sc-ico{background:rgba(6,182,212,.12);color:rgba(6,182,212,.8)}
        .sc.r .sc-ico{background:rgba(244,63,94,.12);color:rgba(244,63,94,.8)}
        .sc-ico svg{width:12px;height:12px}

        /* panel */
        .panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--rl);padding:20px;transition:background .25s,border-color .25s}
        .panel-hd{font-size:13px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;color:var(--text)}
        .panel-hd::before{content:'';width:3px;height:13px;border-radius:2px;background:var(--accent);display:block;flex-shrink:0;transition:background .3s}
        .ov-grid{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:1024px){.ov-grid{grid-template-columns:1fr 1fr}}
        .chart-box{height:240px}

        /* perf */
        .perf{background:var(--perf-grad);border-radius:var(--r);padding:20px;position:relative;overflow:hidden}
        .perf::before{content:'';position:absolute;width:160px;height:160px;background:rgba(255,255,255,.07);border-radius:50%;top:-60px;right:-50px;pointer-events:none}
        .perf-hd{display:flex;align-items:center;gap:10px;margin-bottom:16px;position:relative;z-index:1}
        .perf-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;position:relative;z-index:1}
        .perf-row+.perf-row{border-top:1px solid rgba(255,255,255,.15)}
        .perf-lbl{font-size:12px;font-weight:500;color:rgba(255,255,255,.78)}
        .perf-val{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.5px}
        .perf-big{font-size:32px;font-weight:700;color:#fff;letter-spacing:-1.5px}
        .prog{height:4px;border-radius:4px;background:rgba(255,255,255,.15);margin-top:12px;overflow:hidden;position:relative;z-index:1}
        .prog-fill{height:100%;border-radius:4px;background:rgba(255,255,255,.8);transition:width .6s cubic-bezier(.22,1,.36,1)}

        /* table */
        .asgn-table{width:100%;border-collapse:collapse}
        .asgn-table th{font-size:11px;font-weight:600;color:var(--hint);letter-spacing:.5px;text-transform:uppercase;padding:8px 12px;text-align:left;border-bottom:1px solid var(--border)}
        .asgn-table td{font-size:13px;color:var(--text2);padding:11px 12px;border-bottom:1px solid var(--border)}
        .asgn-table tr:last-child td{border-bottom:none}
        .asgn-table tr:hover td{background:var(--surface2)}
        .badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;display:inline-flex;align-items:center}
        .badge.g{background:rgba(34,197,94,.12);color:#4ade80}
        .badge.a{background:rgba(245,158,11,.12);color:#fbbf24}
        .badge.r{background:rgba(244,63,94,.12);color:#f87171}

        /* students */
        .student-grid{display:grid;gap:10px;grid-template-columns:1fr}
        @media(min-width:640px){.student-grid{grid-template-columns:repeat(2,1fr)}}
        @media(min-width:1100px){.student-grid{grid-template-columns:repeat(4,1fr)}}
        .student-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:16px;transition:transform .18s,border-color .18s,background .25s}
        .student-card:hover{transform:translateY(-2px);border-color:var(--accent-border)}
        .s-top{display:flex;align-items:center;gap:12px;margin-bottom:14px}
        .s-avatar{width:44px;height:44px;border-radius:50%;background:var(--accent-dim);border:2px solid var(--accent-border);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:var(--accent);flex-shrink:0}
        .s-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:2px}
        .s-email{font-size:11px;color:var(--hint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px}
        .s-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:12px;border-top:1px solid var(--border)}
        .s-stat-lbl{font-size:9px;color:var(--hint);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
        .s-stat-val{font-size:18px;font-weight:700;color:var(--text);letter-spacing:-.5px}
        .s-prog{height:3px;border-radius:3px;background:var(--border);overflow:hidden;margin-top:10px}
        .s-prog-fill{height:100%;border-radius:3px;transition:width .5s cubic-bezier(.22,1,.36,1)}

        /* assignment cards */
        .ag{display:grid;gap:12px;grid-template-columns:1fr}
        @media(min-width:640px){.ag{grid-template-columns:repeat(2,1fr)}}
        @media(min-width:1100px){.ag{grid-template-columns:repeat(3,1fr)}}
        .ac{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:18px;transition:transform .2s,border-color .2s,background .25s}
        .ac:hover{transform:translateY(-2px);border-color:var(--accent-border)}
        .ac-bar{height:3px;border-radius:3px;margin-bottom:14px}
        .ac-title{font-size:14px;font-weight:600;color:var(--text);margin-bottom:5px}
        .ac-desc{font-size:12px;color:var(--hint);margin-bottom:14px;line-height:1.5}
        .ac-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
        .ac-info-item{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 10px}
        .ac-info-lbl{font-size:9px;color:var(--hint);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
        .ac-info-val{font-size:14px;font-weight:700;color:var(--text)}
        .ac-prog-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;font-size:11px}
        .ac-prog-lbl{color:var(--muted)}
        .ac-prog-val{font-weight:700;color:var(--text)}
        .ac-prog-bar{height:4px;border-radius:4px;background:var(--border);overflow:hidden;margin-bottom:12px}
        .ac-prog-fill{height:100%;border-radius:4px;transition:width .5s,background .3s}
        .btn-view{width:100%;padding:9px;background:var(--accent-dim);border:1px solid var(--accent-border);border-radius:9px;color:var(--accent);font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--font);display:flex;align-items:center;justify-content:center;gap:6px}
        .btn-view:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
        .btn-view svg{width:13px;height:13px}

        /* create form */
        .create-panel{background:var(--surface);border:1px solid var(--accent-border);border-radius:var(--rl);padding:22px;margin-bottom:20px;box-shadow:0 0 0 3px var(--accent-dim);animation:up .25s ease}
        .frow{margin-bottom:14px}
        .frow.c2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media(max-width:640px){.frow.c2{grid-template-columns:1fr}}
        .flbl{display:block;font-size:11px;font-weight:600;color:var(--muted);letter-spacing:.4px;text-transform:uppercase;margin-bottom:6px}
        .fin{width:100%;padding:10px 13px;background:var(--input-bg);border:1px solid var(--border);border-radius:var(--rs);color:var(--text);font-size:13px;outline:none;transition:all .18s;font-family:var(--font)}
        .fin::placeholder{color:var(--hint)}
        .fin:focus{border-color:var(--accent);background:var(--accent-dim)}
        .fta{resize:vertical;min-height:80px}
        .fbtns{display:flex;gap:10px;margin-top:8px}
        .btn-sub{padding:9px 20px;background:var(--accent);border:none;border-radius:var(--rs);color:#fff;font-size:13px;font-weight:600;cursor:pointer;font-family:var(--font)}
        .btn-sub:hover{filter:brightness(1.1)}
        .btn-cnc{padding:9px 20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--rs);color:var(--muted);font-size:13px;cursor:pointer;font-family:var(--font)}
        .btn-cnc:hover{color:var(--text);border-color:var(--border2)}

        .empty{text-align:center;padding:52px 20px;background:var(--surface);border:1px dashed var(--border);border-radius:var(--r);font-size:13px;color:var(--hint);transition:background .25s}

        .recharts-cartesian-grid-horizontal line,.recharts-cartesian-grid-vertical line{stroke:var(--chart-grid)!important}
        .recharts-legend-item-text{color:var(--muted)!important;font-size:12px!important}
        .recharts-text{fill:var(--muted)!important;font-size:11px!important}
      `}</style>

      <div className="t">
        {/* ═══ NAV ═══ */}
        <nav className="nav">
          <div className="nav-strip">
            <div className="nav-brand">
              <div className="nb-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="nb-name">LMS Portal</span>
              <span className="nb-badge">ครู</span>
            </div>

            <div className="nav-tabs">
              {navItems.map(t=>(
                <button key={t.id} className={`nav-tab${page===t.id?' on':''}`} onClick={()=>setPage(t.id)}>
                  <t.icon/>{t.label}
                </button>
              ))}
            </div>

            <div className="nav-right">
              {userRoles.length>1&&(
                <div className="role-pill">
                  <span>โหมด</span>
                  <select value={currentRole||'TEACHER'} onChange={e=>onRoleChange?.(e.target.value as CourseRole)}>
                    {userRoles.includes('STUDENT')&&<option value="STUDENT">นักเรียน</option>}
                    {userRoles.includes('TEACHER')&&<option value="TEACHER">ครู</option>}
                  </select>
                </div>
              )}

              <button className="mode-toggle" onClick={()=>setIsDark(p=>!p)}>
                {isDark
                  ? <Sun size={12} style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',color:'var(--hint)'}}/>
                  : <Moon size={12} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',color:'var(--hint)'}}/>
                }
                <div className={`mode-thumb${isDark?'':' lt'}`}>{isDark?<Moon size={12}/>:<Sun size={12}/>}</div>
              </button>

              <div className="theme-wrap" ref={themeRef}>
                <button className={`icon-btn${themeOpen?' aic':''}`} onClick={()=>setThemeOpen(p=>!p)} title="ปรับสีธีม">
                  <Palette/>
                </button>
                {themeOpen&&(
                  <div className="theme-picker">
                    <div className="tp-ttl">สีธีม</div>
                    <div className="tp-grid">
                      {THEMES.map(th=>(
                        <div key={th.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          <div className={`tp-sw${themeId===th.id&&!customHex?' sel':''}`}
                            style={{background:th.hex}} onClick={()=>{setThemeId(th.id);setCustomHex('');}}>
                            <Check/>
                          </div>
                          <span className="tp-lbl">{th.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="tp-div"/>
                    <div className="tp-cttl">กำหนดเอง</div>
                    <div className="tp-row">
                      <input type="color" className="tp-ci" value={customHex||activeTheme.hex}
                        onChange={e=>{setCustomHex(e.target.value);setThemeId('pink');}}/>
                      <input type="text" className="tp-hi" placeholder="#ffffff"
                        value={customHex} maxLength={7}
                        onChange={e=>{const v=e.target.value;setCustomHex(v);if(/^#[0-9a-fA-F]{6}$/.test(v))setThemeId('pink');}}/>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-chip">
                {user.picture?<img src={user.picture} alt={user.name}/>:<div className="uc-init">{initials}</div>}
                <div className="uc-info">
                  <div className="uc-name">{user.name.split(' ')[0]}</div>
                  <div className="uc-role">ครูผู้สอน</div>
                </div>
              </div>

              <button className="icon-btn logout" onClick={onLogout}><LogOut/></button>
              <button className="icon-btn ham" onClick={()=>setMenuOpen(p=>!p)}>
                {menuOpen?<X/>:<Menu/>}
              </button>
            </div>
          </div>

          {menuOpen&&(
            <div className="mob-nav">
              {navItems.map(t=>(
                <button key={t.id} className={`mob-item${page===t.id?' on':''}`}
                  onClick={()=>{setPage(t.id);setMenuOpen(false);}}>
                  <t.icon/>{t.label}
                </button>
              ))}
              <button className="mob-logout" onClick={onLogout}><LogOut/>ออกจากระบบ</button>
            </div>
          )}
        </nav>

        {/* ═══ PAGE ═══ */}
        <main className="page" key={page}>
          {/* sub-header */}
          <div className="sub-hd">
            <div className="sub-hd-l">
              <div className="ph-title">
                {page==='overview'&&'ภาพรวมชั้นเรียน'}
                {page==='students'&&'นักเรียน'}
                {page==='assignments'&&'งานที่มอบหมาย'}
              </div>
              {courses.length>0&&(
                <>
                  <span className="ph-div">/</span>
                  <select className="course-sel"
                    value={selectedCourse?.id||''}
                    onChange={e=>{
                      const c=courses.find(c=>c.id===e.target.value)||null;
                      setSelectedCourse(c);
                    }}>
                    {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </>
              )}
              {/* Refresh button */}
              <button
                className={`btn-refresh${dataLoading?' spinning':''}`}
                onClick={()=>selectedCourse&&loadCourseData(selectedCourse)}
                disabled={dataLoading}
              >
                <RefreshCw/>
                {dataLoading?'กำลังโหลด…':'รีเฟรช'}
              </button>
            </div>
            {page==='overview'&&(
              <button className="btn-cre" onClick={()=>setShowCreate(p=>!p)}>
                <Plus/>{showCreate?'ยกเลิก':'+ สร้างงาน'}
              </button>
            )}
          </div>

          {/* create form */}
          {showCreate&&page==='overview'&&(
            <div className="create-panel">
              <div className="panel-hd" style={{marginBottom:16}}>สร้างงานใหม่</div>
              <div className="frow">
                <label className="flbl">ชื่องาน</label>
                <input className="fin" type="text" placeholder="ชื่องานที่มอบหมาย" value={newTitle} onChange={e=>setNewTitle(e.target.value)}/>
              </div>
              <div className="frow">
                <label className="flbl">คำอธิบาย</label>
                <textarea className="fin fta" placeholder="รายละเอียดงาน..." value={newDesc} onChange={e=>setNewDesc(e.target.value)}/>
              </div>
              <div className="frow c2">
                <div><label className="flbl">กำหนดส่ง</label><input className="fin" type="date" value={newDue} onChange={e=>setNewDue(e.target.value)}/></div>
                <div><label className="flbl">คะแนนเต็ม</label><input className="fin" type="number" placeholder="100" value={newPts} onChange={e=>setNewPts(e.target.value)}/></div>
              </div>
              <div className="fbtns">
                <button className="btn-sub" onClick={()=>{setShowCreate(false);setNewTitle('');setNewDesc('');setNewDue('');setNewPts('100');}}>สร้างงาน</button>
                <button className="btn-cnc" onClick={()=>setShowCreate(false)}>ยกเลิก</button>
              </div>
            </div>
          )}

          {/* Error banner */}
          {dataError&&(
            <div className="error-box">
              <WifiOff size={16}/>
              <div>
                <div className="error-title">ไม่สามารถดึงข้อมูลจาก Google Classroom</div>
                <div className="error-msg">{dataError}</div>
                <button className="btn-retry" onClick={()=>selectedCourse&&loadCourseData(selectedCourse)}>
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            </div>
          )}

          {/* Loading overlay over stats */}
          {dataLoading ? (
            <div className="loading-box">
              <Loader2 size={32}/>
              <span>กำลังดึงข้อมูลจาก Google Classroom…</span>
            </div>
          ) : (
            <>
              {/* STAT ROW */}
              <div className="sg">
                {([
                  {lbl:'นักเรียน',      val:stats.students,          cls:'',  Icon:Users},
                  {lbl:'งานทั้งหมด',    val:courseWorkList.length,   cls:'b', Icon:BookOpen},
                  {lbl:'ส่งงานแล้ว',    val:stats.turned,            cls:'g', Icon:CheckCircle2},
                  {lbl:'รอส่ง',         val:stats.pending,           cls:'a', Icon:Clock},
                  {lbl:'ส่งสาย',        val:stats.late,              cls:'r', Icon:AlertCircle},
                  {lbl:'คะแนนเฉลี่ย', val:`${stats.avg}%`,         cls:'p', Icon:TrendingUp},
                ] as const).map(({lbl,val,cls,Icon},i)=>(
                  <div key={i} className={`sc ${cls}`}>
                    <div className="sc-label">{lbl}</div>
                    <div className="sc-val">{val}</div>
                    <div className="sc-ico"><Icon/></div>
                  </div>
                ))}
              </div>

              {/* ════ OVERVIEW ════ */}
              {page==='overview'&&(
                <>
                  <div className="ov-grid" style={{marginBottom:14}}>
                    <div className="panel">
                      <div className="panel-hd">อัตราการส่งงานรายวิชา</div>
                      <div className="chart-box">
                        {barData.length>0?(
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} barSize={16}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                              <XAxis dataKey="name" tick={{fontSize:11}} tickLine={false} axisLine={false}/>
                              <YAxis tick={{fontSize:11}} tickLine={false} axisLine={false} width={24} allowDecimals={false}/>
                              <Tooltip contentStyle={tooltipStyle} cursor={{fill:'var(--surface2)'}}/>
                              <Legend/>
                              <Bar dataKey="ส่งแล้ว" fill={activeTheme.hex} radius={[4,4,0,0]}/>
                              <Bar dataKey="รอส่ง"   fill="#f59e0b"          radius={[4,4,0,0]}/>
                              <Bar dataKey="ส่งสาย"  fill="#f43f5e"          radius={[4,4,0,0]}/>
                            </BarChart>
                          </ResponsiveContainer>
                        ):(
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--hint)',fontSize:13}}>ยังไม่มีงานในวิชานี้</div>
                        )}
                      </div>
                    </div>

                    <div style={{display:'flex',flexDirection:'column',gap:14}}>
                      <div className="panel" style={{flex:1}}>
                        <div className="panel-hd">สถานะการส่งงานรวม</div>
                        {pieData.length>0?(
                          <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                            <div style={{position:'relative',flexShrink:0}}>
                              <ResponsiveContainer width={140} height={140}>
                                <PieChart>
                                  <Pie data={pieData} cx={70} cy={70} innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                                    {pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                                  </Pie>
                                  <Tooltip contentStyle={tooltipStyle}/>
                                </PieChart>
                              </ResponsiveContainer>
                              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
                                <div style={{fontSize:22,fontWeight:700,color:'var(--text)',letterSpacing:-1}}>{stats.subRate}%</div>
                                <div style={{fontSize:9,color:'var(--hint)'}}>ส่งแล้ว</div>
                              </div>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',gap:7,flex:1}}>
                              {pieData.map((d,i)=>(
                                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)'}}>
                                  <div style={{width:7,height:7,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                                  <span style={{fontSize:12,color:'var(--muted)',flex:1}}>{d.name}</span>
                                  <span style={{fontSize:12,fontWeight:700,color:'var(--text)'}}>{d.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ):(
                          <div style={{textAlign:'center',padding:'32px 0',color:'var(--hint)',fontSize:12}}>ยังไม่มีข้อมูลการส่งงาน</div>
                        )}
                      </div>

                      <div className="perf">
                        <div className="perf-hd">
                          <Award size={18} color="#fff"/>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:'#fff'}}>สรุปผลชั้นเรียน</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,.6)'}}>ภาพรวมการส่งงาน</div>
                          </div>
                        </div>
                        <div className="perf-row"><span className="perf-lbl">ส่งงานแล้ว</span><span className="perf-val">{stats.turned}</span></div>
                        <div className="perf-row"><span className="perf-lbl">รอส่ง</span><span className="perf-val">{stats.pending}</span></div>
                        <div className="perf-row" style={{paddingTop:10}}>
                          <span className="perf-lbl" style={{fontWeight:600,color:'rgba(255,255,255,.9)'}}>คะแนนเฉลี่ย</span>
                          <span className="perf-big">{stats.avg}%</span>
                        </div>
                        <div className="prog"><div className="prog-fill" style={{width:`${stats.avg}%`}}/></div>
                      </div>
                    </div>
                  </div>

                  {/* Assignment detail table */}
                  <div className="panel">
                    <div className="panel-hd">รายละเอียดงานทั้งหมด</div>
                    {courseWorkList.length>0?(
                      <div style={{overflowX:'auto'}}>
                        <table className="asgn-table">
                          <thead>
                            <tr>
                              <th>ชื่องาน</th><th>ส่งแล้ว</th><th>รอส่ง</th><th>ส่งสาย</th><th>อัตรา</th>
                            </tr>
                          </thead>
                          <tbody>
                            {courseWorkList.map(w=>{
                              const ws=submissionsList.filter(s=>s.courseWorkId===w.id);
                              const t=ws.filter(s=>s.state==='TURNED_IN').length;
                              const p=ws.filter(s=>s.state==='NEW').length;
                              const l=ws.filter(s=>s.late).length;
                              const rate=ws.length?Math.round((t/ws.length)*100):0;
                              return (
                                <tr key={w.id}>
                                  <td style={{color:'var(--text)',fontWeight:500,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{w.title}</td>
                                  <td><span className="badge g">{t}</span></td>
                                  <td><span className="badge a">{p}</span></td>
                                  <td><span className="badge r">{l}</span></td>
                                  <td>
                                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                                      <div style={{flex:1,height:4,borderRadius:4,background:'var(--border)',overflow:'hidden',minWidth:60}}>
                                        <div style={{height:'100%',width:`${rate}%`,background:activeTheme.hex,borderRadius:4}}/>
                                      </div>
                                      <span style={{fontSize:12,fontWeight:700,color:'var(--text)',minWidth:32}}>{rate}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ):(
                      <div style={{textAlign:'center',padding:'24px 0',color:'var(--hint)',fontSize:13}}>ยังไม่มีงาน</div>
                    )}
                  </div>
                </>
              )}

              {/* ════ STUDENTS ════ */}
              {page==='students'&&(
                studentsList.length>0?(
                  <div className="student-grid">
                    {studentsList.map(s=>{
                      const subs   = submissionsList.filter(sb=>sb.userId===s.userId);
                      const turned = subs.filter(sb=>sb.state==='TURNED_IN').length;
                      const graded = subs.filter(sb=>sb.assignedGrade!=null);
                      const avg    = graded.length?Math.round(graded.reduce((a,sb)=>a+(sb.assignedGrade??0),0)/graded.length):null;
                      const rate   = courseWorkList.length?Math.round((turned/courseWorkList.length)*100):0;
                      const init   = s.profile.name.fullName.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
                      const col    = avg!=null?(avg>=80?'#4ade80':avg>=60?'#fbbf24':'#f87171'):'var(--hint)';
                      return (
                        <div className="student-card" key={s.userId}>
                          <div className="s-top">
                            <div className="s-avatar">
                              {s.profile.photoUrl
                                ?<img src={s.profile.photoUrl} alt={s.profile.name.fullName} style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                                :init
                              }
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div className="s-name">{s.profile.name.fullName}</div>
                              <div className="s-email">{s.profile.emailAddress}</div>
                            </div>
                            <span className="badge g" style={{alignSelf:'flex-start'}}>Active</span>
                          </div>
                          <div className="s-stats">
                            <div>
                              <div className="s-stat-lbl">ส่งงาน</div>
                              <div className="s-stat-val">{turned}<span style={{fontSize:13,color:'var(--hint)',fontWeight:400}}>/{courseWorkList.length}</span></div>
                            </div>
                            <div>
                              <div className="s-stat-lbl">คะแนนเฉลี่ย</div>
                              <div className="s-stat-val" style={{color:col}}>{avg!=null?`${avg}%`:'—'}</div>
                            </div>
                          </div>
                          <div className="s-prog">
                            <div className="s-prog-fill" style={{width:`${rate}%`,background:activeTheme.hex}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ):<div className="empty">ยังไม่มีนักเรียนในวิชานี้</div>
              )}

              {/* ════ ASSIGNMENTS ════ */}
              {page==='assignments'&&(
                courseWorkList.length>0?(
                  <div className="ag">
                    {courseWorkList.map((w,i)=>{
                      const ws    = submissionsList.filter(s=>s.courseWorkId===w.id);
                      const t     = ws.filter(s=>s.state==='TURNED_IN').length;
                      const total = studentsList.length||ws.length;
                      const rate  = total?Math.round((t/total)*100):0;
                      const cols  = [activeTheme.hex,'#06b6d4','#a855f7','#f59e0b','#22c55e'];
                      const col   = cols[i%cols.length];
                      return (
                        <div className="ac" key={w.id}>
                          <div className="ac-bar" style={{background:col}}/>
                          <div className="ac-title">{w.title}</div>
                          {w.description&&<div className="ac-desc">{w.description}</div>}
                          <div className="ac-info-grid">
                            <div className="ac-info-item">
                              <div className="ac-info-lbl">คะแนนเต็ม</div>
                              <div className="ac-info-val">{w.maxPoints??'—'}</div>
                            </div>
                            <div className="ac-info-item">
                              <div className="ac-info-lbl">กำหนดส่ง</div>
                              <div className="ac-info-val" style={{fontSize:12}}>
                                {w.dueDate?`${w.dueDate.day}/${w.dueDate.month}/${w.dueDate.year}`:'ไม่กำหนด'}
                              </div>
                            </div>
                          </div>
                          <div className="ac-prog-hd">
                            <span className="ac-prog-lbl">ส่งงานแล้ว</span>
                            <span className="ac-prog-val">{t}/{total} คน</span>
                          </div>
                          <div className="ac-prog-bar">
                            <div className="ac-prog-fill" style={{width:`${rate}%`,background:col}}/>
                          </div>
                          <button className="btn-view"
                            onClick={()=>w.alternateLink&&window.open(w.alternateLink,'_blank','noopener,noreferrer')}>
                            <ChevronRight/>ดูใน Google Classroom ({rate}%)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ):<div className="empty">ยังไม่มีงานในวิชานี้</div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}