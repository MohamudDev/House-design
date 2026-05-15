import { Outlet } from 'react-router-dom';
import EngineerSidebar from '../components/engineer/EngineerSidebar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

const EngineerDashboard = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <EngineerSidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-slate-200 px-8 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold text-slate-800">Workspace</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">Welcome back,</span>
            <span className="font-bold text-slate-900">{user?.name}</span>
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg border border-indigo-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          {!user?.isApproved && (
            <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg flex items-start gap-4 text-amber-800 shadow-sm">
              <ShieldAlert size={24} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg">Account Pending Approval</h3>
                <p className="text-sm mt-1 opacity-90">
                  Your account is currently under review. Some features like uploading designs may be restricted until an admin approves your profile.
                </p>
              </div>
            </div>
          )}

          {/* This renders the nested routes (Overview, Upload, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EngineerDashboard;
