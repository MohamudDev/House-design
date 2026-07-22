import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, Heart, MessageSquare, Search, Filter, Eye, Layout, DollarSign, ShoppingBag } from 'lucide-react';
import DesignViewModal from '../components/DesignViewModal';
import ThemeToggle from '../components/ThemeToggle';
import ClientNavbar from '../components/client/ClientNavbar';

const ClientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Favorites (just IDs for toggling)
  const [favorites, setFavorites] = useState([]);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    houseType: 'all',
    minRooms: 1,
    maxBudget: 1000000
  });

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const storedInfo = localStorage.getItem('userInfo');
        if (!storedInfo) {
          console.error('No userInfo found');
          setLoading(false);
          return;
        }

        const userInfo = JSON.parse(storedInfo);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get(`/api/client/designs?t=${new Date().getTime()}`, config);
        setDesigns(data.data);
      } catch (error) {
        console.error('Error fetching designs:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchFavorites = async () => {
      try {
        const storedInfo = localStorage.getItem('userInfo');
        if (!storedInfo) return;
        const userInfo = JSON.parse(storedInfo);
        const { data } = await axios.get('/api/client/favorites', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        if (data.success) {
          setFavorites(data.data.map(d => d._id));
        }
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };

    fetchDesigns();
    fetchFavorites();
  }, []);

  const handleToggleFavorite = async (e, designId) => {
    e.stopPropagation();
    try {
      const storedInfo = localStorage.getItem('userInfo');
      if (!storedInfo) return;
      const userInfo = JSON.parse(storedInfo);
      
      const { data } = await axios.post(`/api/client/favorites/${designId}`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      
      if (data.success) {
        setFavorites(data.favorites);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredDesigns = designs.filter(design => {
    // 1. Search filter
    const matchesSearch = design.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          design.houseType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Dropdown filters
    const matchesType = filters.houseType === 'all' || design.houseType.toLowerCase() === filters.houseType.toLowerCase();
    const matchesRooms = design.rooms >= filters.minRooms;
    const matchesBudget = design.budgetEstimate <= filters.maxBudget;

    return matchesSearch && matchesType && matchesRooms && matchesBudget;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      {/* Premium Navbar */}
      <ClientNavbar />

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Design Gallery</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Explore verified architectural plans from top engineers.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-600 dark:hover:border-indigo-500'}`}
            >
              <Filter size={18} />
              Filters
            </button>
            <button 
              onClick={() => navigate('/client-dashboard/purchases')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20`}
            >
              <ShoppingBag size={18} />
              My Purchases
            </button>
            <button 
              onClick={() => navigate('/client-dashboard/favorites')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 dark:shadow-indigo-900/20`}
            >
              <Heart size={18} />
              My Favorites
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-10 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">House Type</label>
              <select 
                value={filters.houseType}
                onChange={(e) => setFilters({...filters, houseType: e.target.value})}
                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="villa">Villa</option>
                <option value="apartment">Apartment</option>
                <option value="mansion">Mansion</option>
                <option value="bungalow">Bungalow</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Min Rooms: {filters.minRooms}</label>
              <input 
                type="range" 
                min="1" max="80" 
                value={filters.minRooms}
                onChange={(e) => setFilters({...filters, minRooms: parseInt(e.target.value)})}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Max Budget: ${filters.maxBudget.toLocaleString()}</label>
              <input 
                type="range" 
                min="1" max="5000000" step="1000"
                value={filters.maxBudget}
                onChange={(e) => setFilters({...filters, maxBudget: parseInt(e.target.value)})}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        )}

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No designs found</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDesigns.map((design) => (
              <div 
                key={design._id} 
                className="group bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-900/20 hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                {/* Image/Thumbnail Area */}
                <div className="relative h-64 overflow-hidden">
                  {design.images && design.images.length > 0 ? (
                    <img 
                      src={`${design.images[0]}`} 
                      alt={design.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500">
                      <Layout size={48} />
                    </div>
                  )}
                  <div className="absolute top-5 right-5">
                    <button 
                      onClick={(e) => handleToggleFavorite(e, design._id)}
                      className={`p-2.5 backdrop-blur rounded-2xl shadow-lg transition-all active:scale-90 ${favorites.includes(design._id) ? 'bg-red-50 hover:bg-red-100 text-red-500' : 'bg-white/90 hover:bg-white text-slate-400 hover:text-red-500'}`}
                    >
                      <Heart size={20} className={favorites.includes(design._id) ? "fill-red-500" : ""} />
                    </button>
                  </div>
                  <div className="absolute bottom-5 left-5">
                    <span className="px-3 py-1.5 bg-indigo-600/90 backdrop-blur text-white text-xs font-bold rounded-xl shadow-lg">
                      {design.houseType.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-7">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {design.title}
                    </h3>
                    {design.ratings && design.ratings.length > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg shrink-0">
                        ★ {(design.ratings.reduce((acc, r) => acc + r.rating, 0) / design.ratings.length).toFixed(1)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                        <Layout size={16} />
                      </div>
                      <span className="text-sm font-semibold">{design.rooms} Rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                      <span className="text-sm font-semibold">${design.budgetEstimate.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold border border-indigo-200 dark:border-indigo-800">
                        {design.engineer?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{design.engineer?.name}</span>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedDesign(design)}
                      className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/btn"
                    >
                      View 3D
                      <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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

export default ClientDashboard;
