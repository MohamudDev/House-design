import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Lock, Briefcase, ArrowRight, AlertCircle, CheckCircle2, FileText, X } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'client'
  });
  const [nationalIdFile, setNationalIdFile] = useState(null);
  const [certificateFile, setCertificateFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Selfie camera states
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState('');
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (formData.role !== 'engineer') {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setIsCameraActive(false);
      setSelfieBlob(null);
      setSelfiePreview('');
    }
  }, [formData.role]);

  const startCamera = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      setCameraStream(stream);
      setIsCameraActive(true);
      setTimeout(() => {
        const video = document.getElementById('webcam-video');
        if (video) video.srcObject = stream;
      }, 100);
    } catch (err) {
      console.error("Camera access failed", err);
      setError("Failed to access camera. Please allow camera permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureSelfie = () => {
    const video = document.getElementById('webcam-video');
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    // Mirror image for canvas too
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setSelfieBlob(file);
      setSelfiePreview(URL.createObjectURL(blob));
      stopCamera();
    }, "image/jpeg", 0.95);
  };

  const retakeSelfie = () => {
    setSelfieBlob(null);
    setSelfiePreview('');
    startCamera();
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    
    if (formData.role === 'engineer') {
      setIsLoading(false);
      setShowTermsModal(true);
      return;
    }

    submitRegistration(false);
  };

  const submitRegistration = async (acceptedTerms) => {
    setIsLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('password', formData.password);
    data.append('role', formData.role);
    if (acceptedTerms) {
      data.append('acceptedTerms', 'true');
    }
    if (formData.role === 'engineer') {
      if (!nationalIdFile || !certificateFile || !selfieBlob) {
        setError('Please upload National ID, Certificate and take a Selfie verification');
        setIsLoading(false);
        return;
      }
      data.append('nationalId', nationalIdFile);
      data.append('certificate', certificateFile);
      data.append('selfie', selfieBlob);
    }

    const result = await register(data);
    
    if (result.success) {
      const userRole = result.user.role;
      if (userRole === 'admin' || userRole === 'superadmin') navigate('/admin-dashboard');
      else if (userRole === 'engineer') navigate('/engineer-dashboard');
      else navigate('/');
    } else {
      setError(result.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  const handleDeclineTerms = () => {
    setShowTermsModal(false);
    setError('You must accept the Terms & Conditions to use this platform.');
  };

  const handleAcceptTerms = () => {
    setShowTermsModal(false);
    submitRegistration(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 py-12 transition-colors duration-300 relative">
      <div className="absolute top-6 right-6">
        <ThemeToggle className="text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 bg-white dark:bg-slate-800 shadow-sm" />
      </div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden transition-colors border border-transparent dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400">Join our marketplace today</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-600 border border-red-100">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  pattern="^[a-zA-Z\s]+$"
                  title="Name should only contain letters and spaces"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                  placeholder="name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <CheckCircle2 size={20} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Type</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Briefcase size={20} />
                </div>
                <select
                  name="role"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors appearance-none"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="client">Client (Home Seeker)</option>
                  <option value="engineer">Engineer / Architect</option>
                </select>
              </div>
            </div>

            {formData.role === 'engineer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">National ID</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={(e) => setNationalIdFile(e.target.files[0])}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Engineering / Professional Certificate</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                      onChange={(e) => setCertificateFile(e.target.files[0])}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selfie Verification (Sawirkaaga Xaqiijinta)</label>
                  
                  {selfiePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-col items-center p-4">
                      <img src={selfiePreview} alt="Selfie Preview" className="w-full max-w-[200px] h-[150px] object-cover rounded-lg border border-slate-200 dark:border-slate-700 mb-3" />
                      <button
                        type="button"
                        onClick={retakeSelfie}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Retake Selfie (Dib u sawir)
                      </button>
                    </div>
                  ) : isCameraActive ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex flex-col items-center p-4">
                      <video id="webcam-video" autoPlay playsInline className="w-full max-w-[200px] h-[150px] object-cover rounded-lg bg-black mb-3 transform scale-x-[-1]"></video>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={captureSelfie}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Capture Photo (Sawir qaado)
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={startCamera}
                      className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/50 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 font-semibold text-sm transition-all"
                    >
                      <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Open Camera & Take Selfie (Sawir iska qaad)
                    </button>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative transition-colors border border-slate-200 dark:border-slate-700">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terms & Conditions</h2>
              </div>
              <button 
                onClick={handleDeclineTerms}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Before activating your engineer account, please review our terms regarding the sale of house designs on this platform.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 mb-6">
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">You can upload and sell house designs.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">The platform charges a <strong>10% commission</strong> on every successful sale.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">Commission is automatically deducted from each sale.</p>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">By accepting these terms, you agree to the commission policy.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={handleDeclineTerms}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Decline Terms
                </button>
                <button 
                  onClick={handleAcceptTerms}
                  className="flex-1 px-4 py-3 bg-primary hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all active:scale-[0.98]"
                >
                  Accept Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Register;
