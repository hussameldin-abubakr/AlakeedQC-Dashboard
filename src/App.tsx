import { useState, useEffect } from 'react';
import { SearchHeader } from './components/SearchHeader';
import { ReportViewer } from './components/ReportViewer';
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
import { SettingsModal } from './components/SettingsModal';
import { PromptStudio } from './components/PromptStudio';
import { PromptOptimizer } from './components/PromptOptimizer';
import { BulkProcessor } from './components/BulkProcessor';
import { QCDashboard } from './components/QCDashboard';
import { Login } from './components/Login';
import { fetchReport, type Report } from './services/api';
import { analyzeReportWithAI } from './services/aiService';
import { getNextLabId, getPrevLabId } from './utils/labIdUtils';
import { type AISettings, DEFAULT_SETTINGS, AVAILABLE_MODELS } from './types/settings';
import { type PromptState, INITIAL_PROMPT_STATE, type PromptVersion } from './types/prompt';
import { supabaseService } from './services/supabaseService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Activity, Keyboard, Database, Zap, Archive, AlertTriangle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { Footer } from './components/Footer';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<'auditor' | 'dashboard' | 'optimizer'>('auditor');
  const [labId, setLabId] = useState('2510014363');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);

  // Modals Visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPromptStudioOpen, setIsPromptStudioOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Settings State
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [promptState, setPromptState] = useState<PromptState>(INITIAL_PROMPT_STATE);

  // 1. Auth Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Initial Load: Sync from Supabase or LocalStorage
  useEffect(() => {
    if (!session) return;
    const syncSettings = async () => {
      try {
        const cloudSettings = await supabaseService.getSettings();
        const validateSettings = (s: AISettings): AISettings => {
          const provider = s.provider || 'google';
          const models = AVAILABLE_MODELS[provider];
          if (!models.includes(s.model)) {
            return { ...s, provider, model: models[0] };
          }
          return { ...s, provider };
        };

        if (cloudSettings) {
          setAiSettings(validateSettings(cloudSettings.ai_settings));
          setPromptState(cloudSettings.prompt_state);
        } else {
          const savedAi = localStorage.getItem('alakeed_ai_settings');
          const savedPrompt = localStorage.getItem('alakeed_prompt_state');
          if (savedAi) setAiSettings(validateSettings(JSON.parse(savedAi)));
          if (savedPrompt) setPromptState(JSON.parse(savedPrompt));
        }
      } catch (e) {
        console.error('Settings sync error:', e);
      }
    };
    syncSettings();
  }, [session]);

  // 3. Persist Changes to Supabase & LocalStorage
  useEffect(() => {
    if (!session) return;
    localStorage.setItem('alakeed_ai_settings', JSON.stringify(aiSettings));
    localStorage.setItem('alakeed_prompt_state', JSON.stringify(promptState));

    const debounceTimer = setTimeout(() => {
      supabaseService.saveSettings(aiSettings, promptState).catch(console.error);
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [aiSettings, promptState, session]);

  const handleSearch = async (targetId: string) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setAiAnalysis(null);
    setIsFromCache(false);

    try {
      const cachedReport = await supabaseService.getReportByLabId(targetId);
      const data = await fetchReport(targetId);

      if (data) {
        setReport(data);
        if (cachedReport) {
          setAiAnalysis(cachedReport.analysis);
          setIsFromCache(true);
        }
      } else {
        setError(`Report ${targetId} not found or API error.`);
      }
    } catch (err) {
      setError('Failed to fetch report.');
    } finally {
      setLoading(false);
    }
  };

  const navigateReport = (direction: 'next' | 'prev') => {
    const nextId = direction === 'next' ? getNextLabId(labId) : getPrevLabId(labId);
    setLabId(nextId);
    handleSearch(nextId);
  };

  const activePromptContent = promptState.versions.find(v => v.id === promptState.activeVersionId)?.content || promptState.versions[0].content;

  const handleAnalyze = async () => {
    if (!report || aiLoading) return;
    setAiLoading(true);
    setIsFromCache(false);
    try {
      const result = await analyzeReportWithAI(report, aiSettings, activePromptContent);
      setAiAnalysis(result);

      await supabaseService.saveAIReport({
        lab_id: labId,
        analysis: result,
        model: aiSettings.model,
        provider: aiSettings.provider,
        prompt_id: promptState.activeVersionId,
        report_snapshot: report
      });

    } catch (e: any) {
      console.error(e);
      setAiAnalysis(`❌ **Error**: ${e?.message || "Error running AI analysis."}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSavePrompt = (name: string, content: string, description: string) => {
    const newVersion: PromptVersion = {
      id: `v${Date.now()}`,
      name,
      content,
      description,
      createdAt: Date.now()
    };
    setPromptState(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion],
      activeVersionId: newVersion.id
    }));
  };

  const handleActivatePrompt = (id: string) => {
    setPromptState(prev => ({ ...prev, activeVersionId: id }));
  };

  const handleDeletePrompt = (id: string) => {
    if (promptState.versions.length <= 1) return;
    setPromptState(prev => {
      const newVersions = prev.versions.filter(v => v.id !== id);
      return {
        ...prev,
        versions: newVersions,
        activeVersionId: prev.activeVersionId === id ? newVersions[newVersions.length - 1].id : prev.activeVersionId
      };
    });
  };

  const handleResetPrompt = () => {
    if (window.confirm('Are you sure you want to reset all prompts?')) {
      setPromptState(INITIAL_PROMPT_STATE);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session || isSettingsOpen || isPromptStudioOpen || isBulkOpen) return;

      if (document.activeElement?.tagName === 'INPUT' && e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Tab') {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          navigateReport('next');
          break;
        case 'ArrowLeft':
          navigateReport('prev');
          break;
        case 'Enter':
          if (e.altKey || e.metaKey) {
            e.preventDefault();
            handleAnalyze();
          }
          else if (document.activeElement?.id === 'lab-id-input') handleSearch(labId);
          break;
        case '/':
          e.preventDefault();
          document.getElementById('lab-id-input')?.focus();
          break;
        case ',':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsSettingsOpen(true);
          }
          break;
        case 'p':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsPromptStudioOpen(true);
          }
          break;
        case 'b':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setIsBulkOpen(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [labId, report, aiLoading, isSettingsOpen, isPromptStudioOpen, isBulkOpen, aiSettings, promptState, session]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <Activity className="w-12 h-12 text-blue-600 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying Security Session</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-blue-100">
      <SearchHeader
        value={labId}
        onChange={setLabId}
        onSearch={handleSearch}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPrompt={() => setIsPromptStudioOpen(true)}
        onOpenBulk={() => setIsBulkOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
        loading={loading}
        onSignOut={handleSignOut}
        userEmail={session.user.email}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSave={setAiSettings}
      />

      <PromptStudio
        isOpen={isPromptStudioOpen}
        onClose={() => setIsPromptStudioOpen(false)}
        state={promptState}
        onSave={handleSavePrompt}
        onActivate={handleActivatePrompt}
        onDelete={handleDeletePrompt}
        onReset={handleResetPrompt}
      />

      <BulkProcessor
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        settings={aiSettings}
        activePrompt={activePromptContent}
        activePromptId={promptState.activeVersionId}
      />

      <main className="max-w-[1700px] mx-auto px-8 py-10">

        {currentView === 'dashboard' ? (
          <QCDashboard onSelectReport={(id) => {
            setLabId(id);
            setCurrentView('auditor');
            handleSearch(id);
          }} />
        ) : currentView === 'optimizer' ? (
          <PromptOptimizer
            report={report}
            settings={aiSettings}
            promptState={promptState}
            onSave={handleSavePrompt}
            onActivate={handleActivatePrompt}
          />
        ) : (
          <>
            {!isSupabaseConfigured && (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl mb-6 border border-amber-200 flex items-center gap-3 shadow-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div className="text-xs font-bold uppercase tracking-widest">
                  Cloud Sync Disabled: Missing Supabase credentials in .env. Persistence is limited to local session.
                </div>
              </div>
            )}

            <div className="mb-8 flex items-center justify-end gap-3 px-2 overflow-x-auto no-scrollbar pb-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isFromCache ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                {isFromCache ? <Archive className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                {isFromCache ? 'LOADED FROM CLOUD ARCHIVE' : 'LIVE AI GENERATION ACTIVE'}
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                <Database className="w-3.5 h-3.5" />
                DASHBOARD CLOUD SYNCED
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-5 rounded-2xl mb-10 border border-red-100 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <Activity className="w-6 h-6" />
                  <span className="font-semibold text-lg">{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-300 hover:text-red-600 font-bold text-2xl px-2">×</button>
              </div>
            )}

            {!report && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-40 text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200 shadow-sm transition-all hover:border-blue-200 group">
                <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-10 text-slate-200 group-hover:scale-110 transition-transform group-hover:bg-blue-50 group-hover:text-blue-200">
                  <Keyboard className="w-16 h-16" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Scanner Ready</h2>
                <p className="max-w-md text-center text-slate-500 text-lg">Quickly navigate between patient reports using your laboratory workstation shortcut keys.</p>
                <div className="mt-12 flex flex-wrap justify-center gap-4 text-sm uppercase tracking-widest font-black">
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                    <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">← / →</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200">
                    <kbd className="bg-white px-2 py-0.5 rounded border border-slate-300 shadow-sm">Alt + Enter</kbd>
                    <span>AI QC</span>
                  </div>
                  <button
                    onClick={() => setIsBulkOpen(true)}
                    className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-100 text-amber-600 hover:bg-amber-100 transition-colors"
                  >
                    <kbd className="bg-white px-2 py-0.5 rounded border border-amber-200 shadow-sm">Cmd + B</kbd>
                    <Zap className="w-4 h-4 ml-1" />
                    <span>Bulk Audit</span>
                  </button>
                </div>
              </div>
            )}

            {report && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                <div className="xl:col-span-8 space-y-12">
                  <ReportViewer report={report} />
                </div>

                <div className="xl:col-span-4 lg:sticky lg:top-[100px] h-auto xl:h-[calc(100vh-10rem)]">
                  <AIAnalysisPanel
                    analysis={aiAnalysis}
                    loading={aiLoading}
                    onAnalyze={handleAnalyze}
                    onTune={() => setCurrentView('optimizer')}
                    activeModel={aiSettings.model}
                    isFromCache={isFromCache}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
