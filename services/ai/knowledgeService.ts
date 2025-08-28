import { KnowledgeBaseEntry } from '../../types';
import { mockKnowledgeBase } from '../../data/mockData';

class KnowledgeService {
  private entries: KnowledgeBaseEntry[] = mockKnowledgeBase;

  /**
   * Searches the knowledge base for entries matching a query string.
   * It performs a case-insensitive search on title, content, and tags.
   * @param query The string to search for.
   * @returns A matching KnowledgeBaseEntry or null if not found.
   */
  search(query: string): KnowledgeBaseEntry | null {
    const lowerCaseQuery = query.toLowerCase();

    // Simple search: find the first entry where the query appears in title, content, or tags.
    const foundEntry = this.entries.find(
      entry =>
        entry.title.toLowerCase().includes(lowerCaseQuery) ||
        entry.content.toLowerCase().includes(lowerCaseQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
    );

    return foundEntry || null;
  }

  /**
   * Retrieves all entries from the knowledge base.
   * @returns An array of all knowledge base entries.
   */
  getAll(): KnowledgeBaseEntry[] {
    // Return a copy to prevent direct mutation of the mock data
    return [...this.entries].sort((a, b) => a.title.localeCompare(b.title));
  }

  /**
   * Adds a new entry to the knowledge base.
   * @param entryData The data for the new entry, without an ID.
   */
  add(entryData: Omit<KnowledgeBaseEntry, 'id'>): void {
    const newEntry: KnowledgeBaseEntry = {
      id: `kb_${Date.now()}`,
      ...entryData,
    };
    this.entries.push(newEntry);
  }

  /**
   * Updates an existing entry in the knowledge base.
   * @param updatedEntry The full entry object, including the ID of the entry to update.
   */
  update(updatedEntry: KnowledgeBaseEntry): void {
    const index = this.entries.findIndex(entry => entry.id === updatedEntry.id);
    if (index !== -1) {
      this.entries[index] = updatedEntry;
    }
  }
}

// Export a singleton instance of the service
export const knowledgeService = new KnowledgeService();
