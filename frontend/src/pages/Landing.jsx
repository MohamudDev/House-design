import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Home, Users, ShieldCheck, ChevronRight, Layout, DollarSign, Eye, Search } from 'lucide-react';
import Navbar from '../components/Navbar';
import DesignViewModal from '../components/DesignViewModal';

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleView3D = (design) => {
    if (user) {
      setSelectedDesign(design);
    } else {
      navigate('/login');
    }
  };

  const handleExploreClick = (e) => {
    e.preventDefault();
    if (user) {
      if (user.role === 'client') navigate('/client-dashboard');
      else if (user.role === 'engineer') navigate('/engineer-dashboard');
      else if (user.role === 'admin' || user.role === 'superadmin') navigate('/admin-dashboard');
    } else {
      navigate('/login');
    }
  };



  useEffect(() => {
    if (user) {
      const role = (user.role || '').toLowerCase().trim();
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin-dashboard');
      } else if (role === 'engineer') {
        navigate('/engineer-dashboard');
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchPublicDesigns = async () => {
      try {
        const { data } = await axios.get(`/api/public/designs?t=${new Date().getTime()}`);
        setDesigns(data.data); // Load all for search, but maybe display top ones initially
      } catch (error) {
        console.error('Error fetching public designs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicDesigns();
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white dark:bg-slate-900 transition-colors duration-500">
      <Navbar />

      {/* Hero Section */}
      <main className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1920" 
            alt="Beautiful Luxury House" 
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-8 flex flex-col items-start">
          <div className="max-w-2xl text-left animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              The Next Generation of Architecture
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tighter">
              Building Dreams <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Into Reality.</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-xl font-medium">
              Design Your Dream Home With Modern Elegance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <button 
                onClick={handleExploreClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-500/40 active:scale-95"
              >
                Start Exploring
                <ChevronRight size={22} />
              </button>
              
              <a 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                View Gallery
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Trust Badges */}
      <div className="bg-slate-50 dark:bg-slate-800 py-12 border-y border-slate-200 dark:border-slate-700 transition-colors">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <Home size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Verified Designs</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Every plan is checked for quality</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <Users size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Direct Chat</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Talk directly with the engineer</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
              <ShieldCheck size={32} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-slate-900 dark:text-white font-bold text-lg">Secure Process</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Safe transactions and vetted pros</p>
          </div>
        </div>
      </div>

      {/* Featured Gallery */}
      <section id="gallery" className="py-24 px-8 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Featured Collections</h2>
            <div className="w-24 h-2 bg-indigo-600 mx-auto rounded-full mb-6"></div>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Discover the most popular architectural trends handpicked by our experts.</p>
          </div>

          {/* Search Bar for Public Gallery */}
          <div className="max-w-xl mx-auto mb-16 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search dream houses, styles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/50 rounded-2xl outline-none transition-all shadow-sm dark:text-white dark:placeholder-slate-500 text-lg"
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 bg-slate-100 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          ) : designs.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-400 dark:text-slate-500 font-bold text-xl uppercase tracking-widest">Gallery Coming Soon</p>
              <p className="text-slate-500 dark:text-slate-400 mt-2 italic">Engineers are currently preparing stunning 3D models for you.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {designs.filter(d => d.title.toLowerCase().includes(searchTerm.toLowerCase()) || d.houseType.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 6).map((design) => (
                <div key={design._id} className="group cursor-pointer">
                  <div className="relative h-[450px] rounded-[2.5rem] overflow-hidden shadow-xl transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-indigo-200 group-hover:-translate-y-3">
                    {/* Placeholder or Image */}
                    <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800">
                      {design.images && design.images.length > 0 ? (
                        <img 
                          src={`${design.images[0]}`} 
                          alt={design.title}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                          <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-3xl flex items-center justify-center shadow-inner mb-4">
                            <Layout size={40} />
                          </div>
                          <span className="font-bold text-sm tracking-widest uppercase">3D Model Only</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg text-xs font-black uppercase tracking-widest mb-4 inline-block">
                          {design.houseType}
                        </span>
                        <h3 className="text-3xl font-black mb-3">{design.title}</h3>
                        
                        <div className="flex gap-4 mb-6">
                          <div className="flex items-center gap-1.5 text-slate-300 text-sm font-bold">
                            <Layout size={16} /> {design.rooms} Rooms
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-300 text-sm font-bold">
                            <DollarSign size={16} /> ${design.budgetEstimate.toLocaleString()}
                          </div>
                        </div>

                        <button 
                          onClick={() => handleView3D(design)}
                          className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                        >
                          EXPLORE IN 3D
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-20">
            {!user && (
              <Link 
                to="/register" 
                className="inline-flex items-center gap-3 text-indigo-600 font-black text-xl hover:gap-5 transition-all group"
              >
                Sign up to see all designs & chat with engineers
                <ChevronRight size={24} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer / Contact Preview */}
      <footer className="relative bg-slate-900 py-20 px-8 text-white border-t border-white/10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/footer_bg.png" 
            alt="Modern House Footer Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <span className="font-bold text-2xl">H</span>
              </div>
              <span className="font-bold text-xl tracking-tight">DesignSpace</span>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium">
              We provide the tools and connections to turn architectural dreams into reality. Based in Somalia, serving the world.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-slate-500">Platform</h4>
              <ul className="space-y-4 font-bold text-slate-300">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to={user?.role === 'engineer' ? '/engineer-dashboard' : '/register'} className="hover:text-white transition-colors">Join as Engineer</Link></li>
                <li><Link to={user?.role === 'client' ? '/client-dashboard' : '/login'} className="hover:text-white transition-colors">Browse Marketplace</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase tracking-widest mb-6 text-slate-500">Support</h4>
              <ul className="space-y-4 font-bold text-slate-300">
                <li><a href="mailto:support@designspace.com" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto mt-20 pt-10 border-t border-white/10 text-center text-slate-400 font-bold text-sm">
          &copy; {new Date().getFullYear()} DesignSpace. All rights reserved.
        </div>
      </footer>

      {/* 3D View Modal */}
      {selectedDesign && (
        <DesignViewModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)} 
        />
      )}
    </div>
  );
};

export default Landing;
