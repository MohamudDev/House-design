import { Link, useLocation } from 'react-router-dom';
import { Box, Ruler, FolderKanban, ClipboardList } from 'lucide-react';
import NotificationCenter from '../NotificationCenter';

const links = [
  { to: '/client-dashboard/projects', label: 'My Projects', icon: ClipboardList, end: true },
  { to: '/client-dashboard/my-designs', label: 'My Designs', icon: Box },
  { to: '/client-dashboard/customisations', label: 'Customise', icon: Ruler },
  { to: '/client-dashboard/collaborations', label: 'My Collaborations', icon: FolderKanban }
];

const ClientWorkspaceNav = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {links.map(({ to, label, icon: Icon, end }) => {
        const active = end ? pathname === to : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600'
            }`}
            title={label}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
      <NotificationCenter
        variant="projects"
        buttonClassName="relative p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 transition-colors"
      />
    </div>
  );
};

export default ClientWorkspaceNav;
