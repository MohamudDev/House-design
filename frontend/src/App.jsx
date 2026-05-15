import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import AdminOverview from './pages/admin/AdminOverview';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDesigns from './pages/admin/ManageDesigns';
import ClientDashboard from './pages/ClientDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import EngineerOverview from './pages/engineer/EngineerOverview';
import UploadDesign from './pages/engineer/UploadDesign';
import MyDesigns from './pages/engineer/MyDesigns';
import Availability from './pages/engineer/Availability';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
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
            <Route path="reports" element={<div className="p-8 text-slate-500">Reports coming soon...</div>} />
            <Route path="settings" element={<div className="p-8 text-slate-500">Settings coming soon...</div>} />
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
            <Route path="messages" element={<div className="p-8 text-slate-500">Messages functionality coming soon...</div>} />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
