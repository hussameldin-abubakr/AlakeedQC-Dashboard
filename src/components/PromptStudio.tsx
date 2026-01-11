import React, { useState } from 'react';
import {
    X, Save, RotateCcw, History,
    Trash2, Code, Info, Clock
} from 'lucide-react';
import type { PromptVersion, PromptState } from '../types/prompt';
import clsx from 'clsx';

interface PromptStudioProps {
    isOpen: boolean;
    onClose: () => void;
    state: PromptState;
    onSave: (name: string, content: string, description: string) => void;
    onActivate: (id: string) => void;
    onDelete: (id: string) => void;
    onReset: () => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({
    isOpen, onClose, state, onSave, onActivate, onDelete, onReset
}) => {
    const activeVersion = state.versions.find(v => v.id === state.activeVersionId) || state.versions[0];
    const [editContent, setEditContent] = useState(activeVersion.content);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [view, setView] = useState<'editor' | 'history'>('editor');
    const [showSaveModal, setShowSaveModal] = useState(false);

    if (!isOpen) return null;

    const variables = [
        { token: '{{fullname}}', desc: 'Patient full name' },
        { token: '{{age}}', desc: 'Patient age' },
        { token: '{{gender}}', desc: 'Patient gender' },
        { token: '{{clinical_info}}', desc: 'Report clinical indications' },
        { token: '{{test_results}}', desc: 'Formatted test results & parameters' },
    ];

    const handleRestore = (version: PromptVersion) => {
        setEditContent(version.content);
        setView('editor');
    };

    return (
        <div className="fixed inset-0 z-[110] flex bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col m-4 sm:m-8 bg-white rounded-[2.5rem] shadow-3xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">

                {/* Header */}
                <div className="bg-slate-50 px-10 py-6 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Code className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">AQ Prompt Studio</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-indigo-200">
                                    v{state.versions.length}.0
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Logic Editor</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-8 w-px bg-slate-200 mx-2" />
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Sub-Header / Tabs */}
                <div className="px-10 py-1 bg-white border-b border-slate-100 flex items-center gap-8">
                    <button
                        onClick={() => setView('editor')}
                        className={clsx(
                            "py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-2",
                            view === 'editor' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                        )}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={clsx(
                            "py-4 text-sm font-black uppercase tracking-widest transition-all border-b-2 px-2",
                            view === 'history' ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent hover:text-slate-600"
                        )}
                    >
                        Version History
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">

                    {view === 'editor' ? (
                        <>
                            {/* Variables Panel */}
                            <div className="w-72 border-r border-slate-100 bg-slate-50/50 p-8 overflow-y-auto">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Available Tokens</h3>
                                <div className="space-y-4">
                                    {variables.map(v => (
                                        <div
                                            key={v.token}
                                            className="group bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                                            onClick={() => setEditContent(prev => prev + v.token)}
                                        >
                                            <div className="font-mono text-[13px] text-indigo-600 font-bold mb-1 group-hover:scale-105 transition-transform origin-left">
                                                {v.token}
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-medium">
                                                {v.desc}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-10 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <div className="flex items-center gap-2 text-amber-700 text-xs font-black uppercase tracking-widest mb-2">
                                        <Info className="w-4 h-4" />
                                        <span>Pro Tip</span>
                                    </div>
                                    <p className="text-[11px] text-amber-600 leading-relaxed">
                                        Use tokens inside curly braces. The AI will replace them with live clinical data during analysis.
                                    </p>
                                </div>

                                <div className="mt-auto pt-10">
                                    <button
                                        onClick={onReset}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all text-[11px] font-black uppercase tracking-widest"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Reset to Defaults
                                    </button>
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 flex flex-col p-8 bg-slate-50/20">
                                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-inner flex flex-col overflow-hidden">
                                    <div className="bg-slate-50 px-6 py-2 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Markdown Template</span>
                                        <span className="text-[10px] font-bold text-slate-300">Chars: {editContent.length}</span>
                                    </div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="flex-1 p-8 font-mono text-sm leading-relaxed text-slate-700 focus:outline-none resize-none"
                                        placeholder="Type your clinical audit logic here..."
                                    />
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={() => setShowSaveModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-sm shadow-xl shadow-indigo-100 hover:shadow-2xl transition-all flex items-center gap-3 active:scale-95"
                                    >
                                        <Save className="w-5 h-5" />
                                        Save New Version
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* History View */
                        <div className="flex-1 p-10 overflow-y-auto bg-slate-50/30">
                            <div className="max-w-4xl mx-auto space-y-6">
                                {state.versions.slice().reverse().map((v) => (
                                    <div
                                        key={v.id}
                                        className={clsx(
                                            "bg-white rounded-2xl border p-6 flex items-start justify-between group transition-all",
                                            v.id === state.activeVersionId
                                                ? "border-emerald-500 shadow-lg shadow-emerald-50"
                                                : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex gap-5">
                                            <div className={clsx(
                                                "p-3 rounded-xl",
                                                v.id === state.activeVersionId ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <History className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="text-lg font-black text-slate-800">{v.name}</h4>
                                                    {v.id === state.activeVersionId && (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-sm mb-3 font-medium">{v.description}</p>
                                                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(v.createdAt).toLocaleString()}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{v.content.length} Characters</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {v.id !== state.activeVersionId && (
                                                <>
                                                    <button
                                                        onClick={() => onActivate(v.id)}
                                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-800"
                                                    >
                                                        Activate
                                                    </button>
                                                    <button
                                                        onClick={() => onDelete(v.id)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleRestore(v)}
                                                className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
                                                title="Load into editor"
                                            >
                                                <RotateCcw className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Version Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="p-8 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Save New Logic Version</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Describe these clinical improvements</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version Name</label>
                                <input
                                    autoFocus
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="e.g. Hematology rules update"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Change Log / Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    placeholder="What clinical reasoning changed?"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 resize-none h-24"
                                />
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onSave(editName || 'Untitled Version', editContent, editDesc || 'No description');
                                    setShowSaveModal(false);
                                    setEditName('');
                                    setEditDesc('');
                                }}
                                disabled={!editContent}
                                className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                Confirm Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
