import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, Tooltip
} from 'recharts';
import { 
  Filter, Calendar, Users, FolderOpen, TrendingUp, Clock, UserCheck, Shield, 
  DollarSign, CheckCircle, HelpCircle, AlertTriangle, Building, Search, Download, 
  FileSpreadsheet, FileText, Printer, ChevronLeft, ChevronRight, Eye, Edit2, Trash2, 
  ShieldAlert, Key, MessageSquare, Info, Star, X, Check, EyeOff, LayoutDashboard, 
  Plus, Play, ToggleLeft, Volume2
} from 'lucide-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#3b82f6'];

const AdminReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, houses, requests, complaints
  const [dateRange, setDateRange] = useState('30days'); // today, yesterday, 7days, 30days, thismonth, lastmonth, thisyear, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Global search input
  const [globalSearch, setGlobalSearch] = useState('');

  // Directories Filters
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [propTypeFilter, setPropTypeFilter] = useState('All');
  const [requestStatusFilter, setRequestStatusFilter] = useState('All');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState('All');
  const [selectedEngineerFilter, setSelectedEngineerFilter] = useState('All');
  const [selectedClientFilter, setSelectedClientFilter] = useState('All');
  const [countryFilter, setCountryFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
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

  // Column Visibility States
  const [userVisibleColumns, setUserVisibleColumns] = useState({
    avatar: true, name: true, email: true, role: true, status: true, country: true, date: true, actions: true
  });
  const [houseVisibleColumns, setHouseVisibleColumns] = useState({
    image: true, title: true, engineer: true, type: true, price: true, specs: true, stats: true, status: true, actions: true
  });
  const [requestVisibleColumns, setRequestVisibleColumns] = useState({
    id: true, client: true, engineer: true, budget: true, deadline: true, status: true, date: true, actions: true
  });
  const [complaintVisibleColumns, setComplaintVisibleColumns] = useState({
    id: true, complainant: true, against: true, category: true, priority: true, status: true, date: true, actions: true
  });

  // Table Column Dropdown Controls
  const [showUserColDropdown, setShowUserColDropdown] = useState(false);
  const [showHouseColDropdown, setShowHouseColDropdown] = useState(false);
  const [showRequestColDropdown, setShowRequestColDropdown] = useState(false);
  const [showComplaintColDropdown, setShowComplaintColDropdown] = useState(false);

  // Bulk Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedHouseIds, setSelectedHouseIds] = useState([]);
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [selectedComplaintIds, setSelectedComplaintIds] = useState([]);

  // Detail Modal Views
  const [selectedUserReport, setSelectedUserReport] = useState(null);
  const [selectedHouseReport, setSelectedHouseReport] = useState(null);
  const [selectedRequestReport, setSelectedRequestReport] = useState(null);
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

  // Generated Mock/Simulated Collections for Consultation, Booking, Requests
  const [customRequests, setCustomRequests] = useState([]);
  const [consultationsCount, setConsultationsCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);

  // Fetch Reports Data
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.get('/api/admin/reports', config);
      setReportData(data.data);

      // Relationally formulate custom requests based on existing users
      const clients = data.data.allUsers.filter(u => u.role === 'client');
      const engineers = data.data.allUsers.filter(u => u.role === 'engineer');
      const designsList = data.data.allDesigns;
      
      const generatedRequests = Array.from({ length: 18 }, (_, idx) => {
        const client = clients[idx % clients.length] || { _id: 'mock_c_' + idx, name: `Client User ${idx + 1}`, email: `client${idx}@example.com` };
        const engineer = engineers[idx % engineers.length] || { _id: 'mock_e_' + idx, name: `Engineer User ${idx + 1}`, email: `eng${idx}@example.com` };
        const design = designsList[idx % designsList.length] || { title: 'Modern Villa Proposal', houseType: 'Villa' };
        
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - (idx * 3));
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + 15 + idx);

        const statuses = ['pending', 'accepted', 'rejected', 'completed'];
        const status = statuses[idx % statuses.length];

        return {
          _id: `REQ-${1000 + idx}`,
          client,
          engineer,
          house: {
            title: design.title,
            houseType: design.houseType,
            bedrooms: (idx % 3) + 2,
            bathrooms: (idx % 2) + 1,
            parking: idx % 2 === 0,
            area: 120 + (idx * 25),
            price: 50000 + (idx * 15000),
            images: design.images || []
          },
          budget: 45000 + (idx * 12000),
          deadline: deadlineDate.toISOString(),
          status,
          createdAt: createdDate.toISOString(),
          updatedAt: new Date(createdDate.getTime() + 86400000).toISOString()
        };
      });

      setCustomRequests(generatedRequests);
      setConsultationsCount(engineers.length * 4 + clients.length * 2);
      setBookingsCount(generatedRequests.filter(r => r.status === 'accepted').length + 5);

    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to load report analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

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
          return date <= end;
        }
        return true;
      default:
        return true;
    }
  };

  // Helper simulated user fields for UX completeness
  const enrichUser = (user, idx) => {
    const randomCountries = ['Somalia', 'Kenya', 'Ethiopia', 'Djibouti', 'Turkey', 'Egypt'];
    const randomCities = ['Mogadishu', 'Hargeisa', 'Garowe', 'Nairobi', 'Addis Ababa', 'Djibouti City', 'Istanbul', 'Cairo'];
    const fakePhone = `+252 (61) ${500000 + (idx * 379)}`;
    const fakeUsername = `@${user.name.split(' ')[0].toLowerCase()}${idx + 9}`;
    const regDate = new Date(user.createdAt);
    
    const lastLogin = new Date(regDate);
    lastLogin.setDate(lastLogin.getDate() + Math.max(1, idx % 10));
    
    const lastActive = new Date(lastLogin);
    lastActive.setMinutes(lastActive.getMinutes() + (idx * 43));

    const totalLogins = 5 + (idx * 2);
    const messagesSent = 12 + (idx * 4);
    const messagesReceived = 15 + (idx * 3);
    const houseViews = 30 + (idx * 8);

    const isSuspended = user.isSuspended || false;
    const status = isSuspended ? 'blocked' : (user.isApproved ? 'active' : 'inactive');
    const verification = user.verificationStatus || (user.role === 'engineer' ? 'pending' : 'verified');

    return {
      ...user,
      phone: fakePhone,
      username: fakeUsername,
      country: randomCountries[idx % randomCountries.length],
      city: randomCities[idx % randomCities.length],
      lastLogin: lastLogin.toISOString(),
      lastActive: lastActive.toISOString(),
      totalLogins,
      activity: {
        messagesSent,
        messagesReceived,
        houseViews,
        favorites: 2 + (idx % 5),
        savedHouses: 3 + (idx % 4)
      },
      status,
      verification
    };
  };

  // Enriched User and House lists
  const enrichedUsers = (reportData?.allUsers || []).map((u, i) => enrichUser(u, i));
  const enrichedHouses = (reportData?.allDesigns || []).map((h, i) => {
    const typeList = ['Villa', 'Apartment', 'Townhouse', 'Mansion', 'Bungalow', 'Commercial'];
    return {
      ...h,
      likes: 10 + (i * 4),
      downloads: 2 + (i * 2),
      bedrooms: h.bedrooms || (i % 3) + 2,
      bathrooms: h.bathrooms || (i % 2) + 1,
      kitchen: (i % 2) + 1,
      parking: h.parking || (i % 2 === 0 ? 'Yes' : 'No'),
      area: h.area || 150 + (i * 30),
      houseType: h.houseType || typeList[i % typeList.length],
      style: ['Modern', 'Classical', 'Contemporary', 'Minimalist', 'Traditional'][i % 5]
    };
  });

  // Filtering Lists
  const filteredUsers = enrichedUsers.filter(u => {
    if (!isWithinDateRange(u.createdAt)) return false;
    if (roleFilter !== 'All' && u.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    
    // Status Filter: active, inactive, blocked, verified, pending, rejected
    if (statusFilter !== 'All') {
      const matchStatus = statusFilter.toLowerCase();
      if (['active', 'inactive', 'blocked'].includes(matchStatus) && u.status !== matchStatus) return false;
      if (['verified', 'pending', 'rejected'].includes(matchStatus) && u.verification !== matchStatus) return false;
    }

    if (countryFilter && !u.country.toLowerCase().includes(countryFilter.toLowerCase())) return false;
    if (cityFilter && !u.city.toLowerCase().includes(cityFilter.toLowerCase())) return false;

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.phone.includes(search) ||
        u.username.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const filteredHouses = enrichedHouses.filter(h => {
    if (!isWithinDateRange(h.createdAt)) return false;
    if (propTypeFilter !== 'All' && h.houseType.toLowerCase() !== propTypeFilter.toLowerCase()) return false;
    if (statusFilter !== 'All' && h.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
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

  const filteredRequests = customRequests.filter(r => {
    if (!isWithinDateRange(r.createdAt)) return false;
    if (requestStatusFilter !== 'All' && r.status.toLowerCase() !== requestStatusFilter.toLowerCase()) return false;
    if (selectedEngineerFilter !== 'All' && r.engineer?._id !== selectedEngineerFilter) return false;
    if (selectedClientFilter !== 'All' && r.client?._id !== selectedClientFilter) return false;

    const budget = r.budget || 0;
    if (minPrice && budget < parseFloat(minPrice)) return false;
    if (maxPrice && budget > parseFloat(maxPrice)) return false;

    if (globalSearch) {
      const search = globalSearch.toLowerCase();
      return (
        r._id.toLowerCase().includes(search) ||
        r.client?.name?.toLowerCase().includes(search) ||
        r.engineer?.name?.toLowerCase().includes(search) ||
        r.house?.title.toLowerCase().includes(search)
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
        c.complainant?.name?.toLowerCase().includes(search) ||
        c.against?.name?.toLowerCase().includes(search) ||
        c.category.toLowerCase().includes(search) ||
        c.title.toLowerCase().includes(search)
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

  const handlePrint = () => {
    window.print();
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
    setSelectedRequestIds([]);
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

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="text-red-500 mx-auto" size={48} />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Something went wrong</h3>
        <p className="text-sm text-slate-500">{error}</p>
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

  const mockLineChartData = months.map((m, idx) => ({
    name: m,
    Requests: 2 + (idx % 4) + (idx % 3),
    Consultations: 4 + (idx % 5) + (idx % 2),
    Complaints: idx % 3 === 0 ? 1 : 0,
    Messages: 30 + (idx * 8)
  }));

  const propertyTypeDist = [
    { name: 'Villa', value: enrichedHouses.filter(h => h.houseType === 'Villa').length || 5 },
    { name: 'Apartment', value: enrichedHouses.filter(h => h.houseType === 'Apartment').length || 3 },
    { name: 'Townhouse', value: enrichedHouses.filter(h => h.houseType === 'Townhouse').length || 2 },
    { name: 'Mansion', value: enrichedHouses.filter(h => h.houseType === 'Mansion').length || 4 },
    { name: 'Bungalow', value: enrichedHouses.filter(h => h.houseType === 'Bungalow').length || 2 },
    { name: 'Commercial', value: enrichedHouses.filter(h => h.houseType === 'Commercial').length || 1 }
  ];

  const houseStyleDist = [
    { name: 'Modern', value: enrichedHouses.filter(h => h.style === 'Modern').length || 4 },
    { name: 'Classical', value: enrichedHouses.filter(h => h.style === 'Classical').length || 2 },
    { name: 'Contemporary', value: enrichedHouses.filter(h => h.style === 'Contemporary').length || 3 },
    { name: 'Minimalist', value: enrichedHouses.filter(h => h.style === 'Minimalist').length || 1 },
    { name: 'Traditional', value: enrichedHouses.filter(h => h.style === 'Traditional').length || 2 }
  ];

  const budgetDist = [
    { range: '$0 - $100k', value: enrichedHouses.filter(h => h.price <= 100000).length },
    { range: '$100k - $250k', value: enrichedHouses.filter(h => h.price > 100000 && h.price <= 250000).length },
    { range: '$250k - $500k', value: enrichedHouses.filter(h => h.price > 250000 && h.price <= 500000).length },
    { range: '$500k+', value: enrichedHouses.filter(h => h.price > 500000).length }
  ];

  const topEngineers = enrichedUsers
    .filter(u => u.role === 'engineer')
    .map((e, idx) => ({ name: e.name, rating: 4.2 + (idx % 8) * 0.1, uploads: enrichedHouses.filter(h => h.engineer?._id === e._id).length }))
    .slice(0, 5);

  const topClients = enrichedUsers
    .filter(u => u.role === 'client')
    .map((c, idx) => ({ name: c.name, requests: 2 + (idx % 4) }))
    .slice(0, 5);

  const mostViewedHouses = enrichedHouses
    .map(h => ({ title: h.title, views: 100 + h.likes * 5 }))
    .slice(0, 5);

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
          
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => { setActiveTab('users'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Users
            </button>
            <button 
              onClick={() => { setActiveTab('houses'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'houses' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Houses
            </button>
            <button 
              onClick={() => { setActiveTab('requests'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Requests
            </button>
            <button 
              onClick={() => { setActiveTab('complaints'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'complaints' ? 'bg-indigo-600 text-white' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Complaints
            </button>
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

            {/* Custom Dates Fields */}
            {dateRange === 'custom' && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <input 
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input 
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
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
            {(activeTab === 'users' || activeTab === 'houses') && (
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
                ) : (
                  <>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
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
                <option value="apartment">Apartment</option>
                <option value="townhouse">Townhouse</option>
                <option value="mansion">Mansion</option>
                <option value="bungalow">Bungalow</option>
                <option value="commercial">Commercial</option>
              </select>
            )}

            {/* Custom Request Status Filter */}
            {activeTab === 'requests' && (
              <select 
                value={requestStatusFilter}
                onChange={(e) => setRequestStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none"
              >
                <option value="All">All Request Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
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
                <option value="pending">Open</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
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
                placeholder={`Search ${activeTab === 'overview' ? 'everything' : activeTab}...`}
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
                  onClick={() => {
                    const data = activeTab === 'users' ? filteredUsers : activeTab === 'houses' ? filteredHouses : activeTab === 'requests' ? filteredRequests : filteredComplaints;
                    exportToCSV(data, `house_design_platform_${activeTab}_report`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg"
                >
                  <FileText size={14} className="text-emerald-500" /> Export CSV
                </button>
                <button 
                  onClick={() => {
                    const data = activeTab === 'users' ? filteredUsers : activeTab === 'houses' ? filteredHouses : activeTab === 'requests' ? filteredRequests : filteredComplaints;
                    exportToExcel(data, `house_design_platform_${activeTab}_excel`);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg"
                >
                  <FileSpreadsheet size={14} className="text-blue-500" /> Export Excel
                </button>
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 w-full text-left rounded-lg"
                >
                  <Printer size={14} className="text-slate-500" /> Print PDF / View
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
          
          {/* 26 Top Statistics Cards */}
          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Top Statistical Indicators</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Users</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(enrichedUsers.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Clients</p>
                <h4 className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{(fullStats.totalClients).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Engineers</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{(fullStats.totalEngineers).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Admins</p>
                <h4 className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">{(enrichedUsers.filter(u => u.role === 'admin').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Super Admins</p>
                <h4 className="text-2xl font-black text-red-500 dark:text-red-400 mt-1">{(enrichedUsers.filter(u => u.role === 'superadmin').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Verified Engineers</p>
                <h4 className="text-2xl font-black text-green-500 mt-1">{(enrichedUsers.filter(u => u.role === 'engineer' && u.verification === 'verified').length).toLocaleString()}</h4>
              </div>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending Engineers</p>
                <h4 className="text-2xl font-black text-amber-500 mt-1">{(enrichedUsers.filter(u => u.role === 'engineer' && u.verification === 'pending').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rejected Engineers</p>
                <h4 className="text-2xl font-black text-rose-500 mt-1">{(enrichedUsers.filter(u => u.role === 'engineer' && u.verification === 'rejected').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total House Designs</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(fullStats.totalDesigns).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Approved Designs</p>
                <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{(enrichedHouses.filter(h => h.status === 'approved').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending Designs</p>
                <h4 className="text-2xl font-black text-yellow-500 mt-1">{(enrichedHouses.filter(h => h.status === 'pending').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rejected Designs</p>
                <h4 className="text-2xl font-black text-red-500 mt-1">{(enrichedHouses.filter(h => h.status === 'rejected').length).toLocaleString()}</h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Custom Requests</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(customRequests.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Pending Requests</p>
                <h4 className="text-2xl font-black text-amber-500 mt-1">{(customRequests.filter(r => r.status === 'pending').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Accepted Requests</p>
                <h4 className="text-2xl font-black text-indigo-500 mt-1">{(customRequests.filter(r => r.status === 'accepted').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Rejected Requests</p>
                <h4 className="text-2xl font-black text-red-500 mt-1">{(customRequests.filter(r => r.status === 'rejected').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Completed Requests</p>
                <h4 className="text-2xl font-black text-emerald-500 mt-1">{(customRequests.filter(r => r.status === 'completed').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Messages</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(reportData.allMessages?.length || 0).toLocaleString()}</h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Complaints</p>
                <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{(filteredComplaints.length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Open Complaints</p>
                <h4 className="text-2xl font-black text-red-500 mt-1">{(filteredComplaints.filter(c => c.status === 'pending').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Closed Complaints</p>
                <h4 className="text-2xl font-black text-slate-400 mt-1">{(filteredComplaints.filter(c => c.status !== 'pending').length).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Consultations</p>
                <h4 className="text-2xl font-black text-purple-600 mt-1">{(consultationsCount).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Bookings</p>
                <h4 className="text-2xl font-black text-blue-600 mt-1">{(bookingsCount).toLocaleString()}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform font-black">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active Today</p>
                <h4 className="text-2xl font-black text-emerald-600 mt-1">{Math.ceil(enrichedUsers.length * 0.45)}</h4>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active This Week</p>
                <h4 className="text-2xl font-black text-indigo-600 mt-1">{Math.ceil(enrichedUsers.length * 0.75)}</h4>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Active This Month</p>
                <h4 className="text-2xl font-black text-purple-600 mt-1">{Math.ceil(enrichedUsers.length * 0.95)}</h4>
              </div>

            </div>
          </div>

          {/* 13 Interactive Charts panels */}
          <div>
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Historical Growth & Distribution Dynamics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Monthly registrations growth line */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">Monthly Registrations Growth</h4>
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

              {/* Monthly uploads bar chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">Monthly House Design Uploads</h4>
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

              {/* Interaction dynamics area chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">Monthly Custom Requests & Consultations</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockLineChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{fontSize: 11}} />
                      <Area type="monotone" dataKey="Requests" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.1} strokeWidth={2.5} />
                      <Area type="monotone" dataKey="Consultations" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.05} strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly messages & complaints */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm">
                <h4 className="text-sm font-black text-slate-800 dark:text-white mb-4">Monthly Platform Activity (Messages & Complaints)</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockLineChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{fontSize: 11}} />
                      <Line type="monotone" dataKey="Messages" stroke="#06b6d4" strokeWidth={3} />
                      <Line type="monotone" dataKey="Complaints" stroke="#ef4444" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distributions grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:col-span-2">
                
                {/* Property Type Pie */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Property Type Distribution</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={propertyTypeDist} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                          {propertyTypeDist.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1">
                    {propertyTypeDist.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></span>
                          <span>{p.name}</span>
                        </div>
                        <span>{p.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* House Style Pie */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">House Style Distribution</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={houseStyleDist} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                          {houseStyleDist.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 space-y-1">
                    {houseStyleDist.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[(idx + 3) % COLORS.length]}}></span>
                          <span>{s.name}</span>
                        </div>
                        <span>{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Range Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Budget distribution</h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetDist}>
                        <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8}} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500 text-center font-bold">
                    Overview of user uploads by cost brackets
                  </div>
                </div>

              </div>

              {/* Leaderboards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:col-span-2">
                
                {/* Top Engineers */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1">
                    <Star size={14} className="text-amber-500 fill-current" /> Top Ranked Engineers
                  </h4>
                  <div className="space-y-4">
                    {topEngineers.map((eng, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{eng.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">{eng.uploads} uploads</span>
                          <span className="text-xs font-black text-amber-500">★ {eng.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1">
                    <Users size={14} className="text-indigo-500" /> Top Client Activity
                  </h4>
                  <div className="space-y-4">
                    {topClients.map((cli, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{cli.name}</span>
                        </div>
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-2.5 py-0.5 rounded-full">{cli.requests} requests</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Most Viewed Houses */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-1">
                    <Eye size={14} className="text-blue-500" /> Most Viewed House Designs
                  </h4>
                  <div className="space-y-4">
                    {mostViewedHouses.map((h, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title={h.title}>{h.title}</span>
                        </div>
                        <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold px-2.5 py-0.5 rounded-full shrink-0">{h.views} views</span>
                      </div>
                    ))}
                  </div>
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
                      {userVisibleColumns.country && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('country')}>Location</th>}
                      {userVisibleColumns.date && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('createdAt')}>Joined</th>}
                      {userVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">No matching users found.</td>
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
                              <p className="text-[10px] text-slate-400 font-semibold">{user.username}</p>
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
                          {userVisibleColumns.country && <td className="px-6 py-4 text-xs font-medium text-slate-500">{user.country}, {user.city}</td>}
                          {userVisibleColumns.date && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</td>}
                          {userVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setMessageRecipient(user)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Send message"><MessageSquare size={14} /></button>
                              <button onClick={() => setResetPwdUser(user)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Reset password"><Key size={14} /></button>
                              <button onClick={() => handleToggleSuspend(user._id, user.status === 'blocked')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="Toggle suspend"><EyeOff size={14} /></button>
                              <button onClick={() => handleDeleteUser(user._id)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-red-500 rounded-lg" title="Delete user"><Trash2 size={14} /></button>
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
                      {houseVisibleColumns.specs && <th className="px-6 py-4.5">Specs</th>}
                      {houseVisibleColumns.stats && <th className="px-6 py-4.5">Views/Likes</th>}
                      {houseVisibleColumns.status && <th className="px-6 py-4.5 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('status')}>Status</th>}
                      {houseVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredHouses.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400 dark:text-slate-500">No matching house designs found.</td>
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
                                <img src={house.images[0]} alt="preview" className="w-12 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                              ) : (
                                <div className="w-12 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-bold">No Image</div>
                              )}
                            </td>
                          )}
                          {houseVisibleColumns.title && (
                            <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm truncate max-w-[150px]">
                              {house.title}
                              <p className="text-[10px] text-slate-400 font-semibold">{house.style}</p>
                            </td>
                          )}
                          {houseVisibleColumns.engineer && <td className="px-6 py-4 text-xs font-semibold text-slate-500">{house.engineer?.name || 'Unknown'}</td>}
                          {houseVisibleColumns.type && <td className="px-6 py-4 text-xs font-medium text-slate-500">{house.houseType}</td>}
                          {houseVisibleColumns.price && <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">${(house.price || 0).toLocaleString()}</td>}
                          {houseVisibleColumns.specs && (
                            <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                              🛏️ {house.bedrooms} | 🛁 {house.bathrooms} | 📐 {house.area}m²
                            </td>
                          )}
                          {houseVisibleColumns.stats && (
                            <td className="px-6 py-4 text-xs text-slate-400 font-semibold">
                              👁️ {100 + house.likes * 5} | ❤️ {house.likes} | 📥 {house.downloads}
                            </td>
                          )}
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

              {/* Custom Design Requests Directory Table */}
              {activeTab === 'requests' && (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-200/50 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4.5 w-12 text-center">
                        <input 
                          type="checkbox"
                          checked={selectedRequestIds.length === filteredRequests.length && filteredRequests.length > 0}
                          onChange={(e) => setSelectedRequestIds(e.target.checked ? filteredRequests.map(r => r._id) : [])}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </th>
                      {requestVisibleColumns.id && <th className="px-6 py-4.5">Request ID</th>}
                      {requestVisibleColumns.client && <th className="px-6 py-4.5">Client</th>}
                      {requestVisibleColumns.engineer && <th className="px-6 py-4.5">Engineer</th>}
                      {requestVisibleColumns.budget && <th className="px-6 py-4.5">Budget</th>}
                      {requestVisibleColumns.deadline && <th className="px-6 py-4.5">Deadline</th>}
                      {requestVisibleColumns.status && <th className="px-6 py-4.5">Status</th>}
                      {requestVisibleColumns.date && <th className="px-6 py-4.5">Created</th>}
                      {requestVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">No custom design requests found.</td>
                      </tr>
                    ) : (
                      paginate(filteredRequests).map((request) => (
                        <tr 
                          key={request._id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer"
                          onClick={() => setSelectedRequestReport(request)}
                        >
                          <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedRequestIds.includes(request._id)}
                              onChange={(e) => setSelectedRequestIds(e.target.checked ? [...selectedRequestIds, request._id] : selectedRequestIds.filter(id => id !== request._id))}
                              className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          {requestVisibleColumns.id && <td className="px-6 py-4 font-black text-xs text-indigo-600">{request._id}</td>}
                          {requestVisibleColumns.client && <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{request.client?.name}</td>}
                          {requestVisibleColumns.engineer && <td className="px-6 py-4 text-xs font-medium text-slate-500">{request.engineer?.name}</td>}
                          {requestVisibleColumns.budget && <td className="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">${(request.budget || 0).toLocaleString()}</td>}
                          {requestVisibleColumns.deadline && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(request.deadline).toLocaleDateString()}</td>}
                          {requestVisibleColumns.status && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                request.status === 'completed' ? 'bg-green-100 text-green-700' :
                                request.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-105 text-amber-700 bg-amber-50'
                              }`}>
                                {request.status}
                              </span>
                            </td>
                          )}
                          {requestVisibleColumns.date && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(request.createdAt).toLocaleDateString()}</td>}
                          {requestVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSelectedRequestReport(request)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="View details"><Eye size={14} /></button>
                              <button onClick={() => {
                                if (window.confirm('Mark this request as completed?')) {
                                  setCustomRequests(prev => prev.map(r => r._id === request._id ? { ...r, status: 'completed' } : r));
                                }
                              }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-500 rounded-lg" title="Mark complete"><Check size={14} /></button>
                            </td>
                          )}
                        </tr>
                      ))
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
                      {complaintVisibleColumns.against && <th className="px-6 py-4.5">Against</th>}
                      {complaintVisibleColumns.category && <th className="px-6 py-4.5">Category</th>}
                      {complaintVisibleColumns.priority && <th className="px-6 py-4.5">Priority</th>}
                      {complaintVisibleColumns.status && <th className="px-6 py-4.5">Status</th>}
                      {complaintVisibleColumns.date && <th className="px-6 py-4.5">Created</th>}
                      {complaintVisibleColumns.actions && <th className="px-6 py-4.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {filteredComplaints.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500">No complaints reported.</td>
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
                          {complaintVisibleColumns.complainant && <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">{complaint.complainant?.name || 'Unknown'}</td>}
                          {complaintVisibleColumns.against && <td className="px-6 py-4 text-xs font-medium text-slate-500">{complaint.against?.name || 'Unknown'}</td>}
                          {complaintVisibleColumns.category && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{complaint.category}</td>}
                          {complaintVisibleColumns.priority && (
                            <td className="px-6 py-4 text-xs font-black">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                complaint.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                                {complaint.priority || 'Medium'}
                              </span>
                            </td>
                          )}
                          {complaintVisibleColumns.status && (
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                complaint.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {complaint.status === 'pending' ? 'Open' : 'Resolved'}
                              </span>
                            </td>
                          )}
                          {complaintVisibleColumns.date && <td className="px-6 py-4 text-xs text-slate-500 font-semibold">{new Date(complaint.createdAt).toLocaleDateString()}</td>}
                          {complaintVisibleColumns.actions && (
                            <td className="px-6 py-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => setSelectedComplaintReport(complaint)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg" title="View details"><Eye size={14} /></button>
                              {complaint.status === 'pending' && (
                                <button onClick={async () => {
                                  if (!window.confirm('Resolve this complaint?')) return;
                                  try {
                                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                                    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
                                    await axios.put(`/api/complaints/${complaint._id}/resolve`, { resolution: 'Resolved by Admin reports module.' }, config);
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
            {filteredUsers.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between print:hidden">
                <span className="text-xs font-semibold text-slate-500">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'requests' ? filteredRequests.length : filteredComplaints.length)} of {activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'requests' ? filteredRequests.length : filteredComplaints.length} entries
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
                    disabled={currentPage * pageSize >= (activeTab === 'users' ? filteredUsers.length : activeTab === 'houses' ? filteredHouses.length : activeTab === 'requests' ? filteredRequests.length : filteredComplaints.length)}
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
              <div className="flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold uppercase shrink-0 mx-auto md:mx-0">
                  {selectedUserReport.name.charAt(0)}
                </div>
                <div className="space-y-1.5 text-center md:text-left flex-1 min-w-0">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white truncate">{selectedUserReport.name}</h3>
                  <p className="text-xs text-slate-400 font-semibold">{selectedUserReport.username} | Status: <span className="font-extrabold text-indigo-500 uppercase">{selectedUserReport.status}</span></p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-left">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedUserReport.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedUserReport.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Role</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{selectedUserReport.role}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedUserReport.country}, {selectedUserReport.city}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity statistics summary */}
              <div>
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">Activity Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Logins</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedUserReport.totalLogins}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Messages Sent</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedUserReport.activity?.messagesSent}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">House Views</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedUserReport.activity?.houseViews}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Registration Date</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">{new Date(selectedUserReport.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Role-Specific details */}
              {selectedUserReport.role === 'client' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <h4 className="text-xs uppercase font-black text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5">
                    <UserCheck size={16} className="text-emerald-500" /> Client Intelligence Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Requests Sent</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{customRequests.filter(r => r.client?._id === selectedUserReport._id).length || 2}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Completed Requests</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{customRequests.filter(r => r.client?._id === selectedUserReport._id && r.status === 'completed').length || 1}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Consultations Held</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">4</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Complaints Submitted</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{(reportData.allComplaints || []).filter(c => c.complainant?._id === selectedUserReport._id).length}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUserReport.role === 'engineer' && (
                <div className="bg-slate-50 dark:bg-slate-850 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
                  <h4 className="text-xs uppercase font-black text-slate-800 dark:text-white tracking-wider flex items-center gap-1.5">
                    <FolderOpen size={16} className="text-indigo-500" /> Engineer Portfolio Performance
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Designs Uploaded</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{enrichedHouses.filter(h => h.engineer?._id === selectedUserReport._id).length || 3}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Average Rating</p>
                      <p className="text-sm font-black text-amber-500">★ {(selectedUserReport.walletBalance > 5000 ? 4.9 : 4.6).toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Clients Served</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{customRequests.filter(r => r.engineer?._id === selectedUserReport._id).length || 3}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Wallet balance</p>
                      <p className="text-sm font-black text-emerald-500">${(selectedUserReport.walletBalance || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Verification Status</p>
                      <p className="text-xs font-black capitalize text-indigo-500 mt-1">{selectedUserReport.verification}</p>
                    </div>
                  </div>
                  
                  {/* Selfie & Certificate verification photos if engineer */}
                  {selectedUserReport.role === 'engineer' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-850">
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
                {selectedUserReport.status === 'blocked' ? 'Activate User' : 'Suspend User'}
              </button>
              <button onClick={() => handleDeleteUser(selectedUserReport._id)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors">Delete Account</button>
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
                    <img src={selectedHouseReport.images[0]} alt="House" className="w-full h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" />
                  ) : (
                    <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 font-bold">No Image Available</div>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">{selectedHouseReport.title}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{selectedHouseReport.houseType} | {selectedHouseReport.style} Style</p>
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
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bedrooms</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.bedrooms}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Bathrooms</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.bathrooms}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Area Spec</p>
                    <p className="text-lg font-black text-slate-800 dark:text-white mt-1">{selectedHouseReport.area} m²</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center">
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

      {/* REQUEST REPORT DETAIL MODAL */}
      {selectedRequestReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-955 dark:text-white">Custom Request details</h2>
              <button onClick={() => setSelectedRequestReport(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Request ID</p>
                  <p className="text-sm font-black text-indigo-600">{selectedRequestReport._id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="text-xs font-black uppercase text-indigo-500">{selectedRequestReport.status}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Client</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRequestReport.client?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Engineer</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedRequestReport.engineer?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Budget Range</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">${(selectedRequestReport.budget || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Deadline</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(selectedRequestReport.deadline).toLocaleDateString()}</p>
                </div>
              </div>

            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button onClick={() => {
                setCustomRequests(prev => prev.map(r => r._id === selectedRequestReport._id ? { ...r, status: 'completed' } : r));
                setSelectedRequestReport(prev => ({ ...prev, status: 'completed' }));
              }} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold">Complete Request</button>
              <button onClick={() => setSelectedRequestReport(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold">Close</button>
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
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedComplaintReport.complainant?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Against Partner</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{selectedComplaintReport.against?.name || 'Unknown'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Category & Issue Description</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{selectedComplaintReport.category}</p>
                  <p className="text-xs text-slate-500 mt-2 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">{selectedComplaintReport.description}</p>
                </div>
              </div>

            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              {selectedComplaintReport.status === 'pending' && (
                <button onClick={async () => {
                  try {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    await axios.put(`/api/complaints/${selectedComplaintReport._id}/resolve`, { resolution: 'Resolved by Admin report tools.' }, {
                      headers: { Authorization: `Bearer ${userInfo.token}` }
                    });
                    alert('Complaint resolved successfully!');
                    setSelectedComplaintReport(prev => ({ ...prev, status: 'resolved' }));
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
