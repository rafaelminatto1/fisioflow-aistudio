// services/ai-economica/knowledgeBaseService.ts
import { KnowledgeEntry, SearchParams, KnowledgeResult } from './types/ai-economica.types';
import { mockKnowledgeBase } from '../../data/mockData'; 

// Adapting old mock data to the new, more detailed KnowledgeEntry type
const adaptedMockKnowledgeBase: KnowledgeEntry[] = mockKnowledgeBase.map(entry => ({
    ...entry,
    id: entry.id,
    tenantId: 'default',
    type: entry.type as KnowledgeEntry['type'],
    summary: entry.content.substring(0, 100) + '...',
    author: { id: 'user_1', name: 'Dr. Roberto', role: 'Fisioterapeuta', experience: 10 },
    confidence: 0.8,
    usageCount: Math.floor(Math.random() * 50),
    successRate: 0.9,
    references: [],
    conditions: [],
    techniques: [],
    contraindications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastUsed: new Date().toISOString(),
    metadata: {
        difficulty: 'intermediate',
        evidenceLevel: 'moderate',
        specialty: ['Ortopedia']
    }
}));


// Mocked ContentManager, as it's not part of the current implementation sprint
class ContentManager {
    private entries: KnowledgeEntry[] = adaptedMockKnowledgeBase;
    async findById(id: string): Promise<KnowledgeEntry | undefined> {
        return this.entries.find(e => e.id === id);
    }
    async save(entry: KnowledgeEntry): Promise<void> {
        this.entries.push(entry);
    }
    async update(entry: KnowledgeEntry): Promise<void> {
        const index = this.entries.findIndex(e => e.id === entry.id);
        if (index > -1) this.entries[index] = entry;
    }
}

// Mocked SearchEngine, as it's not part of the current implementation sprint
class SearchEngine {
    private entries: KnowledgeEntry[] = adaptedMockKnowledgeBase;
    async index(entry: KnowledgeEntry): Promise<void> { /* In-memory, no action needed */ }
    async updateIndex(entry: KnowledgeEntry): Promise<void> { /* In-memory, no action needed */ }
    async searchByText(text: string): Promise<KnowledgeResult[]> {
        const lowerText = text.toLowerCase();
        return this.entries.filter(e => 
            e.title.toLowerCase().includes(lowerText) ||
            e.content.toLowerCase().includes(lowerText) ||
            e.tags.some(t => t.toLowerCase().includes(lowerText))
        );
    }
}


class KnowledgeBaseService {
  private searchEngine: SearchEngine = new SearchEngine();
  private contentManager: ContentManager = new ContentManager();

  async search(params: SearchParams): Promise<KnowledgeResult[]> {
    const textResults = await this.searchEngine.searchByText(params.text);
    // Simplified: just return text results ranked by confidence
    return textResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();