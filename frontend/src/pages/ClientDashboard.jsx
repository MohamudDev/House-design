import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Home, Heart, MessageSquare, Search, Filter, Eye, Layout, DollarSign } from 'lucide-react';
import DesignViewModal from '../components/DesignViewModal';

const ClientDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

    fetchDesigns();
  }, []);

  const filteredDesigns = designs.filter(design => 
    design.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.houseType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Premium Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-2xl">H</span>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">DesignSpace</span>
        </div>

        <div className="flex-1 max-w-md mx-12 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search dream houses, styles..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 rounded-2xl outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-slate-400 font-medium">Welcome back,</p>
            <p className="text-sm font-bold text-slate-900">{user?.name}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
            title="Logout"
          >
            <LogOut size={22} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Design Gallery</h1>
            <p className="text-slate-500 mt-2 text-lg">Explore verified architectural plans from top engineers.</p>
          </div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-indigo-600 transition-colors shadow-sm">
              <Filter size={18} />
              Filters
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
              <Heart size={18} />
              Favorites
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[420px] bg-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">No designs found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDesigns.map((design) => (
              <div 
                key={design._id} 
                className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
              >
                {/* Image/Thumbnail Area */}
                <div className="relative h-64 overflow-hidden">
                  {design.images && design.images.length > 0 ? (
                    <img 
                      src={`http://localhost:5005${design.images[0]}`} 
                      alt={design.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                      <Layout size={48} />
                    </div>
                  )}
                  <div className="absolute top-5 right-5">
                    <button className="p-2.5 bg-white/90 backdrop-blur hover:bg-white text-slate-400 hover:text-red-500 rounded-2xl shadow-lg transition-all active:scale-90">
                      <Heart size={20} />
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
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {design.title}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <Layout size={16} />
                      </div>
                      <span className="text-sm font-semibold">{design.rooms} Rooms</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                        <DollarSign size={16} />
                      </div>
                      <span className="text-sm font-semibold">${design.budgetEstimate.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-200">
                        {design.engineer?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{design.engineer?.name}</span>
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
