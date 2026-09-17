import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';

const emptyForm = { name: '', description: '', price: '', category_id: '', image: '', stock: 50, is_featured: false, is_active: true };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([api.get('/products'), api.get('/categories')])
      .then(([p, c]) => { setProducts(p.data); setCategories(c.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category_id: product.category_id,
      image: product.image || '',
      stock: product.stock,
      is_featured: product.is_featured,
      is_active: product.is_active,
    });
    setEditing(product.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { ...form, price: Number(form.price), stock: Number(form.stock), category_id: Number(form.category_id) };
    if (editing) {
      await api.put(`/products/${editing}`, data);
    } else {
      await api.post('/products', data);
    }
    setShowModal(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    await api.delete(`/products/${id}`);
    fetchData();
  };

  return (
    <DashboardLayout title="Kelola Produk" role="superadmin">
      <div className="flex justify-end mb-6">
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Tambah Produk
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
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Produk</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Kategori</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Harga</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-coffee-600">Stok</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-coffee-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-coffee-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-coffee-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium text-coffee-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-coffee-600">{p.category?.name}</td>
                  <td className="px-6 py-4 text-sm">{formatPrice(p.price)}</td>
                  <td className="px-6 py-4 text-sm">{p.stock}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => openEdit(p)} className="p-2 text-coffee-500 hover:text-coffee-900"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              <textarea placeholder="Deskripsi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Harga" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" required />
                <input type="number" placeholder="Stok" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="input-field" />
              </div>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field" required>
                <option value="">Pilih Kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input placeholder="URL Gambar" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="input-field" />
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                  Aktif
                </label>
              </div>
              <button type="submit" className="btn-primary w-full">{editing ? 'Update' : 'Simpan'}</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
