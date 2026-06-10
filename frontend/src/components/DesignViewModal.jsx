import { X, Box, Info, DollarSign, Layout, Clock, AlertTriangle, MessageSquare, Send, ShoppingCart } from 'lucide-react';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import ModelViewer from './ModelViewer';
import PaymentModal from './client/PaymentModal';

const DesignViewModal = ({ design, onClose }) => {
  const { user } = useContext(AuthContext);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!design) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      setIsSending(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          receiverId: design.engineer._id,
          designId: design._id,
          content: messageContent
        })
      });

      if (res.ok) {
        setMessageSent(true);
        setMessageContent('');
        setErrorMessage('');
        setTimeout(() => {
          setShowMessageForm(false);
          setMessageSent(false);
        }, 3000);
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setErrorMessage('Network error occurred');
    } finally {
      setIsSending(false);
    }
  };

  console.log('DEBUG: Design Modal Data:', {
    designId: design._id,
    engineerName: design.engineer?.name,
    engineerBio: design.engineer?.bio,
    engineerSpecialization: design.engineer?.specialization
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] transition-colors">
        
        {/* Left Side: 3D Viewer */}
        <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-800 relative h-[450px] md:min-h-[550px]">
          {design.model3D ? (
            <ModelViewer url={`${design.model3D}`} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <Box size={40} />
              </div>
              <p className="font-medium">No 3D Model available for this design</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-2 bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 dark:text-white rounded-full shadow-lg transition-all active:scale-90 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Right Side: Details */}
        <div className="w-full md:w-[380px] p-8 overflow-y-auto flex flex-col border-l border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {design.title}
                <span className="text-[10px] text-slate-300 ml-2 font-normal">v1.5</span>
              </h2>
              <span className="inline-block mt-2 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                {design.houseType}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors hidden md:block"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Layout size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Bedrooms</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.rooms}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Layout size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Bathrooms</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.bathrooms || 1}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Layout size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Kitchens</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.kitchens || 1}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <Layout size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Car Parking</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.carParking ? 'Yes' : 'No'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                  <DollarSign size={14} />
                  <span className="text-xs font-semibold uppercase tracking-tight">Est. Budget</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">${design.budgetEstimate.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-3">
                <Info size={16} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Description</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl italic border border-dashed border-slate-200 dark:border-slate-700">
                {design.description}
              </p>
            </div>

            {/* Engineer Profile Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">About the Engineer</h3>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${design.engineer?.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {design.engineer?.isAvailable ? '● Available' : '○ Away'}
                </span>
              </div>
              
              {design.engineer?.specialization && (
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl inline-block">
                  {design.engineer.specialization}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                {design.engineer?.bio || 'No professional bio provided yet.'}
              </p>

              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><Clock size={12} /> Hours: {design.engineer?.workingHours || 'Standard'}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                    {design.engineer?.name?.charAt(0)?.toUpperCase() || 'E'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Designed by</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{design.engineer?.name || 'Engineer'}</p>
                  </div>
                </div>
                {user?.role === 'client' && (
                  <div className="flex gap-2">
                    {!showMessageForm && !messageSent && (
                      <button 
                        onClick={() => setShowMessageForm(true)}
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <MessageSquare size={16} />
                        Message
                      </button>
                    )}
                    
                    {!paymentSuccess ? (
                      <button 
                        onClick={() => setShowPaymentModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all active:scale-95"
                      >
                        <ShoppingCart size={16} />
                        Buy ${(design.price || 100).toLocaleString()}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-100 dark:border-emerald-800">
                        Purchased
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showMessageForm && (
                <form onSubmit={handleSendMessage} className="mt-4 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-2">
                  <textarea
                    className="w-full text-sm p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white mb-2"
                    rows="3"
                    placeholder={`Ask ${design.engineer?.name || 'the engineer'} about this design...`}
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      setErrorMessage('');
                    }}
                    autoFocus
                  />
                  {errorMessage && (
                    <div className="text-red-500 text-xs font-medium mb-2 pl-1 bg-red-50 p-2 rounded border border-red-100 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      {errorMessage}
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button" 
                      onClick={() => setShowMessageForm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSending || !messageContent.trim()}
                      className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {isSending ? 'Sending...' : 'Send'} <Send size={12} />
                    </button>
                  </div>
                </form>
              )}

              {messageSent && (
                <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800 text-sm font-medium text-center animate-in zoom-in">
                  Message sent successfully!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal 
          design={design} 
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(transaction) => {
            setShowPaymentModal(false);
            setPaymentSuccess(true);
          }}
        />
      )}
    </div>
  );
};

export default DesignViewModal;
