import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Edit, Trash2 } from 'lucide-react';
import DesignViewModal from '../../components/DesignViewModal';
import EditDesignModal from '../../components/engineer/EditDesignModal';

const MyDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [editingDesign, setEditingDesign] = useState(null);

  const fetchDesigns = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.get('/api/engineer/designs', config);
      setDesigns(data.data);
    } catch (error) {
      console.error('Error fetching designs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        await axios.delete(`/api/engineer/designs/${id}`, config);
        // Refresh list
        fetchDesigns();
      } catch (error) {
        console.error('Error deleting design:', error);
        alert(error.response?.data?.message || 'Failed to delete design');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full uppercase tracking-wider">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wider">Pending</span>;
    }
  };

  if (loading) return <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading designs...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Designs</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and track the status of your uploaded designs.</p>
        </div>
      </div>

      {designs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm transition-colors">
          <p>You haven't uploaded any designs yet.</p>
          <p className="text-sm mt-1">Go to the 'Upload Design' tab to submit your first project.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                  <th className="p-4 pl-6">Design Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Upload Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {designs.map((design) => (
                  <tr key={design._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {design.images && design.images.length > 0 ? (
                          <img src={`${design.images[0]}`} alt="thumbnail" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }} className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">No Img</div>
                        )}
                        <span className="font-semibold text-slate-800 dark:text-white">{design.title}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{design.houseType}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(design.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {getStatusBadge(design.status)}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedDesign(design)}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" 
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingDesign(design)}
                          className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors" 
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(design._id)}
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" 
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedDesign && (
        <DesignViewModal 
          design={selectedDesign} 
          onClose={() => setSelectedDesign(null)} 
        />
      )}

      {editingDesign && (
        <EditDesignModal 
          design={editingDesign}
          onClose={() => setEditingDesign(null)}
          onUpdateSuccess={() => {
            setEditingDesign(null);
            fetchDesigns();
          }}
        />
      )}
    </div>
  );
};

export default MyDesigns;
