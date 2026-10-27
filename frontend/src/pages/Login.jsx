import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(getDashboardPath(user.role));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#f4f7fc' }}>

      {/* Decorative top-right blob */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(8,27,86,0.12) 0%, transparent 70%)' }}
      />
      {/* Bottom-left blob */}
      <div
        className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(201,152,38,0.12) 0%, transparent 70%)' }}
      />
      {/* Center subtle glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(34,79,168,0.08) 0%, transparent 70%)' }}
      />

      {/* Decorative dots pattern */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#081b56" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        .slide-up   { animation: slide-up 0.55s ease-out both; }
        .slide-up-1 { animation: slide-up 0.55s 0.08s ease-out both; }
        .slide-up-2 { animation: slide-up 0.55s 0.16s ease-out both; }
        .slide-up-3 { animation: slide-up 0.55s 0.24s ease-out both; }
        .slide-up-4 { animation: slide-up 0.55s 0.32s ease-out both; }
        .float-badge { animation: float-badge 4s ease-in-out infinite; }
        .input-wrap {
          transition: box-shadow 0.25s, border-color 0.25s, background 0.25s;
        }
        .input-wrap:focus-within {
          box-shadow: 0 0 0 3px rgba(8,27,86,0.12);
        }
        .btn-login {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(8,27,86,0.3);
        }
        .btn-login:active:not(:disabled) {
          transform: scale(0.98);
        }
        .demo-row {
          transition: background 0.2s, transform 0.15s;
        }
        .demo-row:active { transform: scale(0.98); }
        .demo-row:hover { background: rgba(8,27,86,0.06) !important; }
      `}</style>

      <div className="min-h-screen flex">

        {/* ── LEFT PANEL (desktop only) ─────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[45%] bg-cover bg-center relative flex-col justify-between p-16"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=1200&fit=crop)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(8,27,86,0.94) 0%, rgba(25,58,141,0.85) 100%)' }} />

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3 group">
              <img src="/logo-white.png" alt="Rahardja" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-white tracking-wider leading-none">RAHARDJA</span>
                <span className="text-[9px] tracking-widest text-gold uppercase font-medium mt-0.5">Es Krim, Teh &amp; Kopi</span>
              </div>
            </Link>
          </div>

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[4px] mb-4 text-gold font-medium">Selamat Datang di Rahardja</p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-5">
              Cita Rasa Istimewa<br />Untuk Hari<br />Terbaikmu ✨
            </h1>
            <p className="text-white/70 leading-relaxed text-sm max-w-xs">
              Masuk dan nikmati aneka es krim lembut, teh beraroma segar, dan racikan kopi berkualitas tinggi.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xs text-white/80">✓</span>
            </div>
            <span className="text-white/60 text-xs">Cita rasa premium &amp; pelayanan terbaik</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 lg:px-14 relative">

          {/* Floating decorative badge (mobile hidden) */}
          <div
            className="float-badge absolute top-8 right-8 hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
            style={{ background: 'rgba(8,27,86,0.06)', border: '1px solid rgba(8,27,86,0.15)', color: '#081b56' }}
          >
            <span>✨</span> Rahardja Experience
          </div>

          <div className="w-full max-w-[380px]">

            {/* ── MOBILE LOGO ── */}
            <div className="slide-up mb-8 lg:hidden flex flex-col items-center">
              <Link to="/" className="flex flex-col items-center group">
                <img src="/logo-navy.png" alt="Rahardja" className="h-20 w-auto object-contain mb-2 transition-transform group-hover:scale-105" />
                <span className="font-display text-2xl font-bold tracking-widest text-coffee-900">RAHARDJA</span>
                <span className="text-[10px] tracking-widest text-gold uppercase font-semibold">Es Krim, Teh &amp; Kopi</span>
              </Link>
            </div>

            {/* ── DESKTOP HEADER ── */}
            <div className="slide-up hidden lg:block mb-8">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <img src="/logo-navy.png" alt="Rahardja" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
                <span className="font-display text-2xl font-bold tracking-widest" style={{ color: '#081b56' }}>RAHARDJA</span>
              </Link>
            </div>

            {/* ── HEADING ── */}
            <div className="slide-up-1 mb-8">
              <h2 className="font-display text-3xl font-bold mb-1" style={{ color: '#081b56' }}>Masuk</h2>
              <p className="text-sm" style={{ color: '#224fa8' }}>Masuk ke akun kamu untuk melanjutkan</p>
            </div>

            {/* ── ERROR ── */}
            {error && (
              <div
                className="mb-5 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm slide-up-1"
                style={{ background: '#fff1f0', border: '1px solid #fecaca', color: '#b91c1c' }}
              >
                <span className="mt-0.5 text-red-400">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* ── FORM ── */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Email */}
              <div className="slide-up-2">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#081b56' }}>Email</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    background: focusedField === 'email' ? '#ffffff' : '#f0f4fc',
                    border: `1.5px solid ${focusedField === 'email' ? '#081b56' : '#cfe0fb'}`,
                  }}
                >
                  <Mail size={17} style={{ flexShrink: 0, color: focusedField === 'email' ? '#081b56' : '#6893e4', transition: 'color 0.25s' }} />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    placeholder="kamu@email.com"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#081b56', caretColor: '#081b56' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="slide-up-3">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#081b56' }}>Password</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    background: focusedField === 'password' ? '#ffffff' : '#f0f4fc',
                    border: `1.5px solid ${focusedField === 'password' ? '#081b56' : '#cfe0fb'}`,
                  }}
                >
                  <Lock size={17} style={{ flexShrink: 0, color: focusedField === 'password' ? '#081b56' : '#6893e4', transition: 'color 0.25s' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#081b56', caretColor: '#081b56' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="transition-all duration-200 active:scale-90"
                    style={{ color: '#6893e4' }}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="slide-up-4 pt-1">
                <button
                  type="submit"
                  id="login-submit"
                  disabled={loading}
                  className="btn-login w-full py-4 rounded-2xl font-semibold text-sm tracking-wide disabled:opacity-60 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #081b56 0%, #193a8d 100%)',
                    boxShadow: '0 6px 20px rgba(8,27,86,0.25)',
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Masuk...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Masuk Sekarang
                      <span className="text-gold font-bold">→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: '#cfe0fb' }} />
              <span className="text-xs" style={{ color: '#6893e4' }}>atau</span>
              <div className="flex-1 h-px" style={{ background: '#cfe0fb' }} />
            </div>

            {/* Register link */}
            <p className="text-center text-sm slide-up-4" style={{ color: '#224fa8' }}>
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold transition-all hover:underline" style={{ color: '#081b56' }}>
                Daftar Gratis
              </Link>
            </p>

            {/* ── DEMO ACCOUNTS ── */}
            <div
              className="slide-up-4 mt-7 rounded-2xl p-4"
              style={{ background: '#eef3fb', border: '1.5px solid #cfe0fb' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#081b56' }}>✦ Demo Accounts</p>
              <div className="space-y-2">
                {[
                  { role: 'Admin', email: 'admin@coffee.shop', color: '#ef4444' },
                  { role: 'Kasir', email: 'kasir@coffee.shop', color: '#f97316' },
                  { role: 'Logistik', email: 'logistik@coffee.shop', color: '#d97706' },
                  { role: 'User',  email: 'user@coffee.shop',  color: '#22c55e' },
                ].map(({ role, email: demoEmail, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(demoEmail); setPassword('password'); }}
                    className="demo-row w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.85)', border: '1px solid #cfe0fb' }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-medium" style={{ color: '#081b56' }}>{role}</span>
                    </span>
                    <span style={{ color: '#224fa8', fontFamily: 'monospace' }}>{demoEmail}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs mt-3" style={{ color: '#6893e4' }}>
                Klik untuk isi otomatis · pass: <span className="font-semibold" style={{ color: '#081b56' }}>password</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
