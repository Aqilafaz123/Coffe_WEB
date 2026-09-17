import { Link } from 'react-router-dom';
import { Share2, Globe, MessageCircle, Mail } from 'lucide-react';

const footerLinks = {
  Privacy: ['Terms of use', 'Privacy policy', 'Cookies'],
  Services: [
    { label: 'Shop', to: '/shop' },
    { label: 'Order ahead', to: '/keranjang' },
    { label: 'Menu', to: '/shop' },
  ],
  'About Us': [
    { label: 'Find a location', to: '/lokasi' },
    { label: 'About us', to: '/#about' },
    { label: 'Our story', to: '/#about' },
  ],
  Information: ['Plans & pricing', 'Sell your products', 'Jobs'],
};

export default function Footer() {
  return (
    <footer className="bg-coffee-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs font-semibold tracking-widest text-coffee-400 mb-4 uppercase">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={typeof link === 'string' ? link : link.label}>
                    {typeof link === 'string' ? (
                      <span className="text-white/60 text-sm hover:text-white transition-colors cursor-pointer">{link}</span>
                    ) : (
                      <Link to={link.to} className="text-white/60 text-sm hover:text-white transition-colors">{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-6">
          <Link to="/" className="font-display text-3xl font-bold tracking-wider">COFFEE</Link>
          <div className="flex items-center gap-4">
            {[Share2, Globe, MessageCircle, Mail].map((Icon, i) => (
              <a key={i} href="#" className="text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">
                <Icon size={18} />
              </a>
            ))}
          </div>
          <p className="text-white/40 text-sm">&copy; {new Date().getFullYear()} Coffee Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
