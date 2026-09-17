import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coffee, Snowflake, CupSoda, Cake, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TestimonialsSection from '../components/TestimonialsSection';

const categoryIcons = {
  'hot-coffee': Coffee,
  'cold-coffee': Snowflake,
  'cup-coffee': CupSoda,
  dessert: Cake,
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [coffeeProducts, setCoffeeProducts] = useState([]);
  const [dessertProducts, setDessertProducts] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribeMsg, setSubscribeMsg] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    api.get('/products?category=hot-coffee').then((r) => setCoffeeProducts(r.data.slice(0, 4)));
    api.get('/products?category=dessert').then((r) => setDessertProducts(r.data.slice(0, 4)));
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setSubscribeMsg('');
    setSubscribeSuccess(false);
    try {
      const { data } = await api.post('/subscribe', { email });
      setSubscribeSuccess(true);
      setSubscribeMsg(`Berhasil! Kode diskon Anda: ${data.discount_code}`);
      setEmail('');
    } catch (err) {
      setSubscribeSuccess(false);
      const msg = err.response?.data?.errors?.email?.[0]
        || err.response?.data?.message
        || 'Gagal berlangganan. Silakan coba lagi.';
      setSubscribeMsg(msg);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&h=1080&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-coffee-950/90 via-coffee-900/70 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20">
          <div className="max-w-xl animate-fade-up">
            <p className="text-gold text-sm font-medium tracking-widest uppercase mb-4">Premium Coffee Experience</p>
            <h1 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Kopi Terbaik<br />di Kota Ini!
            </h1>
            <p className="text-white/70 text-lg mb-8 leading-relaxed">
              Nikmati cita rasa kopi premium yang diseduh dengan penuh passion oleh barista profesional kami.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-coffee-900 px-8 py-4 rounded-full font-semibold hover:bg-coffee-100 transition-all hover:shadow-xl hover:shadow-black/20 active:scale-95">
              Order Now
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.slug] || Coffee;
              return (
                <Link
                  key={cat.id}
                  to={`/shop?category=${cat.slug}`}
                  className="flex flex-col items-center gap-4 p-6 rounded-2xl hover:bg-coffee-50 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-coffee-300 flex items-center justify-center group-hover:border-coffee-600 group-hover:bg-coffee-100 transition-all">
                    <Icon size={28} className="text-coffee-600" />
                  </div>
                  <span className="text-coffee-800 font-medium text-sm">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coffee Products */}
      <section className="py-20 bg-coffee-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title mb-12">Our Special Coffee</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coffeeProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="text-center mt-10">
            <Link to="/shop?category=hot-coffee" className="btn-outline inline-flex items-center gap-2">
              Lihat Semua Kopi <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-20 bg-coffee-200 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-48 h-48 opacity-30">
          <img src="https://images.unsplash.com/photo-1559056199-641a0ac8b55c?w=200&h=200&fit=crop" alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="absolute right-0 bottom-0 w-56 h-56 opacity-30">
          <img src="https://images.unsplash.com/photo-1447933601403-0c6688de01e5?w=250&h=250&fit=crop" alt="" className="w-full h-full object-cover rounded-full" />
        </div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-coffee-900 mb-6">
            Check out our best coffee beans
          </h2>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            Explore our products <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Dessert Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title mb-12">Our Special Dessert</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dessertProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      {/* Newsletter */}
      <section className="py-20 bg-coffee-100 relative overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-3xl font-bold text-coffee-900 mb-3">Join in and get 15% Off!</h2>
          <p className="text-coffee-600 mb-8">
            Subscribe dengan email akun terdaftar dan dapatkan kode diskon 15%.
          </p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="input-field flex-1"
              required
            />
            <button type="submit" className="btn-primary whitespace-nowrap">Subscribe</button>
          </form>
          {subscribeMsg && (
            <p className={`mt-4 text-sm font-medium ${subscribeSuccess ? 'text-green-700' : 'text-red-600'}`}>
              {subscribeMsg}
            </p>
          )}
          {!subscribeSuccess && (
            <p className="mt-3 text-coffee-500 text-xs">
              Belum punya akun? <Link to="/register" className="text-coffee-800 underline hover:text-coffee-900">Daftar di sini</Link>
            </p>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
