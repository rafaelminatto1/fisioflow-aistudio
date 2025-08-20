// services/ai-economica/aiService.ts
import { AIQuery, AIResponse, ResponseSource } from './types/ai-economica.types';
import { knowledgeBaseService } from './knowledgeBaseService';
import { cacheService } from './cacheService';
import { premiumAccountManager } from './premiumAccountManager';
import { logger } from './logger';
import { EconomicAiStats, EconomicAiLog } from './types/ai-economica.types';

class AnalyticsService {
    private stats: EconomicAiStats = {
        totalQueries: 0,
        cacheHits: 0,
        internalHits: 0,
        premiumHits: 0,
        queriesByProvider: {},
        estimatedSavings: 0,
    };

    private logs: EconomicAiLog[] = [];

    public getStats(): EconomicAiStats {
        this.stats.estimatedSavings = (this.stats.cacheHits + this.stats.internalHits) * 0.025; // Simulação: R$0.025 economizados por consulta interna/cache
        return this.stats;
    }

    public getLogs(): EconomicAiLog[] {
        return this.logs;
    }

    public trackQuery(query: AIQuery, response: AIResponse) {
        this.stats.totalQueries++;
        
        const providerName = response.provider?.toString() || response.source.toString();
        this.stats.queriesByProvider[providerName] = (this.stats.queriesByProvider[providerName] || 0) + 1;

        switch (response.source) {
            case ResponseSource.CACHE:
                this.stats.cacheHits++;
                break;
            case ResponseSource.INTERNAL:
                this.stats.internalHits++;
                break;
            case ResponseSource.PREMIUM:
                this.stats.premiumHits++;
                break;
        }

        const logEntry: EconomicAiLog = {
            id: `log_${Date.now()}`,
            query,
            response,
            timestamp: new Date(),
        };

        this.logs.unshift(logEntry);
        if (this.logs.length > 50) {
            this.logs.pop();
        }
    }
}

class AIService {
  private analytics: AnalyticsService = new AnalyticsService();

  public getStats(): EconomicAiStats {
      return this.analytics.getStats();
  }

  public getLogs(): EconomicAiLog[] {
      return this.analytics.getLogs();
  }

  async processQuery(query: AIQuery): Promise<AIResponse> {
    logger.info(`Processing query: "${query.text}"`);
    let response: AIResponse;
    const cacheKey = query.text.trim().toLowerCase();

    // 1. Search internal knowledge base
    const internalResult = await this.searchInternal(query);
    if (internalResult.confidence > 0.7) {
      logger.info('Returning response from internal knowledge base.');
      response = internalResult;
      this.analytics.trackQuery(query, response);
      return response;
    }

    // 2. Check cache
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult) {
      logger.info('Returning response from cache.');
      response = { ...cachedResult, source: ResponseSource.CACHE };
      this.analytics.trackQuery(query, response);
      return response;
    }

    // 3. Use premium provider
    try {
      const premiumResult = await this.queryPremium(query);
      if (premiumResult) {
        await cacheService.set(cacheKey, premiumResult);
        logger.info(`Returning response from premium provider: ${premiumResult.provider}`);
        response = premiumResult;
        this.analytics.trackQuery(query, response);
        return response;
      }
    } catch (error) {
      logger.error('Premium provider query failed.', error);
    }

    // 4. Fallback if all else fails
    logger.warn('All sources failed, returning default response.');
    response = this.getDefaultResponse(query);
    this.analytics.trackQuery(query, response);
    return response;
  }

  private async searchInternal(query: AIQuery): Promise<AIResponse> {
    const results = await knowledgeBaseService.search({
      text: query.text,
      type: query.type,
      context: query.context
    });

    if (results.length === 0) {
      return { confidence: 0 } as AIResponse;
    }

    const bestResult = results[0];
    return {
      id: `resp_${Date.now()}`,
      queryId: query.id,
      content: bestResult.content || 'No content available.',
      confidence: bestResult.confidence || 0,
      source: ResponseSource.INTERNAL,
      references: (bestResult.references || []).map(r => ({ title: r, url: r })),
      suggestions: [],
      followUpQuestions: [],
      responseTime: 0,
      createdAt: new Date().toISOString(),
      metadata: { reliability: 0.9, relevance: 0.9 }
    } as AIResponse;
  }
  
  private async queryPremium(query: AIQuery): Promise<AIResponse | null> {
    const provider = await premiumAccountManager.selectBestProvider(query.type);
    if (!provider) {
        logger.warn('No premium provider available.');
        return null;
    }
    
    return await premiumAccountManager.query(provider, query);
  }

  private getDefaultResponse(query: AIQuery): AIResponse {
      return {
          id: `resp_fallback_${Date.now()}`,
          queryId: query.id,
          content: "Desculpe, não consegui encontrar uma resposta para sua pergunta em nenhuma das minhas fontes de dados. Por favor, tente reformular sua pergunta.",
          confidence: 0.1,
          source: ResponseSource.INTERNAL,
          provider: undefined,
          references: [],
          suggestions: ["Tente ser mais específico.", "Verifique a ortografia."],
          followUpQuestions: [],
          responseTime: 10,
          createdAt: new Date().toISOString(),
          metadata: { reliability: 0, relevance: 0 }
      } as AIResponse;
  }
}

export const aiService = new AIService();