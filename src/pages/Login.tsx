import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

type AuthMode = 'login' | 'register';
type UserRole = 'student' | 'teacher';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: UserRole;
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/dashboard');
  };

  const handleGoogleError = () => {
    setError('เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    const users = JSON.parse(localStorage.getItem('lms_users') || '[]');
    const user = users.find((u: any) => u.email === formData.email && u.password === formData.password);
    if (user) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('lms_current_user', JSON.stringify(user));
      navigate('/dashboard');
    } else {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.fullName || !formData.email || !formData.password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง');
      return;
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const users = JSON.parse(localStorage.getItem('lms_users') || '[]');
    if (users.find((u: any) => u.email === formData.email)) {
      setError('อีเมลนี้ถูกใช้งานแล้ว');
      setLoading(false);
      return;
    }
    const newUser = {
      id: Date.now(),
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    };
    users.push(newUser);
    localStorage.setItem('lms_users', JSON.stringify(users));
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('lms_current_user', JSON.stringify(newUser));
    navigate('/dashboard');
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setFormData({ email: '', password: '', confirmPassword: '', fullName: '', role: 'student' });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', 'Noto Sans Thai', sans-serif;
          background: #0a0a0a;
          overflow: hidden;
          position: relative;
        }

        /* Animated background */
        .auth-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }
        .auth-bg::before {
          content: '';
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, #ff006633 0%, transparent 70%);
          top: -200px; left: -200px;
          animation: blob1 8s ease-in-out infinite;
        }
        .auth-bg::after {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          background: radial-gradient(circle, #ff006622 0%, transparent 70%);
          bottom: -150px; right: -150px;
          animation: blob2 10s ease-in-out infinite;
        }
        .auth-bg-dot {
          position: absolute;
          width: 400px; height: 400px;
          background: radial-gradient(circle, #ff006618 0%, transparent 70%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          animation: blob3 6s ease-in-out infinite;
        }
        @keyframes blob1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(80px,60px) scale(1.1)} }
        @keyframes blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-60px,-80px) scale(0.9)} }
        @keyframes blob3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }

        /* Grid overlay */
        .auth-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(255,0,102,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,0,102,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Left Panel */
        .auth-left {
          display: none;
          flex: 1;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 900px) { .auth-left { display: flex; } }

        .brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 64px;
        }
        .brand-icon {
          width: 36px; height: 36px;
          background: #ff0066;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .brand-icon svg { width: 18px; height: 18px; color: white; }
        .brand-name {
          font-size: 18px; font-weight: 700;
          color: white; letter-spacing: -0.3px;
        }

        .hero-headline {
          font-size: clamp(38px, 4vw, 58px);
          font-weight: 700;
          line-height: 1.1;
          color: white;
          letter-spacing: -1.5px;
          margin-bottom: 20px;
        }
        .hero-headline span {
          color: #ff0066;
          display: block;
        }
        .hero-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.45);
          line-height: 1.7;
          max-width: 400px;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        .stats-row {
          display: flex; gap: 32px; margin-top: 56px;
        }
        .stat { display: flex; flex-direction: column; gap: 4px; }
        .stat-num { font-size: 26px; font-weight: 700; color: white; letter-spacing: -1px; }
        .stat-label { font-size: 12px; color: rgba(255,255,255,0.35); font-family: 'Noto Sans Thai', sans-serif; }

        /* Right Panel */
        .auth-right {
          width: 100%;
          max-width: 480px;
          margin: auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 32px 24px;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 900px) { .auth-right { padding: 48px 56px; } }

        /* Card */
        .auth-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 36px 32px;
          backdrop-filter: blur(24px);
          animation: fadeUp 0.5s ease;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .card-header { margin-bottom: 28px; }
        .card-title {
          font-size: 24px; font-weight: 700;
          color: white; letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .card-subtitle {
          font-size: 14px; color: rgba(255,255,255,0.4);
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* Tabs */
        .auth-tabs {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
        }
        .auth-tab {
          flex: 1; padding: 9px 0;
          border: none; background: transparent;
          color: rgba(255,255,255,0.4);
          font-size: 14px; font-weight: 500;
          border-radius: 9px; cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
        }
        .auth-tab.active {
          background: #ff0066;
          color: white;
          box-shadow: 0 4px 16px rgba(255,0,102,0.35);
        }

        /* Form */
        .form-group { margin-bottom: 16px; position: relative; }
        .form-label {
          display: block; font-size: 12px; font-weight: 500;
          color: rgba(255,255,255,0.5); margin-bottom: 7px;
          letter-spacing: 0.3px;
          font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
        }
        .form-input {
          width: 100%; padding: 12px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: white; font-size: 14px;
          transition: all 0.2s;
          outline: none;
          font-family: 'DM Sans', sans-serif;
        }
        .form-input::placeholder { color: rgba(255,255,255,0.2); }
        .form-input:focus {
          border-color: #ff0066;
          background: rgba(255,0,102,0.06);
          box-shadow: 0 0 0 3px rgba(255,0,102,0.12);
        }

        /* Role selector */
        .role-selector { display: flex; gap: 10px; }
        .role-card {
          flex: 1; padding: 14px 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex; flex-direction: column;
          align-items: center; gap: 8px;
          position: relative;
        }
        .role-card:hover { border-color: rgba(255,0,102,0.4); }
        .role-card.selected {
          border-color: #ff0066;
          background: rgba(255,0,102,0.1);
          box-shadow: 0 0 0 3px rgba(255,0,102,0.1);
        }
        .role-icon {
          width: 36px; height: 36px;
          background: rgba(255,255,255,0.07);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          transition: background 0.2s;
        }
        .role-card.selected .role-icon { background: rgba(255,0,102,0.25); }
        .role-name {
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.7);
          font-family: 'Noto Sans Thai', sans-serif;
          transition: color 0.2s;
        }
        .role-card.selected .role-name { color: white; }
        .role-check {
          position: absolute; top: 8px; right: 8px;
          width: 16px; height: 16px;
          background: #ff0066; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: scale(0.5);
          transition: all 0.2s;
        }
        .role-card.selected .role-check { opacity: 1; transform: scale(1); }
        .role-check::after { content: '✓'; font-size: 9px; color: white; font-weight: 700; }

        /* Error */
        .auth-error {
          background: rgba(255,0,102,0.1);
          border: 1px solid rgba(255,0,102,0.3);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px; color: #ff6699;
          margin-bottom: 16px;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* Submit Button */
        .btn-primary {
          width: 100%; padding: 13px;
          background: #ff0066;
          border: none; border-radius: 12px;
          color: white; font-size: 15px; font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Noto Sans Thai', 'DM Sans', sans-serif;
          letter-spacing: 0.2px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          position: relative; overflow: hidden;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          opacity: 0; transition: opacity 0.2s;
        }
        .btn-primary:hover { background: #e6005c; box-shadow: 0 6px 24px rgba(255,0,102,0.4); }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:active { transform: scale(0.99); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider {
          display: flex; align-items: center; gap: 12px;
          margin: 20px 0;
        }
        .divider-line {
          flex: 1; height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .divider-text {
          font-size: 12px; color: rgba(255,255,255,0.25);
          white-space: nowrap;
          font-family: 'Noto Sans Thai', sans-serif;
        }

        /* Google Button wrapper */
        .google-wrap {
          display: flex; justify-content: center;
          filter: saturate(0) brightness(1.8);
          opacity: 0.6;
          transition: all 0.2s;
        }
        .google-wrap:hover { filter: saturate(1) brightness(1); opacity: 1; }

        .footer-text {
          text-align: center; margin-top: 24px;
          font-size: 12px; color: rgba(255,255,255,0.2);
          font-family: 'Noto Sans Thai', sans-serif;
        }
      `}</style>

      <div className="auth-root">
        <div className="auth-bg"><div className="auth-bg-dot" /></div>
        <div className="auth-grid" />

        {/* Left panel */}
        <div className="auth-left">
          <div className="brand-logo">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="brand-name">LMS Portal</span>
          </div>

          <div>
            <h1 className="hero-headline">
              เรียนรู้
              <span>ไร้ขีดจำกัด.</span>
            </h1>
            <p className="hero-sub">
              แพลตฟอร์มการเรียนรู้ออนไลน์สำหรับครูและนักเรียน<br/>
              เชื่อมต่อชั้นเรียน มอบหมายงาน และติดตามความก้าวหน้าได้ในที่เดียว
            </p>
          </div>

          <div className="stats-row">
            <div className="stat">
              <span className="stat-num">12k+</span>
              <span className="stat-label">นักเรียน</span>
            </div>
            <div className="stat">
              <span className="stat-num">840+</span>
              <span className="stat-label">ครูผู้สอน</span>
            </div>
            <div className="stat">
              <span className="stat-num">3.2k+</span>
              <span className="stat-label">รายวิชา</span>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="card-header">
              <h2 className="card-title">
                {mode === 'login' ? 'ยินดีต้อนรับ 👋' : 'สร้างบัญชีใหม่'}
              </h2>
              <p className="card-subtitle">
                {mode === 'login'
                  ? 'เข้าสู่ระบบเพื่อเริ่มต้นการเรียนรู้'
                  : 'กรอกข้อมูลเพื่อเริ่มต้นใช้งาน'}
              </p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              <button
                className={`auth-tab${mode === 'login' ? ' active' : ''}`}
                onClick={() => switchMode('login')}
              >เข้าสู่ระบบ</button>
              <button
                className={`auth-tab${mode === 'register' ? ' active' : ''}`}
                onClick={() => switchMode('register')}
              >สมัครสมาชิก</button>
            </div>

            {/* Error */}
            {error && <div className="auth-error">⚠ {error}</div>}

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">อีเมล</label>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">รหัสผ่าน</label>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> กำลังเข้าสู่ระบบ...</> : 'เข้าสู่ระบบ'}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">ชื่อ-นามสกุล</label>
                  <input
                    className="form-input"
                    type="text"
                    name="fullName"
                    placeholder="ชื่อ นามสกุล"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">อีเมล</label>
                  <input
                    className="form-input"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">รหัสผ่าน</label>
                  <input
                    className="form-input"
                    type="password"
                    name="password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ยืนยันรหัสผ่าน</label>
                  <input
                    className="form-input"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">บทบาทของคุณ</label>
                  <div className="role-selector">
                    <div
                      className={`role-card${formData.role === 'student' ? ' selected' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, role: 'student' }))}
                    >
                      <div className="role-check" />
                      <div className="role-icon">🎓</div>
                      <span className="role-name">นักเรียน</span>
                    </div>
                    <div
                      className={`role-card${formData.role === 'teacher' ? ' selected' : ''}`}
                      onClick={() => setFormData(p => ({ ...p, role: 'teacher' }))}
                    >
                      <div className="role-check" />
                      <div className="role-icon">👨‍🏫</div>
                      <span className="role-name">ครู / อาจารย์</span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> กำลังสร้างบัญชี...</> : 'สร้างบัญชี'}
                </button>
              </form>
            )}

            {/* Divider + Google */}
            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">หรือเข้าสู่ระบบด้วย</span>
              <div className="divider-line" />
            </div>
            <div className="google-wrap">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="rectangular"
                theme="filled_black"
                size="large"
                width="100%"
              />
            </div>

            <p className="footer-text">© 2026 LMS Portal · All rights reserved</p>
          </div>
        </div>
      </div>
    </>
  );
}