/**
 * SearXNG Service
 * Handles web search via SearXNG API
 */

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    engine?: string;
}

export class SearXNGService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    async search(query: string, limit: number = 5): Promise<SearchResult[]> {
        try {
            const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&format=json&pageno=1`;
            console.log('[SearXNGService] Searching:', url);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`SearXNG API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                console.warn('[SearXNGService] No results array in response');
                return [];
            }

            const results = data.results.slice(0, limit).map((item: any) => ({
                title: item.title || '',
                url: item.url || '',
                content: item.content || item.description || '',
                engine: item.engine,
            }));

            console.log(`[SearXNGService] Found ${results.length} results`);
            return results;
        } catch (error) {
            console.error('[SearXNGService] Search error:', error);
            throw error;
        }
    }

    formatForContext(results: SearchResult[]): string {
        if (results.length === 0) {
            return 'No search results found.';
        }

        return results
            .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
            .join('\n\n');
    }
}
