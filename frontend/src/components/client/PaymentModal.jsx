import React, { useMemo, useState } from 'react';
import { X, Smartphone, Lock, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const round2 = (n) => Math.round(Number(n) * 100) / 100;

const PaymentModal = ({ design, onClose, onSuccess, mode = 'checkout', transaction = null, purchaseType = 'full' }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('full');
  const [accountNo, setAccountNo] = useState('');

  const isRemaining = mode === 'remaining';
  const optionLabel =
    purchaseType === 'halfA'
      ? (design?.halfA?.label || 'Half A')
      : purchaseType === 'halfB'
        ? (design?.halfB?.label || 'Half B')
        : 'Full house';

  const totalPrice = useMemo(() => {
    if (isRemaining) return round2(transaction?.totalPrice || 100);
    if (purchaseType === 'halfA') return round2(design?.halfA?.price || 0);
    if (purchaseType === 'halfB') return round2(design?.halfB?.price || 0);
    return round2(design?.price || design?.budgetEstimate || 100);
  }, [transaction, design, purchaseType, isRemaining]);
  const halfPrice = useMemo(() => round2(totalPrice / 2), [totalPrice]);
  const remainingDue = useMemo(
    () => round2(isRemaining ? (transaction?.amountRemaining || halfPrice) : totalPrice - halfPrice),
    [isRemaining, transaction, halfPrice, totalPrice]
  );
  const chargeAmount = isRemaining
    ? remainingDue
    : paymentPlan === 'half'
      ? halfPrice
      : totalPrice;

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

      const { data } = isRemaining
        ? await axios.post(`/api/client/pay-remaining/${transaction._id}`, { accountNo }, config)
        : await axios.post(
            `/api/client/checkout/${design._id}`,
            { accountNo, paymentPlan, purchaseType },
            config
          );

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
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Smartphone className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isRemaining ? 'Pay Remaining Balance' : 'WaafiPay Checkout'}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading || success}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h3>
              <p className="text-slate-500 dark:text-slate-400">
                {isRemaining
                  ? 'Remaining balance has been paid in full.'
                  : paymentPlan === 'half'
                    ? 'Half paid. The other half is left as remaining balance.'
                    : 'You have successfully purchased this design.'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Order Summary
                </p>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    {design?.title || transaction?.design?.title}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-white">${totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>By {design?.engineer?.name || transaction?.design?.engineer?.name || 'Engineer'}</span>
                  <span className="font-semibold text-indigo-600">{isRemaining ? (transaction?.purchaseType === 'halfA' ? 'Half A' : transaction?.purchaseType === 'halfB' ? 'Half B' : 'Full') : optionLabel}</span>
                </div>
              </div>

              {!isRemaining && (
                <div className="mb-6 space-y-2">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Payment option
                  </p>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentPlan === 'full'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPlan"
                      checked={paymentPlan === 'full'}
                      onChange={() => setPaymentPlan('full')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Full payment</p>
                      <p className="text-xs text-slate-500">Pay ${totalPrice.toLocaleString()} now</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentPlan === 'half'
                        ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-900/20'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPlan"
                      checked={paymentPlan === 'half'}
                      onChange={() => setPaymentPlan('half')}
                      className="mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Half payment</p>
                        <span className="text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Remaining
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Pay ${halfPrice.toLocaleString()} now · ${remainingDue.toLocaleString()} left as remaining
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {isRemaining && (
                <div className="mb-6 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                  <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 mb-2">
                    Remaining
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Remaining balance: ${remainingDue.toLocaleString()}
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl border border-red-100 dark:border-red-800">
                  {error}
                </div>
              )}

              <form onSubmit={handlePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Mobile Money Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none dark:text-white transition-all font-medium"
                      placeholder="e.g. 252612946565"
                    />
                    <Smartphone size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    You will receive a prompt on your phone to confirm the payment.
                  </p>
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
                      Pay ${chargeAmount.toLocaleString()} Now
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
