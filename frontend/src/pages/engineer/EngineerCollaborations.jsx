import { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, FolderKanban, Eye } from 'lucide-react';
import CollaborationDetail from '../../components/collaboration/CollaborationDetail';

const statusColor = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Closed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const EngineerCollaborations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const authConfig = () => ({ headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}` } });

  const fetchList = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const { data } = await axios.get(`/api/collaborations?${params}`, authConfig());
      setItems(data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchList(); }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><FolderKanban className="text-indigo-600" /> My Collaborations</h1>
        <p className="text-slate-500 text-sm mt-1">Conversations started from your designs</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchList()} placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm dark:text-white" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm dark:text-white">
          <option value="all">All</option><option value="Active">Active</option><option value="Completed">Completed</option><option value="Closed">Closed</option>
        </select>
        <button onClick={fetchList} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold">Search</button>
      </div>
      <div className="grid gap-4">
        {loading ? <div className="p-10 text-center text-slate-500 animate-pulse">Loading...</div> : items.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border">No collaborations yet.</div>
        ) : items.map((item) => (
          <div key={item._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white">{item.design?.title || 'Design'}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor[item.status]}`}>{item.status}</span>
              </div>
              <p className="text-sm text-slate-500">Client: {item.client?.name}</p>
            </div>
            <button onClick={() => setSelectedId(item._id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"><Eye size={16} /> Open</button>
          </div>
        ))}
      </div>
      {selectedId && <CollaborationDetail collaborationId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
};

export default EngineerCollaborations;
