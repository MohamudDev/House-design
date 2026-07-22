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
    description: '',
    location: '',
    numberOfFloors: '',
    totalUnits: '',
    parkingType: 'Outdoor',
    vehicleType: [],
    totalParkingSpaces: '',
    parkingLocation: 'Ground Floor',
    reservedParking: false,
    visitorParking: false,
    parkingDescription: ''
  });
  
  const [units, setUnits] = useState([]);
  
  const [files, setFiles] = useState({
    model3D: null,
    images: null
  });
  
  const [interiorGallery, setInteriorGallery] = useState([]);
  const [modelPreview, setModelPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const addInteriorRoom = () => {
    setInteriorGallery([
      ...interiorGallery,
      { id: Date.now(), roomName: '', description: '', order: interiorGallery.length + 1, file: null, preview: null }
    ]);
  };

  const removeInteriorRoom = (id) => {
    const updated = interiorGallery.filter(item => item.id !== id);
    // update order
    updated.forEach((item, index) => { item.order = index + 1; });
    setInteriorGallery(updated);
  };

  const handleInteriorChange = (id, field, value) => {
    setInteriorGallery(interiorGallery.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleInteriorFile = (id, file) => {
    if (file) {
      const preview = URL.createObjectURL(file);
      setInteriorGallery(interiorGallery.map(item => item.id === id ? { ...item, file, preview } : item));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    
    if (name === 'totalUnits' && formData.houseType === 'Apartment') {
      const count = parseInt(value) || 0;
      const newUnits = Array(count).fill().map((_, i) => {
        return units[i] || {
          unitName: `Unit ${i + 1}`,
          floorNumber: '',
          bedrooms: '',
          bathrooms: '',
          kitchens: '',
          livingRooms: '',
          diningRooms: '',
          balconies: '',
          area: ''
        };
      });
      setUnits(newUnits);
    }
    
    if (name === 'houseType' && value !== 'Apartment') {
      setUnits([]);
      setFormData(prev => ({ ...prev, houseType: value, totalUnits: '' }));
    }
  };

  const handleUnitChange = (index, field, value) => {
    const newUnits = [...units];
    newUnits[index][field] = value;
    setUnits(newUnits);
  };

  const handleVehicleTypeChange = (e) => {
    const { value, checked } = e.target;
    let newVehicleType = [...formData.vehicleType];
    if (checked) {
      newVehicleType.push(value);
    } else {
      newVehicleType = newVehicleType.filter((v) => v !== value);
    }
    setFormData({ ...formData, vehicleType: newVehicleType });
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
    submitData.append('rooms', formData.houseType === 'Apartment' ? 0 : formData.rooms);
    submitData.append('bathrooms', formData.houseType === 'Apartment' ? 0 : formData.bathrooms);
    submitData.append('kitchens', formData.houseType === 'Apartment' ? 0 : formData.kitchens);
    submitData.append('carParking', formData.carParking);
    submitData.append('budgetEstimate', formData.budgetEstimate);
    submitData.append('description', formData.description);

    if (formData.carParking) {
      submitData.append('parkingType', formData.parkingType);
      submitData.append('vehicleType', JSON.stringify(formData.vehicleType));
      submitData.append('totalParkingSpaces', formData.totalParkingSpaces);
      submitData.append('parkingLocation', formData.parkingLocation);
      submitData.append('reservedParking', formData.reservedParking);
      submitData.append('visitorParking', formData.visitorParking);
      submitData.append('parkingDescription', formData.parkingDescription);
    }

    if (formData.houseType === 'Apartment') {
      submitData.append('location', formData.location);
      submitData.append('numberOfFloors', formData.numberOfFloors);
      submitData.append('totalUnits', formData.totalUnits);
      submitData.append('units', JSON.stringify(units));
    }

    if (files.images) submitData.append('images', files.images);
    if (files.model3D) submitData.append('model3D', files.model3D);

    const galleryData = interiorGallery.map(item => ({
      roomName: item.roomName,
      description: item.description,
      order: item.order,
      hasNewFile: !!item.file
    }));
    submitData.append('interiorGalleryData', JSON.stringify(galleryData));
    
    interiorGallery.forEach(item => {
      if (item.file) {
        submitData.append('interiorImages', item.file);
      }
    });

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
      setInteriorGallery([]);
      
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

            {formData.houseType !== 'Apartment' ? (
              <>
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

              </>
            ) : (
              <>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Number of Floors</label>
                  <input type="number" name="numberOfFloors" required min="1" value={formData.numberOfFloors} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 5" />
                </div>
                <div className="col-span-1 md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Apartment Units</label>
                  <input type="number" name="totalUnits" required min="1" value={formData.totalUnits} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-shadow" placeholder="e.g. 10" />
                </div>
              </>
            )}

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

        {/* Parking Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Parking Information</h2>
          <div className="space-y-6">
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="carParking" checked={formData.carParking} onChange={handleInputChange} className="sr-only" />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.carParking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.carParking ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  Parking Available
                </div>
              </label>
            </div>
            
            {formData.carParking && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parking Type</label>
                  <select name="parkingType" value={formData.parkingType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none">
                    <option value="Underground (Basement)">Underground (Basement)</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Outdoor">Outdoor</option>
                    <option value="Covered Parking">Covered Parking</option>
                    <option value="Private Garage">Private Garage</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parking Location</label>
                  <select name="parkingLocation" value={formData.parkingLocation} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none">
                    <option value="Basement">Basement</option>
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="Outside Building">Outside Building</option>
                    <option value="Side of Building">Side of Building</option>
                    <option value="Rear of Building">Rear of Building</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Parking Spaces</label>
                  <input type="number" name="totalParkingSpaces" min="1" value={formData.totalParkingSpaces} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. 10" />
                </div>
                <div className="col-span-1 flex flex-col justify-center space-y-4 mt-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="reservedParking" checked={formData.reservedParking} onChange={handleInputChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.reservedParking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.reservedParking ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Reserved Parking</div>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" name="visitorParking" checked={formData.visitorParking} onChange={handleInputChange} className="sr-only" />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.visitorParking ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.visitorParking ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                    <div className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Visitor Parking</div>
                  </label>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Supported Vehicle Types</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['Car', 'SUV', 'Motorcycle', 'Bicycle', 'Van', 'Bus', 'Mixed Vehicles'].map((vType) => (
                      <label key={vType} className="flex items-center space-x-2">
                        <input type="checkbox" value={vType} checked={formData.vehicleType.includes(vType)} onChange={handleVehicleTypeChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{vType}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Parking Description (Optional)</label>
                  <textarea name="parkingDescription" rows="2" value={formData.parkingDescription} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none" placeholder="Any additional parking details..."></textarea>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Units Generation */}
        {formData.houseType === 'Apartment' && units.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Apartment Units</h2>
            <div className="space-y-6">
              {units.map((unit, index) => (
                <div key={index} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">Unit {index + 1}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Name / Number</label>
                      <input type="text" required value={unit.unitName} onChange={(e) => handleUnitChange(index, 'unitName', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. 101 or A" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Floor Number</label>
                      <input type="text" required value={unit.floorNumber} onChange={(e) => handleUnitChange(index, 'floorNumber', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. Ground Floor" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Area (Sq m)</label>
                      <input type="number" required value={unit.area} onChange={(e) => handleUnitChange(index, 'area', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="e.g. 120" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
                      <input type="number" required min="1" value={unit.bedrooms} onChange={(e) => handleUnitChange(index, 'bedrooms', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Bathrooms</label>
                      <input type="number" required min="1" value={unit.bathrooms} onChange={(e) => handleUnitChange(index, 'bathrooms', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Kitchens</label>
                      <input type="number" required min="1" value={unit.kitchens} onChange={(e) => handleUnitChange(index, 'kitchens', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Living Rooms</label>
                      <input type="number" required min="1" value={unit.livingRooms} onChange={(e) => handleUnitChange(index, 'livingRooms', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Dining Rooms (Opt)</label>
                      <input type="number" min="0" value={unit.diningRooms} onChange={(e) => handleUnitChange(index, 'diningRooms', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Balconies (Opt)</label>
                      <input type="number" min="0" value={unit.balconies} onChange={(e) => handleUnitChange(index, 'balconies', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Uploads */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">Design Files</h2>
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

            {/* Connected Interior Gallery */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-bold text-slate-800 dark:text-white">Connected Interior Gallery (Optional)</h3>
                <button 
                  type="button" 
                  onClick={addInteriorRoom}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  + Add Room
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a sequential walkthrough of the house interior (e.g., Living Room → Kitchen → Bedroom).</p>

              <div className="space-y-6">
                {interiorGallery.map((room, index) => (
                  <div key={room.id} className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                    <button 
                      type="button"
                      onClick={() => removeInteriorRoom(room.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Name</label>
                          <select 
                            required
                            value={room.roomName}
                            onChange={(e) => handleInteriorChange(room.id, 'roomName', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                          >
                            <option value="">Select Room</option>
                            <option value="Living Room">Living Room</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Dining Room">Dining Room</option>
                            <option value="Master Bedroom">Master Bedroom</option>
                            <option value="Bedroom">Bedroom</option>
                            <option value="Bathroom">Bathroom</option>
                            <option value="Balcony">Balcony</option>
                            <option value="Corridor">Corridor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description (Optional)</label>
                          <textarea 
                            rows="2"
                            value={room.description}
                            onChange={(e) => handleInteriorChange(room.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
                            placeholder="Details about the room..."
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Display Order</label>
                          <input 
                            type="number"
                            min="1"
                            required
                            value={room.order}
                            onChange={(e) => handleInteriorChange(room.id, 'order', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Room Image</label>
                        <input 
                          type="file" 
                          required={!room.file} 
                          accept="image/*" 
                          onChange={(e) => handleInteriorFile(room.id, e.target.files[0])} 
                          className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 transition-colors mb-3" 
                        />
                        {room.preview && (
                          <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={room.preview} alt={room.roomName} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {interiorGallery.length === 0 && (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <p>No interior rooms added yet.</p>
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
