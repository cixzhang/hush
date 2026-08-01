// Vercel serverless function: web search (server-side → no CORS, no scraping).
//
// Uses open, keyless, non-scraping REST APIs — safe to call from a serverless
// function (no bot-blocking, no ToS violations, no funds):
//   1. Hacker News Algolia — tech, products, current events (real URLs)
//   2. Wikipedia search   — encyclopedic coverage
//   3. DuckDuckGo instant answer — supplements when it has a topic card

type SearchHit = { title: string; url: string; snippet?: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function dedupe(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    if (!h.title || seen.has(h.title)) return false;
    seen.add(h.title);
    return true;
  });
}

// 1. Hacker News Algolia — good for tech / products / current events.
async function searchHackerNews(q: string): Promise<SearchHit[]> {
  const url =
    'https://hn.algolia.com/api/v1/search?query=' +
    encodeURIComponent(q) +
    '&hitsPerPage=6';
  const res = await fetch(url, { headers: { 'User-Agent': 'hush/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  const hits = (data.hits || []) as Array<{
    title?: string;
    url?: string;
    objectID: string;
    story_text?: string;
  }>;
  return hits
    .filter((h) => h.title)
    .map((h) => ({
      title: h.title!,
      url: h.url || 'https://news.ycombinator.com/item?id=' + h.objectID,
      snippet: h.story_text
        ? decodeEntities(h.story_text.replace(/<[^>]+>/g, '')).slice(0, 300)
        : undefined,
    }));
}

// 2. Wikipedia — encyclopedic coverage.
async function searchWikipedia(q: string): Promise<SearchHit[]> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&format=json&origin=*&srlimit=5';
  const res = await fetch(url, { headers: { 'User-Agent': 'hush/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  const found = (data.query?.search || []) as Array<{
    title: string;
    snippet: string;
    pageid: number;
  }>;
  return found.map((r) => ({
    title: r.title,
    url: 'https://en.wikipedia.org/?curid=' + r.pageid,
    snippet: decodeEntities(r.snippet.replace(/<[^>]+>/g, '')).trim(),
  }));
}

// 3. DuckDuckGo instant answer — optional topic card.
async function searchDatetimeCard(q: string): Promise<SearchHit[]> {
  // Actually DDG Instant Answer for facts:
  const url = 'https://api.duckduckgo.com/?q=' + encodeURIComponent(q) + '&format=json&no_html=1';
  const res = await fetch(url, { headers: { 'User-Agent': 'hush/1.0' } });
  if (!res.ok) return [];
  const data = await res.json();
  const out: SearchHit[] = [];
  if (data.AbstractText) {
    out.push({
      title: data.Heading || q,
      url: data.AbstractURL || 'https://duckduckgo.com/',
      snippet: String(data.AbstractText),
    });
  }
  return out;
}

export default async function handler(req: any, res: any) {
  const q = String((req.query as any).q || '').trim();
  if (!q) {
    res.status(400).json({ error: 'Missing query' });
    return;
  }

  // Run HN + Wikipedia in parallel; prepend a DDG fact card if available.
  const [hn, wiki, ddg] = await Promise.allSettled([
    searchHackerNews(q),
    searchWikipedia(q),
    searchDatetimeCard(q),
  ]);

  const hits: SearchHit[] = [
    ...(ddg.status === 'fulfilled' ? ddg.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(wiki.status === 'fulfilled' ? wiki.value : []),
  ];

  const results = dedupe(hits);

  res.status(200).json({
    results,
    text:
      results.length === 0
        ? 'No results found.'
        : results
            .map((r) => `• ${r.title}\n  ${r.url}${r.snippet ? `\n  ${r.snippet}` : ''}`)
            .join('\n'),
  });
}
