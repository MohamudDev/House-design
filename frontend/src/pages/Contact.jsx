import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2, Lock } from 'lucide-react';

const Contact = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: 'General Inquiry',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await axios.post('/api/contact', formData, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo')).token}` }
      });
      setSubmitted(true);
      setFormData({ name: user?.name || '', email: user?.email || '', subject: 'General Inquiry', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/90 via-slate-900/80 to-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold mb-6 text-sm uppercase tracking-widest">
            <MessageSquare size={16} />
            Support & Sales
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Let's Start a <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Conversation</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Whether you have a question about features, pricing, or need architectural advice, our team is ready to answer all your questions.
          </p>
        </div>
      </section>

      <main className="flex-grow pb-20 px-6 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mx-auto">
            
            {/* Contact Form */}
            <div className="bg-white dark:bg-slate-800 p-10 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden transition-colors">
              {submitted ? (
                <div className="py-20 text-center flex flex-col items-center animate-in zoom-in duration-500">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-8">
                    <CheckCircle2 size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Message Sent!</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out. One of our architectural consultants will contact you shortly.
                  </p>
                  <button 
                    onClick={() => setSubmitted(false)}
                    className="mt-10 px-8 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white">Send us a Message</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Fill out the form below and we'll get back to you shortly.</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          name="name" 
                          required 
                          pattern="^[a-zA-Z\s]+$"
                          title="Name should only contain letters and spaces"
                          value={formData.name} 
                          onChange={handleChange} 
                          className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all dark:text-white" 
                          placeholder="name" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all dark:text-white" placeholder="john@example.com" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject</label>
                      <select name="subject" value={formData.subject} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all appearance-none cursor-pointer dark:text-white">
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Partnership</option>
                        <option>Hiring an Engineer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Message</label>
                      <textarea name="message" required rows="6" value={formData.message} onChange={handleChange} className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/30 outline-none transition-all resize-none dark:text-white" placeholder="Tell us about your project or ask a question..."></textarea>
                    </div>

                    <button type="submit" disabled={loading} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-[2rem] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                      {loading ? 'Sending...' : 'Send Message'}
                      {!loading && <Send size={20} />}
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
