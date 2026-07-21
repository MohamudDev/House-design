import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Clock, XCircle, Paperclip, Send } from 'lucide-react';

const ComplaintManager = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Engineer',
    description: ''
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/complaints/my', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setComplaints(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const submitData = new FormData();
      submitData.append('subject', formData.subject);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      if (file) {
        submitData.append('attachment', file);
      }

      await axios.post('/api/complaints', submitData, {
        headers: { 
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage({ type: 'success', text: 'Complaint submitted successfully. We will review it shortly.' });
      setFormData({ subject: '', category: 'Engineer', description: '' });
      setFile(null);
      fetchComplaints();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit complaint' });
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <Clock size={16} className="text-amber-500" />;
      case 'In Progress': return <AlertCircle size={16} className="text-blue-500" />;
      case 'Resolved': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'Rejected': return <XCircle size={16} className="text-red-500" />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Resolved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Submit a Complaint</h2>
        
        {message.text && (
          <div className={`p-4 rounded-xl mb-6 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={formData.subject}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                placeholder="Brief subject of your complaint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="Engineer">Engineer</option>
                <option value="Property">Property</option>
                <option value="Payment">Payment</option>
                <option value="System">System</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
            <textarea
              name="description"
              required
              rows="4"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none"
              placeholder="Please provide detailed information about your issue..."
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Attachment (Optional)</label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full px-4 py-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <Paperclip size={18} className="mr-2" />
                <span>{file ? file.name : 'Click to attach a file'}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl flex items-center transition-colors"
            >
              <Send size={18} className="mr-2" /> Submit Complaint
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Your Complaint History</h2>
        
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">You haven't submitted any complaints yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(complaint => (
              <div key={complaint._id} className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{complaint.subject}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                      <span className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs font-semibold">{complaint.category}</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      <span>ID: #{complaint._id.substring(0, 6)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold whitespace-nowrap w-fit ${getStatusClass(complaint.status)}`}>
                    {getStatusIcon(complaint.status)} {complaint.status}
                  </div>
                </div>
                
                <p className="text-slate-700 dark:text-slate-300 text-sm mb-4">
                  {complaint.description}
                </p>

                {complaint.attachment && (
                  <a href={complaint.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline mb-4">
                    <Paperclip size={14} className="mr-1" /> View Attachment
                  </a>
                )}

                {complaint.adminReply && (
                  <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">Admin Reply</div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{complaint.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplaintManager;
