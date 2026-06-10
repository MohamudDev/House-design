import { useState, useEffect } from 'react';
import axios from 'axios';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateStatus = async (userId, isApproved) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      };
      await axios.put(`/api/admin/users/${userId}/status`, { isApproved }, config);
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
        alert('Failed to delete user');
      }
    }
  };

  if (loading) return <div className="p-6 text-slate-500 dark:text-slate-400">Loading...</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manage Users</h1>
        <p className="text-slate-500 dark:text-slate-400">Approve engineers and manage client accounts.</p>
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
              {users.map((user) => (
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
                    {user.role === 'engineer' ? (
                      user.isApproved ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-sm font-medium"><Check size={16}/> Approved</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-sm font-medium"><ShieldAlert size={16}/> Pending</span>
                      )
                    ) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.role === 'engineer' && !user.isApproved && (
                        <button 
                          onClick={() => handleUpdateStatus(user._id, true)}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {user.role === 'engineer' && user.isApproved && (
                        <button 
                          onClick={() => handleUpdateStatus(user._id, false)}
                          className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                        >
                          Revoke
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleDelete(user._id)} 
                          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 size={18}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;
