import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Clock, AlertCircle, CheckCircle, XCircle, Search, MessageSquare, Paperclip, ChevronDown, Check } from 'lucide-react';

const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.get('/api/complaints', {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setComplaints(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.put(`/api/complaints/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setComplaints(complaints.map(c => c._id === id ? res.data.data : c));
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint(res.data.data);
      }
      setStatusMenuOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedComplaint) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const res = await axios.put(`/api/complaints/${selectedComplaint._id}/reply`, { adminReply: replyText }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setComplaints(complaints.map(c => c._id === selectedComplaint._id ? res.data.data : c));
      setSelectedComplaint(res.data.data);
      setReplyText('');
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const filteredComplaints = complaints.filter(c => filter === 'All' ? true : c.status === filter);

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
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Resolved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Complaints Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View, track, and resolve user complaints</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-max">
          {['All', 'Pending', 'In Progress', 'Resolved'].map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Complaints List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[70vh]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search complaints..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
              />
              <Search size={18} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No complaints found.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredComplaints.map(complaint => (
                  <div 
                    key={complaint._id} 
                    onClick={() => setSelectedComplaint(complaint)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${selectedComplaint?._id === complaint._id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate pr-2 text-sm">{complaint.subject}</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${getStatusClass(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">
                      {complaint.sender?.name} ({complaint.sender?.role})
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{complaint.category}</span>
                      <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Complaint Detail */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[70vh]">
          {selectedComplaint ? (
            <>
              {/* Detail Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
                      {selectedComplaint.category}
                    </span>
                    <span className="text-sm text-slate-500">ID: #{selectedComplaint._id.substring(0, 8)}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedComplaint.subject}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    From: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedComplaint.sender?.name}</span> ({selectedComplaint.sender?.email}) &bull; {new Date(selectedComplaint.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold shadow-sm transition-colors ${getStatusClass(selectedComplaint.status)} border-transparent hover:brightness-95`}
                  >
                    {getStatusIcon(selectedComplaint.status)} {selectedComplaint.status} <ChevronDown size={16} />
                  </button>
                  
                  {statusMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10">
                      {['Pending', 'In Progress', 'Resolved', 'Rejected'].map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedComplaint._id, status)}
                          className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between text-slate-700 dark:text-slate-200"
                        >
                          {status} {selectedComplaint.status === status && <Check size={16} className="text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Description</h4>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedComplaint.description}
                    </p>
                  </div>
                </div>

                {selectedComplaint.attachment && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Attachment</h4>
                    <a href={selectedComplaint.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-indigo-600 dark:text-indigo-400">
                      <Paperclip size={16} /> View Attached File
                    </a>
                  </div>
                )}

                {selectedComplaint.adminReply && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle size={14} className="text-emerald-500" /> Admin Reply
                    </h4>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                      <p className="text-emerald-800 dark:text-emerald-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedComplaint.adminReply}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reply Box */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <form onSubmit={handleReply} className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply to the user..."
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                  />
                  <button 
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    <MessageSquare size={16} /> Reply
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare size={48} className="mb-4 text-slate-300 dark:text-slate-700" />
              <p>Select a complaint to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageComplaints;
