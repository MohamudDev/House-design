import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Box, Clock, AlertTriangle, Play } from 'lucide-react';
import ModelViewer from '../../components/ModelViewer';
import { format } from 'date-fns';

const ClientMyDesigns = () => {
  const { user } = useContext(AuthContext);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    fetchClientDesigns();
  }, []);

  const fetchClientDesigns = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages/client-designs`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDesigns(data.designs);
      } else {
        setError(data.message || 'Failed to load your designs');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while loading designs.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My 3D Designs</h1>
        <p className="text-slate-500 dark:text-slate-400">View custom 3D models sent to you by engineers.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle size={20} />
          {error}
        </div>
      )}

      {designs.length === 0 && !error ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Box size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Designs Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            When engineers send you custom 3D models in the chat, they will appear here for you to view in full screen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {designs.map((msg) => (
            <div key={msg._id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col cursor-pointer" onClick={() => setSelectedDesign(msg.attachmentUrl)}>
              <div className="h-48 bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center relative group">
                <Box size={48} className="text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <div className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all shadow-xl">
                    <Play size={16} className="fill-current" /> View in 3D
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                  {msg.content || 'Attached 3D Model'}
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    {msg.sender?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{msg.sender?.name || 'Engineer'}</p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                      <Clock size={10} className="shrink-0" /> <span className="truncate">{format(new Date(msg.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D Viewer Modal */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Box size={18} className="text-indigo-500" /> 3D Model Viewer
              </h3>
              <button 
                onClick={() => setSelectedDesign(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="flex-1 relative bg-slate-50 dark:bg-slate-800">
              <ModelViewer url={`${selectedDesign}`} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientMyDesigns;
