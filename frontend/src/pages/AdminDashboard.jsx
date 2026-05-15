import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-slate-800">Control Panel</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Administrator,</span>
            <span className="font-bold text-slate-900">{user?.name}</span>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg border border-blue-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* This renders the nested routes (Overview, Users, Designs, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
