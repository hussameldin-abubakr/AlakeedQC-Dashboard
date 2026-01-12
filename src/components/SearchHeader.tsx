import React from 'react';
import {
    Search, Loader2, Settings2, Code,
    LogOut, User, Zap, LayoutDashboard, BrainCircuit, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

interface SearchHeaderProps {
    value: string;
    onChange: (val: string) => void;
    onSearch: (labId: string) => void;
    onOpenSettings: () => void;
    onOpenPrompt: () => void;
    onOpenBulk: () => void;
    onSignOut: () => void;
    currentView: 'auditor' | 'dashboard' | 'optimizer';
    onViewChange: (view: 'auditor' | 'dashboard' | 'optimizer') => void;
    userEmail?: string | null;
    loading: boolean;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    value, onChange, onSearch, onOpenSettings, onOpenPrompt, onOpenBulk, onSignOut, currentView, onViewChange, userEmail, loading
}) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSearch(value.trim());
        }
    };

    return (
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-[60] shadow-sm">
            <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">

                {/* Logo & Navigation */}
                <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg shadow-blue-100">
                            <span className="font-bold text-xl tracking-tighter">AQ</span>
                        </div>
                        <h1 className="text-xl font-black hidden lg:block text-slate-800 tracking-tight">Alakeed QC</h1>
                    </div>

                    <nav className="flex items-center bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => onViewChange('auditor')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                currentView === 'auditor' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <BrainCircuit className="w-4 h-4" />
                            Auditor
                        </button>
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                currentView === 'dashboard' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Analytics
                        </button>
                        <button
                            onClick={() => onViewChange('optimizer')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                currentView === 'optimizer' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                            Optimizer
                        </button>
                    </nav>
                </div>

                {/* Search Bar Section (Only in Auditor View) */}
                <form onSubmit={handleSubmit} className={clsx("flex-1 max-w-xl flex gap-x-2 transition-all", currentView !== 'auditor' && "opacity-30 pointer-events-none grayscale")}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            id="lab-id-input"
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Search Lab ID..."
                            readOnly={currentView !== 'auditor'}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm bg-slate-50"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || currentView !== 'auditor'}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center gap-2 min-w-[120px] justify-center active:scale-95"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>

                    <div className="flex items-center gap-2 ml-2">
                        <button
                            type="button"
                            onClick={onOpenBulk}
                            className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/30 hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-all active:scale-95 group/bulk"
                            title="Bulk AI Auditor"
                        >
                            <Zap className="w-6 h-6 group-hover/bulk:fill-amber-500 transition-all" />
                        </button>
                        <button
                            type="button"
                            onClick={onOpenPrompt}
                            className="p-2.5 rounded-lg border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 transition-all active:scale-95"
                            title="Prompt Studio (Cmd+P)"
                        >
                            <Code className="w-6 h-6" />
                        </button>
                        <button
                            type="button"
                            onClick={onOpenSettings}
                            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
                            title="AI Settings"
                        >
                            <Settings2 className="w-6 h-6" />
                        </button>
                    </div>
                </form>

                {/* Profile & Auth Section */}
                <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                    <div className="hidden xl:flex flex-col items-end">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated Analyst</p>
                        <p className="text-sm font-bold text-slate-600 leading-none">{userEmail?.split('@')[0] || 'User'}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border border-slate-200 overflow-hidden relative group/avatar">
                        <User className="w-6 h-6" />
                        <button
                            onClick={onSignOut}
                            className="absolute inset-0 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
