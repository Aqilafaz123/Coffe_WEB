import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [showPassConf, setShowPassConf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/pesanan');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(', '));
      } else {
        setError('Registrasi gagal. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    background: focusedField === field ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
    border: focusedField === field ? '1px solid rgba(201,162,39,0.6)' : '1px solid rgba(255,255,255,0.1)',
  });

  const iconColor = (field) => focusedField === field ? '#c9a227' : 'rgba(196,160,122,0.5)';

  const fields = [
    { name: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama kamu', Icon: User, required: true },
    { name: 'email', label: 'Email', type: 'email', placeholder: 'kamu@email.com', Icon: Mail, required: true },
    { name: 'phone', label: 'Nomor Telepon', type: 'tel', placeholder: '08xx-xxxx-xxxx', Icon: Phone, required: false },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0f0a 0%, #2c1810 40%, #3d2317 100%)' }}>

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #c9a227, transparent)' }} />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, #8b5e3c, transparent)' }} />

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-up { animation: slide-up 0.6s ease-out forwards; }
        .slide-up-d1 { animation: slide-up 0.6s ease-out 0.1s both; }
        .slide-up-d2 { animation: slide-up 0.6s ease-out 0.2s both; }
        .slide-up-d3 { animation: slide-up 0.6s ease-out 0.3s both; }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm lg:max-w-md">

          {/* Logo */}
          <div className="slide-up flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)' }}>
              <Coffee size={28} color="#c9a227" />
            </div>
            <Link to="/" className="font-display text-2xl font-bold text-white tracking-wide">COFFEE</Link>
          </div>

          {/* Card */}
          <div
            className="slide-up-d1 rounded-3xl p-7"
            style={{
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-white mb-1">Buat Akun</h2>
              <p style={{ color: 'rgba(196,160,122,0.8)', fontSize: '14px' }}>Daftar dan nikmati kopi terbaik kami</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Text fields */}
              {fields.map(({ name, label, type, placeholder, Icon, required }) => (
                <div key={name} className="slide-up-d2">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.8)' }}>
                    {label}
                  </label>
                  <div
                    className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300"
                    style={inputStyle(name)}
                  >
                    <Icon size={16} color={iconColor(name)} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(name)}
                      onBlur={() => setFocusedField('')}
                      placeholder={placeholder}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: 'white', caretColor: '#c9a227' }}
                      required={required}
                    />
                  </div>
                </div>
              ))}

              {/* Password */}
              <div className="slide-up-d2">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.8)' }}>Password</label>
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300"
                  style={inputStyle('password')}
                >
                  <Lock size={16} color={iconColor('password')} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Min. 8 karakter"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'white', caretColor: '#c9a227' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="active:scale-90 transition-transform" style={{ color: 'rgba(196,160,122,0.6)' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="slide-up-d3">
                <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: 'rgba(201,162,39,0.8)' }}>Konfirmasi Password</label>
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-300"
                  style={inputStyle('password_confirmation')}
                >
                  <Lock size={16} color={iconColor('password_confirmation')} style={{ flexShrink: 0, transition: 'color 0.3s' }} />
                  <input
                    type={showPassConf ? 'text' : 'password'}
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password_confirmation')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Ulangi password"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'white', caretColor: '#c9a227' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassConf(!showPassConf)} className="active:scale-90 transition-transform" style={{ color: 'rgba(196,160,122,0.6)' }}>
                    {showPassConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password match indicator */}
              {form.password && form.password_confirmation && (
                <div className="flex items-center gap-2 text-xs px-1">
                  {form.password === form.password_confirmation ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span style={{ color: '#4ade80' }}>Password cocok</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span style={{ color: '#f87171' }}>Password tidak cocok</span>
                    </>
                  )}
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="register-submit"
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
                      Mendaftar...
                    </span>
                  ) : 'Daftar Sekarang →'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(196,160,122,0.5)' }}>atau</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Login link */}
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold hover:underline transition-all" style={{ color: '#c9a227' }}>
                Masuk
              </Link>
            </p>
          </div>

          {/* Terms note */}
          <p className="text-center text-xs mt-5 px-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Dengan mendaftar, kamu menyetujui syarat & ketentuan layanan kami
          </p>
        </div>
      </div>
    </div>
  );
}
