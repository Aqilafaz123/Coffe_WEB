import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

const emptyForm = {
  name: '', description: '', capacity: 4, price_per_hour: '', image: '',
  amenities: '', is_active: true,
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get('/manage/rooms')
      .then((r) => setRooms(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (room) => {
    setForm({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity,
      price_per_hour: room.price_per_hour,
      image: room.image || '',
      amenities: (room.amenities || []).join(', '),
      is_active: room.is_active,
    });
    setEditing(room.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...form,
      capacity: Number(form.capacity),
      price_per_hour: Number(form.price_per_hour),
      amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
    };
    if (editing) {
      await api.put(`/rooms/${editing}`, data);
    } else {
      await api.post('/rooms', data);
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus ruangan ini?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  return (
    <DashboardLayout title="Kelola Ruangan" role="superadmin">
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Tambah Ruangan
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
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Ruangan</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Kapasitas</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Harga/jam</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Status</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-coffee-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-coffee-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-coffee-900">{room.name}</p>
                    <p className="text-xs text-coffee-500 truncate max-w-xs">{room.description}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-coffee-600">{room.capacity} orang</td>
                  <td className="px-6 py-4 text-sm text-coffee-900">{formatPrice(room.price_per_hour)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {room.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(room)} className="p-2 text-coffee-500 hover:text-coffee-900"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(room.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl font-bold">{editing ? 'Edit' : 'Tambah'} Ruangan</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nama ruangan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Kapasitas" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" required />
                <input type="number" placeholder="Harga/jam" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })} className="input-field" required />
              </div>
              <input placeholder="URL Gambar" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-field" />
              <input placeholder="Fasilitas (pisahkan koma: WiFi, AC, TV)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="input-field" />
              <label className="flex items-center gap-2 text-sm text-coffee-700">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Aktif
              </label>
              <button type="submit" className="btn-primary w-full">Simpan</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
