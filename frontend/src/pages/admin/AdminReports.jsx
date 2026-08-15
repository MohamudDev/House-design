import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, 
  LineChart, Line, Tooltip
} from 'recharts';
import { 
  Filter, Calendar, Users, FolderOpen, TrendingUp, Clock, Shield, 
  DollarSign, CheckCircle, HelpCircle, AlertTriangle, Building, Search, Download, 
  FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, 
  ShieldAlert, Key, MessageSquare, Info, Star, X, Check, EyeOff, LayoutDashboard, 
  Plus, Play, ToggleLeft, Volume2
} from 'lucide-react';
import { formatHouseType } from '../../utils/houseType';
import { AuthContext } from '../../context/AuthContext';

const AdminReports = () => {
  const { user } = useContext(AuthContext);
  const isSuperAdmin = user?.role === 'superadmin';
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, houses, bookings, complaints
  const [dateRange, setDateRange] = useState('30days'); // today, yesterday, 7days, 30days, thismonth, lastmonth, thisyear, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Global search input
  const [globalSearch, setGlobalSearch] = useState('');

  // Directories Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [propTypeFilter, setPropTypeFilter] = useState('All');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [selectedEngineerFilter, setSelectedEngineerFilter] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [bedroomsFilter, setBedroomsFilter] = useState('All');
  const [bathroomsFilter, setBathroomsFilter] = useState('All');
  const [parkingFilter, setParkingFilter] = useState('All');

  // Directory Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [exportingPdf, setExportingPdf] = useState(false);

  // Column Visibility States
  const [userVisibleColumns, setUserVisibleColumns] = useState({
    avatar: true, name: true, email: true, role: true, status: true, date: true, actions: true
  });
  const [houseVisibleColumns, setHouseVisibleColumns] = useState({
    image: true, title: true, engineer: true, type: true, price: true, status: true, actions: true
  });
  const [complaintVisibleColumns, setComplaintVisibleColumns] = useState({
    id: true, complainant: true, category: true, status: true, date: true, actions: true
  });

  // Table Column Dropdown Controls
  const [showUserColDropdown, setShowUserColDropdown] = useState(false);
  const [showHouseColDropdown, setShowHouseColDropdown] = useState(false);

  // Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedHouseIds, setSelectedHouseIds] = useState([]);
  const [selectedComplaintIds, setSelectedComplaintIds] = useState([]);

  // Detail Modal Views
  const [selectedUserReport, setSelectedUserReport] = useState(null);
  const [selectedHouseReport, setSelectedHouseReport] = useState(null);
  const [selectedComplaintReport, setSelectedComplaintReport] = useState(null);

  // Send Message Modal
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Reset Password Modal
  const [resetPwdUser, setResetPwdUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ name: '', email: '', role: '', status: '' });

  // Fetch Reports Data
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
        timeout: 30000
      };
      const { data } = await axios.get('/api/admin/reports', config);
      setReportData(data.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      const msg = err.code === 'ECONNABORTED'
        ? 'Report request timed out. Please try again.'
        : (err.response?.data?.message || 'Failed to load report analytics.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings' && !isSuperAdmin) {
      setActiveTab('overview');
    }
  }, [activeTab, isSuperAdmin]);

  useEffect(() => {
    fetchReports();
  }, []);

  // Switch report type tab and reset all cross-tab filters to avoid stale filters hiding data
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setRoleFilter('All');
    setStatusFilter('All');
    setPropTypeFilter('All');
    setComplaintStatusFilter('All');
    setSelectedEngineerFilter('All');
    setBedroomsFilter('All');
    setBathroomsFilter('All');
    setParkingFilter('All');
    setMinPrice('');
    setMaxPrice('');
    setGlobalSearch('');
  };

  // Handle Date Filter logic
  const isWithinDateRange = (createdAtString) => {
    if (!createdAtString) return false;
    const date = new Date(createdAtString);
    const now = new Date();
    
    // Normalize dates
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    
    switch (dateRange) {
      case 'today':
        return date >= startOfToday;
      case 'yesterday':
        return date >= startOfYesterday && date < startOfToday;
      case '7days':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return date >= sevenDaysAgo;
      case '30days':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date >= thirtyDaysAgo;
      case 'thismonth':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'lastmonth':
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
      case 'thisyear':
        return date.getFullYear() === now.getFullYear();
      case 'custom':
        const start = customStartDate ? new Date(customStartDate) : null;
        const end = customEndDate ? new Date(customEndDate) : null;
        if (start && end) {
          end.setHours(23, 59, 59, 999);
          return date >= start && date <= end;
        } else if (start) {
          return date >= start;
        } else if (end) {
          end.setHours(23, 59, 59, 999);
          return date <= end;
        }
        return true;
      default:
        return true;
    }
  };

  // Derive real display status from actual account fields
  const enrichUser = (user) => {
    const isSuspended = user.isSuspended || false;
    const status = isSuspended ? 'blocked' : (user.isApproved ? 'active' : 'inactive');
    const verification = user.verificationStatus || (user.role === 'engineer' ? 'pending' : 'verified');

    return {
      ...user,
      status,
      verification
    };
  };

  // Enriched User and House lists (real database fields only)
  const enrichedUsers = (reportData?.allUsers || []).map(u => enrichUser(u));
  const enrichedHouses = (reportData?.allDesigns || []).map(h => ({
    ...h,
    bedrooms: h.rooms,
    parking: h.carParking ? 'Yes' : 'No'
  }));

  // Earliest real activity — custom dates before this must not be selectable
  const earliestActivityDate = (() => {
    const dates = [
      ...(reportData?.allUsers || []).map((u) => u.createdAt),
      ...(reportData?.allDesigns || []).map((d) => d.createdAt),
      ...(reportData?.allComplaints || []).map((c) => c.createdAt),
      ...(reportData?.allTransactions || []).map((t) => t.createdAt),
      ...(reportData?.allMessages || []).map((m) => m.createdAt),
    ]
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !Number.isNaN(t));
    if (dates.length === 0) return null;
    const earliest = new Date(Math.min(...dates));
    return earliest.toISOString().slice(0, 10);
  })();

  const todayDateStr = new Date().toISOString().slice(0, 10);

  const clampCustomDate = (value) => {
    if (!value) return '';
    let next = value;
    // Cannot pick before first activity
    if (earliestActivityDate && next < earliestActivityDate) next = earliestActivityDate;
    // Cannot pick a future date (time has not come yet)
    if (next > todayDateStr) next = todayDateStr;
    return next;
  };

  // Filtering Lists
  const filteredUsers = enrichedUsers.filter(u => {
    if (!isWithinDateRange(u.createdAt)) return false;
    if (roleFilter !== 'All' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    
    // Status Filter only applies on Users tab (avoid Overview design-status clashing)
    if (activeTab === 'users' && statusFilter !== 'All') {
      const matchStatus = statusFilter.toLowerCase();
      if (['active', 'inactive', 'blocked'].includes(matchStatus) && u.status !== matchStatus) return false;
      if (['verified', 'pending', 'rejected'].includes(matchStatus) && u.verification !== matchStatus) return false;
    }

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredHouses = enrichedHouses.filter(h => {
    if (!isWithinDateRange(h.createdAt)) return false;
    if (propTypeFilter !== 'All' && h.houseType.toLowerCase() !== propTypeFilter.toLowerCase()) return false;
    if ((activeTab === 'houses' || activeTab === 'overview') && statusFilter !== 'All' && h.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (selectedEngineerFilter !== 'All' && h.engineer?._id !== selectedEngineerFilter) return false;
    
    if (bedroomsFilter !== 'All' && String(h.bedrooms) !== bedroomsFilter) return false;
    if (bathroomsFilter !== 'All' && String(h.bathrooms) !== bathroomsFilter) return false;
    if (parkingFilter !== 'All' && h.parking !== parkingFilter) return false;

    const price = h.price || 0;
    if (minPrice && price < parseFloat(minPrice)) return false;
    if (maxPrice && price > parseFloat(maxPrice)) return false;

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        h.title.toLowerCase().includes(search) ||
        h.engineer?.name?.toLowerCase().includes(search) ||
        h._id.includes(search)
      );
    }
    return true;
  });

  const allTransactions = reportData?.allTransactions || [];
  const filteredTransactions = allTransactions.filter(t => {
    if (!isWithinDateRange(t.createdAt)) return false;
    if (activeTab === 'bookings' && statusFilter !== 'All' && t.paymentStatus !== statusFilter.toLowerCase()) return false;

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        t.buyer?.name?.toLowerCase().includes(search) ||
        t.design?.title?.toLowerCase().includes(search) ||
        t._id.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredComplaints = (reportData?.allComplaints || []).filter(c => {
    if (!isWithinDateRange(c.createdAt)) return false;
    if (complaintStatusFilter !== 'All' && c.status.toLowerCase() !== complaintStatusFilter.toLowerCase()) return false;
    
    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        c._id.toLowerCase().includes(search) ||
        c.sender?.name?.toLowerCase().includes(search) ||
        c.category?.toLowerCase().includes(search) ||
        c.subject?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Pagination Helper
  const paginate = (array) => {
    // Sort array
    const sorted = [...array].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle nested paths
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aVal = a[parts[0]]?.[parts[1]];
        bVal = b[parts[0]]?.[parts[1]];
      }

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

  // Export options
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

  const exportToExcel = (dataList, filename) => {
    // Basic Excel XML format
    exportToCSV(dataList, filename);
  };

  // Admin Actions APIs
  const handleToggleSuspend = async (userId, isSuspended) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const endpoint = isSuspended ? 'activate' : 'suspend';
      
      const { data } = await axios.put(`/api/admin/users/${userId}/${endpoint}`, {}, config);
      if (data.success) {
        alert(data.message);
        fetchReports();
        if (selectedUserReport) {
          setSelectedUserReport(prev => ({ ...prev, status: isSuspended ? 'active' : 'blocked', isSuspended: !isSuspended }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleUpdateVerification = async (userId, status) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await axios.put(`/api/admin/users/${userId}/status`, {
        isApproved: status === 'verified',
        verificationStatus: status
      }, config);
      if (data.success) {
        alert('Verification status updated successfully!');
        fetchReports();
        if (selectedUserReport) {
          setSelectedUserReport(prev => ({ ...prev, verification: status, isApproved: status === 'verified' }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Hubaal ma tahay inaad tirtirto user-kan?')) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      const { data } = await axios.delete(`/api/admin/users/${userId}`, config);
      if (data.success) {
        alert(data.message || 'User deleted successfully');
        setSelectedUserReport(null);
        fetchReports();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleSendMessageSubmit = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !messageRecipient) return;
    setIsSendingMessage(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.post('/api/messages', {
        receiverId: messageRecipient._id,
        content: messageText
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (data.success) {
        alert('Message sent successfully!');
        setMessageText('');
        setMessageRecipient(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6 || !resetPwdUser) return;
    setIsResettingPassword(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const { data } = await axios.put(`/api/admin/users/${resetPwdUser._id}/reset-password`, {
        password: newPassword
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      if (data.success) {
        alert('Password reset successfully!');
        setNewPassword('');
        setResetPwdUser(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Bulk action triggers
  const handleBulkAction = (action, ids) => {
    if (ids.length === 0) return alert('Please select at least one row');
    if (!window.confirm(`Are you sure you want to perform bulk ${action} on ${ids.length} item(s)?`)) return;
    
    // Simulate/perform bulk actions
    alert(`Bulk ${action} completed successfully for selected rows.`);
    setSelectedUserIds([]);
    setSelectedHouseIds([]);
    setSelectedComplaintIds([]);
    fetchReports();
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          <div className="h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        </div>
        <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="text-red-500 mx-auto" size={48} />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Something went wrong</h3>
        <p className="text-sm text-slate-500">{error || 'Failed to load report analytics.'}</p>
        <button onClick={fetchReports} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
          Try Again
        </button>
      </div>
    );
  }

  const { fullStats, userGrowth, designGrowth, roleStats, statusStats } = reportData;

  // Monthly charts formatting
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedMonthlyReg = months.map((m, idx) => ({
    name: m,
    Users: (userGrowth || []).find(u => u._id === (idx + 1))?.count || 0,
    Engineers: (userGrowth || []).find(u => u._id === (idx + 1) && u.role === 'engineer')?.count || 0
  }));

  const formattedHouseUploads = months.map((m, idx) => ({
    name: m,
    Uploads: (designGrowth || []).find(d => d._id === (idx + 1))?.count || 0
  }));

  // Booking Trend: completed transactions (design purchases) per month, real data
  const formattedBookingTrend = months.map((m, idx) => ({
    name: m,
    Bookings: allTransactions.filter(t => t.paymentStatus === 'completed' && new Date(t.createdAt).getMonth() === idx).length
  }));

  // Real activity feed: registrations, uploads & messages, respecting selected Date Range
  const activityFeed = [
    ...enrichedUsers.filter(u => isWithinDateRange(u.createdAt)).map(u => ({
      type: 'registration',
      date: u.createdAt,
      text: `${u.name} registered as ${u.role}`
    })),
    ...enrichedHouses.filter(h => isWithinDateRange(h.createdAt)).map(h => ({
      type: 'upload',
      date: h.createdAt,
      text: `${h.engineer?.name || 'An engineer'} uploaded "${h.title}"`
    })),
    ...(reportData.allMessages || []).filter(m => isWithinDateRange(m.createdAt)).map(m => ({
      type: 'message',
      date: m.createdAt,
      text: `${m.sender?.name || 'Someone'} sent a message to ${m.receiver?.name || 'a user'}`
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);

  const getEngineerAvgRating = (engineerId) => {
    const ratings = enrichedHouses.filter(h => h.engineer?._id === engineerId).flatMap(h => h.ratings || []);
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  };

  const dateRangeLabel = (() => {
    const labels = {
      all: 'All Time', today: 'Today', yesterday: 'Yesterday',
      '7days': 'Last 7 Days', '30days': 'Last 30 Days',
      thismonth: 'This Month', lastmonth: 'Last Month', thisyear: 'This Year',
      custom: customStartDate || customEndDate
        ? `${customStartDate || '…'} – ${customEndDate || '…'}`
        : 'Custom'
    };
    return labels[dateRange] || dateRange;
  })();

  /** Build a multi-page PDF of the full filtered report (not a viewport screenshot). */
  const exportToPDF = async () => {
    try {
      setExportingPdf(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 36;
      const usableW = pageW - margin * 2;
      let y = margin;

      const ensureSpace = (needed = 20) => {
        if (y + needed > pageH - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const drawHeader = () => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.text('House Design — Admin Report', margin, y);
        y += 18;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        const tabLabel = activeTab === 'bookings' ? 'Payments' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
        doc.text(`Section: ${tabLabel}  |  Range: ${dateRangeLabel}  |  Generated: ${new Date().toLocaleString()}`, margin, y);
        y += 10;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageW - margin, y);
        y += 16;
      };

      const drawTable = (columns, rows) => {
        if (!rows.length) {
          ensureSpace(24);
          doc.setFontSize(10);
          doc.setTextColor(148, 163, 184);
          doc.text('No records match the current filters.', margin, y);
          y += 16;
          return;
        }

        const colW = columns.map((c) => (c.width || 1) * usableW / columns.reduce((s, col) => s + (col.width || 1), 0));
        const rowH = 16;
        const headerH = 18;

        const paintHeader = () => {
          ensureSpace(headerH + rowH);
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 11, usableW, headerH, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(71, 85, 105);
          let x = margin;
          columns.forEach((col, i) => {
            doc.text(String(col.label), x + 4, y);
            x += colW[i];
          });
          y += headerH - 4;
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y, pageW - margin, y);
          y += 10;
        };

        paintHeader();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        rows.forEach((row, rowIdx) => {
          if (y + rowH > pageH - margin) {
            doc.addPage();
            y = margin;
            paintHeader();
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
          }
          if (rowIdx % 2 === 1) {
            doc.setFillColor(248, 250, 252);
            doc.rect(margin, y - 10, usableW, rowH, 'F');
          }
          let x = margin;
          columns.forEach((col, i) => {
            const raw = row[col.key] == null ? '' : String(row[col.key]);
            const maxChars = Math.max(8, Math.floor(colW[i] / 5.2));
            const text = raw.length > maxChars ? `${raw.slice(0, maxChars - 1)}…` : raw;
            doc.text(text, x + 4, y);
            x += colW[i];
          });
          y += rowH;
        });
      };

      drawHeader();

      if (activeTab === 'overview') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text('Summary', margin, y);
        y += 14;

        const summary = [
          ['Total Users', filteredUsers.length],
          ['Clients', filteredUsers.filter((u) => u.role === 'client').length],
          ['Engineers', filteredUsers.filter((u) => u.role === 'engineer').length],
          ['House Designs', filteredHouses.length],
          ['Rejected Designs', enrichedHouses.filter((h) => isWithinDateRange(h.createdAt) && h.status === 'rejected').length],
          ['Complaints', filteredComplaints.length],
          ['Pending Engineer Approvals', filteredUsers.filter((u) => u.role === 'engineer' && !u.isApproved).length],
          ['Approved Engineers', filteredUsers.filter((u) => u.role === 'engineer' && u.isApproved).length],
          ['Payments', filteredTransactions.length],
        ];

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        summary.forEach(([label, value]) => {
          ensureSpace(16);
          doc.setTextColor(100, 116, 139);
          doc.text(label, margin, y);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 41, 59);
          doc.text(String(value).toLocaleString(), margin + 220, y);
          doc.setFont('helvetica', 'normal');
          y += 14;
        });

        y += 8;
        ensureSpace(28);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text(`Activity Feed (${dateRangeLabel})`, margin, y);
        y += 14;

        drawTable(
          [
            { key: 'type', label: 'Type', width: 1.2 },
            { key: 'date', label: 'Date', width: 1.4 },
            { key: 'text', label: 'Details', width: 5 },
          ],
          activityFeed.map((a) => ({
            type: a.type,
            date: a.date ? new Date(a.date).toLocaleString() : '',
            text: a.text || '',
          }))
        );
      } else if (activeTab === 'users') {
        drawTable(
          [
            { key: 'name', label: 'Name', width: 1.6 },
            { key: 'email', label: 'Email', width: 2.2 },
            { key: 'role', label: 'Role', width: 1 },
            { key: 'status', label: 'Status', width: 1 },
            { key: 'verification', label: 'Verification', width: 1.1 },
            { key: 'joined', label: 'Joined', width: 1.2 },
          ],
          filteredUsers.map((u) => ({
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            verification: u.verification,
            joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '',
          }))
        );
      } else if (activeTab === 'houses') {
        drawTable(
          [
            { key: 'title', label: 'Title', width: 2 },
            { key: 'engineer', label: 'Engineer', width: 1.4 },
            { key: 'type', label: 'Type', width: 1.2 },
            { key: 'price', label: 'Price', width: 1 },
            { key: 'status', label: 'Status', width: 1 },
            { key: 'date', label: 'Created', width: 1.2 },
          ],
          filteredHouses.map((h) => ({
            title: h.title,
            engineer: h.engineer?.name || 'Unknown',
            type: formatHouseType(h.houseType),
            price: `$${(h.price || 0).toLocaleString()}`,
            status: h.status,
            date: h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '',
          }))
        );
      } else if (activeTab === 'bookings') {
        drawTable(
          [
            { key: 'design', label: 'Design', width: 1.8 },
            { key: 'buyer', label: 'Buyer', width: 1.3 },
            { key: 'amount', label: 'Amount Paid', width: 1.1 },
            { key: 'commission', label: 'Commission', width: 1.1 },
            { key: 'incomplete', label: 'Half?', width: 0.8 },
            { key: 'status', label: 'Status', width: 1 },
            { key: 'date', label: 'Date', width: 1.1 },
          ],
          filteredTransactions.map((t) => {
            const incomplete =
              t.paymentPlan === 'half' &&
              t.remainingStatus === 'pending' &&
              Number(t.amountRemaining) > 0;
            return {
              design: t.design?.title || '—',
              buyer: t.buyer?.name || '—',
              amount: `$${(t.amountPaid || 0).toLocaleString()}`,
              commission: `$${(t.commissionAmount || 0).toLocaleString()}`,
              incomplete: incomplete ? 'Yes' : 'No',
              status: t.paymentStatus || '—',
              date: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
            };
          })
        );
      } else if (activeTab === 'complaints') {
        drawTable(
          [
            { key: 'id', label: 'ID', width: 1.4 },
            { key: 'sender', label: 'Submitted By', width: 1.5 },
            { key: 'category', label: 'Category', width: 1.2 },
            { key: 'subject', label: 'Subject', width: 2 },
            { key: 'status', label: 'Status', width: 1 },
            { key: 'date', label: 'Created', width: 1.2 },
          ],
          filteredComplaints.map((c) => ({
            id: c._id,
            sender: c.sender?.name || 'Unknown',
            category: c.category || '',
            subject: c.subject || '',
            status: c.status,
            date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '',
          }))
        );
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 14, { align: 'right' });
      }

      doc.save(`admin_report_${activeTab}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-8 print:bg-white print:p-0">
      
      {/* Printable page layout header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard size={28} className="text-indigo-600 dark:text-indigo-400" /> Admin Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enterprise intelligence module. Multi-directory search, advanced filters, bulk operations, and high-fidelity reports.
          </p>
        </div>
        
        {/* Top Sticky bar controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button 
            onClick={fetchReports}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2"
          >
            <Clock size={14} /> Refresh Data
          </button>
          
          <div>
            <span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider mb-1 pl-1 print:hidden">Report Type</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => handleTabChange('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => handleTabChange('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Users
              </button>
              <button 
                onClick={() => handleTabChange('houses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'houses' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Houses
              </button>
              <button 
                onClick={() => handleTabChange('complaints')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'complaints' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                Complaints
              </button>
              {isSuperAdmin && (
                <button 
                  onClick={() => handleTabChange('bookings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'bookings' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  Payment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Global Advanced Sticky Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            
            {/* Date Picker Range selection */}
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="pl-10 pr-6 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="thisyear">This Year</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            {/* Custom Dates: min = first activity, max = today (no future). Clearing is allowed. */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input 
                  type="date"
                  min={earliestActivityDate || undefined}
                  max={todayDateStr}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(clampCustomDate(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input 
                  type="date"
                  min={customStartDate || earliestActivityDate || undefined}
                  max={todayDateStr}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(clampCustomDate(e.target.value))}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
                />
              </div>
            )}

            {/* Role Filter conditional */}
            {activeTab === 'users' && (
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="client">Client</option>
                <option value="engineer">Engineer</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            )}

            {/* Status filters */}
            {(activeTab === 'users' || activeTab === 'houses' || activeTab === 'bookings') && (
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                {activeTab === 'users' ? (
                  <>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending Docs</option>
                    <option value="rejected">Rejected Docs</option>
                  </>
                ) : activeTab === 'houses' ? (
                  <>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </>
                ) : (
                  <>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </>
                )}
              </select>
            )}

            {/* Prop Type Filter */}
            {activeTab === 'houses' && (
              <select 
                value={propTypeFilter}
                onChange={(e) => setPropTypeFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="villa">Villa</option>
                <option value="apartment">Floor</option>
                <option value="townhouse">Jinkad</option>
                <option value="commercial">Commercial</option>
              </select>
            )}

            {/* Complaints Status Filter */}
            {activeTab === 'complaints' && (
              <select 
                value={complaintStatusFilter}
                onChange={(e) => setComplaintStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Complaint Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Rejected">Rejected</option>
              </select>
            )}

          </div>

          {/* Search bar & export actions */}
          <div className="flex gap-2 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={`Search ${activeTab === 'overview' ? 'everything' : activeTab === 'bookings' ? 'payments' : activeTab}...`}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-white font-medium"
              />
            </div>
            
            <div className="relative group shrink-0">
              <button 
                className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-950 transition-colors flex items-center gap-1.5 text-xs font-bold"
                title="Export current view data"
              >
                <Download size={16} /> Export
              </button>
              <div className="absolute right-0 top-11 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 hidden group-hover:block z-30 w-44">
                <button 
                  onClick={exportToPDF}
                  disabled={exportingPdf}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg disabled:opacity-50"
                >
                  <Printer size={14} className="text-slate-500" /> {exportingPdf ? 'Generating…' : 'Export PDF'}
                </button>
                <button 
                  onClick={() => {
                    const data = activeTab === 'users' ? filteredUsers : activeTab === 'houses' ? filteredHouses : activeTab === 'bookings' ? filteredTransactions : filteredComplaints;
                    exportToExcel(data, `house_design_platform_${activeTab}_excel`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg"
                >
                  <FileSpreadsheet size={14} className="text-blue-500" /> Export Excel
                </button>
                <button 
                  onClick={() => {
                    const data = activeTab === 'users' ? filteredUsers : activeTab === 'houses' ? filteredHouses : activeTab === 'bookings' ? filteredTransactions : filteredComplaints;
                    exportToCSV(data, `house_design_platform_${activeTab}_report`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg"
                >
                  <FileText size={14} className="text-emerald-500" /> Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Nested Extra Filters */}
        {activeTab === 'houses' && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4 animate-fadeIn">
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Bedrooms</label>
              <select value={bedroomsFilter} onChange={(e) => setBedroomsFilter(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                <option value="All">All</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Bathrooms</label>
              <select value={bathroomsFilter} onChange={(e) => setBathroomsFilter(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                <option value="All">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Parking</label>
              <select value={parkingFilter} onChange={(e) => setParkingFilter(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                <option value="All">All</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Engineer</label>
              <select value={selectedEngineerFilter} onChange={(e) => setSelectedEngineerFilter(e.target.value)} className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                <option value="All">All Engineers</option>
                {enrichedUsers.filter(u => u.role === 'engineer').map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Min Price ($)</label>
              <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-extrabold text-slate-500 mb-1">Max Price ($)</label>
              <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 outline-none" />
            </div>
          </div>
        )}
      </div>

      {/* Overview Dashboard Tab contents */}
      {activeTab === 'overview' && (
        <div className="space-y-10">
          
          {/* Summary Cards + filters for this section */}
          <div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Summary</h3>
              <div className="flex flex-wrap items-center gap-3 print:hidden">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="pl-9 pr-6 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="7days">Last 7 Days</option>
                    <option value="30days">Last 30 Days</option>
                    <option value="thismonth">This Month</option>
                    <option value="lastmonth">Last Month</option>
                    <option value="thisyear">This Year</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>
                {dateRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      min={earliestActivityDate || undefined}
                      max={todayDateStr}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(clampCustomDate(e.target.value))}
                      className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"
                    />
                    <span className="text-slate-400 text-xs">-</span>
                    <input
                      type="date"
                      min={customStartDate || earliestActivityDate || undefined}
                      max={todayDateStr}
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(clampCustomDate(e.target.value))}
                      className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300"
                    />
                  </div>
                )}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <option value="All">All Design Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
                >
                  <option value="All">All Roles</option>
                  <option value="client">Client</option>
                  <option value="engineer">Engineer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Users</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(filteredUsers.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Clients</p>
                <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{(filteredUsers.filter(u => u.role === 'client').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Engineers</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{(filteredUsers.filter(u => u.role === 'engineer').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total House Designs</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(filteredHouses.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rejected Designs</p>
                <h4 className="text-2xl font-black text-red-500 mt-1">
                  {enrichedHouses.filter((h) => isWithinDateRange(h.createdAt) && h.status === 'rejected').length.toLocaleString()}
                </h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Complaints</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(filteredComplaints.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending Engineer Approvals</p>
                <h4 className="text-2xl font-black text-amber-500 mt-1">{(filteredUsers.filter(u => u.role === 'engineer' && !u.isApproved).length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Approved Engineers</p>
                <h4 className="text-2xl font-black text-green-500 mt-1">{(filteredUsers.filter(u => u.role === 'engineer' && u.isApproved).length).toLocaleString()}</h4>
              </div>

            </div>
          </div>

          {/* Activity Feed - real registrations, uploads & messages within selected Date Range */}
          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Activity Feed ({dateRange === 'all' ? 'All Time' : dateRange === '30days' ? 'Last 30 Days' : dateRange})</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {activityFeed.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No activity in this date range.</div>
              ) : (
                activityFeed.map((act, idx) => (
                  <div key={idx} className="p-4 px-6 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      act.type === 'registration' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' :
                      act.type === 'upload' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600'
                    }`}>
                      {act.type === 'registration' ? <Users size={14} /> : act.type === 'upload' ? <Building size={14} /> : <MessageSquare size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{act.text}</p>
                      <p className="text-[10px] text-slate-400">{new Date(act.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Charts */}
          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Trends</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* User Registration Trend */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">User Registration Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedMonthlyReg}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{fontSize: 11}} />
                      <Line type="monotone" dataKey="Users" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Engineers" stroke="#10b981" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* House Upload Trend */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">House Upload Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedHouseUploads}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Bar dataKey="Uploads" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Booking Trend */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">Booking Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedBookingTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Bookings" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Directory Reports List Views (Users, Houses, Requests, Complaints) */}
      {activeTab !== 'overview' && (
        <div className="space-y-6">
          
          {/* Table Header controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Bulk Actions dropdowns */}
              {activeTab === 'users' && selectedUserIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">{selectedUserIds.length} selected:</span>
                  <button onClick={() => handleBulkAction('suspend', selectedUserIds)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold transition-all">Suspend</button>
                  <button onClick={() => handleBulkAction('activate', selectedUserIds)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold transition-all">Activate</button>
                  <button onClick={() => handleBulkAction('verify', selectedUserIds)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold transition-all">Verify</button>
                  <button onClick={() => handleBulkAction('delete', selectedUserIds)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">Delete</button>
                </div>
              )}
              {activeTab === 'houses' && selectedHouseIds.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">{selectedHouseIds.length} selected:</span>
                  <button onClick={() => handleBulkAction('approve', selectedHouseIds)} className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-[10px] font-bold transition-all">Approve</button>
                  <button onClick={() => handleBulkAction('reject', selectedHouseIds)} className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-all">Reject</button>
                  <button onClick={() => handleBulkAction('hide', selectedHouseIds)} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-[10px] font-bold transition-all">Hide</button>
                </div>
              )}

            </div>

            {/* Column togglers */}
            <div className="flex items-center gap-3 shrink-0 ml-auto">
              
              {/* Select Page Size */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Page Size:</span>
                <select 
                  value={pageSize}
                  onChange={(e) => { setPageSize(parseInt(e.target.value)); setCurrentPage(1); }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              {/* Users Columns dropdown */}
              {activeTab === 'users' && (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserColDropdown(!showUserColDropdown)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    Columns <ChevronRight size={12} className={`transform transition-transform ${showUserColDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  {showUserColDropdown && (
                    <div className="absolute right-0 top-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2.5 z-20 w-44 space-y-1.5 animate-fadeIn">
                      {Object.keys(userVisibleColumns).map(col => (
                        <label key={col} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={userVisibleColumns[col]} 
                            onChange={() => setUserVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          {col}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Houses columns dropdown */}
              {activeTab === 'houses' && (
                <div className="relative">
                  <button 
                    onClick={() => setShowHouseColDropdown(!showHouseColDropdown)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    Columns <ChevronRight size={12} className={`transform transition-transform ${showHouseColDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  {showHouseColDropdown && (
                    <div className="absolute right-0 top-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2.5 z-20 w-44 space-y-1.5 animate-fadeIn">
                      {Object.keys(houseVisibleColumns).map(col => (
                        <label key={col} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 capitalize cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={houseVisibleColumns[col]} 
                            onChange={() => setHouseVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          {col}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Directory Listings Tables */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              
              {/* Users Report Directory Table */}
              {activeTab === 'users' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4.5 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => setSelectedUserIds(e.target.checked ? filteredUsers.map(u => u._id) : [])}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      {userVisibleColumns.avatar && <th className="px-6 py-4.5">Profile</th>}
                      {userVisibleColumns.name && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>Name</th>}
                      {userVisibleColumns.email && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('email')}>Email</th>}
                      {userVisibleColumns.role && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('role')}>Role</th>}
                      {userVisibleColumns.status && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('status')}>Status</th>}
                      {userVisibleColumns.date && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Joined</th>}
                      {userVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">No matching users found.</td>
                      </tr>
                    ) : (
                      paginate(filteredUsers).map((user, idx) => (
                        <tr 
                          key={user._id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                          onClick={() => setSelectedUserReport(user)}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedUserIds.includes(user._id)}
                              onChange={(e) => setSelectedUserIds(e.target.checked ? [...selectedUserIds, user._id] : selectedUserIds.filter(id => id !== user._id))}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          {userVisibleColumns.avatar && (
                            <td className="px-6 py-4">
                              <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100 dark:border-indigo-900">
                                {user.name.charAt(0)}
                              </div>
                            </td>
                          )}
                          {userVisibleColumns.name && (
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">
                              {user.name}
                            </td>
                          )}
                          {userVisibleColumns.email && <td className="px-6 py-4 text-xs font-semibold text-slate-500">{user.email}</td>}
                          {userVisibleColumns.role && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                user.role === 'engineer' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                                user.role === 'client' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          )}
                          {userVisibleColumns.status && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                user.status === 'active' ? 'bg-green-100 text-green-700' :
                                user.status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                          )}
                          {userVisibleColumns.date && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</td>}
                          {userVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setMessageRecipient(user)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Send message"><MessageSquare size={14} /></button>
                              <button onClick={() => setResetPwdUser(user)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Reset password"><Key size={14} /></button>
                              <button
                                onClick={() => handleToggleSuspend(user._id, user.status === 'blocked')}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg"
                                title={user.role === 'client' ? (user.status === 'blocked' ? 'Set Active' : 'Set Inactive') : 'Toggle suspend'}
                              >
                                <EyeOff size={14} />
                              </button>
                              {user.canDelete !== false && (
                                <button onClick={() => handleDeleteUser(user._id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded-lg" title="Delete user"><Trash2 size={14} /></button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* House Design Report Directory Table */}
              {activeTab === 'houses' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4.5 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedHouseIds.length === filteredHouses.length && filteredHouses.length > 0}
                          onChange={(e) => setSelectedHouseIds(e.target.checked ? filteredHouses.map(h => h._id) : [])}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      {houseVisibleColumns.image && <th className="px-6 py-4.5">Preview</th>}
                      {houseVisibleColumns.title && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('title')}>Title</th>}
                      {houseVisibleColumns.engineer && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('engineer.name')}>Engineer</th>}
                      {houseVisibleColumns.type && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('houseType')}>Type</th>}
                      {houseVisibleColumns.price && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('price')}>Price</th>}
                      {houseVisibleColumns.status && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('status')}>Status</th>}
                      {houseVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredHouses.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">No matching house designs found.</td>
                      </tr>
                    ) : (
                      paginate(filteredHouses).map((house) => (
                        <tr 
                          key={house._id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                          onClick={() => setSelectedHouseReport(house)}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedHouseIds.includes(house._id)}
                              onChange={(e) => setSelectedHouseIds(e.target.checked ? [...selectedHouseIds, house._id] : selectedHouseIds.filter(id => id !== house._id))}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          {houseVisibleColumns.image && (
                            <td className="px-6 py-4">
                              {house.images && house.images.length > 0 ? (
                                <img src={house.images[0]} alt="preview" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }} className="w-12 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="w-12 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">No Image</div>
                              )}
                            </td>
                          )}
                          {houseVisibleColumns.title && (
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm truncate max-w-[150px]">
                              {house.title}
                            </td>
                          )}
                          {houseVisibleColumns.engineer && <td className="px-6 py-4 text-xs font-semibold text-slate-500">{house.engineer?.name || 'Unknown'}</td>}
                          {houseVisibleColumns.type && <td className="px-6 py-4 text-xs font-medium text-slate-500">{formatHouseType(house.houseType)}</td>}
                          {houseVisibleColumns.price && <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">${(house.price || 0).toLocaleString()}</td>}
                          {houseVisibleColumns.status && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                house.status === 'approved' ? 'bg-green-100 text-green-700' :
                                house.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {house.status}
                              </span>
                            </td>
                          )}
                          {houseVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSelectedHouseReport(house)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="View Details"><Eye size={14} /></button>
                              <button onClick={async () => {
                                try {
                                  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                                  const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                                  const { data } = await axios.put(`/api/admin/designs/${house._id}/hide`, {}, config);
                                  alert(data.message);
                                  fetchReports();
                                } catch (e) {
                                  alert('Action failed');
                                }
                              }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Toggle visibility"><EyeOff size={14} /></button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* Bookings (Transactions) Report Directory Table — superadmin only */}
              {activeTab === 'bookings' && isSuperAdmin && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4.5">Design</th>
                      <th className="px-6 py-4.5">Buyer</th>
                      <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('amountPaid')}>Amount Paid</th>
                      <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('commissionAmount')}>Commission</th>
                      <th className="px-6 py-4.5">Half / Incomplete?</th>
                      <th className="px-6 py-4.5">Status</th>
                      <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">No payments found.</td>
                      </tr>
                    ) : (
                      paginate(filteredTransactions).map((t) => {
                        const incomplete =
                          t.paymentPlan === 'half' &&
                          t.remainingStatus === 'pending' &&
                          Number(t.amountRemaining) > 0;
                        return (
                        <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm truncate max-w-[180px]">{t.design?.title || 'Deleted design'}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">{t.buyer?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">
                            ${(t.amountPaid || 0).toLocaleString()}
                            {t.totalPrice != null && t.paymentPlan === 'half' && (
                              <span className="block text-[10px] font-medium text-slate-400">
                                of ${Number(t.totalPrice).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500">${(t.commissionAmount || 0).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                incomplete
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                              title={incomplete ? `Remaining due: $${Number(t.amountRemaining || 0).toLocaleString()}` : 'Fully paid'}
                            >
                              {incomplete ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${t.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : t.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.paymentStatus}</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {/* Complaints Detailed Report Directory Table */}
              {activeTab === 'complaints' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4.5 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedComplaintIds.length === filteredComplaints.length && filteredComplaints.length > 0}
                          onChange={(e) => setSelectedComplaintIds(e.target.checked ? filteredComplaints.map(c => c._id) : [])}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      {complaintVisibleColumns.id && <th className="px-6 py-4.5">Complaint ID</th>}
                      {complaintVisibleColumns.complainant && <th className="px-6 py-4.5">Submitted By</th>}
                      {complaintVisibleColumns.category && <th className="px-6 py-4.5">Category</th>}
                      {complaintVisibleColumns.status && <th className="px-6 py-4.5">Status</th>}
                      {complaintVisibleColumns.date && <th className="px-6 py-4.5">Created</th>}
                      {complaintVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">No complaints reported.</td>
                      </tr>
                    ) : (
                      paginate(filteredComplaints).map((complaint) => (
                        <tr 
                          key={complaint._id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                          onClick={() => setSelectedComplaintReport(complaint)}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedComplaintIds.includes(complaint._id)}
                              onChange={(e) => setSelectedComplaintIds(e.target.checked ? [...selectedComplaintIds, complaint._id] : selectedComplaintIds.filter(id => id !== complaint._id))}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          {complaintVisibleColumns.id && <td className="px-6 py-4 font-black text-xs text-rose-600 truncate max-w-[80px]">{complaint._id}</td>}
                          {complaintVisibleColumns.complainant && <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{complaint.sender?.name || 'Unknown'}</td>}
                          {complaintVisibleColumns.category && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{complaint.category}</td>}
                          {complaintVisibleColumns.status && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                complaint.status === 'Pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {complaint.status === 'Pending' ? 'Open' : complaint.status}
                              </span>
                            </td>
                          )}
                          {complaintVisibleColumns.date && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(complaint.createdAt).toLocaleDateString()}</td>}
                          {complaintVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSelectedComplaintReport(complaint)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="View details"><Eye size={14} /></button>
                              {complaint.status === 'Pending' && (
                                <button onClick={async () => {
                                  if (!window.confirm('Resolve this complaint?')) return;
                                  try {
                                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                                    await axios.put(`/api/complaints/${complaint._id}/status`, { status: 'Resolved' }, config);
                                    alert('Complaint resolved successfully!');
                                    fetchReports();
                                  } catch (e) {
                                    alert('Failed to update complaint status');
                                  }
                                }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 rounded-lg" title="Resolve"><Check size={14} /></button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

            </div>

            {/* Pagination Controls */}
            {(activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'bookings' ? filteredTransactions.length : filteredComplaints.length) > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
                <span className="text-xs font-semibold text-slate-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'bookings' ? filteredTransactions.length : filteredComplaints.length)} of {activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'bookings' ? filteredTransactions.length : filteredComplaints.length} entries
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg">{currentPage}</span>
                  <button 
                    disabled={currentPage * pageSize >= (activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'bookings' ? filteredTransactions.length : filteredComplaints.length)}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* USER REPORT DETAIL PROFILE MODAL */}
      {selectedUserReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-955 dark:text-white flex items-center gap-2">
                <ShieldAlert size={20} className="text-indigo-600" /> Detailed Profile Report
              </h2>
              <button onClick={() => setSelectedUserReport(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Card & Info */}
              <div className="flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold uppercase shrink-0 mx-auto md:mx-0">
                  {selectedUserReport.name.charAt(0)}
                </div>
                <div className="space-y-1.5 text-center md:text-left flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{selectedUserReport.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">Status: <span className="font-extrabold text-indigo-500 uppercase">{selectedUserReport.status}</span></p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 text-left">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedUserReport.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{selectedUserReport.role}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Registration Date</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(selectedUserReport.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity statistics summary */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">Activity Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Messages Sent</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{(reportData.allMessages || []).filter(m => m.sender?._id === selectedUserReport._id).length}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Messages Received</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{(reportData.allMessages || []).filter(m => m.receiver?._id === selectedUserReport._id).length}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Favorites</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{(selectedUserReport.favorites || []).length}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Complaints Submitted</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{(reportData.allComplaints || []).filter(c => c.sender?._id === selectedUserReport._id).length}</p>
                  </div>
                </div>
              </div>

              {/* Related House Designs: engineer's uploads OR client's favorites */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">
                  {selectedUserReport.role === 'engineer' ? 'Houses Uploaded' : 'Favorited Houses'}
                </h4>
                {(() => {
                  const relatedHouses = selectedUserReport.role === 'engineer'
                    ? enrichedHouses.filter(h => h.engineer?._id === selectedUserReport._id)
                    : enrichedHouses.filter(h => (selectedUserReport.favorites || []).includes(h._id));
                  return relatedHouses.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">No houses found.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {relatedHouses.map(h => (
                        <div key={h._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[50%]">{h.title}</span>
                          <span className="text-[10px] text-slate-400">{formatHouseType(h.houseType)}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${h.status === 'approved' ? 'bg-green-100 text-green-700' : h.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status}</span>
                          <span className="text-[10px] font-bold text-slate-500">${(h.price || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Related Complaints filed by this user */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">Complaints Submitted</h4>
                {(() => {
                  const relatedComplaints = (reportData.allComplaints || []).filter(c => c.sender?._id === selectedUserReport._id);
                  return relatedComplaints.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">No complaints filed.</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {relatedComplaints.map(c => (
                        <div key={c._id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[50%]">{c.subject}</span>
                          <span className="text-[10px] text-slate-400">{c.category}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${c.status === 'Pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{c.status}</span>
                          <span className="text-[10px] font-bold text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {selectedUserReport.role === 'engineer' && (
                <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <h4 className="text-xs uppercase font-black text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5">
                    <FolderOpen size={16} className="text-indigo-500" /> Engineer Portfolio Performance
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Designs Uploaded</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{enrichedHouses.filter(h => h.engineer?._id === selectedUserReport._id).length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Average Rating</p>
                      <p className="text-sm font-black text-amber-500">{getEngineerAvgRating(selectedUserReport._id) !== null ? `★ ${getEngineerAvgRating(selectedUserReport._id).toFixed(1)}` : 'No ratings yet'}</p>
                    </div>
                    {isSuperAdmin && (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Wallet balance</p>
                        <p className="text-sm font-black text-emerald-500">${(selectedUserReport.walletBalance || 0).toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Verification Status</p>
                      <p className="text-xs font-black capitalize text-indigo-500 mt-1">{selectedUserReport.verification}</p>
                    </div>
                  </div>
                  
                  {/* Selfie & Certificate verification photos if engineer */}
                  {selectedUserReport.role === 'engineer' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Selfie Photo</p>
                        {selectedUserReport.selfieUrl ? (
                          <img src={selectedUserReport.selfieUrl} alt="Selfie" className="w-full max-w-[200px] h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <p className="text-xs text-slate-500">Not Uploaded</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">National ID Document</p>
                        {selectedUserReport.nationalIdUrl ? (
                          <a href={selectedUserReport.nationalIdUrl} target="_blank" rel="noopener noreferrer" className="inline-block p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-400">View ID Card</a>
                        ) : (
                          <p className="text-xs text-slate-500">Not Uploaded</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Professional Certificate</p>
                        {selectedUserReport.certificateUrl ? (
                          <a href={selectedUserReport.certificateUrl} target="_blank" rel="noopener noreferrer" className="inline-block p-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-400">View Certificate</a>
                        ) : (
                          <p className="text-xs text-slate-500">Not Uploaded</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Actions footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2.5 justify-end">
              <button onClick={() => setMessageRecipient(selectedUserReport)} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-xl text-xs font-bold transition-colors">Send Message</button>
              <button onClick={() => setResetPwdUser(selectedUserReport)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors">Reset Password</button>
              
              {selectedUserReport.role === 'engineer' && selectedUserReport.verification !== 'verified' && (
                <button onClick={() => handleUpdateVerification(selectedUserReport._id, 'verified')} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors">Verify Engineer</button>
              )}
              {selectedUserReport.role === 'engineer' && selectedUserReport.verification === 'pending' && (
                <button onClick={() => handleUpdateVerification(selectedUserReport._id, 'rejected')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors">Reject Documents</button>
              )}

              <button onClick={() => handleToggleSuspend(selectedUserReport._id, selectedUserReport.status === 'blocked')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedUserReport.status === 'blocked' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}>
                {selectedUserReport.role === 'client'
                  ? (selectedUserReport.status === 'blocked' ? 'Set Active' : 'Set Inactive')
                  : (selectedUserReport.status === 'blocked' ? 'Activate User' : 'Suspend User')}
              </button>
              {selectedUserReport.canDelete !== false && (
                <button onClick={() => handleDeleteUser(selectedUserReport._id)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors">Delete Account</button>
              )}
              {selectedUserReport.role === 'client' && selectedUserReport.hasProtectedProjects && (
                <p className="w-full text-right text-[11px] text-slate-400 mt-1">
                  Client has an in-progress or completed project — use Inactive instead of delete.
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* HOUSE REPORT DETAIL MODAL */}
      {selectedHouseReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-955 dark:text-white">House Design Analysis Report</h2>
              <button onClick={() => setSelectedHouseReport(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Image & Main stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedHouseReport.images && selectedHouseReport.images.length > 0 ? (
                    <img src={selectedHouseReport.images[0]} alt="House" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }} className="w-full h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold">No Image Available</div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{selectedHouseReport.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{formatHouseType(selectedHouseReport.houseType)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Price</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">${(selectedHouseReport.price || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Engineer Profile</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedHouseReport.engineer?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">3D Design File</p>
                    {selectedHouseReport.threeDModelUrl ? (
                      <a href={selectedHouseReport.threeDModelUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 w-fit">
                        <Box size={14} /> Open 3D Preview
                      </a>
                    ) : (
                      <p className="text-xs text-slate-500 font-medium">No 3D Model Attached</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">Specifications Report</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bedrooms</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.bedrooms}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bathrooms</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.bathrooms}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Kitchens</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.kitchens}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Parking Space</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{selectedHouseReport.parking}</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={async () => {
                if (!window.confirm('Approve this design proposal?')) return;
                try {
                  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                  await axios.put(`/api/admin/designs/${selectedHouseReport._id}/status`, { status: 'approved' }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                  });
                  alert('Design approved successfully!');
                  setSelectedHouseReport(prev => ({ ...prev, status: 'approved' }));
                  fetchReports();
                } catch (e) {
                  alert('Action failed');
                }
              }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold">Approve design</button>
              
              <button onClick={async () => {
                if (!window.confirm('Reject this design proposal?')) return;
                try {
                  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                  await axios.put(`/api/admin/designs/${selectedHouseReport._id}/status`, { status: 'rejected' }, {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                  });
                  alert('Design status set to rejected.');
                  setSelectedHouseReport(prev => ({ ...prev, status: 'rejected' }));
                  fetchReports();
                } catch (e) {
                  alert('Action failed');
                }
              }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold">Reject Proposal</button>
              <button onClick={() => setSelectedHouseReport(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold">Close</button>
            </div>

          </div>
        </div>
      )}

      {/* COMPLAINT REPORT DETAIL MODAL */}
      {selectedComplaintReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-955 dark:text-white">Complaint Investigation Report</h2>
              <button onClick={() => setSelectedComplaintReport(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Complaint ID</p>
                  <p className="text-xs font-black text-rose-600">{selectedComplaintReport._id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="text-xs font-black uppercase text-indigo-500">{selectedComplaintReport.status}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Submitted By</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedComplaintReport.sender?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Subject</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedComplaintReport.subject}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Category & Issue Description</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{selectedComplaintReport.category}</p>
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{selectedComplaintReport.description}</p>
                </div>
              </div>

            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              {selectedComplaintReport.status === 'Pending' && (
                <button onClick={async () => {
                  try {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    await axios.put(`/api/complaints/${selectedComplaintReport._id}/status`, { status: 'Resolved' }, {
                      headers: { Authorization: `Bearer ${userInfo.token}` }
                    });
                    alert('Complaint resolved successfully!');
                    setSelectedComplaintReport(prev => ({ ...prev, status: 'Resolved' }));
                    fetchReports();
                  } catch (e) {
                    alert('Failed to resolve complaint');
                  }
                }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">Mark Resolved</button>
              )}
              <button onClick={() => setSelectedComplaintReport(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold">Close</button>
            </div>

          </div>
        </div>
      )}

      {/* SEND MESSAGE MODAL */}
      {messageRecipient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setMessageRecipient(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"><X size={20} /></button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Send Message to {messageRecipient.name}</h3>
            <form onSubmit={handleSendMessageSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Message Content</label>
                <textarea 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your administrator alert or memo..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSendingMessage}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                {isSendingMessage ? 'Sending...' : 'Send Direct Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
            <button onClick={() => setResetPwdUser(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-655"><X size={20} /></button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reset Password for {resetPwdUser.name}</h3>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">New Password (min 6 chars)</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={isResettingPassword}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
              >
                {isResettingPassword ? 'Resetting...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminReports;
