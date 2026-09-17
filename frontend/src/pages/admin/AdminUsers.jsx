import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

const roleLabels = { user: 'User', cashier: 'Kasir', superadmin: 'Super Admin' };
const roleColors = { user: 'bg-blue-100 text-blue-800', cashier: 'bg-purple-100 text-purple-800', superadmin: 'bg-red-100 text-red-800' };
const emptyForm = { name: '', email: '', password: '', role: 'user', phone: '' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    api.get('/users').then((r) => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };

  const openEdit = (user) => {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setEditing(user.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form };
    if (editing && !data.password) delete data.password;
    if (editing) {
      await api.put(`/users/${editing}`, data);
    } else {
      await api.post('/users', data);
    }
    setShowModal(false);
    fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus user ini?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  return (
    <DashboardLayout title="Kelola Pengguna" role="superadmin">
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Tambah User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-coffee-50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Nama</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Email</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Telepon</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-coffee-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-coffee-50/50">
                  <td className="px-6 py-4 font-medium text-coffee-900">{u.name}</td>
                  <td className="px-6 py-4 text-sm text-coffee-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[u.role]}`}>
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-coffee-600">{u.phone || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(u)} className="p-2 text-coffee-500 hover:text-coffee-900"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">{editing ? 'Edit User' : 'Tambah User'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" required />
              <input type="password" placeholder={editing ? 'Password (kosongkan jika tidak diubah)' : 'Password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" {...(!editing && { required: true })} />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                <option value="user">User</option>
                <option value="cashier">Kasir</option>
                <option value="superadmin">Super Admin</option>
              </select>
              <input placeholder="Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Simpan'}</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
