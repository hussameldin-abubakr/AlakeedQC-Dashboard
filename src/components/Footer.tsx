import React from 'react';
import raiLogo from '../assets/rai-logo.png';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full py-12 flex flex-col items-center justify-center gap-2 opacity-80 hover:opacity-100 transition-all duration-500">
            <div className="flex flex-col items-center justify-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                    Powered by
                </span>
                <img
                    src={raiLogo}
                    alt="Rai Logo"
                    className="h-6 w-auto object-contain opacity-90 grayscale-0"
                />
            </div>
        </footer>
    );
};
