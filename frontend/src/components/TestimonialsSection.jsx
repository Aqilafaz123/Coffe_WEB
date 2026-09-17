import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Quote, Star, Send, Loader2 } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

function StarRating({ value, onChange, readonly = false, size = 18 }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition-transform ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            size={size}
            className={n <= value ? 'text-gold fill-gold' : 'text-coffee-200'}
          />
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [active, setActive] = useState(0);
  const [form, setForm] = useState({ content: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchTestimonials = () => {
    api.get('/testimonials').then((r) => setTestimonials(r.data));
  };

  useEffect(() => { fetchTestimonials(); }, []);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  const prev = () => setActive((i) => (i - 1 + testimonials.length) % testimonials.length);
  const next = () => setActive((i) => (i + 1) % testimonials.length);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSubmitting(true);
    setFormMsg('');
    setFormSuccess(false);
    try {
      await api.post('/testimonials/submit', form);
      setFormSuccess(true);
      setFormMsg('Terima kasih! Ulasan Anda sudah ditampilkan.');
      setForm({ content: '', rating: 5 });
      fetchTestimonials();
      setActive(0);
    } catch (err) {
      setFormSuccess(false);
      setFormMsg(err.response?.data?.message || 'Gagal mengirim ulasan.');
    } finally {
      setSubmitting(false);
    }
  };

  const current = testimonials[active];

  return (
    <section className="py-24 relative overflow-hidden" id="about">
      <div className="absolute inset-0 bg-gradient-to-br from-coffee-900 via-coffee-800 to-coffee-700" />
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, #c9a227 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c9a227 0%, transparent 40%)',
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-gold text-sm font-medium tracking-widest uppercase mb-3">Testimoni</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Our Happy Customers</h2>
          <p className="text-coffee-200 max-w-xl mx-auto">
            Ceritakan pengalaman Anda — bantu pelanggan lain menemukan kopi terbaik.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Carousel */}
          <div className="lg:col-span-3">
            {testimonials.length === 0 ? (
              <div className="bg-white/10 backdrop-blur rounded-3xl p-12 text-center text-coffee-200">
                Belum ada ulasan. Jadilah yang pertama!
              </div>
            ) : (
              <div className="relative">
                <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl min-h-[280px] flex flex-col justify-between">
                  <Quote size={40} className="text-coffee-200 mb-4" />
                  <p className="text-coffee-700 text-lg leading-relaxed mb-8 flex-1">
                    &ldquo;{current?.content}&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={current?.avatar}
                        alt={current?.name}
                        className="w-14 h-14 rounded-full object-cover ring-2 ring-coffee-100"
                      />
                      <div>
                        <p className="font-semibold text-coffee-900">{current?.name}</p>
                        <p className="text-coffee-500 text-sm">{current?.role}</p>
                        <StarRating value={current?.rating || 5} readonly size={14} />
                      </div>
                    </div>
                    {testimonials.length > 1 && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={prev}
                          className="w-10 h-10 rounded-full border border-coffee-200 flex items-center justify-center text-coffee-600 hover:bg-coffee-50 transition-colors"
                          aria-label="Sebelumnya"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={next}
                          className="w-10 h-10 rounded-full border border-coffee-200 flex items-center justify-center text-coffee-600 hover:bg-coffee-50 transition-colors"
                          aria-label="Berikutnya"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {testimonials.length > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {testimonials.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActive(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === active ? 'w-8 bg-gold' : 'w-2 bg-white/40 hover:bg-white/60'
                        }`}
                        aria-label={`Ulasan ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-xl">
              <h3 className="font-display text-xl font-bold text-coffee-900 mb-1">Tulis Ulasan</h3>
              <p className="text-coffee-500 text-sm mb-6">Bagikan pengalaman Anda di coffee shop kami</p>

              {user ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-coffee-700 mb-2 block">Rating</label>
                    <StarRating value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-coffee-700 mb-2 block">Ulasan Anda</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Ceritakan pengalaman kopi, suasana, pelayanan..."
                      rows={4}
                      className="input-field resize-none text-sm"
                      required
                      minLength={10}
                      maxLength={500}
                    />
                    <p className="text-xs text-coffee-400 mt-1 text-right">{form.content.length}/500</p>
                  </div>
                  {formMsg && (
                    <p className={`text-sm ${formSuccess ? 'text-green-600' : 'text-red-600'}`}>{formMsg}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting || form.content.trim().length < 10}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-6">
                  <p className="text-coffee-600 text-sm mb-4">Login untuk menulis ulasan</p>
                  <Link to="/login" className="btn-primary inline-block text-sm">Login</Link>
                  <p className="text-coffee-400 text-xs mt-3">
                    Belum punya akun? <Link to="/register" className="text-coffee-800 underline">Daftar</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
