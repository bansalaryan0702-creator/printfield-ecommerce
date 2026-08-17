import { Link } from "react-router-dom";
import { Printer, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img referrerPolicy="no-referrer" src="/logo.png" alt="Printfield" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your one-stop destination for premium quality custom printing, personalized gifts, and digital corporate solutions.
            </p>
            <div className="flex gap-2 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><Twitter className="h-5 w-5" /></a>
              <a href="https://instagram.com/printfield.whitefield" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors p-2 -m-2 rounded-lg"><Linkedin className="h-5 w-5" /></a>
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
