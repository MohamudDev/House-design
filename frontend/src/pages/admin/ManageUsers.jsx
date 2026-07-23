import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, ShieldAlert, Trash2, X, FileText, ExternalLink, Search, Filter, Ban, Play, Plus } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserDocs, setSelectedUserDocs] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'client' });

  const fetchUsers = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.get('/api/admin/users', config);
      setUsers(data.data);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/admin/users', formData, config);
      alert('User created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'client' });
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, isApproved, verificationStatus) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`/api/admin/users/${userId}/status`, { isApproved, verificationStatus }, config);
      fetchUsers(); 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update status';
      alert(`Error: ${message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        await axios.delete(`/api/admin/users/${id}`, config);
        fetchUsers();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleSuspendToggle = async (userId, currentlySuspended) => {
    if (!window.confirm(`Are you sure you want to ${currentlySuspended ? 'activate' : 'suspend'} this user?`)) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      const endpoint = currentlySuspended ? `/api/admin/users/${userId}/activate` : `/api/admin/users/${userId}/suspend`;
      await axios.put(endpoint, {}, config);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating suspension status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    let matchesStatus = true;
    if (statusFilter === 'suspended') matchesStatus = user.isSuspended;
    else if (statusFilter === 'active') matchesStatus = !user.isSuspended && user.isApproved;
    else if (statusFilter === 'pending') matchesStatus = user.role === 'engineer' && !user.isApproved && user.verificationStatus !== 'rejected';
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) return <div className="p-6 text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Users</h1>
          <p className="text-slate-500 dark:text-slate-400">Approve engineers and manage client accounts.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors sm:mr-4"
          >
            <Plus size={20} /> Add New User
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="client">Clients</option>
            <option value="engineer">Engineers</option>
            <option value="admin">Admins</option>
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending Auth</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800 dark:text-white">{user.name}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{user.email}</td>
                  <td className="p-4 uppercase text-xs font-bold tracking-wider">
                    <span className={`px-2 py-1 rounded ${
                      user.role === 'admin' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 
                      user.role === 'engineer' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {user.isSuspended ? (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1 text-sm font-medium"><Ban size={16}/> Suspended</span>
                      ) : user.role === 'engineer' ? (
                        user.isApproved ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-sm font-medium"><Check size={16}/> Verified</span>
                        ) : user.verificationStatus === 'rejected' ? (
                          <span className="text-red-600 dark:text-red-400 flex items-center gap-1 text-sm font-medium"><ShieldAlert size={16}/> Rejected</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-sm font-medium"><ShieldAlert size={16}/> Pending</span>
                        )
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-sm font-medium"><Check size={16}/> Active</span>
                      )}
                      {user.role === 'engineer' && (user.nationalIdUrl || user.certificateUrl) && (
                        <button onClick={() => setSelectedUserDocs(user)} className="text-xs text-blue-600 hover:underline text-left mt-1">View Documents</button>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.role === 'engineer' && !user.isApproved && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(user._id, true, 'verified')}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                          >
                            Approve
                          </button>
                          {user.verificationStatus !== 'rejected' && (
                            <button 
                              onClick={() => handleUpdateStatus(user._id, false, 'rejected')}
                              className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </>
                      )}
                      {user.role === 'engineer' && user.isApproved && !user.isSuspended && (
                        <button 
                          onClick={() => handleUpdateStatus(user._id, false, 'pending')}
                          className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                      {user.role !== 'superadmin' && (
                        <>
                          <button 
                            onClick={() => handleSuspendToggle(user._id, user.isSuspended)} 
                            className={`p-2 rounded-lg transition-colors ${
                              user.isSuspended 
                                ? 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30' 
                                : 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30'
                            }`}
                            title={user.isSuspended ? "Activate User" : "Suspend User"}
                          >
                            {user.isSuspended ? <Play size={18} /> : <Ban size={18} />}
                          </button>
                          {user.role !== 'admin' && (
                            <button 
                              onClick={() => handleDelete(user._id)} 
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 size={18}/>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents Modal */}
      {selectedUserDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Engineer Documents</h2>
              </div>
              <button 
                onClick={() => setSelectedUserDocs(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">National ID</h3>
                {selectedUserDocs.nationalIdUrl ? (
                  <a href={selectedUserDocs.nationalIdUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400 hover:underline">
                    <ExternalLink size={16} /> View National ID
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Not uploaded</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Professional Certificate</h3>
                {selectedUserDocs.certificateUrl ? (
                  <a href={selectedUserDocs.certificateUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-blue-600 dark:text-blue-400 hover:underline">
                    <ExternalLink size={16} /> View Certificate
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Not uploaded</p>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Selfie Verification</h3>
                {selectedUserDocs.selfieUrl ? (
                  <div className="flex flex-col gap-2">
                    <img 
                      src={selectedUserDocs.selfieUrl} 
                      alt="Selfie" 
                      className="w-full max-w-[200px] h-[150px] object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/200x150?text=No+Selfie'; }}
                    />
                    <a href={selectedUserDocs.selfieUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">
                      <ExternalLink size={12} /> Open original selfie
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New User</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input 
                  type="email" 
                  required 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select 
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="client" className="dark:bg-slate-800">Client</option>
                  <option value="engineer" className="dark:bg-slate-800">Engineer</option>
                </select>
                {formData.role === 'engineer' && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">Note: Engineers created by admins are automatically verified.</p>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
