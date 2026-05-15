import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Get in Touch</h1>
            <p className="text-slate-500 text-lg">Have questions about our platform or need architectural advice? We're here to help.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
            
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-5 hover:border-indigo-600 transition-colors">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Email Us</h4>
                  <p className="text-slate-500 text-sm mb-2">Our team responds within 24 hours.</p>
                  <a href="mailto:support@designspace.com" className="text-indigo-600 font-bold hover:underline">support@designspace.com</a>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-5 hover:border-indigo-600 transition-colors">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Call Us</h4>
                  <p className="text-slate-500 text-sm mb-2">Mon-Fri from 8am to 6pm.</p>
                  <a href="tel:+252610000000" className="text-emerald-600 font-bold hover:underline">+252 61 000 0000</a>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-5 hover:border-indigo-600 transition-colors">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Visit Office</h4>
                  <p className="text-slate-500 text-sm mb-2">Mogadishu, Somalia.</p>
                  <span className="text-amber-600 font-bold italic">KM4 Street, City Center</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 bg-white p-10 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
              {submitted ? (
                <div className="py-20 text-center flex flex-col items-center animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">Message Sent!</h2>
                  <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. One of our architectural consultants will contact you shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-10 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10">
                    <div className="flex items-center gap-3 text-indigo-600 font-black uppercase tracking-widest text-xs mb-3">
                      <MessageSquare size={16} />
                      Send a message
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">How can we help you?</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                      <select name="subject" value={formData.subject} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none cursor-pointer">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Partnership</option>
                        <option>Hiring an Engineer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                      <textarea name="message" required rows="6" value={formData.message} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all resize-none" placeholder="Tell us about your project or ask a question..."></textarea>
                    </div>

                    <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
                      Send Message
                      <Send size={20} />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
