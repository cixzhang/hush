// Vercel serverless function: web search (server-side → no CORS).
// Runs the DuckDuckGo HTML endpoint + Wikipedia fallback on the server.

type SearchHit = { title: string; url: string; snippet?: string };

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'");
}

export default async function handler(req: any, res: any) {
  const q = String((req.query as any).q || '').trim();
  if (!q) {
    res.status(400).json({ error: 'Missing query' });
    return;
  }

  const results: SearchHit[] = [];

  // 1. DuckDuckGo HTML results
  try {
    const url =
      'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(q);
    const ddgRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      },
    });
    if (ddgRes.ok) {
      const html = await ddgRes.text();
      // Each result block is a <div class="result"> ... <a class="result__a" href="...">Title</a>
      // ... <a class="result__snippet" ...>snippet</a>
      const blocks = html.split('class="result results_links');
      for (const block of blocks.slice(1)) {
        const aMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
        if (!aMatch) continue;
        let href = aMatch[1];
        // Unwrap DDG redirect: //duckduckgo.com/l/?uddg=<encoded>
        const uddg = href.match(/uddg=([^&]+)/);
        if (uddg) href = decodeURIComponent(uddg[1]);
        const title = decodeEntities(aMatch[2].replace(/<[^>]+>/g, '')).trim();
        if (!title) continue;
        const sMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
        const snippet = sMatch
          ? decodeEntities(sMatch[1].replace(/<[^>]+>/g, '')).trim()
          : undefined;
        results.push({ title, url: href, snippet });
        if (results.length >= 6) break;
      }
    }
  } catch {
    // fall through to Wikipedia
  }

  // 2. Wikipedia fallback / supplement
  try {
    const wikiUrl =
      'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
      encodeURIComponent(q) +
      '&format=json&origin=*&srlimit=4';
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const data = await wikiRes.json();
      const found = (data.query?.search || []) as Array<{
        title: string;
        snippet: string;
        pageid: number;
      }>;
      for (const r of found) {
        results.push({
          title: r.title,
          url: 'https://en.wikipedia.org/?curid=' + r.pageid,
          snippet: decodeEntities(r.snippet.replace(/<[^>]+>/g, '')).trim(),
        });
        if (results.length >= 8) break;
      }
    }
  } catch {
    // ignore
  }

  res.setHeader('Content-Type', 'application/json');
  if (results.length === 0) {
    res.status(200).json({
      results: [],
      text: 'No results found. Try: https://duckduckgo.com/?q=' + encodeURIComponent(q),
    });
    return;
  }

  const text = results
    .map((r) => `• ${r.title}\n  ${r.url}${r.snippet ? `\n  ${r.snippet}` : ''}`)
    .join('\n');

  res.status(200).json({ results, text });
}
