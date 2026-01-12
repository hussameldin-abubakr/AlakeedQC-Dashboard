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
        'zai-glm-4.7',
        'gpt-oss-120b',
        'qwen-3-32b'
    ]
};
