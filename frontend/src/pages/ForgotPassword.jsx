import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRegisterHint, setShowRegisterHint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    setShowRegisterHint(false);
    try {
      const { data } = await axios.post('/api/auth/forgot-password', { email: email.trim() }, { timeout: 45000 });
      setSuccess(data.message || 'A verification code has been sent to your email. Check Spam too.');
      setStep(2);
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else if (err.response?.data?.code === 'EMAIL_NOT_REGISTERED' || err.response?.status === 404) {
        setError(err.response?.data?.message || 'This email is not registered. Please sign up first.');
        setShowRegisterHint(true);
      } else {
        setError(err.response?.data?.message || 'Failed to send code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!/^\d{6}$/.test(otp.trim())) { setError('Enter the 6-digit code from your email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      const { data } = await axios.post('/api/auth/reset-password', { email, otp: otp.trim(), password });
      setSuccess(data.message || 'Password updated successfully.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute top-6 right-6"><ThemeToggle className="text-slate-500 bg-white dark:bg-slate-800 shadow-sm" /></div>
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-transparent dark:border-slate-700 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Forgot Password</h1>
          <p className="text-slate-500 dark:text-slate-400">{step === 1 ? 'Enter the email of your registered account' : `Enter the code sent to ${email}`}</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg flex flex-col gap-2 text-red-600 border border-red-100">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            {showRegisterHint && (
              <Link to="/register" className="ml-8 text-sm font-bold text-primary hover:underline">
                Go to Sign Up / Register
              </Link>
            )}
          </div>
        )}
        {success && <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center gap-3 text-green-700 border border-green-100"><CheckCircle2 size={20} /><p className="text-sm font-medium">{success}</p></div>}

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white" placeholder="you@example.com" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-70">{isLoading ? 'Sending...' : 'Send Code'}</button>
          </form>
        )}

        {step === 2 && !success.includes('updated successfully') && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Verification Code</label>
              <div className="relative">
                <KeyRound size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" inputMode="numeric" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white tracking-[0.4em] font-semibold text-center text-lg" placeholder="000000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 dark:text-white" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 rounded-lg disabled:opacity-70">{isLoading ? 'Updating...' : 'Update Password'}</button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setStep(1); setSuccess(''); setError(''); }} className="text-slate-500">Change email</button>
              <button type="button" disabled={isLoading} onClick={handleSendOtp} className="font-semibold text-primary">Resend code</button>
            </div>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-primary"><ArrowLeft size={16} /> Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
