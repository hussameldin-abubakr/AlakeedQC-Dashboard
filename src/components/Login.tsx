import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader2, ShieldCheck, Activity } from 'lucide-react';
import { Footer } from './Footer';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="bg-blue-600 text-white p-4 rounded-3xl shadow-xl shadow-blue-100 mb-6 group transition-transform hover:scale-110">
                        <ShieldCheck className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Alakeed QC</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Medical Quality Network
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 p-10 relative overflow-hidden group/card">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                    <div className="mb-8">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">System Access</h2>
                        <p className="text-sm font-medium text-slate-400">Please enter your laboratory credentials</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Mail className="w-3.5 h-3.5 text-slate-300" />
                                User Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                placeholder="name@alakeed.ly"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Lock className="w-3.5 h-3.5 text-slate-300" />
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-3 animate-shake">
                                <div className="p-1 bgColor-red-100 rounded-md">!</div>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authorize Access'}
                        </button>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Unauthorized access is strictly prohibited and monitored
                    </p>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 w-full">
                <Footer />
            </div>
        </div>
    );
};
