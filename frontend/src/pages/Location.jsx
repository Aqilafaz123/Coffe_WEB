import { MapPin, Clock, Phone, Mail, Navigation, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  STORE,
  googleMapsDirectionsUrl,
  googleMapsSearchUrl,
  googleMapsEmbedUrl,
} from '../lib/storeLocation';

export default function Location() {
  return (
    <div className="min-h-screen bg-coffee-50">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-gold text-sm font-medium tracking-widest uppercase mb-2">Kunjungi Kami</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-coffee-900 mb-3">Find a Location</h1>
            <p className="text-coffee-500 max-w-xl mx-auto">
              Temukan coffee shop kami dan nikmati kopi terbaik di suasana yang nyaman.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-coffee-100">
                <iframe
                  title="Lokasi Coffee Shop di Google Maps"
                  src={googleMapsEmbedUrl}
                  className="w-full h-[320px] sm:h-[420px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <a
                  href={googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <Navigation size={18} />
                  Petunjuk Arah
                </a>
                <a
                  href={googleMapsSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 border-2 border-coffee-200 rounded-full text-coffee-800 text-sm font-medium hover:border-coffee-400 hover:bg-white transition-colors"
                >
                  <ExternalLink size={18} />
                  Buka di Google Maps
                </a>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-coffee-100">
                <h2 className="font-display text-xl font-bold text-coffee-900 mb-5">{STORE.name}</h2>
                <ul className="space-y-5">
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-coffee-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-coffee-400 uppercase tracking-wide mb-1">Alamat</p>
                      <p className="text-sm text-coffee-800 leading-relaxed">{STORE.address}</p>
                      <a
                        href={googleMapsSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-coffee-700 hover:text-coffee-900 font-medium mt-2"
                      >
                        <ExternalLink size={14} />
                        Buka di Google Maps
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center shrink-0">
                      <Clock size={18} className="text-coffee-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-coffee-400 uppercase tracking-wide mb-1">Jam Operasional</p>
                      {STORE.hours.map((h) => (
                        <p key={h.day} className="text-sm text-coffee-800">
                          <span className="text-coffee-600">{h.day}:</span> {h.time}
                        </p>
                      ))}
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center shrink-0">
                      <Phone size={18} className="text-coffee-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-coffee-400 uppercase tracking-wide mb-1">Telepon</p>
                      <a href={`tel:${STORE.phone.replace(/\D/g, '')}`} className="text-sm text-coffee-800 hover:text-coffee-600">
                        {STORE.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-coffee-100 flex items-center justify-center shrink-0">
                      <Mail size={18} className="text-coffee-700" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-coffee-400 uppercase tracking-wide mb-1">Email</p>
                      <a href={`mailto:${STORE.email}`} className="text-sm text-coffee-800 hover:text-coffee-600">
                        {STORE.email}
                      </a>
                    </div>
                  </li>
                </ul>
              </div>

              <p className="text-xs text-coffee-400 text-center px-2">
                Klik tombol di atas untuk membuka Google Maps di perangkat Anda dan mendapatkan petunjuk arah.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
