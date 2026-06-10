import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, Clock, CheckCircle, MessageSquare, XCircle, DollarSign, Wallet } from 'lucide-react';

const EngineerOverview = () => {
  const [stats, setStats] = useState({
    totalDesigns: 0,
    pendingDesigns: 0,
    approvedDesigns: 0,
    rejectedDesigns: 0,
    messagesReceived: 0,
    totalEarnings: 0,
    walletBalance: 0
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

  const handleWithdraw = async () => {
    if (stats.walletBalance <= 0) return alert('No funds to withdraw.');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/engineer/withdraw', { amount: stats.walletBalance }, config);
      alert('Withdrawal requested successfully!');
      setStats({ ...stats, walletBalance: 0 });
    } catch (err) {
      alert(err.response?.data?.message || 'Error requesting withdrawal');
    }
  };

  if (loading) return <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading dashboard data...</div>;

  const statCards = [
    { title: 'Total Uploaded', value: stats.totalDesigns, icon: <UploadCloud size={24} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-100 dark:border-indigo-800' },
    { title: 'Pending Approval', value: stats.pendingDesigns, icon: <Clock size={24} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' },
    { title: 'Approved Designs', value: stats.approvedDesigns, icon: <CheckCircle size={24} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' },
    { title: 'Rejected Designs', value: stats.rejectedDesigns, icon: <XCircle size={24} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-100 dark:border-red-800' },
    { title: 'Total Earnings', value: `$${(stats.totalEarnings || 0).toLocaleString()}`, icon: <DollarSign size={24} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', border: 'border-green-100 dark:border-green-800' },
    { title: 'Wallet Balance', value: `$${(stats.walletBalance || 0).toLocaleString()}`, icon: <Wallet size={24} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border ${card.border} flex items-center gap-4 transition-transform hover:-translate-y-1`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 transition-colors mb-6">
        <UploadCloud size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Ready to showcase your work?</h3>
        <p className="max-w-md mx-auto mb-6">Upload your latest 3D models and floor plans to get them approved and featured in our global gallery.</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Available Wallet Balance: ${stats.walletBalance.toLocaleString()}</h3>
          <p className="text-indigo-100">Withdraw your earnings directly to your mobile money account.</p>
        </div>
        <button 
          onClick={handleWithdraw}
          disabled={stats.walletBalance <= 0}
          className="mt-6 md:mt-0 px-8 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Withdraw All Funds
        </button>
      </div>
    </div>
  );
};

export default EngineerOverview;
