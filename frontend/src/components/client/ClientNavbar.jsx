import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { Home, MessageSquare, LogOut, Layout, Box, ShoppingCart, AlertCircle } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const ClientNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext);

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex justify-between items-center transition-colors">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">DesignSpace</span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <Link to="/" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="Home Page">
          <Home size={20} />
        </Link>
        <Link to="/client-dashboard" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="Marketplace">
          <Layout size={20} />
        </Link>
        <Link to="/client-dashboard/my-designs" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="My 3D Designs">
          <Box size={20} />
        </Link>
        <Link to="/client-dashboard/purchases" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="My Purchases">
          <ShoppingCart size={20} />
        </Link>
        <Link to="/client-dashboard/complaints" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="Submit Complaint">
          <AlertCircle size={20} />
        </Link>
        <Link to="/client-dashboard/messages" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl relative" title="Messages">
          <MessageSquare size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <ThemeToggle className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" />
        <div className="text-right hidden sm:block">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Welcome back,</p>
          <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
        </div>
        <button 
          onClick={logout}
          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all active:scale-95"
          title="Logout"
        >
          <LogOut size={22} />
        </button>
      </div>
    </nav>
  );
};

export default ClientNavbar;
