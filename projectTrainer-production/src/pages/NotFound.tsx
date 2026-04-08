import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-corporate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-corporate-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="text-center relative z-10 animate-fade-in bg-white/5 backdrop-blur-3xl p-12 rounded-3xl border border-white/10 shadow-modern-2xl max-w-lg w-full">
        <div className="w-24 h-24 bg-corporate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-corporate-700/50 relative overflow-hidden group">
          <div className="absolute inset-0 bg-accent-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          <span className="text-5xl font-black text-white mix-blend-overlay">!</span>
        </div>
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-corporate-100 to-corporate-400 tracking-tighter mb-2">404</h1>
        <h2 className="text-xl font-black text-white mt-4 tracking-widest uppercase">System Vector Not Found</h2>
        <p className="text-corporate-400 mt-4 mb-10 text-sm font-medium leading-relaxed">
          The requested operational resource could not be located or access has been restricted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto h-12 px-8 uppercase text-[10px] font-black tracking-widest border-corporate-700 text-corporate-300 hover:bg-corporate-800 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retreat
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="primary" className="w-full sm:w-auto h-12 px-8 uppercase text-[10px] font-black tracking-widest bg-corporate-100 text-corporate-900 hover:bg-white border-white">
              <Home className="w-4 h-4 mr-2" />
              Hub Alpha
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
