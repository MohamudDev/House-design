import { useState } from 'react';
import axios from 'axios';
import { X, Save } from 'lucide-react';

const EditDesignModal = ({ design, onClose, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    title: design.title || '',
    houseType: design.houseType || 'Villa',
    rooms: design.rooms || '',
    bathrooms: design.bathrooms || '',
    kitchens: design.kitchens || '',
    carParking: design.carParking || false,
    budgetEstimate: design.budgetEstimate || '',
    description: design.description || ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(design.images && design.images.length > 0 ? `${design.images[0]}` : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      if (imageFile) {
        submitData.append('images', imageFile);
      }

      await axios.put(`/api/engineer/designs/${design._id}`, submitData, config);
      onUpdateSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update design');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden transition-colors">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Design Details</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Design Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                value={formData.title} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
              />
            </div>
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Update Thumbnail Image</label>
              <input 
                type="file" 
                name="images" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-600 transition-colors" 
              />
              {imagePreview && (
                <div className="mt-4">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">House Type</label>
              <select 
                name="houseType" 
                value={formData.houseType} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow"
              >
                <option value="Villa">Villa</option>
                <option value="Apartment">Apartment</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Mansion">Mansion</option>
                <option value="Townhouse">Townhouse</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bedrooms</label>
              <input 
                type="number" 
                name="rooms" 
                required 
                min="1" 
                value={formData.rooms} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
              />
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Bathrooms / Suuli</label>
              <input type="number" name="bathrooms" required min="1" value={formData.bathrooms} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" />
            </div>

            <div className="col-span-1 md:col-span-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kitchens / Jiko</label>
              <input type="number" name="kitchens" required min="1" value={formData.kitchens} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" />
            </div>

            <div className="col-span-1 md:col-span-1 flex items-center mt-6">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="carParking" checked={formData.carParking} onChange={handleInputChange} className="sr-only" />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.carParking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.carParking ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Car Parking
                </div>
              </label>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Estimated Build Budget (USD)</label>
              <input 
                type="number" 
                name="budgetEstimate" 
                required 
                min="0" 
                step="0.1"
                value={formData.budgetEstimate} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" 
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea 
                name="description" 
                required 
                rows="4" 
                value={formData.description} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow resize-none"
              ></textarea>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={16} />
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditDesignModal;
