import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        const params = new URLSearchParams(searchParams);
        if (searchInput.trim()) params.set('search', searchInput.trim());
        else params.delete('search');
        setSearchParams(params);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, searchParams, setSearchParams]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (search) params.set('search', search);

    api.get(`/products?${params}`)
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  }, [category, search]);

  const setCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set('category', slug);
    else params.delete('category');
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-coffee-900 mb-3">Our Menu</h1>
            <p className="text-coffee-500">Pilih kopi dan dessert favorit Anda</p>
          </div>

          <div className="max-w-lg mx-auto mb-8">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-coffee-200 bg-white shadow-sm focus-within:ring-2 focus-within:ring-coffee-400 focus-within:border-transparent transition-all">
              <Search size={20} className="shrink-0 text-coffee-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari menu..."
                className="flex-1 min-w-0 bg-transparent text-coffee-900 placeholder:text-coffee-400 focus:outline-none text-sm"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="shrink-0 p-1 rounded-full text-coffee-400 hover:text-coffee-700 hover:bg-coffee-50 transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <button
              onClick={() => setCategory('')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                !category ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700 hover:bg-coffee-100'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.slug)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat.slug ? 'bg-coffee-900 text-white' : 'bg-white text-coffee-700 hover:bg-coffee-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {search && (
            <p className="text-center text-coffee-600 mb-6">
              Hasil pencarian: <strong>"{search}"</strong>
            </p>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <p className="text-center text-coffee-500 py-20">Tidak ada produk ditemukan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
