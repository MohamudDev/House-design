import { Link } from 'react-router-dom';
import { Home, LogOut, User as UserIcon } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="absolute top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Home size={24} className="text-white" />
        </div>
        <span className="font-bold text-2xl text-white tracking-tight">DesignSpace</span>
      </Link>
      
      <div className="hidden md:flex items-center gap-8 text-white/90 font-medium">
        <Link to="/" className="hover:text-white transition-colors">Home</Link>
        {user?.role === 'client' && (
          <Link to="/client-dashboard" className="hover:text-white transition-colors">Design Gallery</Link>
        )}
        <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
        <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-4">
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
          <>
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
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
