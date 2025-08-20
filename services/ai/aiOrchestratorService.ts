
import { AIProvider, AIResponse, AIQueryLog } from '../../types';
import { aiService } from '../ai-economica/aiService';
import { QueryType, ResponseSource, PremiumProvider } from '../ai-economica/types/ai-economica.types';

// Helper to map new sources to old enum
function mapSourceToAIProvider(source: ResponseSource, provider?: PremiumProvider): AIProvider {
    if (provider) {
        // This relies on enum values matching strings. It's a bit fragile but works with the current setup.
        // It maps "Google Gemini Pro" to "Gemini", "ChatGPT Plus" to "ChatGPT", etc.
        const providerMap: Record<string, AIProvider> = {
            [PremiumProvider.GEMINI_PRO]: AIProvider.GEMINI,
            [PremiumProvider.CHATGPT_PLUS]: AIProvider.CHATGPT,
            [PremiumProvider.CLAUDE_PRO]: AIProvider.CLAUDE,
            [PremiumProvider.PERPLEXITY_PRO]: AIProvider.PERPLEXITY,
            [PremiumProvider.MARS_AI_PRO]: AIProvider.MARS,
        };
        return providerMap[provider] || provider as unknown as AIProvider;
    }
    if (source === ResponseSource.CACHE) return AIProvider.CACHE;
    if (source === ResponseSource.INTERNAL) return AIProvider.INTERNAL_KB;
    return AIProvider.GEMINI; // Fallback
}


class AiOrchestratorService {
  /**
   * DEPRECATED: This service now wraps the new aiService.
   * Please migrate to use aiService from 'services/ai-economica/aiService' directly.
   * 
   * Retrieves an answer for a given prompt by delegating to the main AI service.
   * @param prompt The user's question.
   * @param chatHistory The full conversation history (optional).
   * @returns A promise that resolves to an AIResponse.
   */
  async getResponse(prompt: string, chatHistory: any[] = []): Promise<AIResponse> {
    const hash = btoa(prompt.trim().toLowerCase());

    const query = {
        id: `query_legacy_${Date.now()}`,
        text: prompt,
        type: QueryType.GENERAL_QUESTION,
        context: { userRole: 'Fisioterapeuta' },
        priority: 'normal' as 'normal',
        maxResponseTime: 10000,
        hash,
        createdAt: new Date().toISOString(),
    };

    const response = await aiService.processQuery(query);

    return {
        content: response.content,
        source: mapSourceToAIProvider(response.source, response.provider),
    };
  }
  
  /**
   * DEPRECATED: This method now returns data from the new aiService.
   */
  getLogs(): AIQueryLog[] {
      const ecoLogs = aiService.getLogs();
      return ecoLogs.map(log => ({
          id: new Date(log.timestamp).getTime(),
          prompt: log.query.text,
          content: log.response.content,
          source: mapSourceToAIProvider(log.response.source, log.response.provider),
          timestamp: log.timestamp,
      }));
  }
  
  /**
   * DEPRECATED: This method now returns data from the new aiService.
   */
  getStats() {
      const ecoStats = aiService.getStats();
      return {
          totalQueries: ecoStats.totalQueries,
          cacheHits: ecoStats.cacheHits,
          knowledgeBaseHits: ecoStats.internalHits,
          apiHits: ecoStats.premiumHits,
      };
  }
}

// Export a singleton instance of the service
export const aiOrchestratorService = new AiOrchestratorService();