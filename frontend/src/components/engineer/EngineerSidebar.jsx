import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FolderOpen, MessageSquare, Calendar, LogOut, Briefcase } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';

const EngineerSidebar = () => {
  const { logout } = useContext(AuthContext);
  const { unreadCount } = useContext(SocketContext);

  const navLinks = [
    { name: 'Dashboard', path: '/engineer-dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Upload Design', path: '/engineer-dashboard/upload', icon: <UploadCloud size={20} /> },
    { name: 'My Designs', path: '/engineer-dashboard/designs', icon: <FolderOpen size={20} /> },
    { name: 'Messages', path: '/engineer-dashboard/messages', icon: <MessageSquare size={20} /> },
    { name: 'Availability', path: '/engineer-dashboard/availability', icon: <Calendar size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Briefcase size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl text-white tracking-wide">Engineer</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {link.icon}
            <span className="flex-1">{link.name}</span>
            {link.name === 'Messages' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl transition-colors font-medium hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default EngineerSidebar;
