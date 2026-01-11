import { supabase } from '../lib/supabase';
import { type Report } from './api';
import { type AISettings } from '../types/settings';
import { type PromptState } from '../types/prompt';

export interface SavedAIReport {
    id?: string;
    lab_id: string;
    analysis: string;
    model: string;
    provider: string;
    prompt_id: string;
    report_snapshot: Report;
    created_at?: string;
}

export const supabaseService = {
    // Report Operations
    async getReportByLabId(labId: string) {
        try {
            const { data, error } = await supabase
                .from('ai_reports')
                .select('*')
                .eq('lab_id', labId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(); // maybeSingle doesn't error on 0 results

            if (error) throw error;
            return data as SavedAIReport | null;
        } catch (error) {
            console.error('Supabase fetch error:', error);
            return null;
        }
    },

    async saveAIReport(report: SavedAIReport) {
        try {
            const { data, error } = await supabase
                .from('ai_reports')
                .insert([report])
                .select();

            if (error) throw error;
            return data ? data[0] : null;
        } catch (error) {
            console.error('Supabase save error:', error);
            return null;
        }
    },

    // Settings Operations
    async getSettings() {
        try {
            const { data, error } = await supabase
                .from('dashboard_settings')
                .select('*')
                .eq('id', 'global')
                .maybeSingle();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Supabase settings fetch error:', error);
            return null;
        }
    },

    async saveSettings(aiSettings: AISettings, promptState: PromptState) {
        try {
            const { error } = await supabase
                .from('dashboard_settings')
                .upsert({
                    id: 'global',
                    ai_settings: aiSettings,
                    prompt_state: promptState,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Supabase settings save error:', error);
        }
    },

    async getReportsByDateRange(startDate: string, endDate: string) {
        try {
            // OPTIMIZATION: We select only required fields for analytics to reduce payload size.
            // Excluding 'report_snapshot' which contains massive medical JSON.
            const { data, error } = await supabase
                .from('ai_reports')
                .select('id, lab_id, analysis, provider, model, created_at')
                .gte('created_at', startDate)
                .lte('created_at', endDate)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as SavedAIReport[];
        } catch (error) {
            console.error('Fetch reports error:', error);
            return [];
        }
    },

    async getSystemStats() {
        try {
            // Get total count
            const { count: totalAudits, error: countError } = await supabase
                .from('ai_reports')
                .select('*', { count: 'exact', head: true });

            if (countError) throw countError;

            // Get reports from last 30 days for trending
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: trendData, error: trendError } = await supabase
                .from('ai_reports')
                .select('created_at, provider')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (trendError) throw trendError;

            return {
                totalAudits: totalAudits || 0,
                trendData: trendData || []
            };
        } catch (error) {
            console.error('Stats error:', error);
            return { totalAudits: 0, trendData: [] };
        }
    }
};
