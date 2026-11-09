import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ChangePassword() {
  const { user, getDashboardPath } = useAuth();
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [visible, setVisible] = useState({});
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setErrors({}); setMessage(''); setError('');
    if (form.password !== form.password_confirmation) { setErrors({ password: ['Konfirmasi password tidak sama.'] }); return; }
    setBusy(true);
    try {
      const { data } = await api.put('/me/password', form);
      setForm({ current_password: '', password: '', password_confirmation: '' });
      setMessage(data.message);
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setError(err.response?.data?.errors ? '' : err.response?.data?.message || 'Gagal mengganti password. Silakan coba lagi.');
    } finally { setBusy(false); }
  };

  const content = (
    <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 sm:p-8 shadow-sm">
      <KeyRound size={32} className="text-coffee-900 mb-4" />
      <h2 className="text-2xl font-bold text-coffee-900 mb-2">Ganti Password</h2>
      <p className="text-sm text-coffee-500 mb-6">{user?.email} · Gunakan password baru minimal 6 karakter.</p>
      {message && <p role="status" className="mb-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      <form onSubmit={submit} className="space-y-5">
        {[
          ['current_password', 'Password Lama', 'current-password'],
          ['password', 'Password Baru', 'new-password'],
          ['password_confirmation', 'Konfirmasi Password Baru', 'new-password'],
        ].map(([field, label, autocomplete]) => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-coffee-800 mb-2">{label}</label>
            <div className="relative">
              <input id={field} type={visible[field] ? 'text' : 'password'} autoComplete={autocomplete} value={form[field]} disabled={busy} required minLength={field === 'current_password' ? undefined : 6} maxLength={field === 'current_password' ? undefined : 72} aria-invalid={!!errors[field]} aria-describedby={errors[field] ? `${field}-error` : undefined} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="input-field pr-12" />
              <button type="button" aria-label={`${visible[field] ? 'Sembunyikan' : 'Tampilkan'} ${label}`} onClick={() => setVisible({ ...visible, [field]: !visible[field] })} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-coffee-500">{visible[field] ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors[field] && <p id={`${field}-error`} role="alert" className="text-red-600 text-sm mt-1">{errors[field][0]}</p>}
          </div>
        ))}
        <p className="text-xs text-coffee-500">Setelah berhasil, sesi login lain akan dikeluarkan. Sesi yang digunakan sekarang tetap aktif.</p>
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">{busy ? 'Menyimpan...' : 'Simpan Password Baru'}</button>
      </form>
      <Link to={getDashboardPath(user?.role)} className="block text-center text-sm text-coffee-600 mt-5 hover:underline">Kembali ke Akun</Link>
    </div>
  );

  return user?.role !== 'user'
    ? <DashboardLayout title="Ganti Password" role={user?.role}>{content}</DashboardLayout>
    : <div className="min-h-screen bg-coffee-50"><Navbar /><main className="pt-28 pb-16 px-4">{content}</main><Footer /></div>;
}
