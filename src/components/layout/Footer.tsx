import { Link } from "react-router-dom";
import { Printer, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-10 w-auto object-contain brightness-0 invert opacity-90" loading="lazy" width="40" height="40" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your one-stop destination for premium quality custom printing, personalized gifts, and digital corporate solutions.
            </p>
            <div className="flex gap-2 pt-2">
              <a href="https://instagram.com/printfield.whitefield" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
              <a href="https://wa.me/919606371222" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/business-cards" className="hover:text-purple-400 transition-colors">Business Cards</Link></li>
              <li><Link to="/category/apparel" className="hover:text-purple-400 transition-colors">Custom T-Shirts</Link></li>
              <li><Link to="/category/marketing" className="hover:text-purple-400 transition-colors">Flyers & Brochures</Link></li>
              <li><Link to="/category/gifts" className="hover:text-purple-400 transition-colors">Corporate Gifts</Link></li>
              <li><Link to="/category/signage" className="hover:text-purple-400 transition-colors">Banners & Signboards</Link></li>
              <li><Link to="/category/trophies" className="hover:text-purple-400 transition-colors">Custom Trophies & Awards</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Locations</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/printing-whitefield" className="hover:text-purple-400 transition-colors">Printing in Whitefield</Link></li>
              <li><Link to="/printing-itpl" className="hover:text-purple-400 transition-colors">Printing in ITPL</Link></li>
              <li><Link to="/printing-brookefield" className="hover:text-purple-400 transition-colors">Printing in Brookefield</Link></li>
              <li><Link to="/printing-marathahalli" className="hover:text-purple-400 transition-colors">Printing in Marathahalli</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/custom-printing" className="hover:text-purple-400 transition-colors">Business Printing Solutions</Link></li>
              <li><Link to="/rating" className="hover:text-purple-400 transition-colors flex items-center gap-1.5"><span className="text-amber-400">★</span> Customer Reviews & Ratings</Link></li>
              <li><Link to="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-purple-400 transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/admin" className="hover:text-purple-400 transition-colors text-purple-500">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <span className="text-gray-400">No 96, Mini Villa, Opp. Chaitnya Swojas, Borewell Road, Whitefield, Bengaluru Karnataka 560066</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="text-gray-400">+91 9606371222</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-purple-500 shrink-0" />
                <span className="text-gray-400">Aryan@printfield.in</span>
              </li>
            </ul>
          </div>

        </div>
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              {/* Security Badges */}
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="text-xs font-semibold text-gray-300">256-Bit SSL Secured</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span className="text-xs font-semibold text-gray-300">100% Safe Checkout</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Printfield Digital Solutions. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
