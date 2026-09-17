import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Wifi, CalendarCheck } from 'lucide-react';
import api, { formatPrice } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ReservationModal from '../components/ReservationModal';

export default function Reservasi() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    api.get('/rooms')
      .then((r) => setRooms(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl font-bold text-coffee-900 mb-3">Reservasi Ruangan</h1>
            <p className="text-coffee-500 max-w-xl mx-auto">
              Pilih ruangan favorit Anda untuk meeting, hangout, atau acara privat. Jam operasional 08:00 – 22:00.
            </p>
            {user?.role === 'user' && (
              <Link to="/riwayat?tab=reservasi" className="inline-flex items-center gap-2 mt-4 text-coffee-800 hover:text-coffee-900 text-sm font-medium">
                <CalendarCheck size={16} /> Lihat Riwayat Reservasi
              </Link>
            )}
          </div>

          {successMsg && (
            <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm text-center">
              {successMsg}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-coffee-300 border-t-coffee-900 rounded-full animate-spin" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="text-center text-coffee-500 py-20">Belum ada ruangan tersedia.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover">
                  <div className="aspect-[4/3] bg-coffee-100 overflow-hidden">
                    {room.image ? (
                      <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-coffee-300 text-4xl font-display">COFFEE</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-coffee-900 mb-2">{room.name}</h3>
                    <p className="text-coffee-500 text-sm mb-4 line-clamp-2">{room.description}</p>
                    <div className="flex items-center gap-4 text-sm text-coffee-600 mb-4">
                      <span className="flex items-center gap-1"><Users size={14} /> {room.capacity} orang</span>
                      <span className="font-semibold text-coffee-900">{formatPrice(room.price_per_hour)}/jam</span>
                    </div>
                    {room.amenities?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-5">
                        {room.amenities.map((a) => (
                          <span key={a} className="inline-flex items-center gap-1 px-2 py-1 bg-coffee-50 text-coffee-600 text-xs rounded-lg">
                            <Wifi size={10} /> {a}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedRoom(room)}
                      className="btn-primary w-full text-sm"
                    >
                      Reservasi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {selectedRoom && (
        <ReservationModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onSuccess={() => {
            setSuccessMsg('Reservasi berhasil dibuat! Menunggu konfirmasi dari kami.');
            setSelectedRoom(null);
          }}
        />
      )}
    </div>
  );
}
