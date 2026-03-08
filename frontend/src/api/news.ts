export interface NewsSuggestionItem {
  title: string;
}

interface NewsDataResponse {
  results?: Array<{
    title?: string;
    description?: string;
  }>;
}

const NEWSDATA_URL = 'https://newsdata.io/api/1/latest';

const DEFAULT_COUNTRIES = 'in,cn,au,wo';
const DEFAULT_LANGUAGES = 'ta,en,ml';
const DEFAULT_CATEGORIES = 'technology,education,food,health,lifestyle';

function toPromptTitle(raw: string) {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.length > 90 ? `${cleaned.slice(0, 90)}...` : cleaned;
}

export async function getNewsSuggestions(limit = 4): Promise<NewsSuggestionItem[]> {
  const apiKey = (import.meta as any).env?.VITE_NEWSDATA_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_NEWSDATA_API_KEY');
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    country: DEFAULT_COUNTRIES,
    language: DEFAULT_LANGUAGES,
    category: DEFAULT_CATEGORIES,
  });

  const res = await fetch(`${NEWSDATA_URL}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NewsData error: ${res.status} ${text}`);
  }

  const data = (await res.json()) as NewsDataResponse;
  const seen = new Set<string>();
  const suggestions: NewsSuggestionItem[] = [];

  for (const row of data.results || []) {
    const candidate = toPromptTitle(row.title || row.description || '');
    if (!candidate) continue;
    const key = candidate.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push({ title: candidate });
    if (suggestions.length >= limit) break;
  }

  return suggestions;
}
