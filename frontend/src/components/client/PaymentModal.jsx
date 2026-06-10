import React, { useState } from 'react';
import { X, Smartphone, Lock, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const PaymentModal = ({ design, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const price = design.price || 100;

  const [accountNo, setAccountNo] = useState(''); // Empty by default

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!accountNo) {
      setError('Please enter your mobile money number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      const { data } = await axios.post(`/api/client/checkout/${design._id}`, { accountNo }, config);
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(data.data);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative transition-colors">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Smartphone className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">WaafiPay Checkout</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={loading || success}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-500 dark:text-slate-400">You have successfully purchased this design.</p>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Order Summary</p>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{design.title}</span>
                  <span className="font-bold text-slate-800 dark:text-white">${price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>By {design.engineer?.name}</span>
                  <span>USD</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl border border-red-100 dark:border-red-800">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Mobile Money Number</label>
                  <div className="relative">
                    <input 
                      type="text" required
                      value={accountNo} onChange={(e) => setAccountNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all font-medium"
                      placeholder="e.g. 252612946565"
                    />
                    <Smartphone size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">You will receive a prompt on your phone to confirm the payment.</p>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Pay ${price.toLocaleString()} Now
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
