import ClientNavbar from '../../components/client/ClientNavbar';
import ClientWorkspaceNav from '../../components/client/ClientWorkspaceNav';
import ProjectsPage from '../shared/ProjectsPage';

const ClientProjects = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <ClientNavbar variant="workspace" />
    <div className="flex-1 max-w-7xl mx-auto w-full p-6">
      <ClientWorkspaceNav />
      <ProjectsPage title="My Projects" subtitle="Track purchased designs from payment to delivery" />
    </div>
  </div>
);

export default ClientProjects;
