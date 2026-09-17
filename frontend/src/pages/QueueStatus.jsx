import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Coffee, Clock, CheckCircle, ChevronLeft, RefreshCw } from 'lucide-react';
import api from '../lib/api';

const POLL_INTERVAL = 5000; // 5 seconds

export default function QueueStatus() {
  const { orderId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pulse, setPulse] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get(`/queue/status?order_id=${orderId}`);
      setData(res.data);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat status antrian.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // ── Derived state ─────────────────────────────────────
  const isReady    = data?.is_ready && data?.order_status !== 'completed';
  const isDone     = data?.order_status === 'completed';
  const isWaiting  = data?.has_queue && !isReady && !isDone;
  const notQueued  = data && !data.has_queue;

  // ── Status badge config ───────────────────────────────
  const statusConfig = isDone
    ? { label: 'Selesai',        bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: '✓' }
    : isReady
    ? { label: 'Siap Diambil!',  bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: '🔔' }
    : { label: 'Menunggu',       bg: '#faf8f5', text: '#8b5e3c', border: '#e8d5c4', icon: '⏳' };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#faf8f5' }}>
      {/* Decorative blobs */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(201,162,39,0.15) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(92,58,40,0.08) 0%, transparent 70%)' }} />

      {/* Dot pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="qdots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#c9a227" opacity="0.25" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#qdots)" />
      </svg>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ping-gold {
          0%   { transform: scale(1);    opacity: 0.8; }
          70%  { transform: scale(1.5);  opacity: 0; }
          100% { transform: scale(1.5);  opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bounce-ready {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-12px); }
        }
        @keyframes number-pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.06); }
        }
        .su  { animation: slide-up 0.55s ease-out both; }
        .su1 { animation: slide-up 0.55s 0.1s ease-out both; }
        .su2 { animation: slide-up 0.55s 0.2s ease-out both; }
        .su3 { animation: slide-up 0.55s 0.3s ease-out both; }
        .ping-ring {
          position: absolute; inset: 0; border-radius: 50%;
          border: 3px solid rgba(201,162,39,0.5);
          animation: ping-gold 1.5s ease-out infinite;
        }
        .spin-slow { animation: spin-slow 3s linear infinite; }
        .bounce-ready { animation: bounce-ready 1s ease-in-out infinite; }
        .num-pulse { animation: number-pulse 2s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen flex flex-col items-center justify-center px-5 py-12 relative">
        <div className="w-full max-w-sm">

          {/* Back button */}
          <Link to="/riwayat" className="su inline-flex items-center gap-2 mb-8 text-sm font-medium transition-all hover:opacity-70" style={{ color: '#8b5e3c' }}>
            <ChevronLeft size={18} />
            Riwayat Pesanan
          </Link>

          {/* Logo */}
          <div className="su flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2c1810 0%, #5c3a28 100%)', boxShadow: '0 8px 24px rgba(44,24,16,0.18)' }}>
              <Coffee size={28} color="#c9a227" />
            </div>
            <span className="font-display text-2xl font-bold tracking-widest" style={{ color: '#2c1810' }}>Status Antrian</span>
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="su1 flex flex-col items-center gap-4 py-16">
              <div className="w-10 h-10 rounded-full border-4 spin-slow" style={{ borderColor: '#e8d5c4', borderTopColor: '#c9a227' }} />
              <p style={{ color: '#a67c52' }}>Mengambil data antrian...</p>
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <div className="su1 rounded-2xl px-5 py-4 text-sm flex items-start gap-3"
              style={{ background: '#fff1f0', border: '1px solid #fecaca', color: '#b91c1c' }}>
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── No Queue Yet ── */}
          {!loading && notQueued && (
            <div className="su1 rounded-3xl p-7 text-center"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid #e8d5c4', boxShadow: '0 20px 60px rgba(44,24,16,0.08)' }}>
              <div className="text-4xl mb-3">⏳</div>
              <h3 className="font-display text-lg font-bold mb-2" style={{ color: '#2c1810' }}>Belum Ada Nomor Antrian</h3>
              <p className="text-sm mb-4" style={{ color: '#a67c52' }}>
                {data?.message || 'Nomor antrian akan muncul setelah kasir memproses pesananmu.'}
              </p>
              <div className="text-xs px-3 py-2 rounded-xl inline-block" style={{ background: '#f5f0eb', color: '#8b5e3c' }}>
                Status pesanan: <strong>{data?.order_status ?? '-'}</strong>
              </div>
            </div>
          )}

          {/* ── Main Queue Card ── */}
          {!loading && data?.has_queue && (
            <>
              {/* Status Badge */}
              <div className="su1 flex justify-center mb-5">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${isDone ? 'bounce-ready' : ''}`}
                  style={{ background: statusConfig.bg, color: statusConfig.text, border: `1.5px solid ${statusConfig.border}` }}
                >
                  <span>{statusConfig.icon}</span>
                  {statusConfig.label}
                </span>
              </div>

              {/* Main Number Card */}
              <div className="su2 rounded-3xl p-7 text-center mb-5"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1.5px solid #e8d5c4',
                  boxShadow: '0 20px 60px rgba(44,24,16,0.1), 0 4px 12px rgba(44,24,16,0.06)',
                }}>

                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#a67c52' }}>Nomor Antrian Kamu</p>

                {/* Big Queue Number */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  {(isReady && !isDone) && <div className="ping-ring" />}
                  <div
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center ${pulse ? 'num-pulse' : ''}`}
                    style={{
                      background: isDone
                        ? 'linear-gradient(135deg, #16a34a, #15803d)'
                        : isReady
                        ? 'linear-gradient(135deg, #d97706, #b45309)'
                        : 'linear-gradient(135deg, #2c1810, #5c3a28)',
                      boxShadow: isDone
                        ? '0 12px 32px rgba(22,163,74,0.35)'
                        : isReady
                        ? '0 12px 32px rgba(217,119,6,0.35)'
                        : '0 12px 32px rgba(44,24,16,0.25)',
                    }}
                  >
                    <span className="font-display font-bold text-white" style={{ fontSize: '14px', opacity: 0.8 }}>#</span>
                    <span className="font-display font-bold text-white leading-none" style={{ fontSize: '42px' }}>
                      {data.queue_number}
                    </span>
                  </div>
                </div>

                {/* Currently called */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#f5f0eb' }}>
                    <Clock size={13} style={{ color: '#a67c52' }} />
                    <span className="text-xs" style={{ color: '#8b5e3c' }}>
                      Sedang dipanggil: <strong style={{ color: '#2c1810' }}>
                        {data.current_called > 0 ? `#${data.current_called}` : '-'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex-1 h-px" style={{ background: '#e8d5c4' }} />
                </div>

                {/* Orders ahead info */}
                {isWaiting && (
                  <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: '#f5f0eb' }}>
                    {data.orders_ahead === 0
                      ? <span style={{ color: '#16a34a' }}>🎉 Kamu berikutnya! Bersiap ya.</span>
                      : <span style={{ color: '#8b5e3c' }}>Ada <strong style={{ color: '#2c1810' }}>{data.orders_ahead}</strong> pesanan di depanmu</span>
                    }
                  </div>
                )}

                {/* Ready message */}
                {isReady && !isDone && (
                  <div className="rounded-2xl px-4 py-4 text-center" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                    <p className="font-semibold mb-1" style={{ color: '#d97706' }}>🔔 Nomor antrian kamu dipanggil!</p>
                    <p className="text-xs" style={{ color: '#92400e' }}>Silakan ambil pesananmu di kasir sekarang.</p>
                  </div>
                )}

                {/* Done message */}
                {isDone && (
                  <div className="rounded-2xl px-4 py-4 text-center flex items-center justify-center gap-3"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <CheckCircle size={22} color="#16a34a" />
                    <div className="text-left">
                      <p className="font-semibold text-sm" style={{ color: '#16a34a' }}>Pesanan Selesai!</p>
                      <p className="text-xs" style={{ color: '#4ade80' }}>Terima kasih sudah berkunjung ☕</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress dots */}
              {!isDone && (
                <div className="su3 flex justify-center gap-2 mb-5">
                  {['Menunggu', 'Dipanggil', 'Selesai'].map((step, i) => {
                    const active = (i === 0 && isWaiting) || (i === 1 && isReady) || (i === 2 && isDone);
                    const done   = (i === 0 && (isReady || isDone)) || (i === 1 && isDone);
                    return (
                      <div key={step} className="flex flex-col items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full transition-all duration-500"
                          style={{ background: done ? '#16a34a' : active ? '#c9a227' : '#e8d5c4' }} />
                        <span className="text-xs" style={{ color: active ? '#2c1810' : '#c4a07a' }}>{step}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Order info */}
              <div className="su3 rounded-2xl px-4 py-3 flex items-center justify-between"
                style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid #e8d5c4' }}>
                <div>
                  <p className="text-xs" style={{ color: '#a67c52' }}>Nomor Pesanan</p>
                  <p className="text-sm font-semibold" style={{ color: '#2c1810' }}>{data.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: '#a67c52' }}>Diperbarui</p>
                  <p className="text-xs flex items-center gap-1 justify-end" style={{ color: '#8b5e3c' }}>
                    <RefreshCw size={11} />
                    {lastUpdated ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                  </p>
                </div>
              </div>

              {/* Auto-refresh notice */}
              <p className="text-center text-xs mt-4" style={{ color: '#c4a07a' }}>
                ↻ Otomatis diperbarui setiap 5 detik
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
