import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Eye, EyeOff,
  LockKeyhole, Mail, UserRound, CheckCircle,
} from 'lucide-react';
import { persistUser } from '../utils/api';

/* ── Framer Motion variants ─────────────────────────────── */
const ease = [0.25, 0.46, 0.45, 0.94];
const smoothEase = [0.4, 0.0, 0.2, 1];

const panelVariants = {
  hidden: (dir) => ({ opacity: 0, x: dir === 'left' ? -24 : 24 }),
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease } },
};

const headingVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

const collapseVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.35, ease: smoothEase } },
  show: {
    opacity: 1, height: 'auto', marginBottom: 0,
    transition: { height: { duration: 0.4, ease: smoothEase }, opacity: { duration: 0.3, delay: 0.07, ease: smoothEase } },
  },
  exit: {
    opacity: 0, height: 0, marginBottom: 0,
    transition: { opacity: { duration: 0.18, ease: smoothEase }, height: { duration: 0.3, delay: 0.06, ease: smoothEase } },
  },
};

const forgotVariants = {
  hidden: { opacity: 0, height: 0 },
  show: { opacity: 1, height: 'auto', transition: { height: { duration: 0.35, ease: smoothEase }, opacity: { duration: 0.28, delay: 0.07 } } },
  exit: { opacity: 0, height: 0, transition: { opacity: { duration: 0.16 }, height: { duration: 0.28, delay: 0.05 } } },
};

