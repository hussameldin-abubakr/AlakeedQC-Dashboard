import React, { useState, useEffect, useMemo } from 'react';
import {
    Activity, Download, CalendarDays,
    ShieldCheck, Microscope, Search,
    Filter, AlertCircle, CheckCircle2, Brain,
    LayoutDashboard, ClipboardCheck
} from 'lucide-react';
import { supabaseService, type SavedAIReport } from '../services/supabaseService';
import clsx from 'clsx';

interface QCDashboardProps {
    onSelectReport: (labId: string) => void;
}

type QCStatusFilter = 'all' | 'pass' | 'attention';

export const QCDashboard: React.FC<QCDashboardProps> = ({ onSelectReport }) => {
    const [reports, setReports] = useState<SavedAIReport[]>([]);
    const [loading, setLoading] = useState(true);
    // Use local date string (YYYY-MM-DD) instead of ISO to avoid timezone shifts
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));

    const [statusFilter, setStatusFilter] = useState<QCStatusFilter>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            // Fetch a wider range to ensure we have overview data
            const data = await supabaseService.getReportsByDateRange(
                new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
                new Date().toISOString()
            );
            setReports(data);
            setLoading(false);
        };
        fetchAll();
    }, []);

    const getReportStatus = (analysis: string): 'pass' | 'attention' => {
        const low = analysis.toLowerCase();
        const isError = low.includes('critical') ||
            low.includes('error') ||
            low.includes('attention required') ||
            low.includes('discrepancy') ||
            low.includes('missing') ||
            low.includes('key');
        return isError ? 'attention' : 'pass';
    };

    // Filter Logic for the Register (Deduplicated by Lab ID to show latest only)
    const filteredReports = useMemo(() => {
        // Step 1: Group by lab_id and keep only the latest entry
        const latestMap: Record<string, SavedAIReport> = {};

        reports.forEach(r => {
            const existing = latestMap[r.lab_id];
            if (!existing || (r.created_at && existing.created_at && r.created_at > existing.created_at)) {
                latestMap[r.lab_id] = r;
            }
        });

        const uniqueReports = Object.values(latestMap);

        // Step 2: Apply UI filters
        return uniqueReports.filter(r => {
            const matchesDate = r.created_at?.startsWith(selectedDate);
            const status = getReportStatus(r.analysis);
            const matchesStatus = statusFilter === 'all' || status === statusFilter;
            const matchesSearch = r.lab_id.toLowerCase().includes(searchQuery.trim().toLowerCase());

            return matchesDate && matchesStatus && matchesSearch;
        });
    }, [reports, selectedDate, statusFilter, searchQuery]);

    // Global Stats (Lab Overview) vs Daily Stats
    const stats = useMemo(() => {
        const latestMap: Record<string, SavedAIReport> = {};
        reports.forEach(r => {
            const existing = latestMap[r.lab_id];
            if (!existing || (r.created_at && existing.created_at && r.created_at > existing.created_at)) {
                latestMap[r.lab_id] = r;
            }
        });
        const latestReports = Object.values(latestMap);

        const totalGlobal = latestReports.length;
        const attentionGlobal = latestReports.filter(r => getReportStatus(r.analysis) === 'attention').length;
        const passGlobal = totalGlobal - attentionGlobal;
        const globalQualityScore = totalGlobal > 0 ? Math.round((passGlobal / totalGlobal) * 100) : 0;

        const daySet = latestReports.filter(r => r.created_at?.startsWith(selectedDate));
        const dayTotal = daySet.length;
        const dayAttention = daySet.filter(r => getReportStatus(r.analysis) === 'attention').length;

        const handleExport = () => {
            if (filteredReports.length === 0) return;
            const headers = ['Lab ID', 'Date', 'Status', 'Analysis Insight'];
            const rows = filteredReports.map(r => [
                r.lab_id,
                new Date(r.created_at || '').toLocaleDateString(),
                getReportStatus(r.analysis),
                `"${r.analysis.replace(/"/g, '""').slice(0, 500)}..."`
            ]);
            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Alakeed_QC_Audit_${selectedDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        return {
            totalGlobal,
            passGlobal,
            attentionGlobal,
            globalQualityScore,
            dayTotal,
            dayAttention,
            handleExport
        };
    }, [reports, selectedDate, filteredReports]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-40">
                <div className="flex flex-col items-center gap-4">
                    <Microscope className="w-12 h-12 text-blue-600 animate-bounce" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading Quality Intelligence</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">

            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                        <ShieldCheck className="w-10 h-10 text-emerald-500" />
                        Quality Oversight Center
                    </h2>
                    <p className="text-slate-500 font-medium mt-1">Laboratory-wide clinical performance and audit control</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <CalendarDays className="w-5 h-5 ml-3 text-slate-400" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent border-none px-2 py-2 font-bold text-slate-700 outline-none"
                    />
                    <div className="w-[1px] h-6 bg-slate-100 mx-1" />
                    <button
                        onClick={stats.handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                    >
                        <Download className="w-4 h-4 ml-1" />
                        Export Audit
                    </button>
                </div>
            </div>

            {/* Quality Summary Grid - FOCUS ON GLOBAL OVERVIEW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none bg-slate-50 px-2 py-1 rounded-full border border-slate-100">Lab-Wide</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Global Quality</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.globalQualityScore}%</span>
                        <div className="text-emerald-500 text-xs font-bold">{stats.totalGlobal > 0 ? 'Verified' : 'No Data'}</div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none bg-slate-50 px-2 py-1 rounded-full border border-slate-100">30-Day Pass</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Confirmed</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.passGlobal}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Reports</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border-2 border-amber-100 bg-amber-50/10 shadow-sm overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none bg-amber-50 px-2 py-1 rounded-full border border-amber-100">Active Risks</span>
                    </div>
                    <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest mb-1">Attention Pool</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.attentionGlobal}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase">Cases</span>
                    </div>
                </div>

                <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl overflow-hidden relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/10 text-white rounded-2xl">
                            <ClipboardCheck className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none bg-white/5 px-2 py-1 rounded-full">Daily Scope</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Selected Day Audits</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">{stats.dayTotal}</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-500 uppercase leading-none">Reports</span>
                            {stats.dayAttention > 0 && <span className="text-[10px] font-black text-amber-400 uppercase leading-none mt-1">{stats.dayAttention} ALERT</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Controls */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search Audit Register by Lab ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm shadow-inner transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <div className="px-3 flex items-center gap-2 text-slate-400">
                        <Filter className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">Filter Results</span>
                    </div>
                    {(['all', 'pass', 'attention'] as QCStatusFilter[]).map((st) => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={clsx(
                                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                statusFilter === st
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audit Register Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <LayoutDashboard className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Audit Register: {selectedDate}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                {filteredReports.length === reports.length ? 'Showing all available reports' : `${filteredReports.length} records filtered for this session`}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto no-scrollbar">
                    {filteredReports.length === 0 ? (
                        <div className="p-32 flex flex-col items-center justify-center text-slate-200">
                            <Brain className="w-20 h-20 mb-6 opacity-10 animate-pulse" />
                            <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40">No records within current filter scope</p>
                            <button
                                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                                className="mt-6 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline"
                            >
                                Reset Search Filters
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Case Identifier</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quality Audit</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/2">AI Insight Snapshot</th>
                                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Sequence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        onClick={() => onSelectReport(report.lab_id)}
                                        className="hover:bg-blue-50/50 transition-colors group cursor-pointer active:bg-blue-100/50"
                                    >
                                        <td className="px-10 py-8">
                                            <div className="font-mono text-sm font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{report.lab_id}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                TIMESTAMP: {new Date(report.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            {getReportStatus(report.analysis) === 'attention' ? (
                                                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest w-fit shadow-sm">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    Attention
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest w-fit shadow-sm">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    Pass
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-10 py-8">
                                            <p className="text-sm font-bold text-slate-600 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 pl-4 py-1">
                                                {report.analysis.replace(/[#*]/g, '').slice(0, 150)}...
                                            </p>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <div key={s} className={clsx("w-1.5 h-3 rounded-full", s < 5 ? "bg-blue-500" : "bg-slate-200")} />
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-1">Model Level 1</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
};
