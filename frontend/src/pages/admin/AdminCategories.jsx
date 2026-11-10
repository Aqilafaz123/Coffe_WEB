import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';

const emptyForm = { name: '', icon: 'coffee', is_active: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({});

  const load = async () => {
    const { data } = await api.get('/admin/categories');
    setCategories(data);
  };
  useEffect(() => {
    let active = true;
    api.get('/admin/categories').then(({ data }) => { if (active) setCategories(data); })
      .catch(() => { if (active) setError('Kategori gagal dimuat. Silakan refresh halaman.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const reset = () => { setForm(emptyForm); setEditing(null); setErrors({}); };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true); setError(''); setErrors({}); setSuccess('');
    try {
      if (editing) await api.put(`/categories/${editing}`, form);
      else await api.post('/categories', form);
      reset();
      setSuccess('Kategori berhasil disimpan.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan atau memperbarui daftar kategori.');
      setErrors(err.response?.data?.errors || {});
    } finally { setBusy(false); }
  };
  const remove = async (category) => {
    if (!confirm(`Hapus kategori ${category.name}?`)) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await api.delete(`/categories/${category.id}`);
      if (editing === category.id) reset();
      setSuccess('Kategori berhasil dihapus.');
      await load();
    } catch (err) { setError(err.response?.data?.message || 'Gagal menghapus kategori.'); }
    finally { setBusy(false); }
  };

  return (
    <DashboardLayout title="Kelola Kategori" role="superadmin">
      <p className="text-coffee-500 text-sm mb-6">Kategori aktif tersedia pada pilihan kategori produk dan menu pelanggan.</p>
      {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl p-4 mb-4">{error}</p>}
      {success && <p role="status" className="bg-green-50 text-green-800 rounded-xl p-4 mb-4">{success}</p>}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <form onSubmit={save} className="bg-white rounded-2xl p-4 sm:p-6 h-fit space-y-4">
              <h2 className="font-bold text-coffee-900 text-lg flex items-center gap-2"><Plus size={20} />{editing ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <div><label htmlFor="category-name" className="block text-sm font-medium mb-2">Nama Kategori</label><input id="category-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={255} disabled={busy} className="input-field" placeholder="Contoh: Kopi, Teh, Es Krim" />{(errors.name || errors.slug) && <p className="text-red-600 text-sm mt-1">{(errors.name || errors.slug)[0]}</p>}</div>
              <div><label htmlFor="category-icon" className="block text-sm font-medium mb-2">Ikon</label><select id="category-icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} disabled={busy} className="input-field"><option value="coffee">Kopi</option><option value="snowflake">Minuman Dingin</option><option value="cup-soda">Gelas Minuman</option><option value="cake">Makanan / Dessert</option></select></div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} disabled={busy} />Kategori aktif</label>
              <button disabled={busy || !form.name.trim()} className="btn-primary w-full disabled:opacity-50">{busy ? 'Memproses...' : editing ? 'Simpan Perubahan' : 'Tambah Kategori'}</button>
              {editing && <button type="button" onClick={reset} disabled={busy} className="w-full text-sm text-coffee-600 py-2">Batal Edit</button>}
            </form>
              <section className="xl:col-span-2 bg-white rounded-2xl overflow-hidden h-fit">
                {loading ? (
                  <p className="p-12 text-center text-coffee-500">Memuat kategori...</p>
                ) : !categories.length ? (
                  <p className="p-12 text-center text-coffee-500">Belum ada kategori. Tambahkan kategori melalui formulir.</p>
                ) : (
                  <>
                    <div className="sm:hidden divide-y divide-coffee-100">
                      {categories.map((category) => (
                        <div key={category.id} className="p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-coffee-900 truncate">{category.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${category.is_active ? 'bg-green-50 text-green-800' : 'bg-coffee-100 text-coffee-600'}`}>
                                {category.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </div>
                            <p className="text-xs text-coffee-400 truncate mt-0.5">{category.slug} · {category.products_count} produk</p>
                          </div>
                          <div className="flex items-center shrink-0">
                            <button aria-label={`Edit ${category.name}`} disabled={busy} onClick={() => { setEditing(category.id); setForm({ name: category.name, icon: category.icon || 'coffee', is_active: category.is_active }); setErrors({}); setError(''); setSuccess(''); }} className="p-2.5 text-coffee-700 hover:bg-coffee-50 rounded-lg"><Pencil size={16} /></button>
                            <button aria-label={`Hapus ${category.name}`} title={category.products_count ? 'Kategori digunakan produk; nonaktifkan melalui Edit' : 'Hapus kategori'} disabled={busy || category.products_count > 0} onClick={() => remove(category)} className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full min-w-[460px] text-sm">
                        <thead className="bg-coffee-100 text-coffee-700">
                          <tr>
                            <th className="p-4 text-left">Kategori</th>
                            <th className="p-4 text-left">Produk</th>
                            <th className="p-4 text-left">Status</th>
                            <th className="p-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categories.map((category) => (
                            <tr key={category.id} className="border-b border-coffee-100">
                              <td className="p-4"><p className="font-semibold text-coffee-900">{category.name}</p><p className="text-xs text-coffee-400">{category.slug}</p></td>
                              <td className="p-4">{category.products_count}</td>
                              <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${category.is_active ? 'bg-green-50 text-green-800' : 'bg-coffee-100 text-coffee-600'}`}>{category.is_active ? 'Aktif' : 'Nonaktif'}</span></td>
                              <td className="p-4 text-right whitespace-nowrap"><button aria-label={`Edit ${category.name}`} disabled={busy} onClick={() => { setEditing(category.id); setForm({ name: category.name, icon: category.icon || 'coffee', is_active: category.is_active }); setErrors({}); setError(''); setSuccess(''); }} className="p-3 text-coffee-700 hover:bg-coffee-50 rounded-lg"><Pencil size={16} /></button><button aria-label={`Hapus ${category.name}`} title={category.products_count ? 'Kategori digunakan produk; nonaktifkan melalui Edit' : 'Hapus kategori'} disabled={busy || category.products_count > 0} onClick={() => remove(category)} className="p-3 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"><Trash2 size={16} /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
          </div>
        </DashboardLayout>
        );
}
