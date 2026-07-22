import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { MessageSquare, Mail, User, Clock, Check, Trash2, MailOpen, Mail as MailClosed } from 'lucide-react';

const ManageContacts = () => {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchContacts = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.get('/api/contact', config);
      setContacts(data.data);

      const unreadIds = data.data.filter(c => !c.isRead).map(c => c._id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map(id => 
          axios.put(`/api/contact/${id}/read`, {}, config)
        ));
        window.dispatchEvent(new Event('contactsMarkedRead'));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      await axios.put(`/api/contact/${id}/read`, {}, config);
      // Update state locally
      setContacts(contacts.map(c => c._id === id ? { ...c, isRead: true } : c));
    } catch (err) {
      console.error('Error marking as read', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        };
        await axios.delete(`/api/contact/${id}`, config);
        setContacts(contacts.filter(c => c._id !== id));
      } catch (err) {
        console.error('Error deleting message', err);
      }
    }
  };

  const submitReply = async (id) => {
    if (!replyText.trim()) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      const { data } = await axios.put(`/api/contact/${id}/reply`, { reply: replyText }, config);
      setContacts(contacts.map(c => c._id === id ? data.data : c));
      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Error sending reply', err);
      alert('Error sending reply');
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading messages...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inbox</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage inquiries from the public contact form.</p>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700">
            <MessageSquare size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Messages</h3>
            <p className="text-slate-500 dark:text-slate-400">You don't have any contact form submissions yet.</p>
          </div>
        ) : (
          contacts.map((msg) => (
            <div 
              key={msg._id} 
              className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border transition-colors ${
                msg.isRead 
                  ? 'border-slate-200 dark:border-slate-700 opacity-80' 
                  : 'border-indigo-300 dark:border-indigo-600 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {msg.isRead ? <MailOpen size={18} className="text-slate-400" /> : <MailClosed size={18} className="text-indigo-600 dark:text-indigo-400" />}
                    <h3 className={`text-lg ${msg.isRead ? 'font-medium text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                      {msg.subject}
                    </h3>
                    {!msg.isRead && <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-full">NEW</span>}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                    <span className="flex items-center gap-1"><User size={14} /> {msg.name}</span>
                    <span className="flex items-center gap-1"><Mail size={14} /> {msg.email}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {new Date(msg.createdAt).toLocaleString()}</span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.message}</p>
                  
                  {msg.reply && (
                    <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wider">Your Reply ({new Date(msg.repliedAt).toLocaleDateString()})</p>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.reply}</p>
                    </div>
                  )}

                  {replyingTo === msg._id && !msg.reply && (
                    <div className="mt-4 space-y-3">
                      <textarea 
                        rows="3" 
                        value={replyText} 
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply here..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                      ></textarea>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => submitReply(msg._id)}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Send Reply
                        </button>
                        <button 
                          onClick={() => setReplyingTo(null)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-3 justify-start shrink-0">
                  {!msg.reply && !msg.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(msg._id)}
                      className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                    >
                      <Check size={16} /> Mark Read
                    </button>
                  )}
                  {!msg.reply && replyingTo !== msg._id && (
                    <button 
                      onClick={() => setReplyingTo(msg._id)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <MessageSquare size={16} /> Reply
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(msg._id)}
                    className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageContacts;
