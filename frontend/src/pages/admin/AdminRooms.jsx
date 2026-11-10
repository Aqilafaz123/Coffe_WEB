import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import ImageDropzone from '../../components/ImageDropzone';

const emptyForm = {
  name: '', description: '', capacity: 4, price_per_hour: '', image: '',
  amenities: '', is_active: true,
};

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = () => {
    api.get('/manage/rooms')
      .then((r) => setRooms(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setImageFile(null);
    setRemoveImage(false);
    setError('');
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
    setImageFile(null);
    setRemoveImage(false);
    setError('');
    setEditing(room.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const amenitiesList = form.amenities
        ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description || '');
      formData.append('capacity', String(Number(form.capacity)));
      formData.append('price_per_hour', String(Number(form.price_per_hour)));
      formData.append('is_active', form.is_active ? '1' : '0');

      if (amenitiesList.length > 0) {
        amenitiesList.forEach((item) => formData.append('amenities[]', item));
      } else {
        formData.append('amenities', '');
      }

      if (imageFile) {
        formData.append('image_file', imageFile);
      } else if (editing && removeImage) {
        formData.append('remove_image', '1');
      }

      if (editing) {
        formData.append('_method', 'PUT');
        await api.post(`/rooms/${editing}`, formData);
      } else {
        await api.post('/rooms', formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      const firstError = Object.values(err.response?.data?.errors || {})?.[0]?.[0];
      setError(firstError || err.response?.data?.message || 'Gagal menyimpan ruangan.');
    } finally {
      setSaving(false);
    }
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
          <div className="flex justify-end mb-4 sm:mb-6">
            <button onClick={openCreate} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 text-sm">
              <Plus size={16} /> Tambah Ruangan
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="md:hidden divide-y divide-coffee-100">
                        {rooms.map((room) => (
                          <div key={room.id} className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-coffee-900 truncate">{room.name}</p>
                                {room.description && (
                                  <p className="text-xs text-coffee-500 line-clamp-2 mt-0.5">{room.description}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {room.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <div className="text-xs text-coffee-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span>{room.capacity} orang</span>
                                <span className="font-semibold text-coffee-900">{formatPrice(room.price_per_hour)}/jam</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => openEdit(room)} className="p-2 text-coffee-600 hover:bg-coffee-50 rounded-lg"><Pencil size={16} /></button>
                                <button onClick={() => handleDelete(room.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full min-w-[640px]">
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
                            <td className="px-6 py-4 text-sm text-coffee-600 whitespace-nowrap">{room.capacity} orang</td>
                            <td className="px-6 py-4 text-sm text-coffee-900 whitespace-nowrap">{formatPrice(room.price_per_hour)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {room.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <button onClick={() => openEdit(room)} className="p-2 text-coffee-500 hover:text-coffee-900"><Pencil size={16} /></button>
                              <button onClick={() => handleDelete(room.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
            </div>
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                  <div className="bg-white rounded-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-5 sm:mb-6">
                      <h2 className="font-display text-xl font-bold">{editing ? 'Edit' : 'Tambah'} Ruangan</h2>
                      <button onClick={() => setShowModal(false)}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input placeholder="Nama ruangan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
                      <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input type="number" placeholder="Kapasitas" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input-field" required />
                          <input type="number" placeholder="Harga/jam" value={form.price_per_hour} onChange={(e) => setForm({ ...form, price_per_hour: e.target.value })} className="input-field" required />
                        </div>
                        <ImageDropzone
                          label="Gambar Ruangan"
                          file={imageFile}
                          existingUrl={form.image}
                          removed={removeImage}
                          onChange={({ file, removed }) => {
                            setImageFile(file);
                            setRemoveImage(removed);
                          }}
                        />
                        <input placeholder="Fasilitas (pisahkan koma: WiFi, AC, TV)" value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} className="input-field" />
                        <label className="flex items-center gap-2 text-sm text-coffee-700">
                          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                          Aktif
                        </label>
                        {error && <p className="text-red-600 text-sm" role="alert">{error}</p>}
                        <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-50">
                          {saving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </form>
                  </div>
                </div>
      )}
              </DashboardLayout>
              );
}
