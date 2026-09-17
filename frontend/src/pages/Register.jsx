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

  const inputBg = (field) => focusedField === field ? '#ffffff' : '#f0ebe4';
  const inputBorder = (field) => `1.5px solid ${focusedField === field ? '#c9a227' : '#e8d5c4'}`;
  const iconColor = (field) => focusedField === field ? '#c9a227' : '#c4a07a';

  const fields = [
    { name: 'name',  label: 'Nama Lengkap',    type: 'text',  placeholder: 'Nama kamu',         Icon: User,  required: true  },
    { name: 'email', label: 'Email',            type: 'email', placeholder: 'kamu@email.com',    Icon: Mail,  required: true  },
    { name: 'phone', label: 'Nomor Telepon',    type: 'tel',   placeholder: '08xx-xxxx-xxxx',    Icon: Phone, required: false },
  ];

  const passwordMatch = form.password && form.password_confirmation && form.password === form.password_confirmation;
  const passwordMismatch = form.password && form.password_confirmation && form.password !== form.password_confirmation;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#faf8f5' }}>

      {/* Blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,162,39,0.16) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(92,58,40,0.1) 0%, transparent 70%)' }} />

      {/* Dot pattern */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots-r" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#c9a227" opacity="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots-r)" />
      </svg>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .su  { animation: slide-up 0.55s ease-out both; }
        .su1 { animation: slide-up 0.55s 0.08s ease-out both; }
        .su2 { animation: slide-up 0.55s 0.16s ease-out both; }
        .su3 { animation: slide-up 0.55s 0.24s ease-out both; }
        .su4 { animation: slide-up 0.55s 0.32s ease-out both; }
        .su5 { animation: slide-up 0.55s 0.40s ease-out both; }
        .input-wrap { transition: box-shadow 0.25s, border-color 0.25s, background 0.25s; }
        .input-wrap:focus-within { box-shadow: 0 0 0 3px rgba(201,162,39,0.15); }
        .btn-reg { transition: transform 0.2s, box-shadow 0.2s; }
        .btn-reg:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(44,24,16,0.25); }
        .btn-reg:active:not(:disabled) { transform: scale(0.98); }
      `}</style>

      <div className="min-h-screen flex items-center justify-center px-5 py-12 relative">
        <div className="w-full max-w-[380px] lg:max-w-[420px]">

          {/* Logo */}
          <div className="su flex flex-col items-center mb-8">
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

          {/* Card */}
          <div
            className="su1 rounded-3xl p-7"
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid #e8d5c4',
              boxShadow: '0 20px 60px rgba(44,24,16,0.1), 0 4px 12px rgba(44,24,16,0.06)',
            }}
          >
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold mb-1" style={{ color: '#2c1810' }}>Buat Akun Baru</h2>
              <p className="text-sm" style={{ color: '#a67c52' }}>Daftar dan mulai nikmati kopi terbaik kami</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 px-4 py-3 rounded-2xl flex items-start gap-3 text-sm"
                style={{ background: '#fff1f0', border: '1px solid #fecaca', color: '#b91c1c' }}>
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Basic fields */}
              {fields.map(({ name, label, type, placeholder, Icon, required }, i) => (
                <div key={name} className={`su${i + 2}`}>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b5e3c' }}>
                    {label}
                  </label>
                  <div
                    className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                    style={{ background: inputBg(name), border: inputBorder(name) }}
                  >
                    <Icon size={17} style={{ flexShrink: 0, color: iconColor(name), transition: 'color 0.25s' }} />
                    <input
                      type={type}
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      onFocus={() => setFocusedField(name)}
                      onBlur={() => setFocusedField('')}
                      placeholder={placeholder}
                      className="flex-1 bg-transparent outline-none text-sm"
                      style={{ color: '#2c1810', caretColor: '#c9a227' }}
                      required={required}
                    />
                  </div>
                </div>
              ))}

              {/* Password */}
              <div className="su4">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b5e3c' }}>Password</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{ background: inputBg('password'), border: inputBorder('password') }}
                >
                  <Lock size={17} style={{ flexShrink: 0, color: iconColor('password'), transition: 'color 0.25s' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Min. 8 karakter"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#2c1810', caretColor: '#c9a227' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!s => !s)} className="active:scale-90 transition-transform" style={{ color: '#c4a07a' }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="su5">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b5e3c' }}>Konfirmasi Password</label>
                <div
                  className="input-wrap flex items-center gap-3 rounded-2xl px-4 py-4"
                  style={{
                    background: inputBg('password_confirmation'),
                    border: passwordMismatch
                      ? '1.5px solid #fca5a5'
                      : passwordMatch
                      ? '1.5px solid #86efac'
                      : inputBorder('password_confirmation'),
                  }}
                >
                  <Lock size={17} style={{ flexShrink: 0, color: iconColor('password_confirmation'), transition: 'color 0.25s' }} />
                  <input
                    type={showPassConf ? 'text' : 'password'}
                    name="password_confirmation"
                    value={form.password_confirmation}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password_confirmation')}
                    onBlur={() => setFocusedField('')}
                    placeholder="Ulangi password"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: '#2c1810', caretColor: '#c9a227' }}
                    required
                  />
                  <button type="button" onClick={() => setShowPassConf(s => !s)} className="active:scale-90 transition-transform" style={{ color: '#c4a07a' }}>
                    {showPassConf ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {passwordMatch && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5 pl-1" style={{ color: '#16a34a' }}>
                    <span>✓</span> Password cocok
                  </p>
                )}
                {passwordMismatch && (
                  <p className="text-xs mt-1.5 flex items-center gap-1.5 pl-1" style={{ color: '#dc2626' }}>
                    <span>✕</span> Password tidak cocok
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  id="register-submit"
                  disabled={loading}
                  className="btn-reg w-full py-4 rounded-2xl font-semibold text-sm tracking-wide disabled:opacity-60"
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
                      Mendaftar...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Daftar Sekarang <span style={{ color: '#c9a227' }}>→</span>
                    </span>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
              <span className="text-xs" style={{ color: '#c4a07a' }}>atau</span>
              <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
            </div>

            {/* Login link */}
            <p className="text-center text-sm" style={{ color: '#a67c52' }}>
              Sudah punya akun?{' '}
              <Link to="/login" className="font-semibold hover:underline transition-all" style={{ color: '#2c1810' }}>
                Masuk
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="text-center text-xs mt-5 px-6" style={{ color: '#c4a07a' }}>
            Dengan mendaftar, kamu menyetujui syarat & ketentuan layanan kami
          </p>
        </div>
      </div>
    </div>
  );
}
