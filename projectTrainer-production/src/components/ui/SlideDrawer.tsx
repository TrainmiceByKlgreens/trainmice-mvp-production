import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SlideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function SlideDrawer({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer
}: SlideDrawerProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-corporate-950/40 backdrop-blur-sm z-[60] transition-opacity duration-500 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-white shadow-premium z-[70] transform transition-transform duration-500 ease-out border-l border-corporate-100 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-8 border-b border-corporate-100 bg-corporate-50/30">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-1 bg-accent-500 rounded-full" />
                                <span className="text-[10px] font-black text-accent-600 uppercase tracking-[0.3em]">TrainMICE</span>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center text-corporate-400 hover:text-corporate-900 transition-all bg-white border border-corporate-100 rounded-xl hover:rotate-90 duration-300 shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <h2 className="text-2xl font-black text-corporate-900 tracking-tighter uppercase text-sm tracking-[0.2em]">{title}</h2>
                        {subtitle && (
                            <p className="text-[11px] font-black text-corporate-400 uppercase tracking-widest mt-1 opacity-80">{subtitle}</p>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col overflow-hidden p-0 bg-white">
                        {children}
                    </div>

                    {/* Optional Footer */}
                    {footer && (
                        <div className="p-8 border-t border-corporate-100 bg-white">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
