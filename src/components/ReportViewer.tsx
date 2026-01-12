import React from 'react';
import type { Report, Test, Parameter } from '../services/api';
import { User, Phone, FlaskConical, AlertTriangle, Building2, Calendar } from 'lucide-react';
import clsx from 'clsx';

interface ReportViewerProps {
    report: Report;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* Patient Card - Upgraded for Large Screens */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -mr-20 -mt-20 z-0 opacity-40 transition-transform group-hover:scale-110 duration-500" />

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-8 border-b border-slate-100">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shadow-blue-200">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{report.Fullname}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                                        PID: {report.PatientID}
                                    </span>
                                    <span className="text-sm font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase font-bold">
                                        LabID: {report.LabID}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sample Status</div>
                                <div className="text-emerald-500 font-bold flex items-center gap-1 justify-end">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                    Processed
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <InfoItem label="Age" value={report.Age} icon={<Calendar className="w-4 h-4" />} />
                        <InfoItem label="Gender" value={report.Gender} icon={<User className="w-4 h-4" />} />
                        <InfoItem label="Phone" value={report.Phone} icon={<Phone className="w-4 h-4" />} />
                        <InfoItem label="Sender" value={report.Sender} icon={<Building2 className="w-4 h-4" />} />
                    </div>

                    <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 block text-xs uppercase tracking-widest font-black mb-2">Clinical Indications</span>
                        <p className="text-slate-700 text-lg leading-relaxed font-medium">
                            {report.ClinicalInfo || "Routine checkup - No prior clinical history provided."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Test Results */}
            <div className="space-y-8">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-6 w-1.5 bg-blue-600 rounded-full" />
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider">Test Results Overview</h3>
                </div>
                {report.TestReqest.map((test, idx) => (
                    <TestCard key={idx} test={test} />
                ))}
            </div>
        </div>
    );
};

const InfoItem = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
    <div className="group/item">
        <div className="text-slate-400 text-xs uppercase tracking-widest font-black flex items-center gap-2 mb-2 group-hover/item:text-blue-500 transition-colors">
            {icon}
            {label}
        </div>
        <div className="font-bold text-slate-800 text-xl tracking-tight">{value}</div>
    </div>
);

const TestCard = ({ test }: { test: Test }) => (
    <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/30 border border-slate-200 overflow-hidden transform transition-all hover:shadow-xl">
        <div className="bg-slate-50/80 backdrop-blur-sm px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                    <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <h3 className="font-black text-xl text-slate-800">{test.TestName}</h3>
                    <span className="text-slate-400 font-mono text-xs font-bold tracking-tighter uppercase">{test.TestCode}</span>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Turnaround</span>
                <span className="text-sm font-bold text-slate-600">{test.Duration}</span>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-[10px] text-slate-400 bg-slate-50/50 uppercase tracking-widest font-black">
                    <tr>
                        <th className="px-8 py-4">Parameter Analysis</th>
                        <th className="px-8 py-4">Current Value</th>
                        <th className="px-8 py-4">Reference Range</th>
                        <th className="px-8 py-4">History Comparison</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {test.Testparameters.map((param, idx) => (
                        <ParameterRow key={idx} param={param} />
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const ParameterRow = ({ param }: { param: Parameter }) => {
    const isAbnormal = checkAbnormal(param.Value, param.NormalRange);

    return (
        <tr className={clsx(
            "group/row transition-all duration-300",
            isAbnormal ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50/80"
        )}>
            <td className="px-8 py-5">
                <div className="font-bold text-slate-700 text-lg group-hover/row:text-slate-900 transition-colors">
                    {param.ParameterName}
                </div>
                <div className="text-xs text-slate-400 font-mono font-medium">{param.ParameterCode}</div>
            </td>
            <td className="px-8 py-5">
                <div className="flex items-center gap-3">
                    <span className={clsx(
                        "font-black font-mono text-2xl tracking-tighter",
                        isAbnormal ? "text-red-600" : "text-slate-900"
                    )}>
                        {param.Value || "N/A"}
                    </span>
                    {isAbnormal && (
                        <div className="bg-red-100 text-red-600 p-1 rounded-lg">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    )}
                </div>
            </td>
            <td className="px-8 py-5">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-tighter mb-1">Standard</span>
                    <span className="text-slate-500 font-mono font-bold py-1 px-2 bg-slate-100 rounded text-sm w-fit inline-block border border-slate-200/50">
                        {param.NormalRange}
                    </span>
                </div>
            </td>
            <td className="px-8 py-5">
                {param.HistoryValue ? (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono font-bold text-sm">{param.HistoryValue}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Prior</span>
                        </div>
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter mt-1">{param.HistoryDate}</span>
                    </div>
                ) : (
                    <span className="text-slate-300 italic text-sm">No prior data</span>
                )}
            </td>
        </tr>
    );
};

function checkAbnormal(value: string, range: string): boolean {
    if (!value || !range) return false;
    const val = parseFloat(value);
    if (isNaN(val)) return false;

    // Handle "min-max"
    if (range.includes('-')) {
        const parts = range.split('-').map(p => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return val < parts[0] || val > parts[1];
        }
    }

    // Handle "< X"
    if (range.startsWith('<')) {
        const threshold = parseFloat(range.replace('<', '').trim());
        if (!isNaN(threshold)) return val >= threshold; // It is equal or greater, so it's abnormal if the range is "< X"
    }

    // Handle "> X"
    if (range.startsWith('>')) {
        const threshold = parseFloat(range.replace('>', '').trim());
        if (!isNaN(threshold)) return val <= threshold;
    }

    return false;
}
