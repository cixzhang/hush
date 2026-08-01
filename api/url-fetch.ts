// Vercel serverless function: URL fetch (server-side → no CORS).

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req: any, res: any) {
  const url = String((req.query as any).url || '').trim();
  if (!url) {
    res.status(400).json({ error: 'Missing url' });
    return;
  }
  // Only allow http(s) URLs to avoid protocol-relative weirdness.
  if (!/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'text/html,text/plain,*/*',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!fetchRes.ok) {
      res.status(502).json({ error: `Fetch failed: ${fetchRes.status}` });
      return;
    }

    const contentType = fetchRes.headers.get('content-type') || '';
    let text: string;
    if (contentType.includes('application/json')) {
      text = await fetchRes.text(); // keep JSON as-is
    } else {
      text = await fetchRes.text();
    }

    const stripped = stripHtml(text);
    const finalText =
      contentType.includes('application/json')
        ? stripped.slice(0, 8000)
        : stripped.slice(0, 8000);

    res.setHeader('Content-Type', 'application/json');
    if (!finalText) {
      res.status(200).json({ text: '(no readable text content on page)' });
      return;
    }
    res.status(200).json({ text: finalText });
  } catch (e: any) {
    const msg = e?.name === 'AbortError' ? 'Fetch timed out' : `Fetch error: ${e?.message || e}`;
    res.status(502).json({ error: msg });
  }
}
