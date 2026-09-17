import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
        setError('Registrasi gagal.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-coffee-50">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display text-3xl font-bold text-coffee-900 mb-8 block">COFFEE</Link>
        <h2 className="font-display text-2xl font-bold text-coffee-900 mb-2">Daftar</h2>
        <p className="text-coffee-500 mb-8">Buat akun baru</p>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Nama</label>
            <input name="name" value={form.name} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Telepon</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-2">Konfirmasi Password</label>
            <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} className="input-field" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Loading...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-coffee-500 mt-6 text-sm">
          Sudah punya akun? <Link to="/login" className="text-coffee-900 font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
