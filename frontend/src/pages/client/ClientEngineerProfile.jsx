import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, ArrowLeft, Eye, Layout, DollarSign, MessageSquare } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import DesignViewModal from '../../components/DesignViewModal';
import { formatHouseType } from '../../utils/houseType';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const ClientEngineerProfile = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [engineer, setEngineer] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const token = user?.token || JSON.parse(localStorage.getItem('userInfo') || '{}').token;
        const { data } = await axios.get(`/api/client/engineers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setEngineer(data.data.engineer);
          setDesigns(data.data.designs || []);
        } else {
          setError(data.message || 'Engineer not found');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load engineer profile');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id, user?.token]);

  const openChat = () => {
    navigate('/client-dashboard/messages', {
      state: {
        partnerId: engineer._id,
        partnerName: engineer.name
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-slate-500">{error}</div>
        ) : engineer ? (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 md:p-8 mb-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                <div className="shrink-0">
                  {engineer.profileImage ? (
                    <img
                      src={resolveMediaUrl(engineer.profileImage)}
                      alt={engineer.name}
                      className="w-24 h-24 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-800"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-3xl font-bold border border-indigo-200 dark:border-indigo-800">
                      {engineer.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{engineer.name}</h1>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        engineer.isAvailable
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {engineer.isAvailable ? '● Available' : '○ Away'}
                    </span>
                  </div>
                  {engineer.specialization && (
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                      {engineer.specialization}
                    </p>
                  )}
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                    {engineer.bio || 'No professional bio provided yet.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {engineer.workingHours || 'Standard hours'}
                    </span>
                    {engineer.ratingCount > 0 && (
                      <span>
                        {engineer.satisfactionRate}% satisfied · {engineer.ratingCount} review
                        {engineer.ratingCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span>{designs.length} design{designs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openChat}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                  >
                    <MessageSquare size={16} /> Message engineer
                  </button>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Approved designs</h2>
            {designs.length === 0 ? (
              <p className="text-sm text-slate-500 py-8">No approved designs yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {designs.map((design) => (
                  <div
                    key={design._id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 relative">
                      {design.images?.[0] ? (
                        <img
                          src={resolveMediaUrl(design.images[0])}
                          alt={design.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Layout size={32} />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white truncate">{design.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">{formatHouseType(design.houseType)}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 dark:border-slate-700">
                        <span className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                          <DollarSign size={14} />
                          {Number(design.budgetEstimate || design.price || 0).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedDesign({ ...design, engineer })}
                          className="flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                        >
                          View <Eye size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {selectedDesign && (
        <DesignViewModal design={selectedDesign} onClose={() => setSelectedDesign(null)} />
      )}
    </div>
  );
};

export default ClientEngineerProfile;
