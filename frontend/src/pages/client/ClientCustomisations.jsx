import { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ruler, XCircle, MessageSquare } from 'lucide-react';
import ClientNavbar from '../../components/client/ClientNavbar';
import ClientWorkspaceNav from '../../components/client/ClientWorkspaceNav';
import { AuthContext } from '../../context/AuthContext';
import { getApiBaseUrl } from '../../utils/apiBase';

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
};

const ClientCustomisations = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [openingChat, setOpeningChat] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/customizations/mine', config);
      setItems(data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load customisations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this pending request?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.put(`/api/customizations/${id}/cancel`, {}, config);
      await load();
      setSelected(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    }
  };

  const chatWithEngineer = async () => {
    if (!selected?.engineer?._id) {
      alert('Engineer not found for this request.');
      return;
    }
    try {
      setOpeningChat(true);
      const token = user?.token || JSON.parse(localStorage.getItem('userInfo') || '{}').token;
      if (selected.design?._id) {
        await fetch(`${getApiBaseUrl()}/api/collaborations/ensure`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            designId: selected.design._id,
            engineerId: selected.engineer._id
          })
        });
      }
      navigate('/client-dashboard/messages', {
        state: {
          partnerId: selected.engineer._id,
          partnerName: selected.engineer.name
        }
      });
    } catch (err) {
      console.error(err);
      navigate('/client-dashboard/messages', {
        state: { partnerId: selected.engineer._id, partnerName: selected.engineer.name }
      });
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <ClientNavbar variant="workspace" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <ClientWorkspaceNav />
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ruler className="text-indigo-600" size={24} /> My Customisations
          </h1>
          <p className="text-sm text-slate-500 mt-1">Requests you sent to engineers for design changes.</p>
        </div>

        {loading ? (
          <p className="text-slate-500 animate-pulse">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
            No customisations yet.{' '}
            <Link to="/client-dashboard" className="text-indigo-600 font-bold hover:underline">
              Browse designs
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setSelected(item)}
                className="w-full text-left p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {item.design?.title || item.originalSnapshot?.title || 'Design'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {item.proposed?.houseLength} × {item.proposed?.houseWidth} m ({item.proposed?.houseArea} m²) ·{' '}
                      {item.proposed?.rooms || 0} bed · {item.proposed?.bathrooms || 0} bath ·{' '}
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${statusStyle[item.status]}`}>
                    {item.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <div
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    {selected.design?.title || selected.originalSnapshot?.title}
                  </h2>
                  <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${statusStyle[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <button type="button" onClick={() => setSelected(null)} className="p-2 text-slate-400 hover:text-slate-700">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs font-bold uppercase text-slate-400 mb-2">Original</p>
                  <p>{selected.originalSnapshot?.rooms} bed · {selected.originalSnapshot?.bathrooms} bath</p>
                  <p className="mt-1">
                    {selected.originalSnapshot?.houseLength} × {selected.originalSnapshot?.houseWidth} m
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
                  <p className="text-xs font-bold uppercase text-indigo-400 mb-2">Proposed</p>
                  <p>{selected.proposed?.rooms} bed · {selected.proposed?.bathrooms} bath</p>
                  <p className="mt-1">
                    {selected.proposed?.houseLength} × {selected.proposed?.houseWidth} m ({selected.proposed?.houseArea} m²)
                  </p>
                </div>
              </div>

              {selected.proposed?.roomsDetail?.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Room</th>
                        <th className="px-3 py-2">Size</th>
                        <th className="px-3 py-2">Area</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selected.proposed.roomsDetail.map((r, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100">{r.name}</td>
                          <td className="px-3 py-2 text-slate-500">{r.length} × {r.width} m</td>
                          <td className="px-3 py-2">{r.area} m²</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selected.note && (
                <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-2 border-indigo-400 pl-3">{selected.note}</p>
              )}

              {selected.engineerNote && (
                <div className="space-y-3">
                  <div
                    className={`rounded-xl border-l-4 p-3 ${
                      selected.status === 'declined'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10'
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      {selected.status === 'declined' ? 'Decline reason' : 'Engineer note'}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{selected.engineerNote}</p>
                  </div>
                  <button
                    type="button"
                    disabled={openingChat}
                    onClick={chatWithEngineer}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60"
                  >
                    <MessageSquare size={16} />
                    {openingChat ? 'Opening...' : 'Chat with eng'}
                  </button>
                </div>
              )}

              {!selected.engineerNote && selected.status === 'declined' && (
                <p className="text-sm text-red-600 dark:text-red-400 border-l-4 border-red-500 pl-3">
                  This request was declined. No reason was provided.
                </p>
              )}

              {!selected.engineerNote && ['accepted'].includes(selected.status) && selected.engineer?._id && (
                <button
                  type="button"
                  disabled={openingChat}
                  onClick={chatWithEngineer}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-60"
                >
                  <MessageSquare size={16} />
                  {openingChat ? 'Opening...' : 'Chat with eng'}
                </button>
              )}

              {selected.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => cancel(selected._id)}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600"
                >
                  Cancel request
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientCustomisations;
