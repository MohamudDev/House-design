import { Link } from 'react-router-dom';
import { Home, LogOut, User as UserIcon, Moon, Sun, Mail, CheckCircle2, Menu, X } from 'lucide-react';
import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unreadReplies, setUnreadReplies] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const [hasOpenedPopover, setHasOpenedPopover] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    // Check local storage or system preference on mount
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    if (user) {
      fetchUnreadReplies();
    }

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [user]);

  const fetchUnreadReplies = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) return;
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/contact/my/unread', config);
      setUnreadReplies(data.data);
    } catch (err) {
      console.error('Error fetching unread replies', err);
    }
  };

  const handleOpenPopover = () => {
    setShowPopover(!showPopover);
    if (!showPopover && unreadReplies.length > 0 && !hasOpenedPopover) {
      setHasOpenedPopover(true);
      
      // Background request to mark all as read so badge doesn't return on refresh
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      unreadReplies.forEach(reply => {
        axios.put(`/api/contact/my/read/${reply._id}`, {}, config).catch(console.error);
      });
    }
  };

  const markReplyAsRead = async (id) => {
    try {
      setUnreadReplies(unreadReplies.filter(r => r._id !== id));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDarkMode(true);
    }
  };

  return (
    <nav className="absolute top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20 dark:bg-slate-900/50 dark:border-slate-800/50 transition-colors">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Home size={24} className="text-white" />
        </div>
        <span className="font-bold text-2xl text-white tracking-tight">DesignSpace</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8 text-white/90 font-medium">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        {user?.role === 'client' && (
          <>
            <Link to="/client-dashboard" className="hover:text-white transition-colors">Marketplace</Link>
            <Link to="/client-dashboard/my-designs" className="hover:text-white transition-colors">My Design</Link>
          </>
        )}
        <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
        <Link to="/services" className="hover:text-white transition-colors">Services</Link>
        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user && (
          <div className="relative" ref={popoverRef}>
            <button 
              onClick={handleOpenPopover}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 relative"
              title="Messages"
            >
              <Mail size={20} />
              {unreadReplies.length > 0 && !hasOpenedPopover && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-indigo-900">
                  {unreadReplies.length}
                </span>
              )}
            </button>

            {showPopover && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">Admin Replies</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {unreadReplies.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                      No new messages.
                    </div>
                  ) : (
                    unreadReplies.map(reply => (
                      <div key={reply._id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{reply.subject}</span>
                          <span className="text-[10px] text-slate-400">{new Date(reply.repliedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{reply.reply}</p>
                        <button 
                          onClick={() => markReplyAsRead(reply._id)}
                          className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
                        >
                          <CheckCircle2 size={14} /> Clear from view
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {user ? (
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white">
              <UserIcon size={18} />
              <span className="text-sm font-bold">{user.name.split(' ')[0]}</span>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-white/70 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-white font-medium hover:text-white/80 transition-colors"
            >
              Log In
            </Link>
            <Link 
              to="/register" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/30 active:scale-95"
            >
              Sign Up
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex flex-col items-center py-6 gap-6 md:hidden z-50">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">Home</Link>
          {user?.role === 'client' && (
            <>
              <Link to="/client-dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">Marketplace</Link>
              <Link to="/client-dashboard/my-designs" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">My Design</Link>
            </>
          )}
          <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">About Us</Link>
          <Link to="/services" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">Services</Link>
          <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold text-lg hover:text-indigo-400">Contact</Link>
          
          <div className="w-2/3 h-px bg-white/10 my-2"></div>
          
          {user ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-white">
                <UserIcon size={20} />
                <span className="font-bold">{user.name}</span>
              </div>
              <button 
                onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                className="text-red-400 font-bold flex items-center gap-2"
              >
                <LogOut size={20} /> Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full px-10">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-white font-bold py-3 w-full text-center border border-white/20 rounded-xl">Log In</Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="bg-indigo-600 text-white font-bold py-3 w-full text-center rounded-xl">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
