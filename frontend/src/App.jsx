import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Services from './pages/Services';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import ManageAdmins from './pages/admin/ManageAdmins';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDesigns from './pages/admin/ManageDesigns';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import ManageContacts from './pages/admin/ManageContacts';
import ManageWithdrawals from './pages/admin/ManageWithdrawals';
import ClientDashboard from './pages/ClientDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerOverview from './pages/engineer/EngineerOverview';
import EngineerReports from './pages/engineer/EngineerReports';
import UploadDesign from './pages/engineer/UploadDesign';
import MyDesigns from './pages/engineer/MyDesigns';
import Availability from './pages/engineer/Availability';
import ProtectedRoute from './components/ProtectedRoute';
import MessagesView from './components/MessagesView';
import ClientNavbar from './components/client/ClientNavbar';
import MyFavorites from './pages/client/MyFavorites';
import ClientMyDesigns from './pages/client/ClientMyDesigns';
import ClientPurchases from './pages/client/ClientPurchases';
import InstallPWA from './components/InstallPWA';
import ComplaintManager from './components/shared/ComplaintManager';
import ManageComplaints from './pages/admin/ManageComplaints';
import { useEffect } from 'react';

const ClearCacheComponent = () => {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      }).then(() => {
        window.location.href = '/login';
      });
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl max-w-md w-full">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Clearing App Cache...</h1>
        <p className="text-slate-500 dark:text-slate-400">Please wait while we update your app to the latest version.</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <InstallPWA />
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          >
            <Route index element={<AdminOverview />} />
            <Route path="admins" element={<ManageAdmins />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="designs" element={<ManageDesigns />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="withdrawals" element={<ManageWithdrawals />} />
            <Route path="contacts" element={<ManageContacts />} />
            <Route path="complaints" element={<ManageComplaints />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route 
            path="/engineer-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['engineer']}>
                <EngineerDashboard />
              </ProtectedRoute>
            } 
          >
            <Route index element={<EngineerOverview />} />
            <Route path="reports" element={<EngineerReports />} />
            <Route path="upload" element={<UploadDesign />} />
            <Route path="designs" element={<MyDesigns />} />
            <Route path="messages" element={<div className="h-full p-2 md:p-6"><MessagesView /></div>} />
            <Route path="complaints" element={<div className="h-full overflow-y-auto custom-scrollbar p-2 md:p-6"><ComplaintManager /></div>} />
            <Route path="availability" element={<Availability />} />
          </Route>

          <Route 
            path="/client-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <ClientDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client-dashboard/favorites" 
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <MyFavorites />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client-dashboard/messages"  
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                  <ClientNavbar />
                  <div className="flex-1 max-w-7xl mx-auto w-full p-2 md:p-6 h-[calc(100vh-80px)]">
                    <MessagesView />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client-dashboard/my-designs"  
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                  <ClientNavbar />
                  <div className="flex-1 max-w-7xl mx-auto w-full p-6">
                    <ClientMyDesigns />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client-dashboard/purchases"  
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                  <ClientNavbar />
                  <div className="flex-1 max-w-7xl mx-auto w-full p-6">
                    <ClientPurchases />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/client-dashboard/complaints"  
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
                  <ClientNavbar />
                  <div className="flex-1 max-w-7xl mx-auto w-full p-6">
                    <ComplaintManager />
                  </div>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route path="/clear-cache" element={<ClearCacheComponent />} />
        </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
