import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Check, X, ShieldAlert } from 'lucide-react';
import DesignViewModal from '../../components/DesignViewModal';

const ManageDesigns = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);

  const fetchDesigns = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.get('/api/admin/designs', config);
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

  const handleUpdateStatus = async (id, status) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`/api/admin/designs/${id}/status`, { status }, config);
      fetchDesigns(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update design status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center w-max gap-1 uppercase"><Check size={14} /> Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center w-max gap-1 uppercase"><X size={14} /> Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center w-max gap-1 uppercase"><ShieldAlert size={14} /> Pending</span>;
    }
  };

  if (loading) return <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading designs...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Designs</h1>
        <p className="text-slate-500 dark:text-slate-400">Review, approve, or reject uploaded house designs.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                <th className="p-4 pl-6">Design Title</th>
                <th className="p-4">Engineer</th>
                <th className="p-4">Type</th>
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
                        <img src={`${design.images[0]}`} alt="thumbnail" className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">No Img</div>
                      )}
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-white block">{design.title}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(design.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-white">{design.engineer?.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{design.engineer?.email || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{design.houseType}</td>
                  <td className="p-4">
                    {getStatusBadge(design.status)}
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedDesign(design)}
                        className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" 
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      
                      {design.status !== 'approved' && (
                        <button 
                          onClick={() => handleUpdateStatus(design._id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors ml-2"
                        >
                          Approve
                        </button>
                      )}
                      
                      {design.status !== 'rejected' && (
                        <button 
                          onClick={() => handleUpdateStatus(design._id, 'rejected')}
                          className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium transition-colors ml-2"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              
              {designs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No designs have been uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

export default ManageDesigns;
