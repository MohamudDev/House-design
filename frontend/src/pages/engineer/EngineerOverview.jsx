import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Clock, CheckCircle, MessageSquare } from 'lucide-react';

const EngineerOverview = () => {
  const [stats, setStats] = useState({
    totalDesigns: 0,
    pendingDesigns: 0,
    approvedDesigns: 0,
    messagesReceived: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/engineer/stats', config);
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
    { title: 'Total Uploaded', value: stats.totalDesigns, icon: <UploadCloud size={24} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { title: 'Pending Approval', value: stats.pendingDesigns, icon: <Clock size={24} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Approved Designs', value: stats.approvedDesigns, icon: <CheckCircle size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Messages', value: stats.messagesReceived, icon: <MessageSquare size={24} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center text-slate-500">
        <UploadCloud size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Ready to showcase your work?</h3>
        <p className="max-w-md mx-auto mb-6">Upload your latest 3D models and floor plans to get them approved and featured in our global gallery.</p>
      </div>
    </div>
  );
};

export default EngineerOverview;
