export interface NewsSuggestionItem {
  title: string;
}

const FALLBACK_SUGGESTIONS: NewsSuggestionItem[] = [
  { title: 'Explain quantum computing in simple terms' },
  { title: 'Compare microservices vs modular monoliths' },
  { title: 'Recent breakthroughs in renewable energy technology' },
  { title: 'Best practices for securing Node.js APIs in production' },
];

export async function getNewsSuggestions(limit = 4): Promise<NewsSuggestionItem[]> {
  try {
    const apiBase = (import.meta as any).env?.VITE_API_BASE_URL || '';
    const res = await fetch(`${apiBase}/api/v1/news/suggestions`);
    if (!res.ok) {
      return FALLBACK_SUGGESTIONS.slice(0, limit);
    }
    const data = await res.json();
    if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
      return data.suggestions.slice(0, limit);
    }
    return FALLBACK_SUGGESTIONS.slice(0, limit);
  } catch (error) {
    console.warn('Backend news proxy unavailable, using fallback suggestions');
    return FALLBACK_SUGGESTIONS.slice(0, limit);
  }
}
