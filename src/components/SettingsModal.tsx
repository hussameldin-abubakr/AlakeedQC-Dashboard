import React from 'react';
import { X, Settings2, Cpu, Sparkles, CheckCircle2, Key, Info } from 'lucide-react';
import type { AISettings, AIProvider } from '../types/settings';
import { AVAILABLE_MODELS } from '../types/settings';
import clsx from 'clsx';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AISettings;
    onSave: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = React.useState<AISettings>(settings);

    // Sync local state when props change (specifically for Supabase initial load)
    React.useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    if (!isOpen) return null;

    const providers: { id: AIProvider; name: string; icon: React.ReactNode; color: string }[] = [
        { id: 'google', name: 'Google Gemini', icon: <Sparkles className="w-5 h-5" />, color: 'blue' },
        { id: 'cerebras', name: 'Cerebras AI', icon: <Cpu className="w-5 h-5" />, color: 'purple' },
    ];

    const handleProviderChange = (provider: AIProvider) => {
        setLocalSettings({
            ...localSettings,
            provider,
            model: AVAILABLE_MODELS[provider][0]
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-200 p-2 rounded-xl text-slate-600">
                            <Settings2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Configuration</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select your intelligence engine</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                    {/* Provider Selection */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Provider</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {providers.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleProviderChange(p.id)}
                                    className={clsx(
                                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left",
                                        localSettings.provider === p.id
                                            ? `border-${p.color}-500 bg-${p.color}-50/50`
                                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-3 rounded-xl transition-all",
                                        localSettings.provider === p.id
                                            ? `bg-${p.color}-500 text-white shadow-lg`
                                            : "bg-white text-slate-400 shadow-sm"
                                    )}>
                                        {p.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className={clsx(
                                            "font-bold text-lg",
                                            localSettings.provider === p.id ? `text-${p.color}-900` : "text-slate-600"
                                        )}>
                                            {p.name}
                                        </div>
                                        <div className="text-xs text-slate-400 capitalize whitespace-nowrap overflow-hidden text-ellipsis ring-0 ring-offset-0 ring-transparent focus:ring-0">Infrastructure</div>
                                    </div>
                                    {localSettings.provider === p.id && (
                                        <CheckCircle2 className={clsx("w-6 h-6 shrink-0", `text-${p.color}-500`)} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* API Key Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Credentials
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Cloud Synced
                            </div>
                        </div>
                        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={localSettings.geminiKey || ''}
                                    onChange={(e) => setLocalSettings({ ...localSettings, geminiKey: e.target.value })}
                                    placeholder="Enter your Google AI Studio key..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cerebras API Key</label>
                                <input
                                    type="password"
                                    value={localSettings.cerebrasKey || ''}
                                    onChange={(e) => setLocalSettings({ ...localSettings, cerebrasKey: e.target.value })}
                                    placeholder="Enter your Cerebras key..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                />
                            </div>
                            <div className="flex items-start gap-3 mt-4 text-[11px] text-slate-400 font-medium">
                                <Info className="w-4 h-4 shrink-0 text-slate-300 mt-0.5" />
                                <p>
                                    {((localSettings.provider === 'google' && import.meta.env.VITE_GEMINI_API_KEY) ||
                                        (localSettings.provider === 'cerebras' && import.meta.env.VITE_CEREBRAS_API_KEY))
                                        ? "✅ System detected and is prioritizing keys from your local .env file."
                                        : "Keys are stored in your cloud database. Local .env variables are prioritized if present."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-4 pb-4">
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Select Model</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_MODELS[localSettings.provider].map((model) => (
                                <button
                                    key={model}
                                    onClick={() => setLocalSettings({ ...localSettings, model })}
                                    className={clsx(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all text-left",
                                        localSettings.model === model
                                            ? "border-blue-500 bg-blue-50 text-blue-900"
                                            : "border-slate-100 hover:border-slate-200 text-slate-600"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            localSettings.model === model ? "bg-blue-500" : "bg-slate-300"
                                        )} />
                                        <span className="font-bold font-mono text-sm">{model}</span>
                                    </div>
                                    {localSettings.model === model && (
                                        <div className="flex items-center gap-2">
                                            {settings.provider === localSettings.provider && settings.model === model && (
                                                <span className="bg-emerald-100 text-emerald-700 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                                            )}
                                            <CheckCircle2 className="w-4 h-4 text-blue-500" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onSave(localSettings);
                            onClose();
                        }}
                        className="px-10 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all text-sm"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        </div>
    );
};
