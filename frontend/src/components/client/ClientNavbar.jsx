import { useContext } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import { Home, MessageSquare, LogOut, Layout, ShoppingCart, AlertCircle, Box } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

const navLinkClass = ({ isActive }) =>
  `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white shadow-sm'
      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
  }`;

const iconLinkClass = ({ isActive }) =>
  `transition-colors p-2 rounded-xl ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-500 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800'
  }`;

/**
 * Shared client top nav — Marketplace / My Design stay visible so clients can switch freely.
 */
const ClientNavbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext) || {};

  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4 flex justify-between items-center gap-3 transition-colors">
      <div className="flex items-center gap-3 shrink-0">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <span className="font-bold text-xl text-slate-800 dark:text-white tracking-tight hidden sm:inline">DesignSpace</span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
        <NavLink to="/client-dashboard" end className={navLinkClass} title="Marketplace">
          <Layout size={16} />
          <span className="hidden sm:inline">Marketplace</span>
        </NavLink>
        <NavLink to="/client-dashboard/my-designs" className={navLinkClass} title="My Design">
          <Box size={16} />
          <span className="hidden sm:inline">My Design</span>
        </NavLink>

        <Link to="/" className="text-slate-500 hover:text-indigo-600 transition-colors p-2 bg-slate-100 dark:bg-slate-800 rounded-xl" title="Home Page">
          <Home size={20} />
        </Link>
        <NavLink to="/client-dashboard/purchases" className={iconLinkClass} title="My Purchases">
          <ShoppingCart size={20} />
        </NavLink>
        <NavLink to="/client-dashboard/complaints" className={iconLinkClass} title="Submit Complaint">
          <AlertCircle size={20} />
        </NavLink>
        <NavLink to="/client-dashboard/messages" className={iconLinkClass} title="Messages">
          <span className="relative inline-flex">
            <MessageSquare size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </span>
        </NavLink>

        <ThemeToggle className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" />
        <div className="text-right hidden md:block">
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
