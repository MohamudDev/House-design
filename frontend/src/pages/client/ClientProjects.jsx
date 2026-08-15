import Navbar from '../../components/Navbar';
import ClientWorkspaceNav from '../../components/client/ClientWorkspaceNav';
import ProjectsPage from '../shared/ProjectsPage';

const ClientProjects = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
    <Navbar />
    <div className="flex-1 max-w-7xl mx-auto w-full p-6">
      <ClientWorkspaceNav />
      <ProjectsPage title="My Projects" subtitle="Track purchased designs from payment to completion" />
    </div>
  </div>
);

export default ClientProjects;
