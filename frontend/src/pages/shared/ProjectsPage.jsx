import { useEffect, useState } from 'react';
import axios from 'axios';
import { FolderKanban, Eye, Search } from 'lucide-react';
import ProjectDetail from '../../components/projects/ProjectDetail';
import StatusBadge from '../../components/projects/StatusBadge';

const ProjectsPage = ({ title = 'Projects', subtitle = 'Track delivery progress' }) => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}` }
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      const [{ data }, { data: statsRes }] = await Promise.all([
        axios.get(`/api/projects?${params}`, authConfig()),
        axios.get('/api/projects/stats', authConfig())
      ]);
      setItems(data.data || []);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [status]);

  const filtered = items.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.design?.title?.toLowerCase().includes(q) ||
      p.client?.name?.toLowerCase().includes(q) ||
      p.engineer?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FolderKanban className="text-indigo-600" /> {title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active', value: stats.active },
            { label: 'Completed', value: stats.completed },
            { label: 'Revisions', value: stats.revisionRequests },
            { label: 'Avg Progress', value: `${stats.averageProgress}%` }
          ].map((c) => (
            <div key={c.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">{c.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm dark:text-white" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm dark:text-white">
          <option value="all">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="In Progress">In Progress</option>
          <option value="Revision Requested">Revision Requested</option>
          <option value="Completed - Waiting for Client Confirmation">Waiting Confirmation</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">Loading projects...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border">No projects found.</div>
        ) : filtered.map((item) => (
          <div key={item._id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-bold text-slate-900 dark:text-white truncate">{item.design?.title || 'Design'}</h3>
                <StatusBadge status={item.projectStatus} />
                {item.transaction?.paymentPlan === 'half' && item.transaction?.remainingStatus === 'pending' && (
                  <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    Tahy ${Number(item.transaction.amountRemaining || 0).toLocaleString()}
                  </span>
                )}
                {item.transaction?.paymentPlan === 'half' && item.transaction?.remainingStatus === 'paid' && (
                  <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    Tahy paid
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">Client: {item.client?.name} · Engineer: {item.engineer?.name}</p>
              <div className="mt-3 max-w-md">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1"><span>Progress</span><span>{item.progressPercentage}%</span></div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-600" style={{ width: `${item.progressPercentage}%` }} />
                </div>
              </div>
              {item.expectedCompletionDate && (
                <p className="text-xs text-slate-400 mt-2">Expected completion: {new Date(item.expectedCompletionDate).toLocaleDateString()}</p>
              )}
            </div>
            <button onClick={() => setSelectedId(item._id)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">
              <Eye size={16} /> Open
            </button>
          </div>
        ))}
      </div>

      {selectedId && (
        <ProjectDetail
          projectId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
