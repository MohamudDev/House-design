import { X, Box, Info, DollarSign, Layout, Clock, AlertTriangle } from 'lucide-react';
import ModelViewer from './ModelViewer';

const DesignViewModal = ({ design, onClose }) => {
  if (!design) return null;

  console.log('DEBUG: Design Modal Data:', {
    designId: design._id,
    engineerName: design.engineer?.name,
    engineerBio: design.engineer?.bio,
    engineerSpecialization: design.engineer?.specialization
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: 3D Viewer */}
        <div className="flex-1 bg-slate-50 relative h-[450px] md:min-h-[550px]">
          {design.model3D ? (
            <ModelViewer url={`http://localhost:5005${design.model3D}`} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <Box size={40} />
              </div>
              <p className="font-medium">No 3D Model available for this design</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all active:scale-90 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-[380px] p-8 overflow-y-auto flex flex-col border-l border-slate-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {design.title}
                <span className="text-[10px] text-slate-300 ml-2 font-normal">v1.5</span>
              </h2>
              <span className="inline-block mt-2 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                {design.houseType}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors hidden md:block"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Layout size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Rooms</span>
                </div>
                <p className="text-lg font-bold text-slate-800">{design.rooms}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <DollarSign size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Est. Budget</span>
                </div>
                <p className="text-lg font-bold text-slate-800">${design.budgetEstimate.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-3">
                <Info size={16} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Description</h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed bg-slate-50/50 p-4 rounded-2xl italic border border-dashed border-slate-200">
                {design.description}
              </p>
            </div>

            {/* Engineer Profile Section */}
            <div className="pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">About the Engineer</h3>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${design.engineer?.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {design.engineer?.isAvailable ? '● Available' : '○ Away'}
                </span>
              </div>
              
              {design.engineer?.specialization && (
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl inline-block">
                  {design.engineer.specialization}
                </p>
              )}

              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {design.engineer?.bio || 'No professional bio provided yet.'}
              </p>

              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                <span className="flex items-center gap-1"><Clock size={12} /> Hours: {design.engineer?.workingHours || 'Standard'}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  {design.engineer?.name?.charAt(0).toUpperCase() || 'E'}
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Designed by</p>
                  <p className="text-sm font-bold text-slate-800">{design.engineer?.name || 'Engineer'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignViewModal;
