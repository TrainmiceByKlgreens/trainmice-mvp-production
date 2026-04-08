import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';

export function VerifyEmailSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show success message for 2 seconds, then redirect to login page
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-corporate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-corporate-500/10 rounded-full blur-[150px]" />
      </div>

      <Card className="max-w-md w-full bg-white/95 backdrop-blur-xl border-white/20 shadow-modern-2xl relative z-10 animate-scale-in">
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-emerald-100 animate-pulse-slow">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-corporate-900 mb-3 uppercase tracking-tight">Credentials Verified</h1>
          <p className="text-sm font-bold text-corporate-600 mb-8 leading-relaxed">
            Your communication vector has been successfully authenticated. Operational access granted.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] font-black text-corporate-400 uppercase tracking-[0.2em]">
              Initializing sequence...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

