import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, CheckCheck, ClipboardList } from 'lucide-react';
import { AuthContext } from '../context/AuthContext.jsx';
import { SocketContext } from '../context/SocketContext.jsx';

export const NOTIFICATIONS_UPDATED_EVENT = 'project-notifications-updated';

export const emitNotificationsUpdated = (unreadCount = 0) => {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: { unreadCount } }));
};

/**
 * @param {'bell' | 'projects'} variant - client uses "projects" (clipboard only, no separate bells)
 */
const NotificationCenter = ({
  className = '',
  buttonClassName = '',
  variant = 'bell',
  projectsPath = '/client-dashboard/projects'
}) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext) || {};
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const authConfig = () => ({
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}` }
  });

  const load = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/notifications', authConfig());
      setItems(data.data || []);
      const count = data.unreadCount || 0;
      setUnread(count);
      emitNotificationsUpdated(count);
    } catch (_) {}
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 100));
      setUnread((c) => {
        const next = c + 1;
        emitNotificationsUpdated(next);
        return next;
      });
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const markAll = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, authConfig());
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      emitNotificationsUpdated(0);
    } catch (_) {}
  };

  const markOne = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`, {}, authConfig());
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnread((c) => {
        const next = Math.max(0, c - 1);
        emitNotificationsUpdated(next);
        return next;
      });
    } catch (_) {}
  };

  const openPanel = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) {
      await load();
      await markAll();
    }
  };

  const goToProjects = () => {
    setOpen(false);
    navigate(projectsPath);
  };

  const onItemClick = async (n) => {
    if (!n.isRead) await markOne(n._id);
    setOpen(false);
    const role = (user?.role || '').toLowerCase();
    if (n.project || variant === 'projects') {
      if (role === 'client') navigate('/client-dashboard/projects');
      else if (role === 'engineer') navigate('/engineer-dashboard/projects');
      else if (role === 'admin' || role === 'superadmin') navigate('/admin-dashboard/projects');
    }
  };

  if (!user) return null;

  const isProjects = variant === 'projects';
  const Icon = isProjects ? ClipboardList : Bell;
  const title = isProjects ? 'My Projects & Notifications' : 'Notifications';

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={openPanel}
        className={buttonClassName || 'relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors'}
        title={title}
      >
        <Icon size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {isProjects && (
                <button
                  type="button"
                  onClick={goToProjects}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Open My Projects
                </button>
              )}
              <button type="button" onClick={markAll} className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => onItemClick(n)}
                className={`w-full text-left p-3 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
              >
                <p className="text-sm font-bold text-slate-800 dark:text-white">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
