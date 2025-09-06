export enum PremiumProvider {
  CHATGPT_PLUS = 'ChatGPT Plus',
  GEMINI_PRO = 'Google Gemini Pro',
  CLAUDE_PRO = 'Claude Pro',
  PERPLEXITY_PRO = 'Perplexity Pro',
  MARS_AI_PRO = 'Mars AI Pro',
}

export enum ResponseSource {
  INTERNAL = 'internal',
  CACHE = 'cache',
  PREMIUM = 'premium',
}

export enum QueryType {
  GENERAL_QUESTION = 'general_question',
  PROTOCOL_SUGGESTION = 'protocol_suggestion',
  DIAGNOSIS_HELP = 'diagnosis_help',
  EXERCISE_RECOMMENDATION = 'exercise_recommendation',
  CASE_ANALYSIS = 'case_analysis',
  RESEARCH_QUERY = 'research_query',
  DOCUMENT_ANALYSIS = 'document_analysis',
}

export interface KnowledgeEntry {
  id: string;
  tenantId: string;
  type: 'protocol' | 'exercise' | 'case' | 'technique' | 'experience';
  title: string;
  content: string;
  summary: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    role: string;
    experience: number;
  };
  confidence: number;
  usageCount: number;
  successRate: number;
  references: string[];
  conditions: string[];
  techniques: string[];
  contraindications: string[];
  createdAt: string;
  updatedAt: string;
  lastUsed: string;
  metadata: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    evidenceLevel: 'low' | 'moderate' | 'high';
    specialty: string[];
  };
}

export interface AIQuery {
  id: string;
  text: string;
  type: QueryType;
  context: {
    patientId?: string;
    symptoms?: string[];
    diagnosis?: string;
    previousTreatments?: string[];
    userRole: string;
    specialty?: string;
  };
  priority: 'low' | 'normal' | 'high';
  maxResponseTime: number;
  createdAt: string;
}

export interface Reference {
  title: string;
  url: string;
}

export interface AIResponse {
  id: string;
  queryId: string;
  content: string;
  confidence: number;
  source: ResponseSource;
  provider?: PremiumProvider;
  references: Reference[];
  suggestions: string[];
  followUpQuestions: string[];
  tokensUsed?: number;
  responseTime: number;
  createdAt: string;
  metadata: {
    evidenceLevel?: 'low' | 'moderate' | 'high';
    reliability: number;
    relevance: number;
  };
}

// Additional types needed for services
export interface SearchParams {
  text: string;
  type: QueryType;
  context: AIQuery['context'];
  symptoms?: string[];
  diagnosis?: string;
}
export type KnowledgeResult = Partial<KnowledgeEntry>;

export interface CacheEntry {
  key: string;
  response: AIResponse;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface ProviderConfig {
  enabled: boolean;
  endpoint: string;
}

export interface UsageStatus {
  status: 'available' | 'warning' | 'critical' | 'unavailable';
  percentage: number;
}

export interface EconomicAiStats {
  totalQueries: number;
  cacheHits: number;
  internalHits: number;
  premiumHits: number;
  queriesByProvider: Record<string, number>;
  estimatedSavings: number;
}

export interface EconomicAiLog {
  id: string;
  query: AIQuery;
  response: AIResponse;
  timestamp: Date;
}
