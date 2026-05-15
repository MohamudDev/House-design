import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileImage, FileBarChart, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { logout } = useContext(AuthContext);

  const navLinks = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Manage Users', path: '/admin-dashboard/users', icon: <Users size={20} /> },
    { name: 'Manage Designs', path: '/admin-dashboard/designs', icon: <FileImage size={20} /> },
    { name: 'Reports', path: '/admin-dashboard/reports', icon: <FileBarChart size={20} /> },
    { name: 'Settings', path: '/admin-dashboard/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl text-white tracking-wide">Admin</span>
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
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {link.icon}
            {link.name}
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

export default AdminSidebar;
