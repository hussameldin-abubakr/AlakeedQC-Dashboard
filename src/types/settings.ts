export type AIProvider = 'google' | 'cerebras';

export interface AISettings {
    provider: AIProvider;
    model: string;
    geminiKey?: string;
    cerebrasKey?: string;
}

export const DEFAULT_SETTINGS: AISettings = {
    provider: 'google',
    model: 'gemini-3-flash-preview',
    geminiKey: '',
    cerebrasKey: ''
};

export const AVAILABLE_MODELS: Record<AIProvider, string[]> = {
    google: [
        'gemini-3-flash-preview',
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
    ],
    cerebras: [
        'gpt-oss-120b',
        'llama3.1-70b',
        'llama3.1-8b'
    ]
};
