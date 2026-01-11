import React, { useState, useRef } from 'react';
import {
    X, Zap, Play, Pause, RotateCcw,
    CheckCircle2, AlertTriangle, Clock,
    Database, Loader2, ListOrdered, ChevronRight,
    BrainCircuit, RefreshCw
} from 'lucide-react';
import { getLabIdRange } from '../utils/labIdUtils';
import { fetchReport } from '../services/api';
import { analyzeReportWithAI } from '../services/aiService';
import { supabaseService } from '../services/supabaseService';
import type { AISettings } from '../types/settings';
import clsx from 'clsx';

interface BulkProcessorProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AISettings;
    activePrompt: string;
    activePromptId: string;
}

interface JobStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
    error?: string;
    analysis?: string;
}

export const BulkProcessor: React.FC<BulkProcessorProps> = ({
    isOpen, onClose, settings, activePrompt, activePromptId
}) => {
    const [startId, setStartId] = useState('2510014360');
    const [endId, setEndId] = useState('2510014370');
    const [isProcessing, setIsProcessing] = useState(false);
    const [forceRegenerate, setForceRegenerate] = useState(false);
    const [jobs, setJobs] = useState<JobStatus[]>([]);
    const stopRequested = useRef(false);

    if (!isOpen) return null;

    const range = getLabIdRange(startId, endId);
    const completedCount = jobs.filter(j => j.status === 'completed' || j.status === 'skipped').length;
    const progress = range.length > 0 ? (completedCount / range.length) * 100 : 0;

    // Stats calculation
    const avgTimePerReport = 3.5; // seconds
    const remainingCount = range.length - completedCount;
    const estimatedSeconds = remainingCount * avgTimePerReport;
    const minutes = Math.floor(estimatedSeconds / 60);
    const seconds = Math.floor(estimatedSeconds % 60);

    const handleStart = async () => {
        if (range.length === 0) return;

        setIsProcessing(true);
        stopRequested.current = false;

        // Initialize or Sync jobs based on current range
        let currentJobs = [...jobs];
        if (jobs.length === 0 || jobs.length !== range.length || jobs[0].id !== range[0] || jobs[jobs.length - 1].id !== range[range.length - 1]) {
            currentJobs = range.map(id => ({ id, status: 'pending' }));
            setJobs(currentJobs);
        }

        for (let i = 0; i < range.length; i++) {
            if (stopRequested.current) break;

            const job = currentJobs[i];

            // Skip already successful jobs in the CURRENT table session
            if (job.status === 'completed' || job.status === 'skipped') continue;

            const currentId = range[i];

            // Update job to processing
            setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'processing', error: undefined } : j));

            try {
                // 1. Check Cache (if not forcing regenerate)
                if (!forceRegenerate) {
                    const cached = await supabaseService.getReportByLabId(currentId);
                    if (cached) {
                        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'skipped' } : j));
                        continue;
                    }
                }

                // 2. Fetch Data
                const report = await fetchReport(currentId);
                if (!report) throw new Error("Report not found");

                // 3. AI Analysis
                const analysis = await analyzeReportWithAI(report, settings, activePrompt);

                // 4. Save to DB (UPSERT if forcing regenerate, though saveAIReport usually appends)
                await supabaseService.saveAIReport({
                    lab_id: currentId,
                    analysis,
                    model: settings.model,
                    provider: settings.provider,
                    prompt_id: activePromptId,
                    report_snapshot: report
                });

                setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'completed', analysis } : j));
            } catch (err: any) {
                setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'failed', error: err.message } : j));
            }

            // Small delay to prevent rate limits
            await new Promise(r => setTimeout(r, 800));
        }

        setIsProcessing(false);
    };

    const handleStop = () => {
        stopRequested.current = true;
        setIsProcessing(false);
    };

    const handleReset = () => {
        setJobs([]);
        setIsProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-[120] flex bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex-1 flex flex-col m-4 sm:m-8 bg-white rounded-[2.5rem] shadow-3xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-8 duration-500">

                {/* Header */}
                <div className="bg-slate-50 px-10 py-8 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="bg-amber-500 p-3.5 rounded-2xl text-white shadow-lg shadow-amber-100 ring-4 ring-amber-50">
                            <Zap className="w-7 h-7 fill-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Bulk AI Auditor</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-amber-200">
                                    Enterprise Tool
                                </span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Autonomous Logic Archive</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-200 rounded-full text-slate-400 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Configuration */}
                    <div className="w-96 border-r border-slate-100 bg-slate-50/50 p-10 overflow-y-auto">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Sequence Range</h3>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Starting Lab ID</label>
                                    <input
                                        type="text"
                                        value={startId}
                                        onChange={(e) => setStartId(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm shadow-sm transition-all disabled:opacity-50"
                                    />
                                </div>

                                <div className="flex justify-center py-1">
                                    <ChevronRight className="w-5 h-5 text-slate-300 rotate-90" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Finishing Lab ID</label>
                                    <input
                                        type="text"
                                        value={endId}
                                        onChange={(e) => setEndId(e.target.value)}
                                        disabled={isProcessing}
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm shadow-sm transition-all disabled:opacity-50"
                                    />
                                </div>
                            </div>

                            {/* Regenerate Toggle */}
                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={clsx("p-2 rounded-lg transition-colors", forceRegenerate ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400")}>
                                            <RefreshCw className={clsx("w-4 h-4", forceRegenerate && "animate-spin-slow")} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">Regenerate</span>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bypass Cloud Cache</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setForceRegenerate(!forceRegenerate)}
                                        disabled={isProcessing}
                                        className={clsx(
                                            "w-12 h-6 rounded-full transition-all relative border-2",
                                            forceRegenerate ? "bg-indigo-600 border-indigo-600" : "bg-slate-100 border-slate-200"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-1 w-3 h-3 rounded-full transition-all shadow-sm",
                                            forceRegenerate ? "right-1 bg-white" : "left-1 bg-slate-400"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-400">Batch Size</span>
                                    <span className="text-lg font-black text-slate-800">{range.length} Reports</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        Est. Duration
                                    </div>
                                    <span className="text-sm font-black text-amber-600">~{minutes}m {seconds}s</span>
                                </div>
                                <div className="pt-2 border-t border-slate-50">
                                    <p className="text-[10px] leading-relaxed text-slate-400 font-medium italic">
                                        {forceRegenerate
                                            ? "Forced regeneration active: AI will re-analyze all reports regardless of existing database records."
                                            : "Optimal mode: Successfully processed reports will be pulled from cloud cache to save compute."
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4">
                                {!isProcessing ? (
                                    <button
                                        onClick={handleStart}
                                        disabled={range.length === 0}
                                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Play className="w-4 h-4 fill-white" />
                                        {completedCount > 0 ? 'Retry Sequence' : 'Begin Automaton'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStop}
                                        className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Pause className="w-4 h-4 fill-white" />
                                        Stop Sequence
                                    </button>
                                )}

                                <button
                                    onClick={handleReset}
                                    disabled={isProcessing || jobs.length === 0}
                                    className="w-full py-4 bg-slate-50 text-slate-400 border border-slate-200 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Clear Jobs
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Progress & Log */}
                    <div className="flex-1 flex flex-col p-10 bg-slate-50/20">
                        {/* Progress Header */}
                        <div className="mb-8">
                            <div className="flex items-end justify-between mb-3 px-1">
                                <div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">Processing Sequence</h3>
                                    <p className="text-[11px] font-bold text-slate-400">
                                        Successfully archived {completedCount} of {range.length} analyses
                                    </p>
                                </div>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.3)] relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute top-0 bottom-0 left-0 right-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)25%,transparent 25%,transparent 50%,rgba(255,255,255,0.2)50%,rgba(255,255,255,0.2)75%,transparent 75%,transparent)] bg-[length:2rem_2rem] animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Job List */}
                        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-inner flex flex-col overflow-hidden">
                            <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Execution Log</span>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-blue-500 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> {isProcessing ? 'Active' : 'Idle'}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> {completedCount} ok</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                                {jobs.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 spacing-y-4">
                                        <ListOrdered className="w-12 h-12 opacity-20 mb-4" />
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-50">Log is Empty</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-1 p-4">
                                        {jobs.map((job, idx) => (
                                            <div
                                                key={idx}
                                                className={clsx(
                                                    "flex items-center justify-between p-4 rounded-2xl transition-all border",
                                                    job.status === 'processing' ? "bg-amber-50 border-amber-200 shadow-sm" :
                                                        job.status === 'completed' ? "bg-emerald-50/50 border-emerald-100" :
                                                            job.status === 'skipped' ? "bg-slate-50 border-slate-100 opacity-60" :
                                                                job.status === 'failed' ? "bg-red-50 border-red-100" : "bg-transparent border-transparent"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={clsx(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                                                        job.status === 'processing' ? "bg-amber-500 text-white" :
                                                            job.status === 'completed' ? "bg-emerald-500 text-white" :
                                                                job.status === 'skipped' ? "bg-slate-200 text-slate-500" :
                                                                    job.status === 'failed' ? "bg-red-500 text-white" : "bg-slate-100 text-slate-400"
                                                    )}>
                                                        {job.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                                                            job.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> :
                                                                job.status === 'skipped' ? <Database className="w-5 h-5" /> :
                                                                    job.status === 'failed' ? <AlertTriangle className="w-5 h-5" /> :
                                                                        idx + 1}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-slate-700 font-mono tracking-tight">{job.id}</div>
                                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                            {job.status === 'completed' ? 'Insight Generated' :
                                                                job.status === 'skipped' ? 'Loaded from Cloud Cache' :
                                                                    job.status === 'failed' ? `Error: ${job.error}` :
                                                                        job.status === 'processing' ? 'Running Model Analysis...' : 'Waiting in Queue'}
                                                        </div>
                                                    </div>
                                                </div>

                                                {job.status === 'completed' && (
                                                    <div className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter">Archived</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 px-10 py-4 border-t border-slate-800 flex items-center justify-between text-white/50 shrink-0">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-2"><Database className="w-3.5 h-3.5" /> Pipeline: Connected</span>
                        <span className="text-slate-700">|</span>
                        <span className="flex items-center gap-2"><BrainCircuit className="w-3.5 h-3.5" /> Model: {settings.model}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};
