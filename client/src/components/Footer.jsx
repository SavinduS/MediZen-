import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Brand Section */}
          <div className="flex flex-col space-y-4">
            <Link to="/" className="text-2xl font-bold tracking-tight text-blue-400">
              MediZen <span className="text-white">Healthcare</span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              Providing world-class digital healthcare solutions. Connect with top doctors and manage your medical records seamlessly from anywhere in Sri Lanka.
            </p>
          </div>

          {/* Quick Links Section - Centered */}
          <div className="flex flex-col md:items-center">
            <div className="w-fit text-left">
              <h3 className="text-white font-semibold text-lg mb-6">Quick Links</h3>
              <ul className="space-y-4 text-sm">
                <li>
                  <Link to="/doctors" className="hover:text-blue-400 transition-colors">Find a Doctor</Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-blue-400 transition-colors">About Us</Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-blue-400 transition-colors">Our Services</Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Support</Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-blue-400 transition-colors">FAQs</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info Section */}
          <div className="flex flex-col space-y-6">
            <h3 className="text-white font-semibold text-lg mb-0">Contact Info</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-blue-400 mt-0.5 shrink-0" />
                <span className="text-slate-400">No. 123, Galle Road, Colombo 03, Sri Lanka.</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-blue-400 shrink-0" />
                <span className="text-slate-400">+94 11 234 5678</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-blue-400 shrink-0" />
                <span className="text-slate-400">support@medizen.lk</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs space-y-4 md:space-y-0 text-slate-500">
          <p>&copy; {new Date().getFullYear()} MediZen Healthcare. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
