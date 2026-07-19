import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Users, HardHat, ShieldCheck, Zap, MessageSquare, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';

const Services = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="/services_hero.png" 
            alt="Connecting Engineers and Clients" 
            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium mb-6">
            <Users size={18} />
            Connecting Vision with Expertise
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Clients</span> Meet Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Engineers</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10">
            DesignSpace is the ultimate bridge connecting homeowners with verified architectural engineers. We provide the tools, security, and platform to bring your dream home from concept to reality.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={user ? '/client-dashboard' : '/register'} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 hover:-translate-y-1"
            >
              Start a Project <ChevronRight size={20} />
            </Link>
            <Link 
              to="/about" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center hover:-translate-y-1"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* How We Connect Section */}
      <section className="py-24 bg-white dark:bg-slate-900 transition-colors relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Seamless Collaboration</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Our platform is designed to make the interaction between clients and engineers as smooth and productive as possible.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Direct Connection</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                No middlemen. Clients can browse portfolios and connect directly with the engineers whose style matches their vision.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare size={28} className="text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Real-time Chat</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Discuss modifications, share ideas, and get instant feedback through our built-in real-time messaging system.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Secure Transactions</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                All financial transactions and design transfers are secured and managed through our trusted WaafiPay integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dual Value Proposition */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* For Clients */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-10 md:p-14 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-6">
                  <Users size={16} /> For Clients
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Find Your Perfect Architect</h3>
                <ul className="space-y-4 mb-8">
                  {[
                    'Browse hundreds of premium 3D designs',
                    'Connect with verified professional engineers',
                    'Request custom modifications instantly',
                    'Securely purchase and download full blueprints'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={24} className="text-indigo-500 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300">
                  Register as a Client <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* For Engineers */}
            <div className="bg-slate-900 rounded-[2rem] p-10 md:p-14 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm mb-6">
                  <HardHat size={16} /> For Engineers
                </div>
                <h3 className="text-3xl font-bold text-white mb-6">Showcase & Monetize</h3>
                <ul className="space-y-4 mb-8">
                  {[
                    'Upload your designs with full 3D previews',
                    'Set your own prices and availability',
                    'Chat directly with interested buyers',
                    'Earn 90% commission on every sale'
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle2 size={24} className="text-blue-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="inline-flex items-center gap-2 font-bold text-blue-400 hover:text-blue-300">
                  Join as an Engineer <ChevronRight size={18} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Zap size={48} className="text-yellow-500 mx-auto mb-6" />
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Ready to Experience the Future?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">Whether you are looking to build a home or design one, DesignSpace is your ultimate partner.</p>
          <Link 
            to="/register" 
            className="inline-block bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-xl font-bold text-lg hover:-translate-y-1 transition-transform shadow-xl shadow-slate-900/10 dark:shadow-white/10"
          >
            Get Started Today
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Services;
