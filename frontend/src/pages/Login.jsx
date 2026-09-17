import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=1200&fit=crop)' }}
      >
        <div className="absolute inset-0 bg-coffee-900/60" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <Coffee className="text-gold mb-6" size={48} />
          <h1 className="font-display text-5xl font-bold text-white mb-4">Welcome Back</h1>
          <p className="text-white/70 text-lg">Masuk untuk menikmati kopi terbaik kami</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-coffee-50">
        <div className="w-full max-w-md">
          <Link to="/" className="font-display text-3xl font-bold text-coffee-900 mb-8 block">COFFEE</Link>
          <h2 className="font-display text-2xl font-bold text-coffee-900 mb-2">Login</h2>
          <p className="text-coffee-500 mb-8">Masuk ke akun Anda</p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-coffee-700 mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-coffee-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <p className="text-center text-coffee-500 mt-6 text-sm">
            Belum punya akun? <Link to="/register" className="text-coffee-900 font-medium hover:underline">Daftar</Link>
          </p>

          <div className="mt-8 p-4 bg-coffee-100 rounded-xl text-xs text-coffee-600 space-y-1">
            <p className="font-semibold text-coffee-800 mb-2">Demo Accounts:</p>
            <p>Admin: admin@coffee.shop / password</p>
            <p>Kasir: kasir@coffee.shop / password</p>
            <p>User: user@coffee.shop / password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
