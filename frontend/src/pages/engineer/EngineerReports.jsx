import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Building, Activity, DollarSign, UploadCloud, MessageSquare, CheckCircle,
  XCircle, Clock, Calendar, Search, Download, FileText, FileSpreadsheet, Printer,
  ChevronLeft, ChevronRight, Eye, X, Home
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatHouseType } from '../../utils/houseType';

const EngineerReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('designs'); // designs, requests, bookings

  const [dateRange, setDateRange] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [globalSearch, setGlobalSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  const [selectedDesign, setSelectedDesign] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.get('/api/engineer/stats', config);
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.response?.data?.message || 'Failed to load analytics reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const isWithinDateRange = (createdAtString) => {
    if (!createdAtString) return false;
    const date = new Date(createdAtString);
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return date.toDateString() === now.toDateString();
      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return date.toDateString() === y.toDateString();
      }
      case '7days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 7);
        return date >= d;
      }
      case '30days': {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return date >= d;
      }
      case 'thismonth':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'thisyear':
        return date.getFullYear() === now.getFullYear();
      case 'custom': {
        const start = customStartDate ? new Date(customStartDate) : null;
        const end = customEndDate ? new Date(customEndDate) : null;
        if (start && end) { end.setHours(23, 59, 59, 999); return date >= start && date <= end; }
        if (start) return date >= start;
        if (end) return date <= end;
        return true;
      }
      default:
        return true;
    }
  };

  const paginate = (array) => {
    const sorted = [...array].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aVal = a[parts[0]]?.[parts[1]];
        bVal = b[parts[0]]?.[parts[1]];
      }
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = (dataList, filename) => {
    if (!dataList || dataList.length === 0) return;
    const headers = Object.keys(dataList[0]).filter(k => typeof dataList[0][k] !== 'object');
    let csvContent = headers.join(',') + '\n';
    dataList.forEach(item => {
      const row = headers.map(header => {
        let val = item[header];
        if (typeof val === 'string') val = `"${val.replace(/"/g, '""')}"`;
        return val !== undefined && val !== null ? val : '';
      });
      csvContent += row.join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${Date.now()}.csv`;
    link.click();
  };

  const exportToExcel = (dataList, filename) => exportToCSV(dataList, filename);
  const handlePrint = () => window.print();

  if (error) return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-red-500 dark:text-red-400 text-lg flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
        <Activity /> {error}
      </div>
    </div>
  );

  if (loading || !stats) return (
    <div className="p-6 space-y-6">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/3 animate-pulse"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>)}
      </div>
      <div className="h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
    </div>
  );

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const houseUploadTrend = months.map((m, idx) => ({
    name: m,
    Uploads: (stats.designGrowth || []).find(d => d._id === (idx + 1))?.count || 0
  }));
  const bookingTrend = months.map((m, idx) => ({
    name: m,
    Payments: (stats.bookingGrowth || []).find(d => d._id === (idx + 1))?.count || 0
  }));
  const earningsTrend = months.map((m, idx) => ({
    name: m,
    Earnings: (stats.earningsGrowth || []).find(d => d._id === (idx + 1))?.total || 0
  }));

  const summaryCards = [
    { title: 'Total House Designs', value: stats.totalDesigns || 0, icon: <Building size={18} />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
    { title: 'Total Floors', value: stats.totalApartments || 0, icon: <Home size={18} />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/30' },
    { title: 'Total Payments', value: stats.totalBookings || 0, icon: <Calendar size={18} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' },
    { title: 'Completed Projects', value: stats.totalPropertiesSold || 0, icon: <CheckCircle size={18} />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' },
    { title: 'Pending Requests', value: stats.pendingDesigns || 0, icon: <Clock size={18} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { title: 'Approved Designs', value: stats.approvedDesigns || 0, icon: <CheckCircle size={18} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { title: 'Rejected Designs', value: stats.rejectedDesigns || 0, icon: <XCircle size={18} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
    { title: 'Total Earnings', value: `$${(stats.totalEarnings || 0).toLocaleString()}`, icon: <DollarSign size={18} />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' }
  ];

  const filteredDesigns = (stats.myDesigns || []).filter(d => {
    if (!isWithinDateRange(d.createdAt)) return false;
    if (propertyTypeFilter !== 'All' && d.houseType?.toLowerCase() !== propertyTypeFilter.toLowerCase()) return false;
    if (statusFilter !== 'All' && d.status !== statusFilter) return false;
    if (globalSearch) return d.title?.toLowerCase().includes(globalSearch.toLowerCase());
    return true;
  });

  const filteredMessages = (stats.myMessages || []).filter(m => {
    if (!isWithinDateRange(m.createdAt)) return false;
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return m.sender?.name?.toLowerCase().includes(search) || m.content?.toLowerCase().includes(search);
    }
    return true;
  });

  const filteredTransactions = (stats.myTransactions || []).filter(t => {
    if (!isWithinDateRange(t.createdAt)) return false;
    if (statusFilter !== 'All' && t.paymentStatus !== statusFilter) return false;
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return t.buyer?.name?.toLowerCase().includes(search) || t.design?.title?.toLowerCase().includes(search);
    }
    return true;
  });

  const activeList = activeTab === 'designs' ? filteredDesigns : activeTab === 'requests' ? filteredMessages : filteredTransactions;
  const exportFilename = activeTab === 'designs' ? 'my_house_designs' : activeTab === 'requests' ? 'client_requests' : 'booking_history';

  return (
    <div className="space-y-8 print:bg-white print:p-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Building size={26} className="text-indigo-600 dark:text-indigo-400" /> Engineer Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your designs, payments, client requests and earnings performance.</p>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Activity size={14} /> Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.bg} ${card.color} mb-2`}>
              {card.icon}
            </div>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{card.value}</h4>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mt-0.5">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-3">House Upload Trend</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={houseUploadTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="Uploads" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-3">Payment Trend</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="Payments" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
          <h4 className="text-sm font-black text-slate-800 dark:text-white mb-3">Earnings Trend</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip formatter={(v) => `$${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="Earnings" stroke="#10b981" strokeWidth={3} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">

            {/* Tabs act as Report Type */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button onClick={() => { setActiveTab('designs'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'designs' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>My Designs</button>
              <button onClick={() => { setActiveTab('requests'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Client Requests</button>
              <button onClick={() => { setActiveTab('bookings'); setCurrentPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'bookings' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}>Payment History</button>
            </div>

            {/* Date Range */}
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="pl-10 pr-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="thisyear">This Year</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none" />
                <span className="text-slate-400 text-xs">-</span>
                <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none" />
              </div>
            )}

            {/* Property Type Filter */}
            {activeTab === 'designs' && (
              <select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none">
                <option value="All">All Property Types</option>
                <option value="villa">Villa</option>
                <option value="apartment">Floor</option>
                <option value="townhouse">Townhouse</option>
                <option value="commercial">Commercial</option>
              </select>
            )}

            {/* Status Filter */}
            {activeTab === 'designs' && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none">
                <option value="All">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            )}
            {activeTab === 'bookings' && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none">
                <option value="All">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            )}
          </div>

          {/* Search & Export */}
          <div className="flex gap-2 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-medium"
              />
            </div>
            <div className="relative group shrink-0">
              <button className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors flex items-center gap-1.5 text-xs font-bold" title="Export current view data">
                <Download size={16} /> Export
              </button>
              <div className="absolute right-0 top-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30 w-40">
                <button onClick={handlePrint} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg">
                  <Printer size={14} className="text-slate-500" /> Export PDF
                </button>
                <button onClick={() => exportToExcel(activeList, exportFilename)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg">
                  <FileSpreadsheet size={14} className="text-blue-500" /> Export Excel
                </button>
                <button onClick={() => exportToCSV(activeList, exportFilename)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg">
                  <FileText size={14} className="text-emerald-500" /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">

          {activeTab === 'designs' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4.5">Preview</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('title')}>Title</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('houseType')}>Type</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('price')}>Price</th>
                  <th className="px-6 py-4.5">Views / Favorites</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('status')}>Status</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Uploaded</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDesigns.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">No matching house designs found.</td></tr>
                ) : (
                  paginate(filteredDesigns).map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer" onClick={() => setSelectedDesign(d)}>
                      <td className="px-6 py-4">
                        {d.images && d.images.length > 0 ? (
                          <img src={d.images[0]} alt="preview" className="w-12 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-12 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">No Image</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm truncate max-w-[180px]">{d.title}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{formatHouseType(d.houseType)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">${(d.price || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-semibold">👁️ {d.views || 0} | ⭐ {d.favoritesCount || 0}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${d.status === 'approved' ? 'bg-green-100 text-green-700' : d.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedDesign(d)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="View details"><Eye size={14} /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'requests' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4.5">From</th>
                  <th className="px-6 py-4.5">Design</th>
                  <th className="px-6 py-4.5">Message</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMessages.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">No client requests found.</td></tr>
                ) : (
                  paginate(filteredMessages).map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{m.sender?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{m.designId?.title || 'General'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[260px]">{m.content}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${m.isRead ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{m.isRead ? 'Replied' : 'Pending'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'bookings' && (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4.5">Design</th>
                  <th className="px-6 py-4.5">Buyer</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('amountPaid')}>Amount Paid</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('engineerAmount')}>My Earnings</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">No payments found.</td></tr>
                ) : (
                  paginate(filteredTransactions).map((t) => (
                    <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                      <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{t.design?.title || 'Deleted design'}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{t.buyer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">${(t.amountPaid || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-bold text-emerald-600">${(t.engineerAmount || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${t.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : t.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.paymentStatus}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>

        {/* Pagination */}
        {activeList.length > 0 && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
            <span className="text-xs font-semibold text-slate-500">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, activeList.length)} of {activeList.length} entries
            </span>
            <div className="flex items-center gap-2">
              <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronLeft size={16} /></button>
              <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">{currentPage}</span>
              <button disabled={currentPage * pageSize >= activeList.length} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Design detail modal */}
      {selectedDesign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 dark:text-white">Design Details</h2>
              <button onClick={() => setSelectedDesign(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedDesign.images && selectedDesign.images.length > 0 ? (
                <img src={selectedDesign.images[0]} alt="House" className="w-full h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-800" />
              ) : (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold">No Image Available</div>
              )}
              <h3 className="text-xl font-black text-slate-800 dark:text-white">{selectedDesign.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Type</p><p className="text-sm font-black text-slate-800 dark:text-white">{formatHouseType(selectedDesign.houseType)}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Price</p><p className="text-sm font-black text-slate-800 dark:text-white">${(selectedDesign.price || 0).toLocaleString()}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Rooms</p><p className="text-sm font-black text-slate-800 dark:text-white">{selectedDesign.rooms}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Bathrooms</p><p className="text-sm font-black text-slate-800 dark:text-white">{selectedDesign.bathrooms}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Views</p><p className="text-sm font-black text-slate-800 dark:text-white">{selectedDesign.views || 0}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Favorites</p><p className="text-sm font-black text-slate-800 dark:text-white">{selectedDesign.favoritesCount || 0}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Status</p><p className="text-sm font-black capitalize text-indigo-500">{selectedDesign.status}</p></div>
                <div><p className="text-[10px] uppercase font-bold text-slate-400">Uploaded</p><p className="text-sm font-black text-slate-800 dark:text-white">{new Date(selectedDesign.createdAt).toLocaleDateString()}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EngineerReports;
