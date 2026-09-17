export const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/NTHC6dzMzpMpjfaV8?g_st=ic';

export const STORE = {
  name: 'Coffee Shop',
  address: 'Lihat lokasi lengkap di Google Maps',
  phone: '(021) 1234-5678',
  email: 'hello@coffee.shop',
  hours: [
    { day: 'Senin – Jumat', time: '07:00 – 22:00' },
    { day: 'Sabtu – Minggu', time: '08:00 – 23:00' },
  ],
};

export const googleMapsSearchUrl = GOOGLE_MAPS_URL;

export const googleMapsDirectionsUrl = GOOGLE_MAPS_URL;

/** Embed via query ke link Maps (preview di halaman) */
export const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(GOOGLE_MAPS_URL)}&hl=id&z=16&ie=UTF8&iwloc=&output=embed`;
