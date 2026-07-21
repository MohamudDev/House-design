import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Link } from 'react-router-dom';
import { Filter, Calendar, Users, FolderOpen, TrendingUp, Clock, UserCheck, Shield, DollarSign, CheckCircle, HelpCircle, AlertTriangle, Building } from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        const { data } = await axios.get('/api/admin/reports', config);
        setData(data.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );



  // Format data for growth chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Merge months from both datasets
  const allMonthIds = Array.from(new Set([
    ...(data?.userGrowth || []).map(i => i._id),
    ...(data?.designGrowth || []).map(i => i._id)
  ])).sort((a, b) => a - b);

  const growthData = allMonthIds.map(monthId => ({
    name: months[monthId - 1],
    Users: data.userGrowth.find(u => u._id === monthId)?.count || 0,
    Designs: data.designGrowth.find(d => d._id === monthId)?.count || 0
  }));

  const roleData = (data?.roleStats || []).map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  }));

  const statusData = (data?.statusStats || []).map(item => ({
    name: item._id.charAt(0).toUpperCase() + item._id.slice(1),
    value: item.count
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Insights into user growth and design performance.</p>
        </div>
      </div>

      {/* Main Content Area to Export */}
      <div id="report-content" className="space-y-8 bg-slate-50 dark:bg-slate-900 p-4 -m-4 rounded-xl transition-colors">
        
        {/* Full Statistics Summary Cards */}
        {data?.fullStats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                <Users size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Clients</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalClients}</h4>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <UserCheck size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Engineers</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalEngineers}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2">
                <Shield size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Admins</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalAdmins}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                <FolderOpen size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Designs</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalDesigns}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sold Designs</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalSoldDesigns}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 flex items-center justify-center mb-2">
                <Building size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Unsold Designs</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.totalUnsoldDesigns}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
                <DollarSign size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sales</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">${data.fullStats.totalSales.toLocaleString()}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-2">
                <TrendingUp size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Admin Commission</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">${data.fullStats.totalCommission.toLocaleString()}</h4>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-2">
                <AlertTriangle size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Complaints</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.pendingComplaints}</h4>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-2">
                <HelpCircle size={20} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending Withdrawals</p>
              <h4 className="text-xl font-bold text-slate-800 dark:text-white">{data.fullStats.pendingWithdrawals}</h4>
            </div>
          </div>
        )}

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Growth Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Growth Overview</h3>
            </div>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 py-1.5 px-3 focus:ring-2 focus:ring-indigo-200 outline-none"
            >
              <option value="6months">Last 6 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Line type="monotone" dataKey="Users" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} isAnimationActive={false} />
                <Line type="monotone" dataKey="Designs" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Distribution */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Users size={18} className="text-indigo-500 dark:text-indigo-400" /> User Roles
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {roleData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Design Distribution */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FolderOpen size={18} className="text-emerald-500 dark:text-emerald-400" /> Design Status
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[(idx + 2) % COLORS.length]}}></div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-amber-500 dark:text-amber-400" /> Recent Users
            </h3>
            <Link to="/admin-dashboard/users" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {data?.recentUsers.map((user, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 uppercase">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        user.role === 'engineer' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Designs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar size={18} className="text-indigo-500 dark:text-indigo-400" /> Recent Uploads
            </h3>
            <Link to="/admin-dashboard/designs" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider">View All</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                <tr>
                  <th className="px-6 py-3">Design</th>
                  <th className="px-6 py-3">Engineer</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {data?.recentDesigns.map((design, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[150px]">{design.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{design.houseType}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {design.engineer?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        design.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 
                        design.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {design.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminReports;
