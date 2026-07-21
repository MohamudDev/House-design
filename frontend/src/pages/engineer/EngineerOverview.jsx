import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, MessageSquare, DollarSign, Wallet, Building, Activity, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const EngineerOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError(error.response?.data?.message || 'Failed to load dashboard data');
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

  if (error) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-red-500 dark:text-red-400 text-lg flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <AlertCircle /> {error}
      </div>
    </div>
  );

  if (loading || !stats) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-slate-500 dark:text-slate-400 animate-pulse text-lg flex items-center gap-2">
        <Activity className="animate-spin" /> Loading dashboard...
      </div>
    </div>
  );

  const overviewCards = [
    { title: 'Total Uploaded', value: stats.totalDesigns || 0, icon: <UploadCloud size={24} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { title: 'Active Properties', value: stats.activeProperties || 0, icon: <CheckCircle size={24} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { title: 'Pending Approval', value: stats.pendingDesigns || 0, icon: <Clock size={24} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { title: 'Messages Received', value: stats.messagesReceived || 0, icon: <MessageSquare size={24} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome to your workspace</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-transform hover:-translate-y-1">
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

      {stats.rejectedDesigns > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-4 text-red-800 dark:text-red-300">
          <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
          <div>
            <p className="font-semibold">Action Required</p>
            <p className="text-sm">You have {stats.rejectedDesigns} design(s) that were rejected by the admin. Please review them.</p>
          </div>
        </div>
      )}

      {/* Wallet Section */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-black dark:to-slate-900 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Wallet size={32} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-indigo-200 font-medium mb-1">Available Wallet Balance</p>
            <h3 className="text-3xl md:text-4xl font-bold">${(stats.walletBalance || 0).toLocaleString()}</h3>
            <p className="text-sm text-indigo-200 mt-2 flex items-center gap-2">
              <TrendingUp size={14} /> Total Lifetime Earnings: ${(stats.totalEarnings || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <button 
          onClick={handleWithdraw}
          disabled={stats.walletBalance <= 0}
          className="mt-6 md:mt-0 px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transform active:scale-[0.98]"
        >
          Withdraw Funds
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 transition-colors">
        <UploadCloud size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Ready to showcase your work?</h3>
        <p className="max-w-md mx-auto mb-6">Upload your latest 3D models and floor plans to get them approved and featured in our global gallery.</p>
        <Link to="/engineer-dashboard/upload" className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          Upload New Design
        </Link>
      </div>

    </div>
  );
};

export default EngineerOverview;
