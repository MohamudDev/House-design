import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FileImage, FileBarChart, Settings, LogOut, ShieldAlert, MessageSquare, DollarSign, X, AlertCircle } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const AdminSidebar = ({ isOpen, setIsSidebarOpen }) => {
  const { user, logout } = useContext(AuthContext);

  const navLinks = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { name: 'Manage Users', path: '/admin-dashboard/users', icon: <Users size={20} /> },
    { name: 'Manage Designs', path: '/admin-dashboard/designs', icon: <FileImage size={20} /> },
    { name: 'Payouts', path: '/admin-dashboard/withdrawals', icon: <DollarSign size={20} /> },
    { name: 'Reports', path: '/admin-dashboard/reports', icon: <FileBarChart size={20} /> },
    { name: 'Inbox', path: '/admin-dashboard/contacts', icon: <MessageSquare size={20} /> },
    { name: 'Complaints', path: '/admin-dashboard/complaints', icon: <AlertCircle size={20} /> },
    { name: 'Settings', path: '/admin-dashboard/settings', icon: <Settings size={20} /> },
  ];

  if (user?.role === 'superadmin') {
    navLinks.splice(1, 0, { name: 'Manage Admins', path: '/admin-dashboard/admins', icon: <ShieldAlert size={20} /> });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}
      
      <aside className={`w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col fixed md:relative z-50 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldAlert size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-wide">Admin</span>
          </div>
          <button 
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.exact}
            onClick={() => setIsSidebarOpen(false)}
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
    </>
  );
};

export default AdminSidebar;
