import { useEffect, useState } from 'react';
import axios from 'axios';
import { Ruler, Check, X } from 'lucide-react';

const statusStyle = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
};

const EngineerCustomisations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [engineerNote, setEngineerNote] = useState('');
  const [responding, setResponding] = useState(false);

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
                  <span className={`text-[10px] font-black uppercase px-2 py-1 h-fit rounded-full ${statusStyle[item.status]}`}>
                    {item.status}
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
                      rows={2}
                      value={engineerNote}
                      onChange={(e) => setEngineerNote(e.target.value)}
                      placeholder="Optional note to client..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-600"
                    />
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
                  selected.engineerNote && (
                    <p className="text-sm text-slate-500">Your note: {selected.engineerNote}</p>
                  )
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
