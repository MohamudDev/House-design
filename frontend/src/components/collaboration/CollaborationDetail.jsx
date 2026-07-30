import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { X, Clock, FileText, MessageSquare, StickyNote, Download, CheckCircle2, Ban, Paperclip, Activity } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const statusColor = {
  Active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Closed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
};

const CollaborationDetail = ({ collaborationId, onClose }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('timeline');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const role = (user?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'superadmin';
  const isEngineer = role === 'engineer';
  const isClient = role === 'client';
  const authConfig = () => ({ headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}` } });

  const load = async () => {
    try {
      setLoading(true);
      const { data: res } = await axios.get(`/api/collaborations/${collaborationId}`, authConfig());
      setData(res.data);
      setChatHistory(res.chatHistory || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (collaborationId) load(); }, [collaborationId]);

  const addNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try {
      const url = isClient ? `/api/collaborations/${collaborationId}/client-notes` : `/api/collaborations/${collaborationId}/engineer-notes`;
      await axios.post(url, { content: note }, authConfig());
      setNote('');
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const markComplete = async () => {
    try {
      const { data: res } = await axios.put(`/api/collaborations/${collaborationId}/complete`, {}, authConfig());
      setData(res.data);
      alert(res.bothAgreed ? 'Completed — both agreed.' : 'Your vote recorded. Waiting for the other party.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const closeCollab = async () => {
    if (!window.confirm('Close this collaboration?')) return;
    try {
      const { data: res } = await axios.put(`/api/collaborations/${collaborationId}/close`, {}, authConfig());
      setData(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const exportPdf = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userInfo') || '{}').token;
      const res = await axios.get(`/api/collaborations/${collaborationId}/export/pdf`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `collaboration-${collaborationId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      alert('Failed to export PDF');
    }
  };

  if (!collaborationId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Collaboration Documentation</h2>
            {data && <p className="text-sm text-slate-500 mt-1">{data.design?.title} · {data.client?.name} ↔ {data.engineer?.name}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={exportPdf} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-slate-100 dark:bg-slate-800"><Download size={16} /> PDF</button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
          </div>
        </div>
        {loading ? <div className="p-12 text-center text-slate-500 animate-pulse">Loading...</div> : error ? <div className="p-12 text-center text-red-500">{error}</div> : data && (
          <>
            <div className="px-5 py-3 flex flex-wrap gap-3 items-center border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor[data.status]}`}>{data.status}</span>
              <span className="text-xs text-slate-500">Last: {new Date(data.lastActivity).toLocaleString()}</span>
              <div className="ml-auto flex gap-2">
                {(isClient || isEngineer) && data.status === 'Active' && (
                  <button onClick={markComplete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white"><CheckCircle2 size={14} /> Mark Complete</button>
                )}
                {data.status === 'Active' && (
                  <button onClick={closeCollab} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-700"><Ban size={14} /> Close</button>
                )}
              </div>
            </div>
            <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
              {[
                { id: 'timeline', label: 'Timeline', icon: Clock },
                { id: 'chat', label: 'Chat', icon: MessageSquare },
                { id: 'files', label: 'Files', icon: Paperclip },
                { id: 'notes', label: 'Notes', icon: StickyNote },
                ...(isAdmin ? [{ id: 'activity', label: 'Activity', icon: Activity }] : [])
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 ${tab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {tab === 'timeline' && [...(data.timeline || [])].reverse().map((t) => (
                <div key={t._id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.description || t.event}</p>
                  <p className="text-xs text-slate-500 mt-1">{t.actor?.name || 'System'} · {new Date(t.createdAt).toLocaleString()}</p>
                </div>
              ))}
              {tab === 'chat' && (chatHistory.length === 0 ? <p className="text-slate-500 text-sm">No messages yet.</p> : chatHistory.map((m) => (
                <div key={m._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span className="font-bold text-slate-700 dark:text-slate-200">{m.sender?.name} → {m.receiver?.name}</span><span>{new Date(m.createdAt).toLocaleString()}</span></div>
                  {m.content && <p className="text-sm dark:text-slate-200">{m.content}</p>}
                  {m.attachmentUrl && <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 mt-2 inline-flex items-center gap-1"><Paperclip size={12} /> attachment</a>}
                </div>
              )))}
              {tab === 'files' && (data.files || []).map((f) => (
                <div key={f._id} className="flex justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex gap-3 min-w-0"><FileText className="text-indigo-500 shrink-0" size={18} /><div className="min-w-0"><p className="text-sm font-semibold truncate dark:text-white">{f.fileName}</p><p className="text-xs text-slate-500">{f.fileType} · {f.uploadedBy?.name}</p></div></div>
                  <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">Download</a>
                </div>
              ))}
              {tab === 'notes' && (
                <div className="space-y-4">
                  {(isClient || isAdmin) && (data.clientNotes || []).map((n) => <div key={n._id} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm">{n.content}<p className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>)}
                  {(isEngineer || isAdmin) && (data.engineerNotes || []).map((n) => <div key={n._id} className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-sm">{n.content}<p className="text-xs text-slate-500 mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>)}
                  {(isClient || isEngineer) && (
                    <form onSubmit={addNote} className="space-y-2">
                      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white" />
                      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">{saving ? 'Saving...' : 'Save Note'}</button>
                    </form>
                  )}
                </div>
              )}
              {tab === 'activity' && isAdmin && [...(data.activityLog || [])].reverse().map((a) => (
                <div key={a._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
                  <p className="font-semibold dark:text-white">{a.action}</p>
                  <p className="text-slate-600 dark:text-slate-300">{a.details}</p>
                  <p className="text-xs text-slate-500 mt-1">{a.actor?.name} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CollaborationDetail;
