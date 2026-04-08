import { HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HelpCenter() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center px-4 py-16">
            <div className="max-w-lg w-full text-center">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 mb-8">
                    <div className="absolute inset-0 rounded-3xl bg-amber-100 rotate-6" />
                    <div className="absolute inset-0 rounded-3xl bg-amber-50 -rotate-3" />
                    <div className="relative w-full h-full rounded-3xl bg-white border border-amber-100 shadow-lg flex items-center justify-center">
                        <HelpCircle className="w-10 h-10 text-amber-400" />
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
                    Help Center
                </h1>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 text-xs font-bold uppercase tracking-widest rounded-full mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Coming Soon
                </div>
                <p className="text-gray-500 text-base leading-relaxed max-w-sm mx-auto mb-8">
                    We're building something helpful here. Our Help Center will include FAQs, guides, and support resources. Check back soon!
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                    <button
                        onClick={() => navigate('/contact-us')}
                        className="flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition-all shadow-sm"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
}
