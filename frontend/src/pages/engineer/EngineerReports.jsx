import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye, Heart, TrendingUp, Building, Activity, DollarSign, UploadCloud, MessageSquare, CheckCircle, Mail, Reply, HelpCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const EngineerReports = () => {
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
        setError(error.response?.data?.message || 'Failed to load analytics reports');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (error) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-red-500 dark:text-red-400 text-lg flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <Activity /> {error}
      </div>
    </div>
  );

  if (loading || !stats) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-slate-500 dark:text-slate-400 animate-pulse text-lg flex items-center gap-2">
        <Activity className="animate-spin" /> Loading analytics reports...
      </div>
    </div>
  );

  const salesPercentage = stats.totalDesigns > 0 ? Math.round(((stats.totalPropertiesSold || 0) / stats.totalDesigns) * 100) : 0;
  const replyRate = stats.messagesReceived > 0 ? Math.round(((stats.totalMessagesReplied || 0) / stats.messagesReceived) * 100) : 0;

  const propertyCards = [
    { title: 'Total Uploaded', value: stats.totalDesigns || 0, icon: <UploadCloud size={20} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { title: 'Active Properties', value: stats.activeProperties || 0, icon: <CheckCircle size={20} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { title: 'Total Sold', value: stats.totalPropertiesSold || 0, icon: <DollarSign size={20} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { title: 'Total Unsold', value: stats.totalUnsoldProperties || 0, icon: <Building size={20} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' }
  ];

  const communicationCards = [
    { title: 'Messages Received', value: stats.messagesReceived || 0, icon: <Mail size={20} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
    { title: 'Messages Replied', value: stats.totalMessagesReplied || 0, icon: <Reply size={20} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { title: 'Pending Replies', value: stats.totalPendingReplies || 0, icon: <HelpCircle size={20} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Detailed performance insights for your portfolio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Reports Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <Building size={18} /> Property Reports
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {propertyCards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{card.value}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{card.title}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Communication Reports Section */}
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
            <MessageSquare size={18} /> Communication Reports
          </h2>
          <div className="space-y-4">
            {communicationCards.map((card, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                    {card.icon}
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{card.title}</span>
                </div>
                <span className="text-xl font-bold text-slate-900 dark:text-white">{card.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Sales Conversion</span>
            <span className="font-bold text-green-600 dark:text-green-400">{salesPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${salesPercentage}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stats.totalPropertiesSold || 0} out of {stats.totalDesigns || 0} properties sold</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Message Reply Rate</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{replyRate}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${replyRate}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{stats.totalMessagesReplied || 0} out of {stats.messagesReceived || 0} messages replied</p>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <TrendingUp size={18} /> Views & Favorites
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.propertyPerformance || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="title" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend iconType="circle" />
              <Bar dataKey="views" name="Total Views" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="favorites" name="Total Favorites" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Performance Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Building size={18} /> Property Performance</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Property Name</th>
                  <th className="px-4 py-3 font-medium text-center"><Eye size={16} className="inline mr-1" /> Views</th>
                  <th className="px-4 py-3 font-medium text-center"><Heart size={16} className="inline mr-1" /> Faves</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {stats.propertyPerformance && stats.propertyPerformance.length > 0 ? stats.propertyPerformance.map(prop => (
                  <tr key={prop._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{prop.title}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{prop.views}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">{prop.favorites}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${prop.status === 'Sold' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {prop.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No properties uploaded yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Activity size={18} /> Recent Activities</h2>
          </div>
          <div className="p-2 flex-1 overflow-y-auto max-h-[300px]">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-1">
                {stats.recentActivities.map((act, i) => (
                  <div key={i} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg flex items-start gap-3 transition-colors">
                    <div className={`mt-0.5 p-2 rounded-full ${act.type === 'sale' ? 'bg-green-100 text-green-600' : act.type === 'message' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {act.type === 'sale' ? <DollarSign size={14} /> : act.type === 'message' ? <MessageSquare size={14} /> : <UploadCloud size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {act.type === 'sale' ? `Sale completed for ${act.title || 'a property'}` : 
                         act.type === 'upload' ? `Uploaded new design: ${act.title}` : 
                         `New message received`}
                      </p>
                      {act.type === 'sale' && <p className="text-xs font-bold text-green-600 mt-0.5">+${act.amount}</p>}
                      <p className="text-xs text-slate-400 mt-1">{new Date(act.date).toLocaleDateString()} at {new Date(act.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-8 text-center text-slate-500">No recent activities</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineerReports;
