import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ShoppingBag, Clock, CheckCircle, Layout, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import PaymentModal from '../../components/client/PaymentModal';

const ClientPurchases = () => {
  const { user } = useContext(AuthContext);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payTx, setPayTx] = useState(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/client/purchases`, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPurchases(data.data);
      } else {
        setError(data.message || 'Failed to load your purchases');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred while loading purchases.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase History</h1>
        <p className="text-slate-500 dark:text-slate-400">View designs you have purchased from engineers.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {purchases.length === 0 && !error ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Purchases Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            When you buy designs from the marketplace, your transaction history will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purchases.map((tx) => {
            const hasTahy = tx.paymentPlan === 'half' && tx.remainingStatus === 'pending' && tx.amountRemaining > 0;
            const tahyPaid = tx.paymentPlan === 'half' && tx.remainingStatus === 'paid';
            return (
              <div key={tx._id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
                <div className="h-48 relative">
                  {tx.design?.images && tx.design.images.length > 0 ? (
                    <img
                      src={tx.design.images[0]}
                      alt={tx.design.title}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x300?text=No+Thumbnail'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                      <Layout size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    {hasTahy ? (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow-sm">
                        Tahy · ${Number(tx.amountRemaining).toLocaleString()}
                      </span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle size={14} /> Completed
                      </span>
                    )}
                    {tahyPaid && (
                      <span className="bg-slate-900/80 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        Tahy paid
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{tx.design?.title || 'Unknown Design'}</h3>

                  <div className="flex justify-between items-center mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-1 text-slate-500"><Clock size={14}/> {format(new Date(tx.createdAt), 'MMM d, yyyy')}</span>
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400"><DollarSign size={14}/> {(tx.amountPaid || 0).toLocaleString()} paid</span>
                  </div>
                  {tx.paymentPlan === 'half' && (
                    <p className="text-xs text-slate-500 mb-3">
                      Total ${Number(tx.totalPrice || tx.amountPaid).toLocaleString()} · Half plan
                    </p>
                  )}

                  {hasTahy && (
                    <button
                      type="button"
                      onClick={() => setPayTx(tx)}
                      className="mb-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold"
                    >
                      Pay Tahy ${Number(tx.amountRemaining).toLocaleString()}
                    </button>
                  )}

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {tx.design?.engineer?.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Engineer</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{tx.design?.engineer?.name || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {payTx && (
        <PaymentModal
          mode="remaining"
          transaction={payTx}
          design={payTx.design}
          onClose={() => setPayTx(null)}
          onSuccess={() => {
            setPayTx(null);
            setLoading(true);
            fetchPurchases();
          }}
        />
      )}
    </div>
  );
};

export default ClientPurchases;
