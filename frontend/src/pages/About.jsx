import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { Target, Compass, Box, MessageSquare, ClipboardList, ChevronRight } from 'lucide-react';

const About = () => {
  const { user } = useContext(AuthContext);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="/about_hero_bg.png" 
            alt="Architectural Blueprint" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium mb-6">
            <Compass size={18} />
            Discover DesignSpace
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
            Redefining <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Architecture</span> for the Digital Age
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            We bridge the gap between visionary architects and homeowners. Our platform empowers you to explore, customize, and bring your dream home to life seamlessly.
          </p>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6">
                <Target size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Mission</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                To democratize access to world-class architectural design by connecting clients with top-tier engineers. We strive to make the design process transparent, interactive, and highly efficient.
              </p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-10 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6">
                <Compass size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Our Vision</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                To become the global standard platform where every architectural journey begins. We envision a future where designing a home is as immersive and exciting as living in it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Platform Features</h2>
            <p className="text-slate-600 dark:text-slate-400">Everything you need to seamlessly manage your architectural projects from initial concept to final blueprint.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Box size={24} />, title: '3D House Viewing', desc: 'Experience designs in immersive 3D before making any commitments.', bgColor: 'bg-blue-50 dark:bg-blue-900/30', textColor: 'text-blue-600 dark:text-blue-400' },
              { icon: <MessageSquare size={24} />, title: 'Direct Communication', desc: 'Chat in real-time with engineers to discuss modifications and updates.', bgColor: 'bg-purple-50 dark:bg-purple-900/30', textColor: 'text-purple-600 dark:text-purple-400' },
              { icon: <ClipboardList size={24} />, title: 'Project Management', desc: 'Track progress, manage files, and handle approvals all in one dashboard.', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', textColor: 'text-emerald-600 dark:text-emerald-400' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bgColor} ${feature.textColor}`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h4>
                <p className="text-slate-600 dark:text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-20 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Meet the Team</h2>
            <p className="text-slate-600 dark:text-slate-400">The passionate architects and technologists behind DesignSpace.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { name: 'Sarah Jenkins', role: 'Chief Architect', img: '/team_member_1.png' },
              { name: 'Michael Chen', role: 'Head of Engineering', img: '/team_member_2.png' },
              { name: 'David Okafor', role: 'Lead Developer', img: '/team_member_3.png' }
            ].map((member, idx) => (
              <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 w-full p-6 text-left transform transition-transform duration-300">
                  <h4 className="text-xl font-bold text-white mb-1">{member.name}</h4>
                  <p className="text-blue-300 font-medium">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/about_hero_bg.png')] opacity-10 bg-cover bg-center" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Build Your Dream Home?</h2>
          <p className="text-lg text-slate-300 mb-10">Join thousands of homeowners and engineers collaborating on our platform today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={user ? (user.role === 'client' ? '/client-dashboard' : user.role === 'engineer' ? '/engineer-dashboard' : '/admin-dashboard') : '/login'} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              Explore Designs <ChevronRight size={20} />
            </Link>
            <Link 
              to="/contact" 
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
