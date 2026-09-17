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
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0f0a 0%, #2c1810 40%, #3d2317 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5e3c, transparent)' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />

      {/* Steam particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              background: 'rgba(201,162,39,0.3)',
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animation: `float ${3 + i * 0.5}s ease-in-out infinite alternate`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          to { transform: translateY(-20px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,162,39,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(201,162,39,0); }
        }
        .slide-up { animation: slide-up 0.6s ease-out forwards; }
        .slide-up-delay-1 { animation: slide-up 0.6s ease-out 0.1s both; }
        .slide-up-delay-2 { animation: slide-up 0.6s ease-out 0.2s both; }
        .slide-up-delay-3 { animation: slide-up 0.6s ease-out 0.3s both; }
        .slide-up-delay-4 { animation: slide-up 0.6s ease-out 0.4s both; }
        .input-glow:focus-within {
          box-shadow: 0 0 0 2px rgba(201,162,39,0.5);
        }
      `}</style>

      <div className="min-h-screen flex">
        {/* Left panel - Desktop only */}
        <div
          className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=1200&fit=crop)' }}
        >
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(26,15,10,0.9), rgba(44,24,16,0.6))' }} />
          <div className="relative z-10 flex flex-col justify-between p-16 w-full">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)' }}>
                <Coffee size={20} color="#c9a227" />
              </div>
              <span className="font-display text-2xl font-bold text-white">COFFEE</span>
            </Link>
            <div>
              <h1 className="font-display text-5xl font-bold text-white mb-4 leading-tight">
                Selamat<br />Datang<br />Kembali ☕
              </h1>
              <p className="text-white/60 text-lg leading-relaxed">Masuk untuk menikmati pengalaman kopi terbaik kami yang tak terlupakan.</p>
            </div>
            <div className="flex items-center gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-1 rounded-full" style={{ width: i === 0 ? '24px' : '8px', background: i === 0 ? '#c9a227' : 'rgba(255,255,255,0.3)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Form */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 lg:px-12" style={{ minHeight: '100svh' }}>
          <div className="w-full max-w-sm lg:max-w-md">

            {/* Mobile Logo */}
            <div className="slide-up flex flex-col items-center mb-8 lg:hidden">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)' }}>
                <Coffee size={32} color="#c9a227" />
              </div>
              <Link to="/" className="font-display text-3xl font-bold text-white tracking-wide">COFFEE</Link>
              <div className="flex items-center gap-1 mt-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-full" style={{ width: i === 1 ? '20px' : '6px', height: '3px', background: i === 1 ? '#c9a227' : 'rgba(201,162,39,0.4)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>

            {/* Form Card */}
            <div
              className="slide-up-delay-1 rounded-3xl p-7 lg:p-9"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
              }}
            >
              {/* Header */}
              <div className="mb-7">
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">Masuk</h2>
                <p style={{ color: 'rgba(196,160,122,0.8)', fontSize: '14px' }}>Masuk ke akun kamu untuk melanjutkan</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div className="slide-up-delay-2">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.8)' }}>Email</label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300 input-glow"
                    style={{
                      background: focusedField === 'email' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                      border: focusedField === 'email' ? '1px solid rgba(201,162,39,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Mail size={16} color={focusedField === 'email' ? '#c9a227' : 'rgba(196,160,122,0.5)'} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                    <input
                      type="email"
                      id="login-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      placeholder="kamu@email.com"
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: 'white', caretColor: '#c9a227' }}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="slide-up-delay-3">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.8)' }}>Password</label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300"
                    style={{
                      background: focusedField === 'password' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                      border: focusedField === 'password' ? '1px solid rgba(201,162,39,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Lock size={16} color={focusedField === 'password' ? '#c9a227' : 'rgba(196,160,122,0.5)'} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      id="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      placeholder="••••••••"
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: 'white', caretColor: '#c9a227' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="transition-all duration-200 active:scale-90"
                      style={{ color: 'rgba(196,160,122,0.6)' }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="slide-up-delay-4 pt-2">
                  <button
                    type="submit"
                    id="login-submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-semibold text-sm tracking-wide transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: loading ? 'rgba(201,162,39,0.5)' : 'linear-gradient(135deg, #c9a227 0%, #a67c52 100%)',
                      color: '#1a0f0a',
                      boxShadow: loading ? 'none' : '0 8px 24px rgba(201,162,39,0.35)',
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
                    ) : 'Masuk Sekarang →'}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-xs" style={{ color: 'rgba(196,160,122,0.5)' }}>atau</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Register link */}
              <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-semibold transition-all duration-200 hover:underline"
                  style={{ color: '#c9a227' }}
                >
                  Daftar Gratis
                </Link>
              </p>
            </div>

            {/* Demo Accounts */}
            <div
              className="slide-up-delay-4 mt-5 rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p className="text-xs font-semibold mb-3 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.7)' }}>✦ Demo Accounts</p>
              <div className="space-y-2">
                {[
                  { role: 'Admin', email: 'admin@coffee.shop', color: '#f87171' },
                  { role: 'Kasir', email: 'kasir@coffee.shop', color: '#fb923c' },
                  { role: 'User', email: 'user@coffee.shop', color: '#4ade80' },
                ].map(({ role, email: demoEmail, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { setEmail(demoEmail); setPassword('password'); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 active:scale-[0.98]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>{role}</span>
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{demoEmail}</span>
                  </button>
                ))}
              </div>
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Klik untuk isi otomatis • password: <span style={{ color: 'rgba(201,162,39,0.5)' }}>password</span></p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
