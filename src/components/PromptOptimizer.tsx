import React, { useState, useEffect } from 'react';
import {
    Play, Save, RotateCcw, Database,
    BrainCircuit, Sparkles, AlertTriangle,
    FileText, Code, Loader2, Maximize2, Minimize2,
    ChevronLeft, ChevronRight, Layout
} from 'lucide-react';
import type { Report } from '../services/api';
import type { AISettings } from '../types/settings';
import type { PromptState } from '../types/prompt';
import { compilePrompt } from '../utils/qcPrompt';
import { analyzeReportWithAI } from '../services/aiService';
import { supabaseService } from '../services/supabaseService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import clsx from 'clsx';

interface PromptOptimizerProps {
    report: Report | null;
    settings: AISettings;
    promptState: PromptState;
    onSave: (name: string, content: string, description: string) => void;
    onActivate: (id: string) => void;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({
    report, settings, promptState, onSave, onActivate
}) => {
    const activeVersion = promptState.versions.find(v => v.id === promptState.activeVersionId) || promptState.versions[0];

    const [editContent, setEditContent] = useState(activeVersion.content);
    const [result, setResult] = useState<string | null>(null);
    const [originalAnalysis, setOriginalAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingOriginal, setFetchingOriginal] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showCompiled, setShowCompiled] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveDesc, setSaveDesc] = useState('');

    // Panel states for responsiveness and focus
    const [historyVisible, setHistoryVisible] = useState(true);
    const [dataVisible, setDataVisible] = useState(true);
    const [focusedPanel, setFocusedPanel] = useState<'none' | 'editor' | 'output'>('none');
    const [compareMode, setCompareMode] = useState(true);

    useEffect(() => {
        if (report) {
            setFetchingOriginal(true);
            supabaseService.getReportByLabId(report.LabID)
                .then(r => setOriginalAnalysis(r?.analysis || null))
                .finally(() => setFetchingOriginal(false));
        }
    }, [report?.LabID]);

    const compiledPrompt = report ? compilePrompt(editContent, report) : '';

    const variables = [
        { token: '{{fullname}}', desc: 'Patient Name' },
        { token: '{{age}}', desc: 'Age' },
        { token: '{{gender}}', desc: 'Gender' },
        { token: '{{clinical_info}}', desc: 'Clinical context' },
        { token: '{{test_results}}', desc: 'Full lab data' },
    ];

    const handleRunTest = async () => {
        if (!report) return;
        setLoading(true);
        setError(null);
        try {
            const output = await analyzeReportWithAI(report, settings, editContent);
            setResult(output);
        } catch (e: any) {
            setError(e.message || "Analysis failed");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickSave = () => {
        setShowSaveModal(true);
    };

    if (!report) {
        return (
            <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                <Database className="w-16 h-16 text-slate-200 mb-6" />
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Data Context Required</h2>
                <p className="text-slate-400 font-medium mt-2">Search for a Lab ID first to load a report for optimization.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Prompt Strategy Optimizer</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Iterative Logic Development Environment</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCompiled(!showCompiled)}
                        className={clsx(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                            showCompiled ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "text-slate-400 border-slate-200"
                        )}
                    >
                        {showCompiled ? <FileText className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                        {showCompiled ? 'Show Editor' : 'Preview Prompt'}
                    </button>
                    <button
                        onClick={() => setEditContent(activeVersion.content)}
                        className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-600 font-black uppercase tracking-widest text-[10px] transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                    <button
                        onClick={handleRunTest}
                        disabled={loading}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                        Test Logic
                    </button>
                    <button
                        onClick={handleQuickSave}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
                    >
                        <Save className="w-4 h-4" />
                        Deploy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-h-[800px] h-[calc(100vh-240px)] transition-all duration-500 ease-in-out">
                {/* 0. Version Sidebar */}
                <div className={clsx(
                    "flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500",
                    !historyVisible ? "xl:col-span-1" : "xl:col-span-2",
                    focusedPanel !== 'none' && !historyVisible ? "hidden xl:flex" : ""
                )}>
                    <div className="bg-slate-50 px-4 py-4 border-b border-slate-100 flex items-center justify-between overflow-hidden">
                        {historyVisible && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Logic History</span>}
                        <button
                            onClick={() => setHistoryVisible(!historyVisible)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 mx-auto"
                        >
                            {historyVisible ? <ChevronLeft className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                        </button>
                    </div>
                    {historyVisible && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 animate-in fade-in slide-in-from-left-4 duration-500">
                            {promptState.versions.map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => {
                                        onActivate(v.id);
                                        setEditContent(v.content);
                                        setResult(null);
                                    }}
                                    className={clsx(
                                        "w-full text-left p-4 rounded-2xl transition-all border",
                                        v.id === promptState.activeVersionId
                                            ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20"
                                            : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"
                                    )}
                                >
                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{v.name}</div>
                                    <div className="text-[9px] font-bold text-slate-400 mt-1">{new Date(v.createdAt).toLocaleDateString()}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* 1. Prompt Editor (Left) */}
                <div className={clsx(
                    "flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500",
                    focusedPanel === 'editor' ? "xl:col-span-9" :
                        focusedPanel === 'output' ? "xl:col-span-1" :
                            !historyVisible && !dataVisible ? "xl:col-span-5" :
                                !historyVisible || !dataVisible ? "xl:col-span-4" : "xl:col-span-3"
                )}>
                    <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {showCompiled ? <FileText className="w-4 h-4 text-emerald-500" /> : <Code className="w-4 h-4 text-indigo-500" />}
                            {focusedPanel !== 'output' && (
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {showCompiled ? 'Preview' : 'Editor'}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => setFocusedPanel(focusedPanel === 'editor' ? 'none' : 'editor')}
                            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400"
                            title={focusedPanel === 'editor' ? "Exit Focus Mode" : "Focus Editor"}
                        >
                            {focusedPanel === 'editor' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col relative overflow-hidden">
                        {focusedPanel === 'output' ? (
                            <div className="flex-1 flex items-center justify-center bg-slate-50/50">
                                <Code className="w-6 h-6 text-slate-200" />
                            </div>
                        ) : showCompiled ? (
                            <div className="flex-1 p-8 font-mono text-xs leading-relaxed text-slate-500 bg-slate-50/50 whitespace-pre-wrap overflow-y-auto">
                                {compiledPrompt}
                            </div>
                        ) : (
                            <>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="flex-1 p-8 font-mono text-sm leading-relaxed text-slate-700 focus:outline-none resize-none bg-slate-50/20"
                                    placeholder="Type your clinical logic here..."
                                />
                                <div className="absolute right-6 bottom-6 flex flex-col gap-2 pointer-events-none">
                                    <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg pointer-events-auto shadow-indigo-100/20">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Data Hooks</h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {variables.map(v => (
                                                <button
                                                    key={v.token}
                                                    onClick={() => setEditContent(prev => prev + ' ' + v.token)}
                                                    className="px-2 py-1.5 bg-slate-100 hover:bg-indigo-100 text-[10px] font-mono font-bold text-slate-600 hover:text-indigo-600 rounded-md transition-all border border-slate-200 text-left flex items-center gap-2"
                                                >
                                                    <span className="text-indigo-500 font-black">+</span>
                                                    {v.token}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. Middle (Data Context) */}
                <div className={clsx(
                    "flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all duration-500",
                    !dataVisible ? "xl:col-span-1" :
                        focusedPanel !== 'none' ? "xl:col-span-1" : "xl:col-span-3"
                )}>
                    <div className="bg-slate-50 px-4 py-4 border-b border-slate-100 flex items-center justify-between overflow-hidden">
                        {dataVisible && focusedPanel === 'none' && (
                            <div className="flex items-center gap-2 whitespace-nowrap">
                                <Database className="w-4 h-4 text-emerald-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Data</span>
                            </div>
                        )}
                        <button
                            onClick={() => setDataVisible(!dataVisible)}
                            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 mx-auto"
                        >
                            {dataVisible ? <ChevronRight className="w-4 h-4" /> : <Layout className="w-4 h-4" />}
                        </button>
                    </div>
                    {dataVisible && focusedPanel === 'none' && (
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Active Test Case</div>
                                <div className="space-y-1">
                                    <div className="text-xl font-black text-slate-800 tracking-tight truncate">{report.Fullname}</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black uppercase tracking-widest shrink-0">LabID {report.LabID}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{report.Gender} • {report.Age}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Raw Metrics</div>
                                {report.TestReqest.map((test, tidx) => (
                                    <div key={tidx} className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                        <div className="text-[11px] font-black text-indigo-600 uppercase tracking-widest mb-2 truncate">{test.TestName}</div>
                                        <div className="space-y-1.5">
                                            {test.Testparameters.map((p, pidx) => (
                                                <div key={pidx} className="flex justify-between text-[11px] group">
                                                    <span className="text-slate-500 font-medium truncate mr-2">{p.ParameterName}</span>
                                                    <span className="font-mono font-bold text-slate-900 bg-white px-1.5 rounded shrink-0">{p.Value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Right (The Compare) */}
                <div className={clsx(
                    "flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden ring-4 ring-indigo-50/10 transition-all duration-500",
                    focusedPanel === 'output' ? "xl:col-span-9" :
                        focusedPanel === 'editor' ? "xl:col-span-1" :
                            !dataVisible && !historyVisible ? "xl:col-span-5" :
                                !dataVisible || !historyVisible ? "xl:col-span-4" : "xl:col-span-4"
                )}>
                    <div className="bg-slate-900 px-8 py-4 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white/50">
                            <BrainCircuit className="w-4 h-4" />
                            {focusedPanel !== 'editor' && (
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Output Comparison</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {focusedPanel !== 'editor' && (
                                <button
                                    onClick={() => setCompareMode(!compareMode)}
                                    className={clsx(
                                        "hidden sm:block px-3 py-1 text-[9px] font-black uppercase rounded transition-all border",
                                        compareMode ? "bg-white/20 text-white/70 border-white/10 hover:bg-white/30" : "bg-indigo-500 text-white border-indigo-400 hover:bg-indigo-600"
                                    )}
                                >
                                    {compareMode ? 'Side by Side' : 'Single View'}
                                </button>
                            )}
                            <button
                                onClick={() => setFocusedPanel(focusedPanel === 'output' ? 'none' : 'output')}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50"
                                title={focusedPanel === 'output' ? "Exit Focus Mode" : "Focus Comparison"}
                            >
                                {focusedPanel === 'output' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <div className={clsx(
                        "flex-1 grid divide-slate-100 overflow-hidden",
                        compareMode ? "grid-cols-1 md:grid-cols-2 divide-x" : "grid-cols-1"
                    )}>
                        {/* Current Production */}
                        {compareMode && (
                            <div className="flex flex-col overflow-hidden bg-slate-50/30">
                                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Production</span>
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200" />
                                </div>
                                <div className="flex-1 overflow-y-auto p-8">
                                    {fetchingOriginal ? (
                                        <div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>
                                    ) : originalAnalysis ? (
                                        <div className="prose prose-slate prose-sm max-w-none opacity-60">
                                            <Markdown remarkPlugins={[remarkGfm]}>{originalAnalysis}</Markdown>
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                            <Database className="w-8 h-8 text-slate-200 mb-3" />
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">No existing audit found for this case</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Iteration Preview */}
                        <div className="flex flex-col overflow-hidden bg-white relative">
                            <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Experimental Draft</span>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">New Build</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 bg-white">
                                {loading ? (
                                    <div className="h-full flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
                                ) : error ? (
                                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-red-500">
                                        <AlertTriangle className="w-8 h-8 mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">Analysis Failed</p>
                                        <p className="text-[9px] opacity-70 mt-1">{error}</p>
                                    </div>
                                ) : result ? (
                                    <div className="prose prose-indigo prose-lg max-w-none animate-in fade-in duration-500
                                        prose-headings:font-black prose-headings:tracking-tighter
                                        prose-p:text-slate-700 prose-p:leading-relaxed
                                        prose-strong:text-slate-900 prose-strong:font-black
                                    ">
                                        <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                                        <Sparkles className="w-12 h-12 text-indigo-200 mb-4" />
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Iteration Ready</h4>
                                        <p className="text-[10px] font-bold text-slate-400">Click "Test Logic" to evaluate your changes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Version Modal */}
                {showSaveModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                            <div className="p-8 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Deploy Optimized Strategy</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Finalize this clinical logic update</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version Name</label>
                                    <input
                                        autoFocus
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        placeholder="e.g. Optimized CBC Logic v2"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimization Notes</label>
                                    <textarea
                                        value={saveDesc}
                                        onChange={(e) => setSaveDesc(e.target.value)}
                                        placeholder="What was improved during this iteration?"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 resize-none h-24"
                                    />
                                </div>
                            </div>
                            <div className="p-8 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    Back to Editor
                                </button>
                                <button
                                    onClick={() => {
                                        onSave(saveName || 'Optimized Strategy', editContent, saveDesc || 'Logic optimization session');
                                        setShowSaveModal(false);
                                        setSaveName('');
                                        setSaveDesc('');
                                        alert('New strategy saved and activated!');
                                    }}
                                    disabled={!editContent}
                                    className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:shadow-xl transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Confirm & Activate
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


