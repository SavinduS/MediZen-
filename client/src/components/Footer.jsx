import React from "react";
import { Heart, Mail, Phone } from "lucide-react";
import { FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-blue-600 p-1.5 rounded-lg">
                <Heart size={20} className="text-white fill-current" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                MediZen
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Revolutionizing healthcare through AI-driven diagnostics and
              seamless telemedicine connectivity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/symptoms"
                  className="hover:text-blue-400 transition-colors"
                >
                  AI Symptom Checker
                </a>
              </li>
              <li>
                <a
                  href="/doctors"
                  className="hover:text-blue-400 transition-colors"
                >
                  Find Doctors
                </a>
              </li>
              <li>
                <a
                  href="/appointments"
                  className="hover:text-blue-400 transition-colors"
                >
                  Book Appointment
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={14} /> support@medizen.com
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} /> +1 (555) 000-ZEN
              </li>
            </ul>
          </div>

          {/* Social/Repo */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="bg-slate-800 p-2 rounded-full hover:bg-blue-600 hover:text-white transition-all"
              >
                <FaGithub size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 MediZen Healthcare. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
