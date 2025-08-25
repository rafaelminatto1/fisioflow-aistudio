// services/ai-economica/aiProviders.ts

import { PremiumProvider } from './types/ai-economica.types';

export interface ProviderSettings {
    name: string;
    enabled: boolean;
    monthlyLimit: number;
    currentUsage: number; 
    hasCredentialsConfigured: boolean;
    mcpEnabled?: boolean;
    apiKeyEnvVar?: string;
    baseUrl?: string;
    models?: string[];
}

export const AI_PROVIDERS_CONFIG: Record<string, ProviderSettings> = {
    [PremiumProvider.CHATGPT_PLUS]: {
        name: 'ChatGPT Plus',
        enabled: true,
        monthlyLimit: 1000,
        currentUsage: 340,
        hasCredentialsConfigured: true,
        mcpEnabled: true,
        apiKeyEnvVar: 'OPENAI_API_KEY',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-3.5-turbo'],
    },
    [PremiumProvider.GEMINI_PRO]: {
        name: 'Google Gemini Pro',
        enabled: true,
        monthlyLimit: 1500,
        currentUsage: 850,
        hasCredentialsConfigured: true,
        mcpEnabled: true,
        apiKeyEnvVar: 'GEMINI_API_KEY',
        baseUrl: 'https://generativelanguage.googleapis.com',
        models: ['gemini-pro', 'gemini-pro-vision'],
    },
    [PremiumProvider.CLAUDE_PRO]: {
        name: 'Claude Pro',
        enabled: true,
        monthlyLimit: 800,
        currentUsage: 120,
        hasCredentialsConfigured: true,
        mcpEnabled: true,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        baseUrl: 'https://api.anthropic.com',
        models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
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