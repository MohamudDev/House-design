import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDesigns from './pages/admin/ManageDesigns';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import ManageContacts from './pages/admin/ManageContacts';
import ClientDashboard from './pages/ClientDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerOverview from './pages/engineer/EngineerOverview';
import UploadDesign from './pages/engineer/UploadDesign';
import MyDesigns from './pages/engineer/MyDesigns';
import Availability from './pages/engineer/Availability';
import ProtectedRoute from './components/ProtectedRoute';
import MessagesView from './components/MessagesView';
import ClientNavbar from './components/client/ClientNavbar';
import MyFavorites from './pages/client/MyFavorites';
import ClientMyDesigns from './pages/client/ClientMyDesigns';
import ClientPurchases from './pages/client/ClientPurchases';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="designs" element={<ManageDesigns />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="contacts" element={<ManageContacts />} />
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
            <Route path="upload" element={<UploadDesign />} />
            <Route path="designs" element={<MyDesigns />} />
            <Route path="messages" element={<div className="p-6"><MessagesView /></div>} />
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
                  <div className="flex-1 max-w-7xl mx-auto w-full p-6">
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
        </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
