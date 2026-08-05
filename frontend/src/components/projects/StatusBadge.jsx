import { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { statusColor, statusExplanation } from './statusExplanation';

/**
 * Status badge: click shows explanation only (does not open project or run actions).
 */
const StatusBadge = ({ status, className = '' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const text = statusExplanation[status] || 'Project status information.';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <span className={`relative inline-flex ${className}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold cursor-help ${statusColor[status] || 'bg-slate-100 text-slate-700'}`}
        title="Click for explanation"
        aria-expanded={open}
      >
        {status}
        <Info size={12} className="opacity-70" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-0 top-full mt-1 z-30 w-64 sm:w-72 p-3 rounded-xl bg-slate-900 text-white text-xs leading-relaxed shadow-xl border border-slate-700"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-bold block mb-1">{status}</span>
          {text}
        </span>
      )}
    </span>
  );
};

export default StatusBadge;