/* ── Google Icon ────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function getOAuthErrorMessage(searchParams) {
  const e = searchParams.get('error');
  if (e === 'google_auth_failed') return 'Google login failed. Please try again.';
  if (e === 'server_error') return 'Server error during Google login. Please try again.';
  return '';
}

/* ══════════════════════════════════════════════════════════
   MAIN AUTH COMPONENT
══════════════════════════════════════════════════════════ */
export default function Auth({ apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from?.pathname || '/';

  const getViewFromPath = (pathname) => {
    if (pathname === '/register') return 'register';
    if (pathname === '/forgot-password') return 'forgot';
    if (pathname === '/reset-password') return 'reset';
    return 'login';
  };

  const view = getViewFromPath(location.pathname);
  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgot = view === 'forgot';
  const isReset = view === 'reset';
  const resetToken = searchParams.get('token') || '';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => getOAuthErrorMessage(searchParams));
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') setSuccessMsg('Email verificat! Te poți autentifica.');
  }, [searchParams]);

  const handleChange = (e) => {
    setForm(c => ({ ...c, [e.target.name]: e.target.value }));
    setError('');
    setSuccessMsg('');
  };

  const authFetch = async (endpoint, body) => {
    const res = await fetch(`${apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await authFetch('/api/auth/login', { email: form.email, password: form.password });
      if (data.user) persistUser(data.user);
      navigate(from, { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Parolele nu coincid!'); return; }
    if (form.password.length < 6) { setError('Parola trebuie să aibă cel puțin 6 caractere'); return; }
    setLoading(true); setError('');
    try {
      const data = await authFetch('/api/auth/register', { username: form.name, email: form.email, password: form.password });
      if (data.user) persistUser(data.user);
      navigate('/', { replace: true });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccessMsg('');
    try {
      const data = await authFetch('/api/auth/forgot-password', { email: form.email });
      setSuccessMsg(data.message || 'Link-ul de resetare a fost trimis pe email.');
      setForm(f => ({ ...f, email: '' }));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Parolele nu coincid!'); return; }
    if (!resetToken) { setError('Token invalid. Solicită un nou link.'); return; }
    setLoading(true); setError('');
    try {
      const data = await authFetch('/api/auth/reset-password', { token: resetToken, password: form.password });
      if (data.user) persistUser(data.user);
      setSuccessMsg('Parolă resetată! Redirecționare…');
      setTimeout(() => navigate('/', { replace: true }), 1800);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = () => {
    sessionStorage.setItem('authRedirectFrom', from);
    window.location.href = `${apiBaseUrl}/api/auth/google`;
  };

  const switchView = (newView) => {
    setForm({ name: '', email: '', password: '', confirm: '' });
    setError(''); setSuccessMsg('');
    setShowPassword(false); setShowConfirmPassword(false);
    const paths = { login: '/login', register: '/register', forgot: '/forgot-password' };
    navigate(paths[newView] || '/login', { state: { from: location.state?.from } });
  };

  const handleSubmit = (e) => {
    if (isLogin) handleLogin(e);
    else if (isRegister) handleRegister(e);
    else if (isForgot) handleForgotPassword(e);
    else if (isReset) handleResetPassword(e);
  };

  const getHeading = () => {
    if (isLogin) return { badge: 'Autentificare', title: 'Bine ai revenit', sub: 'Intră în contul tău pentru a continua' };
    if (isRegister) return { badge: 'Înregistrare', title: 'Creează un cont', sub: 'Alătură-te platformei AutoMarket MD' };
    if (isForgot) return { badge: 'Recuperare', title: 'Ai uitat parola?', sub: 'Trimitem un link de resetare pe email' };
    if (isReset) return { badge: 'Resetare', title: 'Parolă nouă', sub: 'Alege o parolă sigură pentru contul tău' };
    return { badge: '', title: '', sub: '' };
  };

  const getSubmitLabel = () => {
    if (loading) {
      if (isLogin) return 'Se autentifică…';
      if (isRegister) return 'Se creează contul…';
      if (isForgot) return 'Se trimite…';
      if (isReset) return 'Se resetează…';
    }
    if (isLogin) return 'Autentificare';
    if (isRegister) return 'Creează Cont';
    if (isForgot) return 'Trimite Link';
    if (isReset) return 'Resetează Parola';
    return 'Continuă';
  };

  const { badge, title, sub } = getHeading();

  /* ── Left panel content per view ──────────────────────── */
  const leftContent = {
    login: {
      headline: 'Cel mai mare\nmagazin auto\ndin Moldova',
      features: ['500+ automobile în stoc', '2 showroom-uri în Chișinău', 'Credit & Leasing disponibil'],
    },
    register: {
      headline: 'Publică\nanunțul tău\ngratuit',
      features: ['Cont gratuit în 2 minute', 'Anunțuri văzute de mii de cumpărători', 'Tranzacții sigure și verificate'],
    },
    forgot: {
      headline: 'Resetare\nparolă\nsigură',
      features: ['Link valid 10 minute', 'Trimis direct pe emailul tău', 'Suport disponibil 24/7'],
    },
    reset: {
      headline: 'Parolă\nnouă,\ncont sigur',
      features: ['Minim 6 caractere', 'Cel puțin o cifră', 'Autentificare automată după resetare'],
    },
  }[view] || {};

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .auth-page-root {
          min-height: 100svh;
          width: 100vw;
          display: grid;
          grid-template-columns: 42% 58%;
          font-family: 'Montserrat', 'Segoe UI', sans-serif;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .auth-page-root { grid-template-columns: 1fr; }
          .auth-left-panel { display: none !important; }
          .auth-right-panel { min-height: 100svh; padding: 48px 24px !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #1e1e1e inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff;
          border-color: #333 !important;
        }
      `}</style>

      <motion.div
        className="auth-page-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* ── LEFT PANEL ──────────────────────────────────── */}
        <motion.div
          className="auth-left-panel"
          custom="left"
          variants={panelVariants}
          initial="hidden"
          animate="show"
          style={{
            background: '#111',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 30% 40%, rgba(230,48,48,0.15) 0%, transparent 60%)',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: -80,
            width: 360, height: 360,
            borderRadius: '50%',
            background: 'rgba(230,48,48,0.06)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div
            style={{ cursor: 'pointer', position: 'relative', zIndex: 2 }}
            onClick={() => navigate('/')}
          >
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#e63030', letterSpacing: '0.05em' }}>
              AUTOMARKET<span style={{ color: 'rgba(255,255,255,0.35)' }}>.MD</span>
            </div>
          </div>

          {/* Main content */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'inline-block',
              background: '#e63030',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              borderRadius: '3px',
              marginBottom: '24px',
            }}>
              🇲🇩 Moldova
            </div>
            <h2 style={{
              color: '#ffffff',
              fontSize: 'clamp(2rem, 2.8vw, 3rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '32px',
              whiteSpace: 'pre-line',
            }}>
              {leftContent.headline}
            </h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(leftContent.features || []).map(f => (
                <li key={f} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  color: 'rgba(255,255,255,0.65)', fontSize: '14px',
                }}>
                  <span style={{
                    width: '22px', height: '22px', background: 'rgba(230,48,48,0.2)',
                    border: '1px solid rgba(230,48,48,0.4)',
                    borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CheckCircle size={12} color="#e63030" />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px',
            position: 'relative', zIndex: 2,
          }}>
            {[['500+', 'Auto'], ['2', 'Locații'], ['100%', 'Gratuit']].map(([n, l]) => (
              <div key={l} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', padding: '14px', textAlign: 'center',
              }}>
                <div style={{ color: '#e63030', fontSize: '20px', fontWeight: 900 }}>{n}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '2px' }}>{l}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT PANEL ─────────────────────────────────── */}
        <motion.div
          className="auth-right-panel"
          custom="right"
          variants={panelVariants}
          initial="hidden"
          animate="show"
          style={{
            background: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflowY: 'auto',
            padding: '48px 64px',
          }}
        >
          <div style={{ width: '100%', maxWidth: '400px' }}>

            {/* Back button for forgot/reset */}
            {(isForgot || isReset) && (
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ x: -3 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600,
                  fontFamily: 'inherit', marginBottom: '28px', padding: 0,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <ArrowLeft size={14} />
                <span>Înapoi la autentificare</span>
              </motion.button>
            )}

            {/* Heading */}
            <motion.div
              key={`heading-${view}`}
              variants={headingVariants}
              initial="hidden"
              animate="show"
              style={{ marginBottom: '32px' }}
            >
              <div style={{
                display: 'inline-block',
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#e63030',
                background: 'rgba(230,48,48,0.1)',
                border: '1px solid rgba(230,48,48,0.25)',
                padding: '4px 12px', borderRadius: '4px',
                marginBottom: '14px',
              }}>
                {badge}
              </div>
              <h1 style={{
                color: '#ffffff', fontSize: 'clamp(1.6rem, 2.5vw, 2.1rem)',
                fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.15,
                margin: '0 0 8px',
              }}>
                {title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: 1.6 }}>
                {sub}
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    marginBottom: '18px', padding: '12px 14px',
                    background: 'rgba(230,48,48,0.1)',
                    border: '1px solid rgba(230,48,48,0.3)',
                    borderLeft: '3px solid #e63030',
                    borderRadius: '6px', color: '#ff8080', fontSize: '13.5px', lineHeight: 1.4,
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence mode="wait">
              {successMsg && (
                <motion.div
                  key={successMsg}
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    marginBottom: '18px', padding: '12px 14px',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderLeft: '3px solid #10b981',
                    borderRadius: '6px', color: '#6ee7b7', fontSize: '13.5px',
                    display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4,
                  }}
                >
                  <CheckCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.div layout transition={{ layout: { duration: 0.4, ease: smoothEase } }}>
              <motion.form
                layout
                initial="hidden"
                animate="show"
                variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Name — register only */}
                <AnimatePresence initial={false}>
                  {isRegister && (
                    <motion.div key="name" variants={collapseVariants} initial="hidden" animate="show" exit="exit" layout>
                      <AuthInput label="Nume complet" name="name" type="text"
                        placeholder="Ex: Ion Popescu" value={form.name}
                        onChange={handleChange} disabled={loading}
                        icon={<UserRound size={16} strokeWidth={1.7} />}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                {(isLogin || isRegister || isForgot) && (
                  <motion.div variants={fieldVariants} layout>
                    <AuthInput label="Email" name="email" type="email"
                      placeholder="adresa@email.com" value={form.email}
                      onChange={handleChange} disabled={loading}
                      icon={<Mail size={16} strokeWidth={1.7} />}
                    />
                  </motion.div>
                )}

                {/* Password */}
                {(isLogin || isRegister || isReset) && (
                  <motion.div variants={fieldVariants} layout>
                    <AuthInput
                      label={isReset ? 'Parolă nouă' : 'Parolă'}
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isReset ? 'Alege o parolă sigură' : 'Introdu parola'}
                      value={form.password}
                      onChange={handleChange}
                      disabled={loading}
                      icon={<LockKeyhole size={16} strokeWidth={1.7} />}
                      suffix={
                        <button type="button" onClick={() => setShowPassword(c => !c)}
                          style={{ position: 'absolute', right: '13px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', padding: '2px', transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                        >
                          {showPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                        </button>
                      }
                    />
                  </motion.div>
                )}

                {/* Confirm password */}
                <AnimatePresence initial={false}>
                  {(isRegister || isReset) && (
                    <motion.div key="confirm" variants={collapseVariants} initial="hidden" animate="show" exit="exit" layout>
                      <AuthInput
                        label="Confirmă parola"
                        name="confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repetă parola"
                        value={form.confirm}
                        onChange={handleChange}
                        disabled={loading}
                        icon={<LockKeyhole size={16} strokeWidth={1.7} />}
                        suffix={
                          <button type="button" onClick={() => setShowConfirmPassword(c => !c)}
                            style={{ position: 'absolute', right: '13px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', padding: '2px', transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                          >
                            {showConfirmPassword ? <EyeOff size={15} strokeWidth={1.8} /> : <Eye size={15} strokeWidth={1.8} />}
                          </button>
                        }
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot password link */}
                <AnimatePresence initial={false}>
                  {isLogin && (
                    <motion.button
                      type="button" key="forgot-link"
                      variants={forgotVariants} initial="hidden" animate="show" exit="exit" layout
                      onClick={() => switchView('forgot')}
                      style={{
                        alignSelf: 'flex-end', background: 'transparent', border: 'none',
                        cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '13px',
                        fontWeight: 600, fontFamily: 'inherit', marginTop: '-4px',
                        transition: 'color 0.15s', padding: 0,
                      }}
                      onMouseEnter={e => e.target.style.color = '#e63030'}
                      onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                    >
                      Ai uitat parola?
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading || (isForgot && !!successMsg)}
                  variants={fieldVariants} layout
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '13px 24px', marginTop: '4px',
                    background: loading ? '#9b1c1c' : '#e63030',
                    border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer',
                    color: '#fff', fontSize: '14px', fontWeight: 800, fontFamily: 'inherit',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    boxShadow: '0 4px 16px rgba(230,48,48,0.35)',
                    transition: 'background 0.2s, box-shadow 0.2s',
                    opacity: (loading || (isForgot && !!successMsg)) ? 0.65 : 1,
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#cc2020'; }}
                  onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#e63030'; }}
                >
                  <span>{getSubmitLabel()}</span>
                  <ArrowRight size={17} strokeWidth={2} />
                </motion.button>
              </motion.form>
            </motion.div>

            {/* Google OAuth */}
            {(isLogin || isRegister) && (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  margin: '24px 0 18px',
                }}>
                  <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em' }}>sau</span>
                  <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                </div>
                <motion.button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', padding: '12px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
                    color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                >
                  <GoogleIcon />
                  <span>Continuă cu Google</span>
                </motion.button>
              </>
            )}

            {/* Switch login ↔ register */}
            {(isLogin || isRegister) && (
              <p style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '8px', marginTop: '24px',
                color: 'rgba(255,255,255,0.35)', fontSize: '13.5px',
              }}>
                {isLogin ? 'Nu ai un cont?' : 'Ai deja un cont?'}
                <motion.button
                  type="button"
                  onClick={() => switchView(isLogin ? 'register' : 'login')}
                  disabled={loading}
                  whileHover={{ x: 2 }} whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: '#e63030', fontWeight: 700, fontSize: '13.5px',
                    fontFamily: 'inherit', padding: 0, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff5050'}
                  onMouseLeave={e => e.currentTarget.style.color = '#e63030'}
                >
                  <span>{isLogin ? 'Înregistrare' : 'Autentificare'}</span>
                  <ArrowRight size={14} strokeWidth={2} />
                </motion.button>
              </p>
            )}

            {/* Terms */}
            {(isLogin || isRegister) && (
              <p style={{
                textAlign: 'center', marginTop: '16px',
                color: 'rgba(255,255,255,0.2)', fontSize: '12px', lineHeight: 1.5,
              }}>
                Continuând, ești de acord cu{' '}
                <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#e63030'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >Termenii</a>
                {' '}și{' '}
                <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
                  onMouseEnter={e => e.target.style.color = '#e63030'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.4)'}
                >Politica de Confidențialitate</a>.
              </p>
            )}

          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ── AuthInput component ────────────────────────────────── */
function AuthInput({ label, name, type, placeholder, value, onChange, disabled, icon, suffix }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'text' }}>
      <span style={{
        fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </span>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <span style={{
          position: 'absolute', left: '13px', color: 'rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', pointerEvents: 'none',
          transition: 'color 0.2s',
        }}>
          {icon}
        </span>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          disabled={disabled}
          autoComplete={name === 'email' ? 'email' : name === 'password' ? 'current-password' : 'off'}
          style={{
            width: '100%',
            padding: suffix ? '11px 42px 11px 40px' : '11px 14px 11px 40px',
            background: '#1e1e1e',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: '7px',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = '#e63030';
            e.target.style.boxShadow = '0 0 0 3px rgba(230,48,48,0.1)';
            e.target.previousSibling.style.color = '#e63030';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = 'none';
            e.target.previousSibling.style.color = 'rgba(255,255,255,0.25)';
          }}
        />
        {suffix}
      </div>
    </label>
  );
}