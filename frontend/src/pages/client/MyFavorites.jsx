import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Heart, Search, Eye, Layout, DollarSign, ChevronLeft } from 'lucide-react';
import DesignViewModal from '../../components/DesignViewModal';
import ClientNavbar from '../../components/client/ClientNavbar';

const MyFavorites = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [favoriteDesigns, setFavoriteDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const storedInfo = localStorage.getItem('userInfo');
      if (!storedInfo) {
        setLoading(false);
        return;
      }
      const userInfo = JSON.parse(storedInfo);
      const { data } = await axios.get('/api/client/favorites', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (data.success) {
        setFavoriteDesigns(data.data); // data.data contains the populated designs
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        // If un-favorited, remove it from the list
        setFavoriteDesigns(prev => prev.filter(d => d._id !== designId));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const filteredDesigns = favoriteDesigns.filter(design => 
    design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.houseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
      <ClientNavbar />

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <Link to="/client-dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm">
            <ChevronLeft size={16} /> Back to Marketplace
          </Link>
        </div>

        {/* Header and Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              My Favorites <Heart className="fill-red-500 text-red-500" size={32} />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">The architectural designs you loved.</p>
          </div>
          
          <div className="flex-1 max-w-md w-full md:w-auto">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search favorites..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 dark:focus:ring-indigo-900/50 rounded-2xl outline-none transition-all text-sm shadow-sm dark:text-white dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-[420px] bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">No favorites yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Go to the marketplace and click the heart icon on designs you like!</p>
            <Link to="/client-dashboard" className="mt-6 inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors">
              Browse Designs
            </Link>
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
                      className="p-2.5 bg-red-50 hover:bg-white text-red-500 backdrop-blur rounded-2xl shadow-lg transition-all active:scale-90"
                      title="Remove from favorites"
                    >
                      <Heart size={20} className="fill-red-500" />
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
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {design.title}
                    </h3>
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

export default MyFavorites;
