import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';

export default function StaffCreateCustomer() {
  const [form, setForm] = useState({ name: '', email: '', password: 'password', phone: '' });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { setOrderForUser } = useCart();
  const navigate = useNavigate();
  const role = user?.role === 'superadmin' ? 'superadmin' : 'cashier';

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/customers', form);
      setSuccess(data);
      setForm({ name: '', email: '', password: 'password', phone: '' });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) {
        setError(Object.values(errors).flat().join(', '));
      } else {
        setError('Gagal membuat akun pelanggan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderForCustomer = () => {
    if (!success) return;
    setOrderForUser({ type: 'user', id: success.id, name: success.name, email: success.email, phone: success.phone });
    navigate('/keranjang');
  };

  return (
    <DashboardLayout title="Buat Akun Pelanggan" role={role}>
      <div className="max-w-lg">
        <p className="text-coffee-500 mb-6">Buat akun untuk pelanggan yang belum terdaftar.</p>

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
          <p className="text-xs text-coffee-500">Beritahu pelanggan email dan password untuk login nanti.</p>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Membuat akun...' : 'Buat Akun Pelanggan'}
          </button>
        </form>

        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 font-medium mb-1">Akun berhasil dibuat!</p>
            <p className="text-green-700 text-sm">{success.name} - {success.email}</p>
            <button type="button" onClick={handleOrderForCustomer} className="btn-primary mt-4 text-sm">
              Pesan untuk Pelanggan Ini
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
