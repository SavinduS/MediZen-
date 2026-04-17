/**
 * Landing Page Component
 * Purpose: Provides a professional, scrollable home experience with a Hero section.
 * Member 2 Responsibility: UX Enhancement & Patient Portal Flow.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Heart, MessageCircle, HelpCircle, Mail, Phone, MapPin, Activity } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white">
            {/* HERO SECTION */}
            <section className="relative min-h-screen flex items-center overflow-hidden bg-slate-900 py-20">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/5 skew-x-12 transform translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -translate-x-32 translate-y-32"></div>

                <div className="container mx-auto px-8 md:px-12 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-5 py-2.5 rounded-full mb-10 animate-in fade-in slide-in-from-left-4 duration-700">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                </span>
                                <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.25em]">Next-Gen Telemedicine</span>
                            </div>
                            
                            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.9] mb-10 animate-in fade-in slide-in-from-left-6 duration-1000">
                                Smart Health.<br/>
                                <span className="text-blue-500 underline decoration-blue-500/30">Zero Friction.</span>
                            </h1>
                            
                            <p className="text-slate-400 text-xl md:text-2xl font-medium leading-relaxed mb-14 max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-200">
                                Connect with world-class specialists in seconds. Secure video consultations, digital prescriptions, and AI-driven insights—all in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-left-10 duration-1000 delay-300">
                                <button 
                                    onClick={() => navigate('/doctors')}
                                    className="group bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
                                >
                                    Find a Doctor <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button 
                                    onClick={() => scrollToSection('about')}
                                    className="bg-slate-800 text-slate-300 px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95 border border-slate-700"
                                >
                                    Learn More
                                </button>
                            </div>

                            <div className="mt-20 flex items-center gap-10 grayscale opacity-40">
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-3xl tracking-tighter">500+</span>
                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Verified Doctors</span>
                                </div>
                                <div className="w-px h-10 bg-slate-800"></div>
                                <div className="flex flex-col">
                                    <span className="text-white font-black text-3xl tracking-tighter">24/7</span>
                                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Patient Support</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE ANIMATION */}
                        <div className="hidden lg:block relative h-[600px] animate-in fade-in zoom-in duration-1000 delay-500">
                            {/* Central Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] animate-pulse"></div>
                            
                            {/* Main Pulse Display */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800/20 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/5 shadow-2xl z-20">
                                <div className="flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <Activity size={100} className="text-blue-500 animate-[pulse_2s_ease-in-out_infinite]" />
                                        <Heart size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/30 fill-white/10 animate-ping" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mb-1">Live Vital Sync</p>
                                        <p className="text-white text-5xl font-black tracking-tight">72 <span className="text-blue-500 text-xl uppercase">bpm</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Orbits */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-white/5 rounded-full border-dashed animate-[spin_40s_linear_infinite_reverse]"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-500/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ABOUT US SECTION */}
            <section id="about" className="py-32 bg-slate-50">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="relative">
                            <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative z-10 overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
                                    <ShieldCheck size={200} />
                                </div>
                                <h3 className="text-4xl font-black mb-6 tracking-tight">Our Mission</h3>
                                <p className="text-blue-100 text-lg leading-relaxed mb-8">
                                    At MediZen, we believe healthcare should be accessible to everyone, everywhere. By leveraging distributed systems and AI, we've built a platform that bridges the gap between patients and medical professionals.
                                </p>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Heart className="mb-4 text-red-400" />
                                        <p className="font-bold text-sm uppercase tracking-widest">Patient First</p>
                                    </div>
                                    <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                                        <Zap className="mb-4 text-amber-400" />
                                        <p className="font-bold text-sm uppercase tracking-widest">Instant Care</p>
                                    </div>
                                </div>
                            </div>
                            {/* Accent blocks */}
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-slate-200 rounded-3xl -z-0"></div>
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-slate-200 rounded-3xl -z-0"></div>
                        </div>

                        <div>
                            <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">MediZen Healthcare</span>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-8">Redefining the <br/><span className="text-blue-600">Digital Clinic.</span></h2>
                            <p className="text-slate-600 text-lg leading-relaxed mb-10">
                                Founded in 2026, MediZen has quickly become the leading smart healthcare platform. We specialize in providing a seamless end-to-end experience—from symptom checking to video consultation and digital prescriptions.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    'Distributed microservice architecture for 99.9% uptime.',
                                    'Secure, end-to-end encrypted video channels.',
                                    'Integrated payment and prescription management.',
                                    'AI-driven health monitoring and analytics.'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-bold text-sm">
                                        <ShieldCheck className="text-green-500" size={18} />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQS SECTION */}
            <section id="faqs" className="py-32 bg-white">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="text-center mb-20">
                        <HelpCircle size={48} className="mx-auto text-blue-600 mb-6" />
                        <h2 className="text-5xl font-black text-slate-900 tracking-tight">Got Questions?</h2>
                        <p className="text-slate-500 text-lg font-medium mt-4">Everything you need to know about using MediZen.</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                q: "How do I book a consultation?",
                                a: "Simply browse our 'Find a Doctor' section, select a specialist, pick an available time slot from their weekly calendar, and confirm your booking."
                            },
                            {
                                q: "Is the video call secure?",
                                a: "Yes, all consultations are powered by industry-standard encryption, ensuring your privacy and data security are always protected."
                            },
                            {
                                q: "How do I get my prescription?",
                                a: "After your session, the doctor will generate a digital prescription (PDF) which you can download immediately from your dashboard."
                            },
                            {
                                q: "Can I upload my medical reports?",
                                a: "Absolutely. You can securely upload diagnostic files to your profile, and they will be accessible to the doctor during your consultation."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-colors cursor-default group">
                                <h4 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black">{i+1}</span>
                                    {faq.q}
                                </h4>
                                <p className="text-slate-500 font-medium leading-relaxed pl-11">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT SUPPORT SECTION */}
            <section id="contact" className="py-32 bg-slate-900 overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl translate-x-10 -translate-y-10"></div>
                
                <div className="container mx-auto px-6 relative z-10">
                    <div className="bg-white rounded-[4rem] overflow-hidden shadow-2xl flex flex-col lg:row-reverse lg:flex-row">
                        <div className="lg:w-1/2 p-12 md:p-20">
                            <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em] mb-4 block">Get In Touch</span>
                            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-8">Contact Support</h2>
                            <p className="text-slate-500 text-lg mb-12">
                                Our dedicated support team is available 24/7 to help you with any technical or booking issues.
                            </p>

                            <div className="space-y-10">
                                <div className="flex items-center gap-6 group">
                                    <div className="bg-blue-50 p-5 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Email Us</p>
                                        <p className="text-xl font-bold text-slate-800">support@medizen.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className="bg-blue-50 p-5 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <Phone size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Call Support</p>
                                        <p className="text-xl font-bold text-slate-800">+94 11 234 5678</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 group">
                                    <div className="bg-blue-50 p-5 rounded-3xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Visit Office</p>
                                        <p className="text-xl font-bold text-slate-800">Colombo, Sri Lanka</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-1/2 bg-blue-600 p-12 md:p-20 text-white flex flex-col justify-center">
                            <div className="bg-white/10 p-12 rounded-[3rem] backdrop-blur-md border border-white/10">
                                <MessageCircle size={48} className="text-white mb-8" />
                                <h3 className="text-3xl font-black mb-6">Need Instant Help?</h3>
                                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                                    Our live chat agents are online and ready to assist you right now. Average response time is under 2 minutes.
                                </p>
                                <button className="w-full bg-white text-blue-600 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95">
                                    Launch Live Chat
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;