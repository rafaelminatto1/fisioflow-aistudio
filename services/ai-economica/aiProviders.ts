// services/ai-economica/aiProviders.ts

import { PremiumProvider } from './types/ai-economica.types';

export interface ProviderSettings {
    name: string;
    enabled: boolean;
    monthlyLimit: number;
    currentUsage: number; 
    hasCredentialsConfigured: boolean;
}

export const AI_PROVIDERS_CONFIG: Record<string, ProviderSettings> = {
    [PremiumProvider.CHATGPT_PLUS]: {
        name: 'ChatGPT Plus',
        enabled: true,
        monthlyLimit: 1000,
        currentUsage: 340,
        hasCredentialsConfigured: true,
    },
    [PremiumProvider.GEMINI_PRO]: {
        name: 'Google Gemini Pro',
        enabled: true,
        monthlyLimit: 1500,
        currentUsage: 850,
        hasCredentialsConfigured: true,
    },
    [PremiumProvider.CLAUDE_PRO]: {
        name: 'Claude Pro',
        enabled: false,
        monthlyLimit: 800,
        currentUsage: 120,
        hasCredentialsConfigured: false,
    },
    [PremiumProvider.PERPLEXITY_PRO]: {
        name: 'Perplexity Pro',
        enabled: true,
        monthlyLimit: 600,
        currentUsage: 550,
        hasCredentialsConfigured: true,
    },
    [PremiumProvider.MARS_AI_PRO]: {
        name: 'Mars AI Pro',
        enabled: false,
        monthlyLimit: 500,
        currentUsage: 0,
        hasCredentialsConfigured: false,
    },
};

export const DEFAULT_AI_PROVIDER = PremiumProvider.GEMINI_PRO;