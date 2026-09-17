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
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#faf8f5' }}>

      {/* Decorative top-right blob */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(201,162,39,0.18) 0%, transparent 70%)' }}
      />
      {/* Bottom-left blob */}
      <div
        className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(92,58,40,0.1) 0%, transparent 70%)' }}
      />
      {/* Center subtle glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, rgba(201,162,39,0.08) 0%, transparent 70%)' }}
      />

      {/* Decorative dots pattern */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#c9a227" opacity="0.25" />
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
          box-shadow: 0 0 0 3px rgba(201,162,39,0.15);
        }
        .btn-login {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(44,24,16,0.25);
        }
        .btn-login:active:not(:disabled) {
          transform: scale(0.98);
        }
        .demo-row {
          transition: background 0.2s, transform 0.15s;
        }
        .demo-row:active { transform: scale(0.98); }
        .demo-row:hover { background: rgba(201,162,39,0.08) !important; }
      `}</style>

      <div className="min-h-screen flex">

        {/* ── LEFT PANEL (desktop only) ─────────────────────── */}
        <div
          className="hidden lg:flex lg:w-[45%] bg-cover bg-center relative flex-col justify-between p-16"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=1200&fit=crop)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(26,15,10,0.85) 0%, rgba(92,58,40,0.7) 100%)' }} />

          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.5)' }}>
                <Coffee size={20} color="#c9a227" />
              </div>
              <span className="font-display text-xl font-bold text-white tracking-widest">COFFEE</span>
            </Link>
          </div>

          <div className="relative z-10">
            <p className="text-xs uppercase tracking-[4px] mb-4" style={{ color: '#c9a227' }}>Selamat Datang</p>
            <h1 className="font-display text-5xl font-bold text-white leading-tight mb-5">
              Kopi Terbaik<br />Untuk Hari<br />Terbaikmu ☕
            </h1>
            <p className="text-white/50 leading-relaxed text-sm max-w-xs">
              Masuk dan pesan kopi favoritmu langsung dari genggaman tanganmu.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xs text-white/60">✓</span>
            </div>
            <span className="text-white/40 text-xs">Lebih dari 500+ pelanggan setia</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-12 lg:px-14 relative">

          {/* Floating decorative badge (mobile hidden) */}
          <div
            className="float-badge absolute top-8 right-8 hidden lg:flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium"
            style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', color: '#8b5e3c' }}
          >
            <span>☕</span> Premium Coffee
          </div>

          <div className="w-full max-w-[380px]">

            {/* ── MOBILE LOGO ── */}
            <div className="slide-up mb-8 lg:hidden flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2c1810 0%, #5c3a28 100%)', boxShadow: '0 8px 24px rgba(44,24,16,0.2)' }}
              >
                <Coffee size={30} color="#c9a227" />
              </div>
              <Link to="/" className="font-display text-3xl font-bold tracking-widest" style={{ color: '#2c1810' }}>COFFEE</Link>
              <div className="flex items-center gap-1 mt-2">
                <div className="h-0.5 w-8 rounded-full" style={{ background: '#c9a227' }} />
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#c9a227' }} />
                <div className="h-0.5 w-8 rounded-full" style={{ background: '#c9a227' }} />
              </div>
            </div>

            {/* ── DESKTOP HEADER ── */}
            <div className="slide-up hidden lg:block mb-8">
              <Link to="/" className="font-display text-2xl font-bold tracking-widest mb-6 block" style={{ color: '#2c1810' }}>COFFEE</Link>
            </div>

            {/* ── HEADING ── */}
            <div className="slide-up-1 mb-8">
              <h2 className="font-display text-3xl font-bold mb-1" style={{ color: '#2c1810' }}>Masuk</h2>
              <p className="text-sm" style={{ color: '#a67c52' }}>Masuk ke akun kamu untuk melanjutkan</p>
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
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b5e3c' }}>Email</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    background: focusedField === 'email' ? '#ffffff' : '#f0ebe4',
                    border: `1.5px solid ${focusedField === 'email' ? '#c9a227' : '#e8d5c4'}`,
                  }}
                >
                  <Mail size={17} style={{ flexShrink: 0, color: focusedField === 'email' ? '#c9a227' : '#c4a07a', transition: 'color 0.25s' }} />
                  <input
                    type="email"
                    id="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField('')}
                    placeholder="kamu@email.com"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#2c1810', caretColor: '#c9a227' }}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="slide-up-3">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b5e3c' }}>Password</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    background: focusedField === 'password' ? '#ffffff' : '#f0ebe4',
                    border: `1.5px solid ${focusedField === 'password' ? '#c9a227' : '#e8d5c4'}`,
                  }}
                >
                  <Lock size={17} style={{ flexShrink: 0, color: focusedField === 'password' ? '#c9a227' : '#c4a07a', transition: 'color 0.25s' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="••••••••"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#2c1810', caretColor: '#c9a227' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="transition-all duration-200 active:scale-90"
                    style={{ color: '#c4a07a' }}
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
                  className="btn-login w-full py-4 rounded-2xl font-semibold text-sm tracking-wide disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #2c1810 0%, #5c3a28 100%)',
                    color: '#faf8f5',
                    boxShadow: '0 6px 20px rgba(44,24,16,0.2)',
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
                      <span style={{ color: '#c9a227' }}>→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
              <span className="text-xs" style={{ color: '#c4a07a' }}>atau</span>
              <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
            </div>

            {/* Register link */}
            <p className="text-center text-sm slide-up-4" style={{ color: '#a67c52' }}>
              Belum punya akun?{' '}
              <Link to="/register" className="font-semibold transition-all hover:underline" style={{ color: '#2c1810' }}>
                Daftar Gratis
              </Link>
            </p>

            {/* ── DEMO ACCOUNTS ── */}
            <div
              className="slide-up-4 mt-7 rounded-2xl p-4"
              style={{ background: '#f0ebe4', border: '1.5px solid #e8d5c4' }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#8b5e3c' }}>✦ Demo Accounts</p>
              <div className="space-y-2">
                {[
                  { role: 'Admin', email: 'admin@coffee.shop', color: '#ef4444' },
                  { role: 'Kasir', email: 'kasir@coffee.shop', color: '#f97316' },
                  { role: 'User',  email: 'user@coffee.shop',  color: '#22c55e' },
                ].map(({ role, email: demoEmail, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(demoEmail); setPassword('password'); }}
                    className="demo-row w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs"
                    style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #e8d5c4' }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-medium" style={{ color: '#5c3a28' }}>{role}</span>
                    </span>
                    <span style={{ color: '#c4a07a', fontFamily: 'monospace' }}>{demoEmail}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs mt-3" style={{ color: '#c4a07a' }}>
                Klik untuk isi otomatis · pass: <span className="font-semibold" style={{ color: '#8b5e3c' }}>password</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
