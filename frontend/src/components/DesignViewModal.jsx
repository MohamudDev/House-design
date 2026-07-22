import { X, Box, Info, DollarSign, Layout, Clock, AlertTriangle, MessageSquare, Send, ShoppingCart, MapPin, Building } from 'lucide-react';
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import ModelViewer from './ModelViewer';
import PaymentModal from './client/PaymentModal';

const DesignViewModal = ({ design: initialDesign, onClose }) => {
  const { user } = useContext(AuthContext);
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [viewMode, setViewMode] = useState('model');
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);

  const [currentDesign, setCurrentDesign] = useState(initialDesign);
  const [ratingsList, setRatingsList] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  const design = currentDesign;

  useEffect(() => {
    setCurrentDesign(initialDesign);
  }, [initialDesign]);

  useEffect(() => {
    const fetchDesignDetails = async () => {
      try {
        if (!initialDesign || !initialDesign._id) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/client/designs/${initialDesign._id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentDesign(data.data);
          if (data.data.ratings) {
            setRatingsList(data.data.ratings);
          }
        }
      } catch (err) {
        console.error('Failed to fetch design details:', err);
      }
    };

    fetchDesignDetails();
  }, [initialDesign, user]);

  const handleRateDesign = async (e) => {
    e.preventDefault();
    if (userRating < 1 || userRating > 5 || !userComment.trim()) return;

    try {
      setSubmittingRating(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/client/designs/${design._id}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          rating: userRating,
          comment: userComment
        })
      });

      if (res.ok) {
        const data = await res.json();
        setRatingsList(data.ratings);
        setUserComment('');
        setUserRating(0);
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Network error occurred');
    } finally {
      setSubmittingRating(false);
    }
  };

  if (!design) return null;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;

    try {
      setIsSending(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/messages`, {
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
        
        {/* Left Side: 3D Viewer / Interior */}
        <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-800 relative h-[450px] md:min-h-[550px] flex flex-col">
          {viewMode === 'model' ? (
            <div className="flex-1 relative w-full h-full">
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
            </div>
          ) : (
            <div className="flex-1 relative bg-black flex flex-col overflow-hidden">
              {design.interiorGallery && design.interiorGallery.length > 0 && design.interiorGallery[currentRoomIndex] ? (
                <>
                  <img 
                    src={design.interiorGallery[currentRoomIndex].image} 
                    alt={design.interiorGallery[currentRoomIndex].roomName}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/800x600?text=Image+Unavailable'; }}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md text-white p-4 flex justify-between items-center">
                    <button 
                      onClick={() => setCurrentRoomIndex(prev => Math.max(0, prev - 1))} 
                      disabled={currentRoomIndex === 0}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Previous
                    </button>
                    <div className="text-center max-w-[50%]">
                      <h4 className="font-bold text-lg">{design.interiorGallery[currentRoomIndex].roomName}</h4>
                      {design.interiorGallery[currentRoomIndex].description && (
                        <p className="text-xs text-slate-300 mt-1 truncate">{design.interiorGallery[currentRoomIndex].description}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setCurrentRoomIndex(prev => Math.min(design.interiorGallery.length - 1, prev + 1))} 
                      disabled={currentRoomIndex === design.interiorGallery.length - 1}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next Room →
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">No interior images available.</div>
              )}
            </div>
          )}

          {design.interiorGallery && design.interiorGallery.length > 0 && (
            <div className="absolute top-6 right-6 z-10 flex gap-2">
              <button 
                onClick={() => setViewMode('model')} 
                className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-colors ${viewMode === 'model' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                3D Exterior
              </button>
              <button 
                onClick={() => setViewMode('interior')} 
                className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg transition-colors ${viewMode === 'interior' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                Explore Interior
              </button>
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
              {design.houseType === 'Apartment' ? (
                <>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <MapPin size={14} />
                      <span className="text-xs font-semibold uppercase tracking-tight">Location</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.location || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Building size={14} />
                      <span className="text-xs font-semibold uppercase tracking-tight">Floors</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.numberOfFloors || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                      <Layout size={14} />
                      <span className="text-xs font-semibold uppercase tracking-tight">Total Units</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{design.totalUnits || 'N/A'}</p>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
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

            {design.houseType === 'Apartment' && design.units && design.units.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Apartment Units</h3>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {design.units.map((unit, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400">{unit.unitName}</h4>
                        <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                          {unit.floorNumber}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Area</span>
                          <span className="font-medium">{unit.area} sq m</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Bedrooms</span>
                          <span className="font-medium">{unit.bedrooms}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Bathrooms</span>
                          <span className="font-medium">{unit.bathrooms}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Kitchens</span>
                          <span className="font-medium">{unit.kitchens}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Living Rooms</span>
                          <span className="font-medium">{unit.livingRooms}</span>
                        </div>
                        {(unit.diningRooms > 0 || unit.balconies > 0) && (
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Extras</span>
                            <span className="font-medium">
                              {unit.diningRooms > 0 ? `${unit.diningRooms} Dining ` : ''}
                              {unit.balconies > 0 ? `${unit.balconies} Balcony` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parking Information Section */}
            {design.carParking && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Parking Information</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Parking Type</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{design.parkingType || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Location</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{design.parkingLocation || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Total Spaces</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{design.totalParkingSpaces || 'Not specified'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500">Visitor Parking</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{design.visitorParking ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                  
                  {design.vehicleType && design.vehicleType.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-2">Supported Vehicles</span>
                      <div className="flex flex-wrap gap-2">
                        {design.vehicleType.map(v => (
                          <span key={v} className="bg-white dark:bg-slate-900 text-xs font-semibold px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {design.parkingDescription && (
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 block mb-1">Additional Details</span>
                      <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{design.parkingDescription}"</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ratings & Reviews Section */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Ratings & Reviews</h3>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">
                  ★ {ratingsList.length > 0 ? (ratingsList.reduce((acc, r) => acc + r.rating, 0) / ratingsList.length).toFixed(1) : '0.0'} ({ratingsList.length})
                </span>
              </div>

              {/* Reviews List */}
              <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {ratingsList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No ratings yet for this design.</p>
                ) : (
                  ratingsList.map((r, index) => (
                    <div key={index} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {r.user?.name || 'Anonymous User'}
                        </span>
                        <div className="flex text-amber-500 text-[10px]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < r.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{r.comment}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Submit Review Form (Clients only) */}
              {user?.role === 'client' && (
                <form onSubmit={handleRateDesign} className="space-y-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setUserRating(star)}
                          className={`text-lg transition-colors ${star <= userRating ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Write a comment..."
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={submittingRating || userRating === 0 || !userComment.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      Rate
                    </button>
                  </div>
                </form>
              )}
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
