import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Ruler, Check, X, DollarSign, MessageSquare } from 'lucide-react';

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
};

const EngineerCustomisations = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [engineerNote, setEngineerNote] = useState('');
  const [responding, setResponding] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [quoting, setQuoting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/customizations/engineer', config);
      setItems(data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const respond = async (status) => {
    if (!selected) return;
    if (status === 'declined' && !engineerNote.trim()) {
      alert('Please write a reason for declining. The client will see this note.');
      return;
    }
    try {
      setResponding(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put(
        `/api/customizations/${selected._id}/respond`,
        { status, engineerNote },
        config
      );
      setSelected(data.data);
      setEngineerNote('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setResponding(false);
    }
  };

  const sendCustomPrice = async () => {
    if (!selected) return;
    const amount = Number(quoteAmount);
    if (!amount || amount <= 0) {
      alert('Enter a valid custom price.');
      return;
    }
    try {
      setQuoting(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.put(
        `/api/customizations/${selected._id}/quote`,
        { amount },
        config
      );
      setSelected(data.data);
      setQuoteAmount('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send custom price');
    } finally {
      setQuoting(false);
    }
  };

  const chatWithClient = () => {
    if (!selected?.client?._id) return;
    navigate('/engineer-dashboard/messages', {
      state: { partnerId: selected.client._id, partnerName: selected.client.name }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Ruler className="text-indigo-600" size={24} /> Customisation Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">Clients requesting changes to your designs (original designs stay unchanged).</p>
      </div>

      {loading ? (
        <p className="text-slate-500 animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : items.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500">
          No customisation requests yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setEngineerNote('');
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-colors ${
                  selected?._id === item._id
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.design?.title || item.originalSnapshot?.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      From {item.client?.name || 'Client'} · {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-1 h-fit rounded-full ${statusStyle[item.status] || statusStyle.pending}`}>
                    {item.status === 'paid' ? 'Paid' : item.status}
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 min-h-[320px]">
            {!selected ? (
              <p className="text-slate-500 text-sm text-center py-16">Select a request to review.</p>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {selected.design?.title || selected.originalSnapshot?.title}
                </h2>
                <p className="text-sm text-slate-500">Client: {selected.client?.name} ({selected.client?.email})</p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Original</p>
                    <p>{selected.originalSnapshot?.rooms} bed / {selected.originalSnapshot?.bathrooms} bath</p>
                    <p>{selected.originalSnapshot?.houseLength} × {selected.originalSnapshot?.houseWidth} m</p>
                  </div>
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40">
                    <p className="text-[10px] font-bold uppercase text-indigo-400 mb-1">Proposed</p>
                    <p>{selected.proposed?.rooms} bed / {selected.proposed?.bathrooms} bath</p>
                    <p>{selected.proposed?.houseLength} × {selected.proposed?.houseWidth} m ({selected.proposed?.houseArea} m²)</p>
                  </div>
                </div>

                {selected.proposed?.roomsDetail?.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Room</th>
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">m²</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selected.proposed.roomsDetail.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 font-medium">{r.name}</td>
                            <td className="px-3 py-2">{r.length}×{r.width}</td>
                            <td className="px-3 py-2">{r.area}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selected.note && (
                  <p className="text-sm italic text-slate-600 dark:text-slate-300 border-l-2 border-indigo-400 pl-3">{selected.note}</p>
                )}

                {selected.status === 'pending' ? (
                  <>
                    <textarea
                      rows={3}
                      value={engineerNote}
                      onChange={(e) => setEngineerNote(e.target.value)}
                      placeholder="Note to client (required if you Decline)..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[11px] text-slate-500">Decline requires a reason so the client can see why.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={responding}
                        onClick={() => respond('accepted')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        <Check size={16} /> Accept
                      </button>
                      <button
                        type="button"
                        disabled={responding}
                        onClick={() => respond('declined')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60"
                      >
                        <X size={16} /> Decline
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {selected.engineerNote && (
                      <p className="text-sm text-slate-500">Your note: {selected.engineerNote}</p>
                    )}
                    {selected.status === 'accepted' && (
                      <div className="space-y-2 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
                        <p className="text-xs font-bold text-indigo-600 uppercase">Set custom price in chat</p>
                        <p className="text-[11px] text-slate-500">
                          Original design price ${Number(selected.design?.price || 0).toFixed(2)} stays unchanged.
                        </p>
                        {selected.quotedPrice ? (
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            Current custom price: ${Number(selected.quotedPrice).toFixed(2)}
                            {selected.paymentStatus === 'awaiting_payment' ? ' · awaiting payment' : ''}
                          </p>
                        ) : null}
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={quoteAmount}
                            onChange={(e) => setQuoteAmount(e.target.value)}
                            placeholder="Amount USD"
                            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none"
                          />
                          <button
                            type="button"
                            disabled={quoting}
                            onClick={sendCustomPrice}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60"
                          >
                            <DollarSign size={14} /> {quoting ? 'Sending...' : 'Send'}
                          </button>
                        </div>
                      </div>
                    )}
                    {selected.status === 'paid' && (
                      <p className="text-sm font-bold text-emerald-600">
                        Paid ${Number(selected.quotedPrice || 0).toFixed(2)}
                      </p>
                    )}
                    {selected.client?._id && ['accepted', 'paid', 'declined'].includes(selected.status) && (
                      <button
                        type="button"
                        onClick={chatWithClient}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold"
                      >
                        <MessageSquare size={16} /> Open chat
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EngineerCustomisations;
