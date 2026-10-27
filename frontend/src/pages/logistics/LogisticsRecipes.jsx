import { useEffect, useState } from 'react';
import { ScrollText, Plus, Trash2, Edit3, CheckCircle, AlertCircle, X, Search } from 'lucide-react';
import api, { formatPrice } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function LogisticsRecipes() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Recipe edit modal
  const [activeProduct, setActiveProduct] = useState(null);
  const [recipeItems, setRecipeItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resProd, resIng] = await Promise.all([
        api.get('/ingredients/recipes'),
        api.get('/ingredients'),
      ]);
      setProducts(resProd.data);
      setIngredients(resIng.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecipeModal = (product) => {
    setActiveProduct(product);
    setErrorMsg('');
    if (product.ingredients && product.ingredients.length > 0) {
      setRecipeItems(
        product.ingredients.map((ing) => ({
          ingredient_id: ing.id,
          quantity_required: ing.pivot?.quantity_required || '',
        }))
      );
    } else {
      // Default to 1 empty row
      setRecipeItems([
        {
          ingredient_id: ingredients[0]?.id || '',
          quantity_required: '',
        },
      ]);
    }
  };

  const handleAddIngredientRow = () => {
    // Pick first ingredient that isn't already used, or just first
    const usedIds = recipeItems.map((r) => Number(r.ingredient_id));
    const available = ingredients.find((i) => !usedIds.includes(i.id)) || ingredients[0];

    setRecipeItems([
      ...recipeItems,
      {
        ingredient_id: available?.id || '',
        quantity_required: '',
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setRecipeItems(recipeItems.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...recipeItems];
    updated[index][field] = value;
    setRecipeItems(updated);
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!activeProduct) return;
    setSaving(true);
    setErrorMsg('');

    // Filter valid rows
    const validItems = recipeItems
      .filter((r) => r.ingredient_id && Number(r.quantity_required) > 0)
      .map((r) => ({
        ingredient_id: Number(r.ingredient_id),
        quantity_required: Number(r.quantity_required),
      }));

    try {
      await api.post(`/products/${activeProduct.id}/recipe`, {
        ingredients: validItems,
      });
      setActiveProduct(null);
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Gagal menyimpan resep.');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.category?.name && p.category.name.toLowerCase().includes(q));
  });

  const role = user?.role || 'logistics';

  return (
    <DashboardLayout title="Resep Produk &amp; Komposisi Bahan (BOM)" role={role}>
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-coffee-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-transparent transition-all">
            <Search size={18} className="shrink-0 text-coffee-400" />
            <input
              type="text"
              placeholder="Cari nama menu kopi atau kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-coffee-900 placeholder:text-coffee-400 focus:outline-none text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-coffee-400 hover:text-coffee-600 transition-colors shrink-0"
                title="Hapus pencarian"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <div className="text-xs text-coffee-500 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl">
            💡 Resep ini yang akan <strong>otomatis memotong stok bahan baku</strong> saat pesanan pelanggan dibayar.
          </div>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-coffee-400 shadow-sm">
            <p className="font-semibold text-coffee-700">Tidak ada produk ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const hasRecipe = product.ingredients && product.ingredients.length > 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-coffee-100/70 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-coffee-100"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-coffee-100 text-coffee-700 rounded-full">
                          {product.category?.name || 'Menu'}
                        </span>
                        <h3 className="font-semibold text-coffee-900 text-base mt-1 truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-coffee-500 font-medium">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    {/* Ingredients summary */}
                    <div className="bg-coffee-50/70 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-coffee-800 flex items-center gap-1.5">
                          <ScrollText size={14} className="text-coffee-600" />
                          Takaran Bahan Baku (1 Porsi):
                        </p>
                        {hasRecipe ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> {product.ingredients.length} Bahan
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                            <AlertCircle size={10} /> Belum Ada
                          </span>
                        )}
                      </div>

                      {hasRecipe ? (
                        <div className="space-y-1">
                          {product.ingredients.map((ing) => (
                            <div key={ing.id} className="flex justify-between text-xs text-coffee-600">
                              <span className="truncate pr-2">• {ing.name}</span>
                              <span className="font-bold text-coffee-800 shrink-0">
                                {Number(ing.pivot?.quantity_required || 0).toLocaleString('id-ID')} {ing.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-coffee-400 italic">
                          Belum ada resep. Klik tombol di bawah untuk menentukan takaran bahan.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => openRecipeModal(product)}
                    className="w-full py-2.5 px-4 bg-coffee-900 hover:bg-coffee-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <Edit3 size={14} />
                    {hasRecipe ? 'Ubah Komposisi Resep' : 'Buat Resep Baru'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Edit Modal */}
      {activeProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-coffee-100 mb-4">
              <div>
                <h3 className="font-semibold text-lg text-coffee-900">
                  Resep Produk: {activeProduct.name}
                </h3>
                <p className="text-xs text-coffee-500">Tentukan bahan baku yang berkurang untuk setiap 1 porsi menu ini.</p>
              </div>
              <button onClick={() => setActiveProduct(null)} className="text-coffee-400 hover:text-coffee-700">
                <X size={20} />
              </button>
            </div>

            {errorMsg && (
              <p className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {errorMsg}
              </p>
            )}

            <form onSubmit={handleSaveRecipe} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {recipeItems.map((row, idx) => {
                  const selectedIng = ingredients.find((i) => i.id === Number(row.ingredient_id));
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-coffee-50/70 rounded-xl border border-coffee-100">
                      <div className="flex-1">
                        <label className="block text-[11px] font-semibold text-coffee-700 mb-1">
                          Pilih Bahan Baku #{idx + 1}
                        </label>
                        <select
                          value={row.ingredient_id}
                          onChange={(e) => handleRowChange(idx, 'ingredient_id', e.target.value)}
                          className="input-field text-xs py-2 bg-white"
                          required
                        >
                          <option value="">-- Pilih Bahan --</option>
                          {ingredients.map((ing) => (
                            <option key={ing.id} value={ing.id}>
                              {ing.name} ({ing.unit}) — Sisa: {Number(ing.stock).toLocaleString('id-ID')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-36">
                        <label className="block text-[11px] font-semibold text-coffee-700 mb-1">
                          Takaran / Qty
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder="Contoh: 18"
                            value={row.quantity_required}
                            onChange={(e) => handleRowChange(idx, 'quantity_required', e.target.value)}
                            className="input-field text-xs py-2 bg-white"
                            required
                          />
                          <span className="text-xs text-coffee-600 font-bold w-10 shrink-0">
                            {selectedIng?.unit || ''}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="mt-5 p-2 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus bahan dari resep"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={handleAddIngredientRow}
                  className="w-full py-2.5 border-2 border-dashed border-coffee-300 text-coffee-700 hover:border-coffee-500 hover:bg-coffee-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus size={15} /> Tambah Bahan Baku Lainnya
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-coffee-100 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveProduct(null)}
                  className="px-4 py-2 border border-coffee-200 text-coffee-700 rounded-xl text-sm font-medium hover:bg-coffee-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Resep Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
