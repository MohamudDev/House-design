import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, User, FolderOpen, CheckCircle, XCircle } from 'lucide-react';

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEngineers: 0,
    totalClients: 0,
    designsPending: 0,
    designsApproved: 0,
    designsRejected: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/admin/stats', config);
        setStats(data.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-slate-500 animate-pulse">Loading dashboard data...</div>;

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: <Users size={24} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Total Engineers', value: stats.totalEngineers, icon: <UserCheck size={24} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { title: 'Total Clients', value: stats.totalClients, icon: <User size={24} />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    { title: 'Designs Pending', value: stats.designsPending, icon: <FolderOpen size={24} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Designs Approved', value: stats.designsApproved, icon: <CheckCircle size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Designs Rejected', value: stats.designsRejected, icon: <XCircle size={24} />, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-white p-6 rounded-2xl shadow-sm border ${card.border} flex items-center gap-4 transition-transform hover:-translate-y-1`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-900">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
