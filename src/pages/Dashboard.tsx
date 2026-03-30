import { useState, useMemo, useEffect, useRef } from 'react';
import type { GoogleUser, Course, AssignmentWithCourseInfo, Notification, CourseRole } from '../types/googleClassroom';
import {
  LogOut, BookOpen, CheckCircle2, Clock, AlertCircle,
  Home, Award, TrendingUp, Search, Menu, X,
  ChevronLeft, ArrowRight, Palette, Check, Sun, Moon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AssignmentCard } from '../components/AssignmentCard';
import NotificationCenter from '../components/NotificationCenter';
import {
  isAssignmentOverdue, isAssignmentSubmitted, isAssignmentPending,
  formatDueDate, filterAssignmentsByStatus, searchAssignments, sortAssignmentsByDueDate
} from '../utils/assignmentUtils';

interface DashboardProps {
  user: GoogleUser; courses: Course[];
  assignments: AssignmentWithCourseInfo[];
  notifications?: Notification[]; userRoles?: CourseRole[];
  currentRole?: CourseRole | null; onRoleChange?: (role: CourseRole) => void;
  loading: boolean; onGoToClassroom: (url: string) => void;
  onSubmitAssignment: (courseId: string, courseWorkId: string, submissionId: string) => Promise<void>;
  onUnsubmitAssignment: (courseId: string, courseWorkId: string, submissionId: string) => Promise<void>;
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

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

export default function Dashboard({
  user, courses, assignments, notifications=[], userRoles=[], currentRole='STUDENT',
  onRoleChange, loading, onGoToClassroom, onSubmitAssignment, onUnsubmitAssignment, onLogout,
}: DashboardProps) {
  const [page, setPage]           = useState<'dashboard'|'courses'|'assignments'>('dashboard');
  const [menuOpen, setMenuOpen]   = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [themeId, setThemeId]     = useState<ThemeId>('pink');
  const [customHex, setCustomHex] = useState('');
  const [isDark, setIsDark]       = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<'all'|'pending'|'submitted'|'overdue'>('all');
  const [sort, setSort]           = useState<'asc'|'desc'>('asc');
  const [activeCourseId, setActiveCourseId] = useState<string|null>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const activeTheme = useMemo(() => {
    if (customHex && /^#[0-9a-fA-F]{6}$/.test(customHex))
      return { id:'custom' as ThemeId, label:'Custom', hex:customHex, dark:customHex };
    return THEMES.find(t => t.id === themeId) ?? THEMES[0];
  }, [themeId, customHex]);

  // Inject CSS variables for both dark & light modes
  useEffect(() => {
    const { r, g, b } = hexToRgb(activeTheme.hex);
    const styleEl = document.getElementById('lms-theme') ?? (() => {
      const el = document.createElement('style'); el.id = 'lms-theme';
      document.head.appendChild(el); return el;
    })();

    if (isDark) {
      styleEl.textContent = `
        :root {
          --accent: ${activeTheme.hex}; --accent-dark: ${activeTheme.dark};
          --accent-dim: rgba(${r},${g},${b},.12); --accent-glow: rgba(${r},${g},${b},.35);
          --accent-border: rgba(${r},${g},${b},.28);
          --bg: #090909; --bg2: #111; --bg3: #181818;
          --surface: rgba(255,255,255,.04); --surface2: rgba(255,255,255,.07);
          --border: rgba(255,255,255,.08); --border2: rgba(255,255,255,.14);
          --text: #fff; --text2: rgba(255,255,255,.7); --muted: rgba(255,255,255,.4); --hint: rgba(255,255,255,.22);
          --grid: rgba(${r},${g},${b},.025);
          --nav-bg: rgba(9,9,9,.92);
          --input-bg: rgba(255,255,255,.05);
          --tooltip-bg: #1c1c1c;
          --shadow: rgba(0,0,0,.4);
          --perf-grad: linear-gradient(135deg,${activeTheme.hex},${activeTheme.dark});
        }
      `;
    } else {
      styleEl.textContent = `
        :root {
          --accent: ${activeTheme.hex}; --accent-dark: ${activeTheme.dark};
          --accent-dim: rgba(${r},${g},${b},.1); --accent-glow: rgba(${r},${g},${b},.25);
          --accent-border: rgba(${r},${g},${b},.3);
          --bg: #f4f5f7; --bg2: #eef0f3; --bg3: #e8eaed;
          --surface: rgba(255,255,255,.9); --surface2: rgba(255,255,255,1);
          --border: rgba(0,0,0,.08); --border2: rgba(0,0,0,.14);
          --text: #0f0f10; --text2: #333; --muted: #666; --hint: #999;
          --grid: rgba(${r},${g},${b},.04);
          --nav-bg: rgba(255,255,255,.95);
          --input-bg: rgba(0,0,0,.04);
          --tooltip-bg: #fff;
          --shadow: rgba(0,0,0,.1);
          --perf-grad: linear-gradient(135deg,${activeTheme.hex},${activeTheme.dark});
        }
      `;
    }
    localStorage.setItem('lms-theme', JSON.stringify({ id:themeId, custom:customHex, dark:isDark }));
  }, [activeTheme, isDark]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('lms-theme') || '{}');
      if (s.id) setThemeId(s.id);
      if (s.custom) setCustomHex(s.custom);
      if (typeof s.dark === 'boolean') setIsDark(s.dark);
    } catch {}
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const activeCourse = useMemo(() => courses.find(c => c.id === activeCourseId) ?? null, [courses, activeCourseId]);

  const stats = useMemo(() => {
    const submitted = assignments.filter(isAssignmentSubmitted);
    const pending   = assignments.filter(isAssignmentPending);
    const overdue   = assignments.filter(a => isAssignmentOverdue(a) && isAssignmentPending(a));
    return { total:assignments.length, submitted:submitted.length, pending:pending.length, overdue:overdue.length,
      rate:assignments.length ? Math.round((submitted.length/assignments.length)*100) : 0, overdueList:overdue.slice(0,3) };
  }, [assignments]);

  const chartData = useMemo(() => {
    const m = new Map<string,{name:string;value:number;submitted:number}>();
    courses.forEach(c => m.set(c.id, { name:c.name.length>22?c.name.slice(0,20)+'…':c.name, value:0, submitted:0 }));
    assignments.forEach(a => { const d=m.get(a.courseId); if(d){d.value++;if(isAssignmentSubmitted(a))d.submitted++;} });
    return Array.from(m.values()).filter(c=>c.value>0).map(c=>({...c,pct:((c.submitted/c.value)*100).toFixed(0)}));
  }, [courses, assignments]);

  const filtered = useMemo(() => {
    let r = filterAssignmentsByStatus(assignments, filter);
    r = searchAssignments(r, search);
    return sortAssignmentsByDueDate(r, sort);
  }, [assignments, filter, search, sort]);

  const courseAssignments = useMemo(() => activeCourseId ? assignments.filter(a=>a.courseId===activeCourseId) : [], [assignments, activeCourseId]);
  const courseStats = useMemo(() => {
    const s=courseAssignments.filter(isAssignmentSubmitted).length, p=courseAssignments.filter(isAssignmentPending).length,
          o=courseAssignments.filter(a=>isAssignmentOverdue(a)&&isAssignmentPending(a)).length;
    return { total:courseAssignments.length, submitted:s, pending:p, overdue:o,
      rate:courseAssignments.length?Math.round((s/courseAssignments.length)*100):0 };
  }, [courseAssignments]);

  const PIE_COLORS = useMemo(() => {
    const { r,g,b } = hexToRgb(activeTheme.hex);
    return [ activeTheme.hex, `rgba(${r},${g},${b},.72)`, `rgba(${r},${g},${b},.52)`,
      `rgba(${r},${g},${b},.38)`, activeTheme.dark, `rgba(${r},${g},${b},.85)`,
      `rgba(${r},${g},${b},.62)`, `rgba(${r},${g},${b},.28)` ];
  }, [activeTheme]);

  const navItems = [
    { id:'dashboard',   label:'ภาพรวม',       icon:Home },
    { id:'courses',     label:'รายวิชา',       icon:BookOpen },
    { id:'assignments', label:'งานที่มอบหมาย', icon:CheckCircle2 },
  ] as const;

  const initials = user.name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        :root{
          --accent:#ff0066;--accent-dark:#cc0052;--accent-dim:rgba(255,0,102,.12);
          --accent-glow:rgba(255,0,102,.35);--accent-border:rgba(255,0,102,.28);
          --bg:#090909;--bg2:#111;--surface:rgba(255,255,255,.04);
          --border:rgba(255,255,255,.08);--text:#fff;--text2:rgba(255,255,255,.7);
          --muted:rgba(255,255,255,.4);--hint:rgba(255,255,255,.22);
          --grid:rgba(255,0,102,.025);--nav-bg:rgba(9,9,9,.92);
          --input-bg:rgba(255,255,255,.05);--tooltip-bg:#1c1c1c;--shadow:rgba(0,0,0,.4);
          --perf-grad:linear-gradient(135deg,#ff0066,#cc0052);
          --font:'DM Sans','Noto Sans Thai',sans-serif;
          --radius:14px; --radius-sm:10px; --radius-lg:16px;
        }

        .d{min-height:100vh;background:var(--bg);font-family:var(--font);color:var(--text);transition:background .25s,color .25s}
        .d::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
          background-image:linear-gradient(var(--grid) 1px,transparent 1px),
                           linear-gradient(90deg,var(--grid) 1px,transparent 1px);
          background-size:52px 52px}

        /* ── NAV ── */
        .nav{position:sticky;top:0;z-index:200;background:var(--nav-bg);
          backdrop-filter:blur(20px);border-bottom:1px solid var(--border);
          transition:background .25s,border-color .25s}
        .nav-strip{display:grid;grid-template-columns:auto 1fr auto;align-items:stretch;height:56px;padding:0 20px}

        .nav-brand{display:flex;align-items:center;gap:10px;padding-right:20px;border-right:1px solid var(--border);flex-shrink:0}
        .nb-icon{width:32px;height:32px;background:var(--accent);border-radius:9px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px var(--accent-glow);flex-shrink:0;transition:background .3s,box-shadow .3s}
        .nb-icon svg{width:16px;height:16px}
        .nb-name{font-size:15px;font-weight:700;letter-spacing:-.3px;white-space:nowrap;color:var(--text)}

        .nav-tabs{display:none;align-items:stretch;padding:0 4px;gap:2px}
        @media(min-width:768px){.nav-tabs{display:flex}}
        .nav-tab{position:relative;display:flex;align-items:center;gap:7px;padding:0 14px;height:100%;background:transparent;border:none;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .18s;font-family:var(--font)}
        .nav-tab svg{width:14px;height:14px;flex-shrink:0}
        .nav-tab:hover{color:var(--text2)}
        .nav-tab.on{color:var(--text);font-weight:600}
        .nav-tab.on::after{content:'';position:absolute;bottom:0;left:12px;right:12px;height:2px;background:var(--accent);border-radius:2px 2px 0 0;box-shadow:0 0 8px var(--accent-glow);animation:tabIn .22s ease;transition:background .3s}
        @keyframes tabIn{from{left:50%;right:50%;opacity:0}to{left:12px;right:12px;opacity:1}}
        .tab-dot{width:5px;height:5px;border-radius:50%;background:var(--accent);flex-shrink:0;animation:blink 1.8s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}

        .nav-right{display:flex;align-items:center;gap:8px;padding-left:16px;border-left:1px solid var(--border)}

        /* icon buttons */
        .icon-btn{width:32px;height:32px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .18s}
        .icon-btn:hover{background:var(--surface);color:var(--text)}
        .icon-btn.logout:hover{background:var(--accent-dim);border-color:var(--accent-border);color:var(--accent)}
        .icon-btn svg{width:14px;height:14px}
        .icon-btn.active-ico{background:var(--accent-dim);border-color:var(--accent-border);color:var(--accent)}
        .ham{display:flex}
        @media(min-width:768px){.ham{display:none}}

        /* mode toggle */
        .mode-toggle{
          display:flex;align-items:center;
          width:56px;height:28px;border-radius:14px;
          background:var(--surface);border:1px solid var(--border);
          cursor:pointer;padding:3px;transition:all .25s;position:relative;
          flex-shrink:0;
        }
        .mode-toggle-thumb{
          width:22px;height:22px;border-radius:50%;
          background:var(--accent);
          display:flex;align-items:center;justify-content:center;
          transition:transform .25s cubic-bezier(.22,1,.36,1),background .25s;
          box-shadow:0 2px 8px var(--accent-glow);
          flex-shrink:0;
        }
        .mode-toggle-thumb.light{transform:translateX(28px)}
        .mode-toggle-thumb svg{width:12px;height:12px;color:#fff}
        .mode-toggle-bg{position:absolute;inset:0;border-radius:14px;overflow:hidden;pointer-events:none}
        .mode-icon-secondary{
          position:absolute;top:50%;width:12px;height:12px;color:var(--hint);
          transform:translateY(-50%);transition:opacity .2s;
        }
        .mode-icon-secondary.sun{left:7px}
        .mode-icon-secondary.moon{right:7px}

        /* role pill */
        .role-pill{display:flex;align-items:center;gap:5px;padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:20px}
        .role-pill span{font-size:10px;color:var(--hint)}
        .role-pill select{background:transparent;border:none;color:var(--text2);font-size:11px;font-weight:600;cursor:pointer;outline:none;font-family:var(--font)}
        .role-pill select option{background:var(--bg2)}

        /* user chip */
        .user-chip{display:flex;align-items:center;gap:7px;padding:3px 8px 3px 4px;background:var(--surface);border:1px solid var(--border);border-radius:20px}
        .user-chip img{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--accent-border);flex-shrink:0}
        .user-chip-init{width:26px;height:26px;border-radius:50%;background:var(--accent-dim);border:1.5px solid var(--accent-border);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:var(--accent);flex-shrink:0}
        .user-chip-info{display:none}
        @media(min-width:520px){.user-chip-info{display:block}}
        .user-chip-name{font-size:12px;font-weight:600;line-height:1.2;color:var(--text)}
        .user-chip-role{font-size:10px;color:var(--hint)}

        /* ── THEME PICKER ── */
        .theme-wrap{position:relative}
        .theme-picker{
          position:absolute;top:calc(100% + 10px);right:0;
          background:var(--bg2);border:1px solid var(--border);
          border-radius:16px;padding:16px;width:232px;z-index:300;
          box-shadow:0 16px 40px var(--shadow);
          animation:popIn .18s cubic-bezier(.22,1,.36,1);
          transition:background .25s;
        }
        @keyframes popIn{from{opacity:0;transform:translateY(-6px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        .tp-title{font-size:11px;font-weight:600;color:var(--hint);letter-spacing:.5px;text-transform:uppercase;margin-bottom:12px}
        .tp-swatches{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px}
        .tp-swatch{width:100%;aspect-ratio:1;border-radius:10px;border:2px solid transparent;cursor:pointer;transition:transform .15s,border-color .15s;display:flex;align-items:center;justify-content:center}
        .tp-swatch:hover{transform:scale(1.08)}
        .tp-swatch.sel{border-color:rgba(255,255,255,.55)}
        .tp-swatch svg{width:14px;height:14px;color:#fff;opacity:0;transition:opacity .15s}
        .tp-swatch.sel svg{opacity:1}
        .tp-label{font-size:10px;color:var(--hint);text-align:center;margin-top:3px}
        .tp-divider{height:1px;background:var(--border);margin:0 0 12px}
        .tp-custom-label{font-size:11px;font-weight:600;color:var(--hint);letter-spacing:.5px;text-transform:uppercase;margin-bottom:8px}
        .tp-custom-row{display:flex;align-items:center;gap:8px}
        .tp-color-input{width:36px;height:36px;border-radius:9px;border:1px solid var(--border);background:var(--surface);cursor:pointer;padding:3px;overflow:hidden}
        .tp-color-input::-webkit-color-swatch-wrapper{padding:0;border-radius:6px}
        .tp-color-input::-webkit-color-swatch{border:none;border-radius:6px}
        .tp-hex-input{flex:1;padding:7px 10px;background:var(--surface);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:12px;font-family:'DM Sans',monospace;outline:none;transition:border-color .18s}
        .tp-hex-input:focus{border-color:var(--accent)}
        .tp-hex-input::placeholder{color:var(--hint)}

        /* mobile nav */
        .mob-nav{display:flex;flex-direction:column;gap:3px;padding:10px 12px 14px;border-top:1px solid var(--border);background:var(--nav-bg)}
        @media(min-width:768px){.mob-nav{display:none !important}}
        .mob-item{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:transparent;border:1px solid transparent;color:var(--muted);font-size:13px;font-weight:500;cursor:pointer;width:100%;transition:all .18s;font-family:var(--font)}
        .mob-item:hover{background:var(--surface);color:var(--text2)}
        .mob-item.on{background:var(--accent-dim);color:var(--text);font-weight:600;border-color:var(--accent-border)}
        .mob-item svg{width:15px;height:15px;flex-shrink:0}
        .mob-badge{margin-left:auto;font-size:10px;font-weight:700;background:var(--accent);color:#fff;border-radius:10px;padding:1px 6px}
        .mob-logout{display:flex;align-items:center;gap:10px;padding:10px 13px;border-radius:10px;background:transparent;border:none;color:var(--hint);font-size:13px;cursor:pointer;width:100%;transition:all .18s;font-family:var(--font);margin-top:4px}
        .mob-logout:hover{background:var(--accent-dim);color:var(--accent)}
        .mob-logout svg{width:15px;height:15px}

        /* ── PAGE ── */
        .page{position:relative;z-index:1;padding:28px 24px 48px;max-width:1440px;margin:0 auto;animation:up .3s cubic-bezier(.22,1,.36,1)}
        @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        .ph{margin-bottom:24px}
        .ph-title{font-size:20px;font-weight:700;letter-spacing:-.5px;margin-bottom:3px;color:var(--text)}
        .ph-sub{font-size:12px;color:var(--hint);font-family:'Noto Sans Thai',sans-serif}

        /* stat grid */
        .sg{display:grid;gap:12px;margin-bottom:24px;grid-template-columns:repeat(2,1fr)}
        @media(min-width:640px){.sg{grid-template-columns:repeat(4,1fr)}}
        .sc{padding:16px 16px 14px;border-radius:var(--radius);background:var(--surface);border:1px solid var(--border);border-top:2.5px solid var(--accent);position:relative;overflow:hidden;transition:transform .18s,border-color .18s,background .25s}
        .sc:hover{transform:translateY(-2px);border-color:var(--accent-border)}
        .sc.g{border-top-color:#22c55e}.sc.g:hover{border-color:rgba(34,197,94,.35);border-top-color:#22c55e}
        .sc.a{border-top-color:#f59e0b}.sc.a:hover{border-color:rgba(245,158,11,.35);border-top-color:#f59e0b}
        .sc.p{border-top-color:#a855f7}.sc.p:hover{border-color:rgba(168,85,247,.35);border-top-color:#a855f7}
        .sc-label{font-size:10px;font-weight:500;letter-spacing:.6px;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
        .sc-val{font-size:28px;font-weight:700;letter-spacing:-1.5px;line-height:1;color:var(--text)}
        .sc-ico{position:absolute;bottom:12px;right:12px;width:26px;height:26px;border-radius:7px;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;transition:all .3s}
        .sc.g .sc-ico{background:rgba(34,197,94,.1);color:rgba(34,197,94,.7)}
        .sc.a .sc-ico{background:rgba(245,158,11,.1);color:rgba(245,158,11,.7)}
        .sc.p .sc-ico{background:rgba(168,85,247,.1);color:rgba(168,85,247,.7)}
        .sc-ico svg{width:13px;height:13px}

        /* panel */
        .panel{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;transition:background .25s,border-color .25s}
        .panel-hd{font-size:13px;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;color:var(--text)}
        .panel-hd::before{content:'';width:3px;height:13px;border-radius:2px;background:var(--accent);display:block;flex-shrink:0;transition:background .3s}

        .dg{display:grid;grid-template-columns:1fr;gap:14px}
        @media(min-width:1024px){.dg{grid-template-columns:1fr 280px}}

        /* pie */
        .pie-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:20px}
        .pie-center{position:relative;flex-shrink:0}
        .pie-label{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
        .pie-label-num{font-size:26px;font-weight:700;letter-spacing:-1px;line-height:1;color:var(--text)}
        .pie-label-sub{font-size:10px;color:var(--hint);margin-top:2px}
        .pie-legend{flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px}
        .pie-leg-row{display:flex;align-items:center;padding:8px 11px;border-radius:9px;background:var(--surface);border:1px solid var(--border);transition:background .25s}
        .pie-dot{width:7px;height:7px;border-radius:50%;margin-right:9px;flex-shrink:0}
        .pie-leg-name{font-size:12px;color:var(--muted);flex:1}
        .pie-leg-pct{font-size:12px;font-weight:700;color:var(--text)}

        /* notif */
        .ni{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:6px;border:1px solid transparent}
        .ni.r{background:var(--accent-dim);border-color:var(--accent-border)}
        .ni.a{background:rgba(245,158,11,.07);border-color:rgba(245,158,11,.15)}
        .ni svg{flex-shrink:0;margin-top:1px}
        .ni-t{font-size:12px;font-weight:600;margin-bottom:1px;color:var(--text)}
        .ni-s{font-size:11px;color:var(--hint);font-family:'Noto Sans Thai',sans-serif}

        /* perf */
        .perf{background:var(--perf-grad);border-radius:var(--radius);padding:18px;position:relative;overflow:hidden;transition:background .3s}
        .perf::before{content:'';position:absolute;width:140px;height:140px;background:rgba(255,255,255,.07);border-radius:50%;top:-50px;right:-40px;pointer-events:none}
        .perf-hd{display:flex;align-items:center;gap:8px;margin-bottom:14px;position:relative;z-index:1}
        .perf-hd-title{font-size:13px;font-weight:700;color:#fff}
        .perf-hd-sub{font-size:10px;color:rgba(255,255,255,.6);font-family:'Noto Sans Thai',sans-serif;margin-top:1px}
        .perf-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;position:relative;z-index:1}
        .perf-row+.perf-row{border-top:1px solid rgba(255,255,255,.15)}
        .perf-lbl{font-size:12px;font-weight:500;color:rgba(255,255,255,.78);font-family:'Noto Sans Thai',sans-serif}
        .perf-val{font-size:22px;font-weight:700;letter-spacing:-.5px;color:#fff}
        .perf-rate{font-size:30px;font-weight:700;letter-spacing:-1.5px;color:#fff}
        .prog{height:3px;border-radius:3px;background:rgba(255,255,255,.15);margin-top:10px;overflow:hidden;position:relative;z-index:1}
        .prog-fill{height:100%;border-radius:3px;background:rgba(255,255,255,.75);transition:width .6s cubic-bezier(.22,1,.36,1)}

        /* courses */
        .cg{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
        .cc{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s,background .25s}
        .cc:hover{transform:translateY(-3px);border-color:var(--accent-border);box-shadow:0 8px 28px var(--accent-dim)}
        .cc:hover .cc-arrow{opacity:1;transform:translate(0,0)}
        .cc-bar{height:3px;border-radius:3px;margin-bottom:14px}
        .cc-name{font-size:13px;font-weight:600;line-height:1.4;margin-bottom:5px;color:var(--text)}
        .cc-section{font-size:11px;color:var(--hint);margin-bottom:14px;font-family:'Noto Sans Thai',sans-serif}
        .cc-footer{display:flex;align-items:center;justify-content:space-between}
        .cc-count{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--hint)}
        .cc-count svg{width:11px;height:11px;color:var(--accent)}
        .cc-arrow{display:flex;align-items:center;gap:3px;font-size:11px;color:var(--accent);font-weight:600;opacity:0;transform:translate(-4px,0);transition:opacity .2s,transform .2s}
        .cc-arrow svg{width:12px;height:12px}

        /* course detail */
        .cd-header{display:flex;align-items:flex-start;gap:14px;padding:20px;margin-bottom:20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);transition:background .25s}
        .cd-color-strip{width:4px;border-radius:4px;flex-shrink:0;align-self:stretch;min-height:60px}
        .cd-info{flex:1;min-width:0}
        .cd-breadcrumb{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--hint);margin-bottom:8px}
        .cd-breadcrumb button{background:none;border:none;color:var(--hint);cursor:pointer;font-size:11px;font-family:'Noto Sans Thai',sans-serif;display:flex;align-items:center;gap:4px;padding:0;transition:color .18s}
        .cd-breadcrumb button:hover{color:var(--text2)}
        .cd-breadcrumb svg{width:12px;height:12px}
        .cd-title{font-size:18px;font-weight:700;letter-spacing:-.4px;margin-bottom:4px;color:var(--text)}
        .cd-section{font-size:12px;color:var(--hint);font-family:'Noto Sans Thai',sans-serif}
        .cd-stat-row{display:flex;gap:20px;margin-top:14px;flex-wrap:wrap}
        .cd-stat{display:flex;flex-direction:column;gap:2px}
        .cd-stat-val{font-size:20px;font-weight:700;letter-spacing:-.5px;line-height:1}
        .cd-stat-lbl{font-size:10px;color:var(--hint);text-transform:uppercase;letter-spacing:.5px}
        .cd-prog-wrap{margin-top:12px;display:flex;align-items:center;gap:10px}
        .cd-prog-bar{flex:1;height:4px;border-radius:4px;background:var(--border);overflow:hidden}
        .cd-prog-fill{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.22,1,.36,1)}
        .cd-prog-label{font-size:12px;font-weight:700;flex-shrink:0}
        .back-btn{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:10px;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:12px;font-weight:500;cursor:pointer;transition:all .18s;font-family:var(--font);margin-bottom:20px}
        .back-btn:hover{background:var(--accent-dim);border-color:var(--accent-border);color:var(--text)}
        .back-btn svg{width:14px;height:14px}
        .cd-ag-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        .cd-ag-title{font-size:14px;font-weight:600;display:flex;align-items:center;gap:8px;color:var(--text)}
        .cd-ag-title::before{content:'';width:3px;height:14px;border-radius:2px;background:var(--accent);display:block;transition:background .3s}
        .cd-ag-count{font-size:12px;color:var(--hint)}

        /* filter */
        .fbar{background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:13px 15px;display:flex;flex-wrap:wrap;gap:9px;align-items:center;margin-bottom:16px;transition:background .25s}
        .sw{flex:1;min-width:170px;position:relative}
        .sw svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);width:13px;height:13px;color:var(--hint);pointer-events:none}
        .si{width:100%;padding:9px 11px 9px 32px;background:var(--input-bg);border:1px solid var(--border);border-radius:9px;color:var(--text);font-size:13px;outline:none;transition:all .18s;font-family:var(--font)}
        .si::placeholder{color:var(--hint)}
        .si:focus{border-color:var(--accent);background:var(--accent-dim);box-shadow:0 0 0 3px rgba(0,0,0,.04)}
        .fsel{padding:9px 11px;background:var(--input-bg);border:1px solid var(--border);border-radius:9px;color:var(--text2);font-size:12px;outline:none;cursor:pointer;transition:border-color .18s,background .25s;font-family:'Noto Sans Thai',var(--font)}
        .fsel option{background:var(--bg2)}
        .fsel:focus{border-color:var(--accent)}

        .ag{display:grid;gap:12px;grid-template-columns:1fr}
        @media(min-width:600px){.ag{grid-template-columns:repeat(2,1fr)}}
        @media(min-width:1100px){.ag{grid-template-columns:repeat(3,1fr)}}
        .empty{grid-column:1/-1;text-align:center;padding:52px 20px;background:var(--surface);border:1px dashed var(--border);border-radius:13px;font-size:13px;color:var(--hint);font-family:'Noto Sans Thai',sans-serif}
      `}</style>

      <div className="d">
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
            </div>

            <div className="nav-tabs">
              {navItems.map(t => (
                <button key={t.id} className={`nav-tab${page===t.id?' on':''}`}
                  onClick={() => { setPage(t.id); if(t.id!=='courses') setActiveCourseId(null); }}>
                  <t.icon />{t.label}
                  {t.id==='assignments' && stats.overdue>0 && page!=='assignments' && <span className="tab-dot"/>}
                </button>
              ))}
            </div>

            <div className="nav-right">
              <NotificationCenter notifications={notifications} />

              {userRoles.length>1 && (
                <div className="role-pill">
                  <span>โหมด</span>
                  <select value={currentRole||'STUDENT'} onChange={e=>onRoleChange?.(e.target.value as CourseRole)}>
                    {userRoles.includes('STUDENT')&&<option value="STUDENT">นักเรียน</option>}
                    {userRoles.includes('TEACHER')&&<option value="TEACHER">ครู</option>}
                  </select>
                </div>
              )}

              {/* ── DARK / LIGHT TOGGLE ── */}
              <button
                className="mode-toggle"
                onClick={() => setIsDark(p => !p)}
                title={isDark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                style={{ border: '1px solid var(--border)', cursor: 'pointer' }}
              >
                {/* secondary icon */}
                {isDark
                  ? <Sun  size={12} className="mode-icon-secondary sun"  style={{ position:'absolute', left:7,  top:'50%', transform:'translateY(-50%)', color:'var(--hint)' }} />
                  : <Moon size={12} className="mode-icon-secondary moon" style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', color:'var(--hint)' }} />
                }
                <div className={`mode-toggle-thumb${isDark?'':' light'}`}>
                  {isDark ? <Moon size={12}/> : <Sun size={12}/>}
                </div>
              </button>

              {/* ── THEME PICKER ── */}
              <div className="theme-wrap" ref={themeRef}>
                <button className={`icon-btn${themeOpen?' active-ico':''}`} onClick={()=>setThemeOpen(p=>!p)} title="ปรับสีธีม">
                  <Palette/>
                </button>
                {themeOpen && (
                  <div className="theme-picker">
                    <div className="tp-title">สีธีม</div>
                    <div className="tp-swatches">
                      {THEMES.map(t => (
                        <div key={t.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                          <div className={`tp-swatch${themeId===t.id&&!customHex?' sel':''}`}
                            style={{background:t.hex}}
                            onClick={()=>{setThemeId(t.id);setCustomHex('');}}>
                            <Check/>
                          </div>
                          <span className="tp-label">{t.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="tp-divider"/>
                    <div className="tp-custom-label">กำหนดเอง</div>
                    <div className="tp-custom-row">
                      <input type="color" className="tp-color-input"
                        value={customHex||activeTheme.hex}
                        onChange={e=>{setCustomHex(e.target.value);setThemeId('pink');}}/>
                      <input type="text" className="tp-hex-input" placeholder="#ffffff"
                        value={customHex} maxLength={7}
                        onChange={e=>{const v=e.target.value;setCustomHex(v);if(/^#[0-9a-fA-F]{6}$/.test(v))setThemeId('pink');}}/>
                    </div>
                  </div>
                )}
              </div>

              <div className="user-chip">
                {user.picture
                  ? <img src={user.picture} alt={user.name}/>
                  : <div className="user-chip-init">{initials}</div>
                }
                <div className="user-chip-info">
                  <div className="user-chip-name">{user.name.split(' ')[0]}</div>
                  <div className="user-chip-role">นักเรียน</div>
                </div>
              </div>

              <button className="icon-btn logout" onClick={onLogout} title="ออกจากระบบ"><LogOut/></button>
              <button className="icon-btn ham" onClick={()=>setMenuOpen(p=>!p)}>
                {menuOpen?<X/>:<Menu/>}
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="mob-nav">
              {navItems.map(t=>(
                <button key={t.id} className={`mob-item${page===t.id?' on':''}`}
                  onClick={()=>{setPage(t.id);if(t.id!=='courses')setActiveCourseId(null);setMenuOpen(false);}}>
                  <t.icon/>{t.label}
                  {t.id==='assignments'&&stats.overdue>0&&<span className="mob-badge">{stats.overdue}</span>}
                </button>
              ))}
              <button className="mob-logout" onClick={onLogout}><LogOut/>ออกจากระบบ</button>
            </div>
          )}
        </nav>

        {/* ═══ PAGE ═══ */}
        <main className="page" key={page+(activeCourseId??'')}>
          <div className="ph">
            <div className="ph-title">
              {page==='dashboard'&&'ภาพรวม'}
              {page==='courses'&&!activeCourseId&&'รายวิชาของฉัน'}
              {page==='courses'&&activeCourse&&activeCourse.name}
              {page==='assignments'&&'งานที่มอบหมาย'}
            </div>
            <div className="ph-sub">ยินดีต้อนรับ, {user.name}</div>
          </div>

          {/* stat row */}
          {(()=>{
            const s=(page==='courses'&&activeCourseId)?courseStats:stats;
            return (
              <div className="sg">
                {([
                  {lbl:'งานทั้งหมด',val:s.total,      cls:'', Icon:BookOpen},
                  {lbl:'ส่งแล้ว',   val:s.submitted,  cls:'g',Icon:CheckCircle2},
                  {lbl:'รอดำเนินการ',val:s.pending,   cls:'a',Icon:Clock},
                  {lbl:'อัตราส่งงาน',val:`${s.rate}%`,cls:'p',Icon:TrendingUp},
                ] as const).map(({lbl,val,cls,Icon},i)=>(
                  <div key={i} className={`sc ${cls}`}>
                    <div className="sc-label">{lbl}</div>
                    <div className="sc-val">{val}</div>
                    <div className="sc-ico"><Icon/></div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* DASHBOARD */}
          {page==='dashboard'&&(
            <div className="dg">
              <div className="panel">
                <div className="panel-hd">การกระจายงานตามวิชา</div>
                {chartData.length>0?(
                  <div className="pie-wrap">
                    <div className="pie-center">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie data={chartData} cx={90} cy={90} innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value">
                            {chartData.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                          </Pie>
                          <Tooltip contentStyle={{background:'var(--tooltip-bg)',border:'1px solid var(--border)',borderRadius:10,fontSize:12,color:'var(--text)'}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pie-label">
                        <div className="pie-label-num">{stats.total}</div>
                        <div className="pie-label-sub">งานรวม</div>
                      </div>
                    </div>
                    <div className="pie-legend">
                      {chartData.map((item,i)=>(
                        <div className="pie-leg-row" key={i}>
                          <div className="pie-dot" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                          <span className="pie-leg-name">{item.name}</span>
                          <span className="pie-leg-pct">{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ):(
                  <div style={{textAlign:'center',padding:'36px 0',color:'var(--hint)',fontSize:13}}>ยังไม่มีข้อมูล</div>
                )}
              </div>

              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <div className="panel">
                  <div className="panel-hd">การแจ้งเตือน</div>
                  {stats.overdue>0?(
                    <>
                      <div className="ni r"><AlertCircle size={14} color="var(--accent)"/>
                        <div><div className="ni-t">งานเลยกำหนด!</div><div className="ni-s">มี {stats.overdue} งานที่เลยกำหนดส่ง</div></div>
                      </div>
                      {stats.overdueList.map((a,i)=>(
                        <div className="ni a" key={i}><Clock size={13} color="#f59e0b"/>
                          <div><div className="ni-t" style={{fontSize:11}}>{a.title}</div><div className="ni-s">{formatDueDate(a)}</div></div>
                        </div>
                      ))}
                    </>
                  ):(
                    <div style={{textAlign:'center',padding:'16px 0',color:'var(--hint)',fontSize:12}}>ไม่มีการแจ้งเตือน ✓</div>
                  )}
                </div>
                <div className="perf">
                  <div className="perf-hd"><Award size={18} color="#fff"/>
                    <div><div className="perf-hd-title">ผลการเรียน</div><div className="perf-hd-sub">ภาพรวมการส่งงาน</div></div>
                  </div>
                  <div className="perf-row"><span className="perf-lbl">ส่งแล้ว</span><span className="perf-val">{stats.submitted}</span></div>
                  <div className="perf-row"><span className="perf-lbl">รอส่ง</span><span className="perf-val">{stats.pending}</span></div>
                  <div className="perf-row" style={{paddingTop:10}}>
                    <span className="perf-lbl" style={{fontWeight:600,color:'rgba(255,255,255,.9)'}}>อัตราส่งงาน</span>
                    <span className="perf-rate">{stats.rate}%</span>
                  </div>
                  <div className="prog"><div className="prog-fill" style={{width:`${stats.rate}%`}}/></div>
                </div>
              </div>
            </div>
          )}

          {/* COURSES */}
          {page==='courses'&&!activeCourseId&&(
            <div className="cg">
              {courses.length>0?courses.map((c,i)=>{
                const ca=assignments.filter(a=>a.courseId===c.id);
                const pct=ca.length?Math.round((ca.filter(isAssignmentSubmitted).length/ca.length)*100):0;
                return (
                  <div className="cc" key={c.id} onClick={()=>setActiveCourseId(c.id)}>
                    <div className="cc-bar" style={{background:PIE_COLORS[i%PIE_COLORS.length]}}/>
                    <div className="cc-name">{c.name}</div>
                    {c.section&&<div className="cc-section">{c.section}</div>}
                    <div style={{height:2,borderRadius:2,background:'var(--border)',overflow:'hidden',marginBottom:12}}>
                      <div style={{height:'100%',width:`${pct}%`,background:PIE_COLORS[i%PIE_COLORS.length],borderRadius:2}}/>
                    </div>
                    <div className="cc-footer">
                      <div className="cc-count"><BookOpen/>{ca.length} งาน · {pct}%</div>
                      <div className="cc-arrow"><span>ดูงาน</span><ArrowRight/></div>
                    </div>
                  </div>
                );
              }):<div className="empty">ยังไม่มีรายวิชา</div>}
            </div>
          )}

          {/* COURSE DETAIL */}
          {page==='courses'&&activeCourseId&&activeCourse&&(()=>{
            const cIdx=courses.findIndex(c=>c.id===activeCourseId);
            const accent=PIE_COLORS[cIdx%PIE_COLORS.length];
            return (
              <>
                <button className="back-btn" onClick={()=>setActiveCourseId(null)}><ChevronLeft/>กลับไปรายวิชา</button>
                <div className="cd-header">
                  <div className="cd-color-strip" style={{background:accent}}/>
                  <div className="cd-info">
                    <div className="cd-breadcrumb">
                      <button onClick={()=>setActiveCourseId(null)}><ChevronLeft/>รายวิชา</button>
                      <span>/</span><span style={{color:'var(--text2)'}}>{activeCourse.name}</span>
                    </div>
                    <div className="cd-title">{activeCourse.name}</div>
                    {activeCourse.section&&<div className="cd-section">{activeCourse.section}</div>}
                    <div className="cd-stat-row">
                      {[
                        {val:courseStats.total,lbl:'งานทั้งหมด',col:''},
                        {val:courseStats.submitted,lbl:'ส่งแล้ว',col:'#4ade80'},
                        {val:courseStats.pending,lbl:'รอส่ง',col:'#fbbf24'},
                        ...(courseStats.overdue>0?[{val:courseStats.overdue,lbl:'เลยกำหนด',col:'#f87171'}]:[])
                      ].map((s,i)=>(
                        <div className="cd-stat" key={i}>
                          <div className="cd-stat-val" style={s.col?{color:s.col}:{color:'var(--text)'}}>{s.val}</div>
                          <div className="cd-stat-lbl">{s.lbl}</div>
                        </div>
                      ))}
                    </div>
                    <div className="cd-prog-wrap">
                      <div className="cd-prog-bar"><div className="cd-prog-fill" style={{width:`${courseStats.rate}%`,background:accent}}/></div>
                      <div className="cd-prog-label" style={{color:accent}}>{courseStats.rate}%</div>
                    </div>
                  </div>
                </div>
                <div className="cd-ag-hd">
                  <div className="cd-ag-title">งานในวิชานี้</div>
                  <div className="cd-ag-count">{courseAssignments.length} งาน</div>
                </div>
                <div className="ag">
                  {courseAssignments.length>0
                    ?courseAssignments.map(a=>(
                        <AssignmentCard key={a.id} assignment={a}
                          onGoToClassroom={onGoToClassroom} onSubmit={onSubmitAssignment}
                          onUnsubmit={onUnsubmitAssignment} loading={loading}
                          formatDueDate={formatDueDate} isOverdue={isAssignmentOverdue}/>
                      ))
                    :<div className="empty">วิชานี้ยังไม่มีงานที่มอบหมาย</div>
                  }
                </div>
              </>
            );
          })()}

          {/* ASSIGNMENTS */}
          {page==='assignments'&&(
            <>
              <div className="fbar">
                <div className="sw"><Search/>
                  <input className="si" type="text" placeholder="ค้นหางาน…" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                <select className="fsel" value={filter} onChange={e=>setFilter(e.target.value as any)}>
                  <option value="all">ทั้งหมด</option><option value="pending">รอส่ง</option>
                  <option value="submitted">ส่งแล้ว</option><option value="overdue">เลยกำหนด</option>
                </select>
                <select className="fsel" value={sort} onChange={e=>setSort(e.target.value as any)}>
                  <option value="asc">ใกล้ครบกำหนดก่อน</option><option value="desc">ไกลครบกำหนดก่อน</option>
                </select>
              </div>
              <div className="ag">
                {filtered.length>0
                  ?filtered.map(a=>(
                      <AssignmentCard key={a.id} assignment={a}
                        onGoToClassroom={onGoToClassroom} onSubmit={onSubmitAssignment}
                        onUnsubmit={onUnsubmitAssignment} loading={loading}
                        formatDueDate={formatDueDate} isOverdue={isAssignmentOverdue}/>
                    ))
                  :<div className="empty">ไม่พบงานที่ค้นหา</div>
                }
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}