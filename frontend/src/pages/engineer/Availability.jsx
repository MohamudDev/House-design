import { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, User as UserIcon, Briefcase, CheckCircle2, AlertCircle, Save } from 'lucide-react';

const Availability = () => {
  const [profile, setProfile] = useState({
    bio: '',
    specialization: '',
    isAvailable: true,
    workingHours: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedInfo = localStorage.getItem('userInfo');
        if (!storedInfo) {
          setMessage({ type: 'error', text: 'Authentication error. Please log in again.' });
          setLoading(false);
          return;
        }

        const userInfo = JSON.parse(storedInfo);
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };

        const baseUrl = window.location.origin;
        console.log('Using Base URL:', baseUrl);

        // Test connectivity
        try {
          console.log('Testing Connectivity to:', `${baseUrl}/api/ping`);
          const pingRes = await axios.get(`${baseUrl}/api/ping`);
          console.log('Connectivity success:', pingRes.data.message);
        } catch (pingErr) {
          console.error('Connectivity check failed:', pingErr.message);
        }
        
        console.log('Fetching Profile from:', `${baseUrl}/api/auth/profile`);
        const { data } = await axios.get(`${baseUrl}/api/auth/profile`, config);
        console.log('Profile loaded:', data.data.email);
        
        setProfile({
          bio: data.data.bio || '',
          specialization: data.data.specialization || '',
          isAvailable: data.data.isAvailable !== undefined ? data.data.isAvailable : true,
          workingHours: data.data.workingHours || '9 AM - 5 PM'
        });
      } catch (error) {
        console.error('Fetch Error:', error.response || error);
        const status = error.response?.status;
        const errMsg = error.response?.data?.message || error.message;
        
        setMessage({ 
          type: 'error', 
          text: `Error ${status || ''}: ${errMsg}. Please ensure the backend is running on port 5005.` 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({
      ...profile,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      };

      // Only send the fields that should be updated
      const updateData = {
        bio: profile.bio,
        specialization: profile.specialization,
        isAvailable: profile.isAvailable,
        workingHours: profile.workingHours
      };

      const baseUrl = 'http://localhost:5005';
      console.log('DIRECT SAVE to:', `${baseUrl}/api/auth/profile`, updateData);
      
      const response = await axios.put(`${baseUrl}/api/auth/profile`, updateData, config);
      console.log('SAVE SUCCESS:', response.data);
      
      setMessage({ type: 'success', text: 'Profile and availability updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error.response || error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error updating profile. Check server console.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium">Loading your professional profile...</p>
    </div>
  );

  if (message.type === 'error' && !profile.specialization && !profile.bio) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Failed to Load Profile</h2>
        <p className="text-slate-500 mb-8">{message.text}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
        >
          Try Refreshing
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Availability & Profile</h1>
        <p className="text-slate-500">Manage your professional presence and current work status.</p>
        <p className="text-[10px] text-slate-400 mt-1">Database Sync ID: {JSON.parse(localStorage.getItem('userInfo'))?.id || 'Not Found'}</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Availability Status */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="text-indigo-600" size={20} />
            Work Status
          </h2>
          
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex-1 w-full">
              <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                <input 
                  type="checkbox" 
                  id="isAvailable" 
                  name="isAvailable"
                  checked={profile.isAvailable}
                  onChange={handleInputChange}
                  className="opacity-0 w-0 h-0 peer" 
                />
                <label 
                  htmlFor="isAvailable" 
                  className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-slate-300 transition-all duration-300 rounded-full peer-checked:bg-indigo-600 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:transition-all before:duration-300 before:rounded-full peer-checked:before:translate-x-6"
                ></label>
              </div>
              <div>
                <p className="font-bold text-slate-800">{profile.isAvailable ? 'Available for new projects' : 'Currently Away / Fully Booked'}</p>
                <p className="text-xs text-slate-500">Toggle your status to let clients know if you're taking new work.</p>
              </div>
            </div>

            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-2">Working Hours / Timezone</label>
              <input 
                type="text" 
                name="workingHours"
                value={profile.workingHours}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
                placeholder="e.g. 9 AM - 5 PM (GMT+3)" 
              />
            </div>
          </div>
        </div>

        {/* Professional Profile */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserIcon className="text-indigo-600" size={20} />
            Professional Profile
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <Briefcase size={16} /> Specialization
              </label>
              <input 
                type="text" 
                name="specialization"
                value={profile.specialization}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
                placeholder="e.g. Modern Residential, Sustainable Design, Urban Planning" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Professional Bio</label>
              <textarea 
                name="bio"
                value={profile.bio}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow resize-none" 
                placeholder="Tell clients about your experience, style, and approach..."
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-70"
          >
            {saving ? 'Saving Changes...' : 'Save Profile & Availability'}
            {!saving && <Save size={20} />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Availability;
