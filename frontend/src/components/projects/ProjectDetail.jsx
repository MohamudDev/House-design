import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import {
  X, Play, CheckCircle2, RefreshCw, Upload, MessageSquare,
  FileText, Send, Pencil, Info
} from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { statusExplanation, statusColor } from './statusExplanation';
import StatusBadge from './StatusBadge';

const toDateInputValue = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseStrictYmd = (value) => {
  const raw = String(value || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return { year, month, day, date, ymd: raw };
};

/** Add days to a YYYY-MM-DD string; returns YYYY-MM-DD. */
const addDaysYmd = (ymd, days) => {
  const parsed = parseStrictYmd(ymd);
  if (!parsed) return '';
  const d = new Date(parsed.year, parsed.month - 1, parsed.day + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayYmd = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const MSG_START_PAST = 'Start Date cannot be in the past.';
const MSG_COMPLETION_AFTER = 'Completion Date must be after the Start Date.';
const MSG_START_REQUIRED = 'Start Date is required.';
const MSG_COMPLETION_REQUIRED = 'Completion Date is required.';

const ProjectDetail = ({ projectId, onClose, onUpdated }) => {
  const { user } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleErrors, setScheduleErrors] = useState({ start: '', completion: '' });

  const [startForm, setStartForm] = useState({ expectedStartDate: '', expectedCompletionDate: '' });
  const [progressForm, setProgressForm] = useState({ progressPercentage: 25, note: '', files: [] });
  const [revisionNote, setRevisionNote] = useState('');
  const [comment, setComment] = useState('');

  const todayStr = todayYmd();
  const hasStartDate = Boolean(startForm.expectedStartDate);
  /** Completion picker: disable all dates on or before Start Date → min is day after start */
  const completionMin = hasStartDate ? addDaysYmd(startForm.expectedStartDate, 1) : '';

  const role = (user?.role || '').toLowerCase();
  const isEngineer = role === 'engineer';
  const isClient = role === 'client';
  const hasUnpaidRemaining =
    project?.transaction?.paymentPlan === 'half' &&
    project?.transaction?.remainingStatus === 'pending' &&
    Number(project?.transaction?.amountRemaining) > 0;
  const authConfig = () => ({
    headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}` }
  });

  const clearScheduleErrors = () => setScheduleErrors({ start: '', completion: '' });

  /**
   * Strict schedule validation — past Start Date is never allowed (Start Work or Edit).
   * Returns { start, completion } error strings (empty if valid).
   */
  const validateScheduleForm = () => {
    const errors = { start: '', completion: '' };
    const { expectedStartDate, expectedCompletionDate } = startForm;

    if (!expectedStartDate) {
      errors.start = MSG_START_REQUIRED;
    } else {
      const start = parseStrictYmd(expectedStartDate);
      if (!start || start.ymd < todayStr) {
        errors.start = MSG_START_PAST;
      }
    }

    if (!expectedStartDate) {
      if (expectedCompletionDate) {
        errors.completion = MSG_COMPLETION_AFTER;
      }
    } else if (!expectedCompletionDate) {
      errors.completion = MSG_COMPLETION_REQUIRED;
    } else {
      const start = parseStrictYmd(expectedStartDate);
      const end = parseStrictYmd(expectedCompletionDate);
      if (!end || !start || end.ymd <= start.ymd) {
        errors.completion = MSG_COMPLETION_AFTER;
      }
    }

    return errors;
  };

  const hasScheduleErrors = (errors) => Boolean(errors.start || errors.completion);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/projects/${projectId}`, authConfig());
      setProject(data.data);
      setTimeline(data.timeline || []);
      setProgressUpdates(data.progressUpdates || []);
      setStartForm({
        expectedStartDate: toDateInputValue(data.data.expectedStartDate),
        expectedCompletionDate: toDateInputValue(data.data.expectedCompletionDate)
      });
      setEditingSchedule(false);
      clearScheduleErrors();
      setProgressForm((p) => ({
        ...p,
        progressPercentage: Number(data.data.progressPercentage) || 0
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load project');
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  const refresh = async () => {
    await load();
    onUpdated?.();
  };

  const run = async (fn) => {
    setSaving(true);
    try {
      await fn();
      await refresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSchedule = async () => {
    const errors = validateScheduleForm();
    setScheduleErrors(errors);
    if (hasScheduleErrors(errors)) return;

    setSaving(true);
    try {
      await axios.put(`/api/projects/${projectId}/schedule`, startForm, authConfig());
      await refresh();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Action failed';
      if (/start date/i.test(message)) {
        setScheduleErrors({ start: message, completion: '' });
      } else {
        setScheduleErrors({ start: '', completion: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    const errors = validateScheduleForm();
    setScheduleErrors(errors);
    if (hasScheduleErrors(errors)) return;

    setSaving(true);
    try {
      await axios.post(`/api/projects/${projectId}/start`, startForm, authConfig());
      await refresh();
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Action failed';
      if (/start date/i.test(message)) {
        setScheduleErrors({ start: message, completion: '' });
      } else {
        setScheduleErrors({ start: '', completion: message });
      }
    } finally {
      setSaving(false);
    }
  };

  const onStartDateChange = (value) => {
    setStartForm((prev) => {
      let nextCompletion = prev.expectedCompletionDate;
      // Clear completion if it is no longer strictly after the new start
      if (nextCompletion && (!value || nextCompletion <= value)) {
        nextCompletion = '';
      }
      return { expectedStartDate: value, expectedCompletionDate: nextCompletion };
    });
    clearScheduleErrors();
  };

  const onCompletionDateChange = (value) => {
    setStartForm((prev) => ({ ...prev, expectedCompletionDate: value }));
    clearScheduleErrors();
  };

  const dateInputClass = (hasError, disabled = false) => {
    const base = 'mt-1 w-full px-3 py-2 rounded-xl border text-sm dark:text-white';
    if (disabled) {
      return `${base} border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-400 cursor-not-allowed`;
    }
    if (hasError) {
      return `${base} border-red-500 ring-2 ring-red-200 dark:ring-red-900/40 bg-white dark:bg-slate-900`;
    }
    return `${base} border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900`;
  };

  const renderScheduleFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-semibold text-slate-500">Start Date</label>
        <input
          type="date"
          min={todayStr}
          value={startForm.expectedStartDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className={dateInputClass(Boolean(scheduleErrors.start))}
        />
        {scheduleErrors.start ? (
          <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{scheduleErrors.start}</p>
        ) : null}
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500">Expected Completion Date</label>
        <input
          type="date"
          min={completionMin || undefined}
          disabled={!hasStartDate}
          value={startForm.expectedCompletionDate}
          onChange={(e) => onCompletionDateChange(e.target.value)}
          className={dateInputClass(Boolean(scheduleErrors.completion), !hasStartDate)}
        />
        {scheduleErrors.completion ? (
          <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{scheduleErrors.completion}</p>
        ) : !hasStartDate ? (
          <p className="mt-1 text-xs text-slate-400">Select a Start Date first.</p>
        ) : null}
      </div>
    </div>
  );

  const handleProgress = () => run(async () => {
    const formData = new FormData();
    formData.append('progressPercentage', String(progressForm.progressPercentage));
    formData.append('note', progressForm.note);
    [...progressForm.files].forEach((f) => formData.append('files', f));
    await axios.post(`/api/projects/${projectId}/progress`, formData, {
      headers: {
        Authorization: `Bearer ${JSON.parse(localStorage.getItem('userInfo') || '{}').token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    setProgressForm({ progressPercentage: progressForm.progressPercentage, note: '', files: [] });
  });

  const handleComplete = () => run(async () => {
    await axios.post(`/api/projects/${projectId}/complete`, {}, authConfig());
  });

  const handleConfirm = () => run(async () => {
    await axios.post(`/api/projects/${projectId}/confirm-delivery`, {}, authConfig());
  });

  const handleRevision = () => run(async () => {
    await axios.post(`/api/projects/${projectId}/request-revision`, { note: revisionNote }, authConfig());
    setRevisionNote('');
  });

  const handleComment = () => run(async () => {
    await axios.post(`/api/projects/${projectId}/comments`, { content: comment }, authConfig());
    setComment('');
  });

  if (!projectId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Tracking</h2>
            {project && (
              <p className="text-sm text-slate-500 mt-1">
                {project.design?.title}
                {project.purchaseType === 'halfA' ? ' · Half A' : project.purchaseType === 'halfB' ? ' · Half B' : project.purchaseType === 'full' ? ' · Full' : ''}
                {' · '}{project.client?.name} ↔ {project.engineer?.name}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"><X size={20} /></button>
        </div>

        {loading || !project ? (
          <div className="p-12 text-center text-slate-500 animate-pulse">Loading project...</div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={project.projectStatus} />
                {project.isReadOnly && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Read-only</span>
                )}
              </div>
              {project.projectStatus === 'Paid' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>{statusExplanation['Paid']}</p>
                </div>
              )}
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-slate-800 dark:text-white">{project.progressPercentage}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all" style={{ width: `${project.progressPercentage}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                <p>Start: {project.expectedStartDate ? new Date(project.expectedStartDate).toLocaleDateString() : '—'}</p>
                <p>Expected end: {project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : '—'}</p>
                <p>Completed: {project.actualCompletionDate ? new Date(project.actualCompletionDate).toLocaleDateString() : '—'}</p>
              </div>
            </div>

            <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
              {[
                { id: 'overview', label: 'Actions' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'files', label: 'Files' },
                { id: 'history', label: 'Progress History' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {tab === 'overview' && (
                <div className="space-y-4">
                  {/* Always show the purchased design */}
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-40 h-36 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0">
                      {project.design?.images?.[0] ? (
                        <img
                          src={project.design.images[0]}
                          alt={project.design?.title || 'Design'}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/320x240?text=Design'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">No image</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                        {project.design?.title || 'Purchased design'}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {project.design?.houseType || 'House'}
                        {project.design?.rooms != null ? ` · ${project.design.rooms} rooms` : ''}
                        {project.design?.price != null ? ` · $${Number(project.design.price).toLocaleString()}` : ''}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Client: {project.client?.name || '—'} · Engineer: {project.engineer?.name || '—'}
                      </p>
                      {project.transaction?.amountPaid != null && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            Paid: ${Number(project.transaction.amountPaid).toLocaleString()}
                            {project.transaction.totalPrice != null
                              ? ` / $${Number(project.transaction.totalPrice).toLocaleString()}`
                              : ''}
                          </p>
                          {project.transaction.paymentPlan === 'half' && project.transaction.remainingStatus === 'pending' && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                              Remaining ${Number(project.transaction.amountRemaining || 0).toLocaleString()} due
                            </span>
                          )}
                          {project.transaction.paymentPlan === 'half' && project.transaction.remainingStatus === 'paid' && (
                            <span className="inline-flex text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              Remaining paid
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEngineer && project.projectStatus === 'Paid' && (
                    <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Play size={16} /> Start Work</h3>
                      {renderScheduleFields()}
                      <button disabled={saving} onClick={handleStart} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">Start Work</button>
                    </div>
                  )}

                  {isEngineer && ['In Progress', 'Revision Requested'].includes(project.projectStatus) && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Pencil size={16} /> Schedule</h3>
                        {!editingSchedule && (
                          <button
                            type="button"
                            onClick={() => {
                              const savedStart = toDateInputValue(project.expectedStartDate);
                              const savedEnd = toDateInputValue(project.expectedCompletionDate);
                              // Never prefill a past start — force a valid re-selection
                              const startOk = savedStart && savedStart >= todayStr;
                              setStartForm({
                                expectedStartDate: startOk ? savedStart : '',
                                expectedCompletionDate:
                                  startOk && savedEnd && savedEnd > savedStart ? savedEnd : ''
                              });
                              clearScheduleErrors();
                              setEditingSchedule(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                          >
                            Edit Dates
                          </button>
                        )}
                      </div>
                      {editingSchedule ? (
                        <>
                          {renderScheduleFields()}
                          <div className="flex flex-wrap gap-2">
                            <button disabled={saving} onClick={handleUpdateSchedule} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">Save Dates</button>
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => {
                                setStartForm({
                                  expectedStartDate: toDateInputValue(project.expectedStartDate),
                                  expectedCompletionDate: toDateInputValue(project.expectedCompletionDate)
                                });
                                clearScheduleErrors();
                                setEditingSchedule(false);
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {project.expectedStartDate ? new Date(project.expectedStartDate).toLocaleDateString() : '—'}
                          {' → '}
                          {project.expectedCompletionDate ? new Date(project.expectedCompletionDate).toLocaleDateString() : '—'}
                        </p>
                      )}
                    </div>
                  )}

                  {isEngineer && ['In Progress', 'Revision Requested'].includes(project.projectStatus) && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Upload size={16} /> Update Progress</h3>
                      <select value={progressForm.progressPercentage} onChange={(e) => setProgressForm({ ...progressForm, progressPercentage: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white">
                        {[0, 25, 50, 75, 100]
                          .filter((n) => n >= (Number(project.progressPercentage) || 0))
                          .map((n) => <option key={n} value={n}>{n}%</option>)}
                      </select>
                      <p className="text-[11px] text-slate-500">Progress can only move forward (cannot go back to a lower %).</p>
                      <textarea rows={3} value={progressForm.note} onChange={(e) => setProgressForm({ ...progressForm, note: e.target.value })} placeholder="Progress notes..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white" />
                      <input type="file" multiple onChange={(e) => setProgressForm({ ...progressForm, files: e.target.files })} className="block w-full text-xs text-slate-500" />
                      <div className="flex flex-wrap gap-2">
                        <button disabled={saving} onClick={handleProgress} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold disabled:opacity-60">Save Progress</button>
                        {project.progressPercentage === 100 && (
                          <button
                            disabled={saving || hasUnpaidRemaining}
                            onClick={handleComplete}
                            title={hasUnpaidRemaining ? 'Client must pay remaining balance first' : undefined}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-1"
                          >
                            <CheckCircle2 size={16} /> Mark as Completed
                          </button>
                        )}
                      </div>
                      {hasUnpaidRemaining && project.progressPercentage === 100 && (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Remaining ${Number(project.transaction.amountRemaining).toLocaleString()} unpaid — client must pay before you can mark completed.
                        </p>
                      )}
                    </div>
                  )}

                  {isClient && project.projectStatus === 'Completed - Waiting for Client Confirmation' && (
                    <div className="p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-900/10 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white">Confirm completion or request revisions</h3>
                      {hasUnpaidRemaining && (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          Pay remaining ${Number(project.transaction.amountRemaining).toLocaleString()} in Purchases before confirming completion.
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={saving || hasUnpaidRemaining}
                          onClick={handleConfirm}
                          title={hasUnpaidRemaining ? 'Pay remaining balance first' : undefined}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60"
                        >
                          Confirm Completion
                        </button>
                      </div>
                      <textarea rows={3} value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="Describe revisions needed..." className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white" />
                      <button disabled={saving || !revisionNote.trim()} onClick={handleRevision} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-1"><RefreshCw size={16} /> Request Revisions</button>
                    </div>
                  )}

                  {isClient && !project.isReadOnly && !['Delivered', 'Paid'].includes(project.projectStatus) && (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><MessageSquare size={16} /> Comment to Engineer</h3>
                      <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm dark:text-white" />
                      <button disabled={saving || !comment.trim()} onClick={handleComment} className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 text-white text-sm font-bold disabled:opacity-60 flex items-center gap-1"><Send size={14} /> Send Comment</button>
                    </div>
                  )}

                  {(project.clientComments || []).length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Client Comments</h3>
                      {[...project.clientComments].reverse().map((c, i) => (
                        <div key={i} className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-sm">
                          {c.content}
                          <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {project.projectStatus === 'Delivered' && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm flex items-start gap-2">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                      Completion confirmed. This project is read-only — history remains available.
                    </div>
                  )}
                </div>
              )}

              {tab === 'timeline' && (
                <div className="space-y-3">
                  {timeline.length === 0 ? <p className="text-sm text-slate-500">No timeline events yet.</p> : timeline.map((t) => (
                    <div key={t._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-800 dark:text-white">{t.action}</span>
                        <span>{new Date(t.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-500">{t.actor?.name || 'System'} · {t.status} · {t.progressPercentage}%</p>
                      {t.note && <p className="text-sm mt-2 dark:text-slate-200">{t.note}</p>}
                    </div>
                  ))}
                </div>
              )}

              {tab === 'files' && (
                <div className="space-y-3">
                  {(project.attachments || []).length === 0 ? <p className="text-sm text-slate-500">No files uploaded yet.</p> : project.attachments.map((f, i) => (
                    <div key={i} className="flex justify-between gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex gap-2 min-w-0">
                        <FileText className="text-indigo-500 shrink-0" size={18} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate dark:text-white">{f.fileName}</p>
                          <p className="text-xs text-slate-500">{f.uploadedBy?.name} · {new Date(f.uploadedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <a href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">Open</a>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'history' && (
                <div className="space-y-3">
                  {progressUpdates.length === 0 ? <p className="text-sm text-slate-500">No progress updates yet.</p> : progressUpdates.map((p) => (
                    <div key={p._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span className="font-bold text-slate-800 dark:text-white">{p.progressPercentage}% · {p.updatedBy?.name}</span>
                        <span>{new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                      {p.note && <p className="text-sm dark:text-slate-200">{p.note}</p>}
                      {(p.files || []).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {p.files.map((f, i) => (
                            <a key={i} href={f.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 underline">{f.fileName}</a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
export { statusColor };
