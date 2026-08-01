// Vercel serverless function: web search (server-side → no CORS).
// Tries DuckDuckGo HTML, then Bing, then Wikipedia as fallbacks so a single
// provider being blocked doesn't kill search.

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

function safeAtob(s: string): string {
  try {
    return atob(s);
  } catch {
    return '';
  }
}

function dedupe(hits: SearchHit[]): SearchHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    if (!h.title || seen.has(h.title)) return false;
    seen.add(h.title);
    return true;
  });
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

async function searchDuckDuckGo(q: string): Promise<SearchHit[]> {
  const url = 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: SearchHit[] = [];
  const blocks = html.split('class="result results_links');
  for (const block of blocks.slice(1)) {
    const a = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    let href = a[1];
    const uddg = href.match(/uddg=([^&]+)/);
    if (uddg) href = decodeURIComponent(uddg[1]);
    const title = decodeEntities(a[2].replace(/<[^>]+>/g, '')).trim();
    if (!title) continue;
    const s = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    out.push({
      title,
      url: href,
      snippet: s ? decodeEntities(s[1].replace(/<[^>]+>/g, '')).trim() : undefined,
    });
    if (out.length >= 6) break;
  }
  return out;
}

async function searchBing(q: string): Promise<SearchHit[]> {
  const url = 'https://www.bing.com/search?q=' + encodeURIComponent(q);
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const out: SearchHit[] = [];
  const blocks = html.split('<li class="b_algo');
  for (const block of blocks.slice(1)) {
    const a = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/);
    if (!a) continue;
    let href = a[1];
    // Decode HTML entities so the redirect query (&amp; → &) parses cleanly.
    href = decodeEntities(href);
    const u = href.match(/[?&]u=([^&]+)/);
    if (u) {
      try {
        // Bing prefixes the base64 URL (e.g. "a1aHR0c..."), so probe offsets.
        let decoded = '';
        for (let offset = 0; offset < 4; offset++) {
          const cand = safeAtob(u[1].slice(offset));
          if (/^https?:\/\//i.test(cand)) {
            decoded = cand;
            break;
          }
        }
        if (decoded) href = decoded;
      } catch {
        // keep bing ck/a redirect as-is
      }
    }
    const title = decodeEntities(a[2].replace(/<[^>]+>/g, '')).trim();
    if (!title) continue;
    const snipMatch = block.match(/class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    out.push({
      title,
      url: href,
      snippet: snipMatch ? decodeEntities(snipMatch[1].replace(/<[^>]+>/g, '')).trim() : undefined,
    });
    if (out.length >= 6) break;
  }
  return out;
}

async function searchWikipedia(q: string): Promise<SearchHit[]> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
    encodeURIComponent(q) +
    '&format=json&origin=*&srlimit=4';
  const res = await fetch(url);
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

export default async function handler(req: any, res: any) {
  const q = String((req.query as any).q || '').trim();
  const debug = (req.query as any).debug === '1';
  if (!q) {
    res.status(400).json({ error: 'Missing query' });
    return;
  }

  let results: SearchHit[] = [];
  const diag: Record<string, number> = {};
  try {
    results = await searchDuckDuckGo(q);
    diag.ddg = results.length;
  } catch (e: any) {
    diag.ddg = -1;
  }
  if (results.length === 0) {
    try {
      results = await searchBing(q);
      diag.bing = results.length;
    } catch (e: any) {
      diag.bing = -1;
    }
  }
  if (results.length === 0) {
    try {
      results = await searchWikipedia(q);
      diag.wiki = results.length;
    } catch (e: any) {
      diag.wiki = -1;
    }
  }

  results = dedupe(results);

  const payload: any = {
    results,
    text:
      results.length === 0
        ? 'No results found. Try: https://duckduckgo.com/?q=' + encodeURIComponent(q)
        : results
            .map((r) => `• ${r.title}\n  ${r.url}${r.snippet ? `\n  ${r.snippet}` : ''}`)
            .join('\n'),
  };
  if (debug) payload.debug = diag;
  res.status(200).json(payload);
}
