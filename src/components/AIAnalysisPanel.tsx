import React from 'react';
import {
    Sparkles, BrainCircuit, Search, Archive, RotateCcw, Zap, Copy, Check
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

interface AIAnalysisPanelProps {
    analysis: string | null;
    loading: boolean;
    onAnalyze: () => void;
    activeModel?: string;
    isFromCache?: boolean;
    onTune?: () => void;
}

export const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
    analysis, loading, onAnalyze, activeModel, isFromCache, onTune
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!analysis) return;
        navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-purple-100/50 border border-purple-100 overflow-hidden flex flex-col h-full ring-1 ring-purple-50 group">
            <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-indigo-700 px-8 py-7 flex items-center justify-between text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:rotate-12 duration-700">
                    <BrainCircuit className="w-20 h-20" />
                </div>
                <div className="relative z-10 flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">AI Clinical Insight</h2>
                        {isFromCache ? (
                            <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-black uppercase tracking-widest text-purple-200">
                                <Archive className="w-3 h-3" />
                                From Archive
                            </div>
                        ) : (
                            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-purple-200 opacity-80">Quality Control Audit</div>
                        )}
                    </div>
                </div>
                <div className="relative z-10 bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-400/30">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-emerald-300">Scanner Ready</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                            <BrainCircuit className="absolute inset-0 m-auto w-6 h-6 text-purple-600 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <p className="font-black text-slate-800 uppercase tracking-widest text-sm mb-1">Synthesizing Data</p>
                            <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-[200px]">Running cross-departmental correlation checks...</p>
                        </div>
                    </div>
                ) : analysis ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="prose prose-slate prose-sm max-w-none 
                            prose-headings:text-slate-800 prose-headings:font-black prose-headings:tracking-tight
                            prose-h3:text-indigo-600 prose-h3:mt-8 prose-h3:mb-4 prose-h3:flex prose-h3:items-center prose-h3:gap-2
                            prose-strong:text-slate-700 prose-strong:font-black
                            prose-p:text-slate-600 prose-p:leading-relaxed
                            prose-table:border prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-sm
                            prose-th:bg-slate-50 prose-th:px-4 prose-th:py-3 prose-th:text-slate-800
                            prose-td:px-4 prose-td:py-3 prose-td:border-t prose-td:border-slate-100
                            prose-ul:space-y-2
                        ">
                            <Markdown remarkPlugins={[remarkGfm]}>
                                {analysis}
                            </Markdown>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100">
                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between group/audit">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Log</p>
                                    <p className="text-xs font-bold text-slate-700">Verified by {activeModel || "AI Engine"}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className={clsx(
                                            "p-3 bg-white shadow-sm border rounded-xl transition-all flex items-center gap-2 group/copy",
                                            copied ? "text-emerald-600 border-emerald-100 bg-emerald-50" : "text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-100"
                                        )}
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                        {copied && <span className="text-[10px] font-black uppercase tracking-widest">Copied</span>}
                                    </button>
                                    <button
                                        onClick={onAnalyze}
                                        className="p-3 bg-white shadow-sm border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:shadow-md active:scale-95"
                                        title="Re-run analysis"
                                    >
                                        <RotateCcw className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={onTune}
                                        className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg shadow-indigo-100 border border-indigo-500 rounded-xl text-white hover:from-indigo-700 hover:to-blue-700 transition-all active:scale-95 flex items-center gap-2 group/tune"
                                        title="Optimize clinical logic for this report"
                                    >
                                        <Sparkles className="w-5 h-5 group-hover/tune:animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Tune Logic</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-purple-50 rounded-[2rem] flex items-center justify-center text-purple-200 group-hover:scale-110 transition-transform duration-500 relative">
                            <div className="absolute inset-0 bg-purple-100 rounded-[2rem] animate-ping opacity-20 group-hover:opacity-40"></div>
                            <Search className="w-10 h-10 relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Review Pending</h3>
                            <p className="max-w-xs text-slate-400 text-sm leading-relaxed">
                                Let <span className="text-purple-600 font-bold">{activeModel ? activeModel.split('-')[0].toUpperCase() : 'AI'}</span> cross-reference parameters and flag anomalies.
                            </p>
                        </div>
                        <button
                            onClick={onAnalyze}
                            className="bg-purple-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-purple-200 hover:shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center gap-3"
                        >
                            <Zap className="w-4 h-4 fill-white" />
                            Initialize Audit
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-4">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                            <div className={`w-full h-full bg-gradient-to-br ${i === 1 ? 'from-blue-400 to-blue-600' : i === 2 ? 'from-purple-400 to-purple-600' : 'from-indigo-400 to-indigo-600'}`}></div>
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="text-slate-800">Multi-Model</span> Verification Active
                </p>
            </div>
        </div>
    );
};
