import { Outlet, Link, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mail, Menu, LogOut } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [unreadContacts, setUnreadContacts] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const [hasOpenedPopover, setHasOpenedPopover] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const popoverRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    fetchUnreadContacts();

    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setShowPopover(false);
      }
    };
    
    const handleMarkedRead = () => {
      fetchUnreadContacts();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('contactsMarkedRead', handleMarkedRead);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('contactsMarkedRead', handleMarkedRead);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/admin-dashboard/contacts') {
      setHasOpenedPopover(true);
      fetchUnreadContacts();
    }
  }, [location.pathname]);

  const fetchUnreadContacts = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (!userInfo) return;
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/contact/unread', config);
      setUnreadContacts(data.data);
    } catch (err) {
      console.error('Error fetching unread contacts', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      <AdminSidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 px-4 md:px-8 py-4 flex justify-between items-center z-10 transition-colors">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Control Panel</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative mr-2" ref={popoverRef}>
              <button 
                onClick={() => {
                  setShowPopover(!showPopover);
                  if (!showPopover) setHasOpenedPopover(true);
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-full relative"
              >
                <Mail size={20} />
                {unreadContacts.length > 0 && !hasOpenedPopover && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">
                    {unreadContacts.length}
                  </span>
                )}
              </button>

              {showPopover && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-800 dark:text-white">New Messages</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {unreadContacts.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                        No new messages.
                      </div>
                    ) : (
                      unreadContacts.map(msg => (
                        <div key={msg._id} className="p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{msg.name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{msg.subject}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-center">
                    <Link 
                      to="/admin-dashboard/contacts" 
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      onClick={() => setShowPopover(false)}
                    >
                      View All Messages
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <ThemeToggle className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 mr-1 md:mr-2" />
            <span className="hidden sm:inline text-sm text-slate-500 dark:text-slate-400">Administrator,</span>
            <span className="hidden sm:inline font-bold text-slate-900 dark:text-white">{user?.name}</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-200 dark:border-blue-800">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button 
              onClick={logout}
              className="ml-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/30 rounded-full transition-colors flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* This renders the nested routes (Overview, Users, Designs, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
