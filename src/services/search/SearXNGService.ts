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

        const formatted = results.map((result, index) => {
            const parts = [];
            parts.push(`## 情報源 ${index + 1}`);
            parts.push(`**タイトル**: ${result.title}`);
            parts.push(`**内容**: ${result.content}`);
            parts.push(`**URL**: ${result.url}`);
            if (result.engine) {
                parts.push(`**検索エンジン**: ${result.engine}`);
            }
            parts.push(''); // Empty line for separation
            return parts.join('\n');
        });

        return formatted.join('\n');
    }
}
