// services/ai-economica/premiumAccountManager.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  AIQuery,
  AIResponse,
  PremiumProvider,
  QueryType,
  ResponseSource,
  ProviderConfig,
  UsageStatus,
} from './types/ai-economica.types';
import { logger } from './logger';
import { settingsService } from './settingsService';
import { mcpService } from './mcpService';

// Mocked Usage Tracker as per implementation plan
class UsageTracker {
  async getCurrentUsage(provider: PremiumProvider): Promise<UsageStatus> {
    // Always available in this mock
    return { status: 'available', percentage: Math.random() * 0.5 };
  }
  async recordUsage(
    provider: PremiumProvider,
    tokensUsed: number
  ): Promise<void> {
    logger.info(`Usage recorded for ${provider}: ${tokensUsed} tokens.`);
  }
}

const usageTracker = new UsageTracker();

// From design doc
const PROVIDER_STRATEGY: Partial<Record<QueryType, PremiumProvider[]>> = {
  [QueryType.RESEARCH_QUERY]: [
    PremiumProvider.PERPLEXITY_PRO,
    PremiumProvider.GEMINI_PRO,
  ],
  [QueryType.CASE_ANALYSIS]: [
    PremiumProvider.MARS_AI_PRO,
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO,
  ],
  [QueryType.DOCUMENT_ANALYSIS]: [
    PremiumProvider.CLAUDE_PRO,
    PremiumProvider.GEMINI_PRO,
  ],
  [QueryType.GENERAL_QUESTION]: [
    PremiumProvider.GEMINI_PRO,
    PremiumProvider.CHATGPT_PLUS,
  ],
};

class PremiumAccountManager {
  private ai: GoogleGenerativeAI;
  private mcpEnabled: boolean;

  constructor() {
    if (!process.env.API_KEY) {
      throw new Error('API_KEY is not set for PremiumAccountManager.');
    }
    this.ai = new GoogleGenerativeAI(process.env.API_KEY);
    this.mcpEnabled = process.env.MCP_ENABLED === 'true';
  }

  async selectBestProvider(
    queryType: QueryType
  ): Promise<PremiumProvider | null> {
    const availableProviders = await this.getAvailableProviders();
    const settings = settingsService.getSettings();
    const defaultProvider = settings.defaultProvider;
    const preferredProviders = PROVIDER_STRATEGY[queryType] || [];

    for (const provider of preferredProviders) {
      if (availableProviders.includes(provider)) {
        return provider;
      }
    }

    if (availableProviders.includes(defaultProvider)) {
      return defaultProvider;
    }

    return availableProviders[0] || null;
  }

  async getAvailableProviders(): Promise<PremiumProvider[]> {
    const available: PremiumProvider[] = [];
    const providerConfigs = settingsService.getMergedProviderConfigs();

    for (const providerKey in providerConfigs) {
      const config = providerConfigs[providerKey];
      if (!config.enabled || !config.hasCredentialsConfigured) continue;

      const provider = providerKey as PremiumProvider;
      const usage = await usageTracker.getCurrentUsage(provider);
      if (usage.status === 'available' || usage.status === 'warning') {
        available.push(provider);
      }
    }
    return available;
  }

  async query(provider: PremiumProvider, query: AIQuery): Promise<AIResponse> {
    const startTime = Date.now();
    let response: AIResponse;

    try {
      // Try MCP service first if enabled
      if (this.mcpEnabled && this.isMCPSupportedProvider(provider)) {
        logger.info(`Attempting MCP query for provider: ${provider}`);
        const mcpResponse = await mcpService.processQuery(query);
        if (mcpResponse) {
          logger.info(`MCP query successful for provider: ${provider}`);
          await this.trackUsage(provider, mcpResponse.tokensUsed || 0);
          mcpResponse.responseTime = Date.now() - startTime;
          return mcpResponse;
        }
        logger.warn(
          `MCP query failed for provider: ${provider}, falling back to direct implementation`
        );
      }

      // Fallback to direct provider implementation
      switch (provider) {
        case PremiumProvider.GEMINI_PRO:
          response = await this.queryGemini(query);
          break;
        // Mocked responses for other providers
        case PremiumProvider.CHATGPT_PLUS:
        case PremiumProvider.CLAUDE_PRO:
        case PremiumProvider.PERPLEXITY_PRO:
        case PremiumProvider.MARS_AI_PRO:
        default:
          response = {
            id: `resp_${Date.now()}`,
            queryId: query.id,
            content: `Resposta simulada do ${provider} para a pergunta: "${query.text}".`,
            confidence: 0.8,
            source: ResponseSource.PREMIUM,
            provider: provider,
            references: [],
            suggestions: [],
            followUpQuestions: [],
            tokensUsed: 100,
            responseTime: 500,
            createdAt: new Date().toISOString(),
            metadata: { reliability: 0.8, relevance: 0.8 },
          };
      }

      await this.trackUsage(provider, response.tokensUsed || 0);
      response.responseTime = Date.now() - startTime;
      return response;
    } catch (error) {
      logger.error(`Error querying ${provider}:`, error);
      throw error;
    }
  }

  private async queryGemini(query: AIQuery): Promise<AIResponse> {
    const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(query.text);
    const response = await result.response;
    const text = response.text();

    const tokensUsed = (query.text.length + text.length) / 4;

    return {
      id: `resp_${Date.now()}`,
      queryId: query.id,
      content: text,
      confidence: 0.85,
      source: ResponseSource.PREMIUM,
      provider: PremiumProvider.GEMINI_PRO,
      references: [],
      suggestions: [
        'Sugestão 1 vinda do Gemini.',
        'Sugestão 2 vinda do Gemini.',
      ],
      followUpQuestions: ['Qual o próximo passo?', 'Tem mais detalhes?'],
      tokensUsed: Math.round(tokensUsed),
      responseTime: 0, // will be set in the caller
      createdAt: new Date().toISOString(),
      metadata: { reliability: 0.9, relevance: 0.9 },
    };
  }

  private isMCPSupportedProvider(provider: PremiumProvider): boolean {
    // Check if provider is supported by MCP
    const mcpSupportedProviders = [
      PremiumProvider.CHATGPT_PLUS,
      PremiumProvider.CLAUDE_PRO,
      PremiumProvider.GEMINI_PRO,
    ];
    return mcpSupportedProviders.includes(provider);
  }

  async trackUsage(
    provider: PremiumProvider,
    tokensUsed: number
  ): Promise<void> {
    await usageTracker.recordUsage(provider, tokensUsed);
  }

  // MCP-related methods
  getMCPStatus(): boolean {
    return this.mcpEnabled;
  }

  getMCPProviderStatus(): Record<string, boolean> {
    if (!this.mcpEnabled) return {};
    return mcpService.getProviderStatus();
  }

  getMCPUsageStats(): Record<string, number> {
    if (!this.mcpEnabled) return {};
    return mcpService.getUsageStats();
  }

  reloadMCPConfig(): void {
    if (this.mcpEnabled) {
      mcpService.reloadConfig();
      logger.info('MCP configuration reloaded');
    }
  }
}

export const premiumAccountManager = new PremiumAccountManager();
