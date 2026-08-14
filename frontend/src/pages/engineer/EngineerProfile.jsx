import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { User, Briefcase, Clock, CheckCircle2, AlertCircle, Save, Camera } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';

const EngineerProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    specialization: '',
    isAvailable: true,
    workingHours: '9 AM - 5 PM',
    profileImage: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedInfo = localStorage.getItem('userInfo');
        if (!storedInfo) {
          setMessage({ type: 'error', text: 'Please log in again.' });
          setLoading(false);
          return;
        }
        const userInfo = JSON.parse(storedInfo);
        const { data } = await axios.get('/api/engineer/profile', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        const p = data.data;
        setProfile({
          name: p.name || '',
          bio: p.bio || '',
          specialization: p.specialization || '',
          isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
          workingHours: p.workingHours || '9 AM - 5 PM',
          profileImage: p.profileImage || ''
        });
      } catch (error) {
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load profile'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePhotoPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file (JPG, PNG, WebP).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be under 5MB.' });
      return;
    }
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage({ type: '', text: '' });
  };

  // Only show photo the engineer uploaded on this page — never registration selfie
  const displayPhoto = photoPreview || (profile.profileImage ? resolveMediaUrl(profile.profileImage) : '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('bio', profile.bio);
      formData.append('specialization', profile.specialization);
      formData.append('workingHours', profile.workingHours);
      formData.append('isAvailable', String(profile.isAvailable));
      if (photoFile) {
        formData.append('profileImage', photoFile);
      }

      const { data } = await axios.put('/api/engineer/profile', formData, {
        headers: {
          Authorization: `Bearer ${userInfo.token}`
        }
      });

      if (data.success) {
        const profileImage = data.data.profileImage || profile.profileImage;
        setProfile((prev) => ({ ...prev, profileImage }));
        setPhotoFile(null);
        if (photoPreview && photoPreview.startsWith('blob:')) {
          URL.revokeObjectURL(photoPreview);
        }
        setPhotoPreview('');
        updateUser({
          name: data.data.name,
          bio: data.data.bio,
          specialization: data.data.specialization,
          isAvailable: data.data.isAvailable,
          workingHours: data.data.workingHours,
          profileImage
        });
        setMessage({ type: 'success', text: 'Profile saved successfully.' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save profile'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Clients see this when they open your profile from a design.
        </p>
      </div>

      {message.text && (
        <div
          className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="relative shrink-0">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                alt={profile.name || 'Profile'}
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-800"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-2xl font-bold border border-indigo-200 dark:border-indigo-800">
                {(profile.name || user?.name || 'E').charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-800"
              title="Change photo"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePhotoPick}
            />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">{profile.name || 'Your name'}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
              {displayPhoto ? 'Change photo' : 'Upload photo'}
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <User size={14} /> Display name
          </label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Briefcase size={14} /> Specialization
          </label>
          <input
            type="text"
            name="specialization"
            value={profile.specialization}
            onChange={handleChange}
            placeholder="e.g. Residential, Apartments, Interior"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell clients about your experience and style..."
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Clock size={14} /> Working hours
          </label>
          <input
            type="text"
            name="workingHours"
            value={profile.workingHours}
            onChange={handleChange}
            placeholder="9 AM - 5 PM"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer">
          <div>
            <p className="font-bold text-slate-800 dark:text-white text-sm">Available for work</p>
            <p className="text-xs text-slate-500 mt-0.5">Clients see Available / Away on your profile</p>
          </div>
          <input
            type="checkbox"
            name="isAvailable"
            checked={profile.isAvailable}
            onChange={handleChange}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 transition-colors"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  );
};

export default EngineerProfile;
