import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { UploadCloud, CheckCircle2, AlertCircle, FileImage, Box, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ModelViewer from '../../components/ModelViewer';

const UploadDesign = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    houseType: 'Villa',
    rooms: '',
    bathrooms: '',
    kitchens: '',
    carParking: false,
    budgetEstimate: '',
    description: ''
  });
  
  const [files, setFiles] = useState({
    model3D: null,
    images: null
  });
  
  const [modelPreview, setModelPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (name === 'model3D') {
      const file = selectedFiles[0];
      setFiles({ ...files, model3D: file });
      // Create preview URL for 3D model if it's a glb/gltf
      if (file && (file.name.endsWith('.glb') || file.name.endsWith('.gltf'))) {
        if (modelPreview) URL.revokeObjectURL(modelPreview);
        setModelPreview(URL.createObjectURL(file));
      }
    } else if (name === 'images') {
      setFiles({ ...files, images: selectedFiles[0] });
    } else {
      setFiles({ ...files, [name]: selectedFiles[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!files.images || !files.model3D) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please upload both a thumbnail image and a 3D model file.' });
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('houseType', formData.houseType);
    submitData.append('rooms', formData.rooms);
    submitData.append('bathrooms', formData.bathrooms);
    submitData.append('kitchens', formData.kitchens);
    submitData.append('carParking', formData.carParking);
    submitData.append('budgetEstimate', formData.budgetEstimate);
    submitData.append('description', formData.description);

    if (files.images) submitData.append('images', files.images);
    if (files.model3D) submitData.append('model3D', files.model3D);

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      await axios.post('/api/engineer/designs', submitData, config);
      setMessage({ type: 'success', text: 'Design uploaded successfully! It is now pending admin approval.' });
      
      // Reset form
      setFormData({ title: '', houseType: 'Villa', rooms: '', bathrooms: '', kitchens: '', carParking: false, budgetEstimate: '', description: '' });
      setFiles({ model3D: null, images: null });
      
      // Redirect after 2 seconds
      setTimeout(() => navigate('/engineer-dashboard/designs'), 2000);

    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error uploading design' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isApproved) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
          <UploadCloud size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Upload Restricted</h2>
        <p className="text-slate-500 mt-2 max-w-md">You cannot upload designs until your engineer account has been verified and approved by an administrator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload New Design</h1>
        <p className="text-slate-500 dark:text-slate-400">Submit your architectural plans for gallery approval.</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <form 
        onSubmit={handleSubmit} 
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { /* allow enter in textarea */ } else if (e.key === 'Enter') { e.stopPropagation(); } }}
        className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
      >
        
        {/* Basic Info */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">1. Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Design Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                pattern="^[a-zA-Z\s]+$"
                title="Title should only contain letters and spaces"
                value={formData.title} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
                placeholder="e.g. Modern Lakefront Villa" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Type</label>
              <select name="houseType" value={formData.houseType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow">
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Mansion">Mansion</option>
                <option value="Townhouse">Townhouse</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bedrooms</label>
              <input type="number" name="rooms" required min="1" value={formData.rooms} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 4" />
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bathrooms / Suuli</label>
              <input type="number" name="bathrooms" required min="1" value={formData.bathrooms} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 2" />
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kitchens / Jiko</label>
              <input type="number" name="kitchens" required min="1" value={formData.kitchens} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 1" />
            </div>

            <div className="col-span-1 md:col-span-1 flex items-center mt-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="carParking" checked={formData.carParking} onChange={handleInputChange} className="sr-only" />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.carParking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.carParking ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Car Parking (Garaash)
                </div>
              </label>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estimated Build Budget (USD)</label>
              <input type="number" name="budgetEstimate" required min="0" step="0.1" value={formData.budgetEstimate} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 250" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea name="description" required rows="4" value={formData.description} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow resize-none" placeholder="Describe the materials, architecture style, and unique features..."></textarea>
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">2. Design Files</h2>
          <div className="space-y-6">
            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Thumbnail Image */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><FileImage size={16} /> Thumbnail Image</label>
                  <input type="file" name="images" required accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-600 transition-colors" />
                  {files.images && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">{files.images.name}</p>}
                </div>
                {files.images && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Image Preview</label>
                    <img src={URL.createObjectURL(files.images)} alt="Thumbnail Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                  </div>
                )}
              </div>

              {/* 3D Model */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2"><Box size={16} /> 3D Model File (.obj, .glb)</label>
                  <input type="file" name="model3D" required accept=".obj,.glb,.gltf,.fbx" onChange={handleFileChange} className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-600 transition-colors" />
                  {files.model3D && <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">{files.model3D.name}</p>}
                </div>

                {modelPreview && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">3D Preview</label>
                    <ModelViewer url={modelPreview} />
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
          {loading ? 'Uploading Design...' : 'Submit for Admin Approval'}
          {!loading && <UploadCloud size={20} />}
        </button>

      </form>
    </div>
  );
};

export default UploadDesign;
