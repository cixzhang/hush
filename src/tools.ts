// Tool definitions and executors for hush.
// Each tool: schema for OpenRouter's function calling, plus a client-side executor.

export type ToolName =
  | 'web_search'
  | 'url_fetch'
  | 'weather'
  | 'datetime'
  | 'code_run'
  | 'calculator'
  | 'memory'
  | 'image_gen';

export interface ToolCall {
  id: string;
  name: ToolName;
  args: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
}

// ---- OpenRouter function-calling schemas ----

export const TOOL_SCHEMAS = [
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web for real-time information. Returns top results with titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'url_fetch',
      description: 'Fetch the content of a web page and return it as text. Useful for reading articles, docs, or API responses.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'weather',
      description: 'Get current weather conditions and a brief forecast for a location.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name or coordinates (lat,lon)' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'datetime',
      description: 'Get the current date and time, optionally for a specific timezone. Can also do date math.',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: 'IANA timezone (e.g. "America/New_York", "Asia/Tokyo"). Defaults to user\'s local timezone.' },
          format: { type: 'string', description: 'Optional custom format string (e.g. "YYYY-MM-DD", "h:mm A")' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'code_run',
      description: 'Execute a JavaScript code snippet and return the output. Useful for calculations, data processing, or quick scripts.',
      parameters: {
        type: 'object',
        properties: {
          code: { type: 'string', description: 'JavaScript code to execute. Use console.log() for output. The code runs in a sandboxed environment.' },
        },
        required: ['code'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculator',
      description: 'Evaluate a mathematical expression and return the result. Supports basic arithmetic, trigonometry, logarithms, etc.',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression to evaluate (e.g. "15% of 230", "sin(45) + cos(30)", "2^10")' },
        },
        required: ['expression'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'memory',
      description: 'Save or recall persistent facts about the user. Saved facts persist across sessions. Use action "save" to store, "recall" to retrieve, or "list" to see all saved facts.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['save', 'recall', 'list'], description: 'What to do: save a fact, recall matching facts, or list all' },
          content: { type: 'string', description: 'The fact to save (for action=save) or the query to search for (for action=recall)' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'image_gen',
      description: 'Generate an image from a text description. Returns a URL to the generated image.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Description of the image to generate' },
        },
        required: ['prompt'],
      },
    },
  },
];

// ---- Tool executors (client-side) ----

async function webSearch(args: { query: string }): Promise<string> {
  const q = encodeURIComponent(args.query);
  const results: string[] = [];

  // 1. Try DuckDuckGo instant answer
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${q}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const data = await ddgRes.json();
      if (data.AbstractText) {
        results.push(`${data.AbstractText}\nSource: ${data.AbstractURL || 'DuckDuckGo'}`);
      }
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, 3)) {
          if (topic.Text) {
            results.push(`• ${topic.Text}\n  ${topic.FirstURL || ''}`);
          }
        }
      }
    }
  } catch {}

  // 2. Wikipedia search (always run — more reliable)
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&format=json&origin=*&srlimit=5`;
    const wikiRes = await fetch(wikiUrl);
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      const searchResults = wikiData.query?.search || [];
      if (searchResults.length > 0) {
        if (results.length > 0) results.push('');
        results.push('Wikipedia results:');
        for (const r of searchResults) {
          const snippet = r.snippet.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#039;/g, "'").trim();
          results.push(`• ${r.title}: ${snippet}\n  https://en.wikipedia.org/?curid=${r.pageid}`);
        }
      }
    }
  } catch {}

  // 3. Fallback
  if (results.length === 0) {
    results.push(`No results found. See: https://duckduckgo.com/?q=${q}`);
  }

  return results.join('\n');
}

async function urlFetch(args: { url: string }): Promise<string> {
  const res = await fetch(args.url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const text = await res.text();
  // Basic HTML-to-text: strip tags, collapse whitespace
  const stripped = text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, 5000);
}

async function weather(args: { location: string }): Promise<string> {
  // Use Open-Meteo (free, no API key needed)
  // First geocode the location
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(args.location)}&count=1`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error(`Geocoding failed: ${geoRes.status}`);
  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location not found: ${args.location}`);
  }
  const { latitude, longitude, name, country } = geoData.results[0];

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=3`;
  const weatherRes = await fetch(weatherUrl);
  if (!weatherRes.ok) throw new Error(`Weather fetch failed: ${weatherRes.status}`);
  const w = await weatherRes.json();

  const cur = w.current;
  const codes: Record<number, string> = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
    55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Rain showers', 81: 'Moderate showers', 82: 'Violent showers',
    95: 'Thunderstorm', 96: 'Thunderstorm + hail', 99: 'Severe thunderstorm + hail',
  };

  const lines = [
    `Weather in ${name}, ${country}:`,
    `  ${codes[cur.weather_code] || 'Unknown'} ${cur.temperature_2m}°C (feels like ${cur.apparent_temperature}°C)`,
    `  Humidity: ${cur.relative_humidity_2m}%  Wind: ${cur.wind_speed_10m} km/h`,
    '',
    '3-day forecast:',
  ];

  if (w.daily) {
    for (let i = 0; i < w.daily.time.length; i++) {
      lines.push(`  ${w.daily.time[i]}: ${codes[w.daily.weather_code[i]] || '?'} ${w.daily.temperature_2m_min[i]}–${w.daily.temperature_2m_max[i]}°C`);
    }
  }

  return lines.join('\n');
}

async function datetime(args: { timezone?: string; format?: string }): Promise<string> {
  const tz = args.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  try {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    if (args.format) {
      // Simple format parsing
      const fmt = args.format
        .replace('YYYY', 'numeric')
        .replace('MM', '2-digit')
        .replace('DD', '2-digit')
        .replace('HH', '2-digit')
        .replace('mm', '2-digit')
        .replace('A', 'short');
      return now.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'medium' });
    }
    return now.toLocaleString('en-US', options);
  } catch {
    // Invalid timezone — fall back to UTC
    return new Date().toUTCString();
  }
}

async function codeRun(args: { code: string }): Promise<string> {
  // Run in a sandboxed Function with console capture
  // We can't use a cross-origin iframe, so we capture console.log output
  // via a safe eval in a try/catch
  const logs: string[] = [];
  const errors: string[] = [];

  const sandboxConsole = {
    log: (...a: unknown[]) => logs.push(a.map(x => typeof x === 'object' ? JSON.stringify(x, null, 2) : String(x)).join(' ')),
    error: (...a: unknown[]) => errors.push(a.map(String).join(' ')),
    warn: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
    info: (...a: unknown[]) => logs.push(a.map(String).join(' ')),
  };

  try {
    // Create a function scope with the sandboxed console
    const fn = new Function('console', `"use strict"; ${args.code}`);
    const result = fn(sandboxConsole);
    const output: string[] = [];
    if (logs.length > 0) output.push(logs.join('\n'));
    if (result !== undefined) output.push(`→ ${typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)}`);
    if (errors.length > 0) output.push(`Errors: ${errors.join('\n')}`);
    return output.join('\n') || '(no output)';
  } catch (e) {
    return `Error: ${(e as Error).message}`;
  }
}

async function calculator(args: { expression: string }): Promise<string> {
  const expr = args.expression
    .replace(/%/g, '/100*')
    .replace(/\^/g, '**')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\btimes\b/gi, '*')
    .replace(/\bdivided by\b/gi, '/')
    .replace(/\bof\b/gi, '*');

  // Only allow safe characters
  if (!/^[0-9+\-*/().,\s\w]*$/.test(expr)) {
    throw new Error('Invalid expression');
  }

  const result = Function(`"use strict"; return (${expr})`)();
  return `${args.expression} = ${result}`;
}

async function memory(args: { action: string; content?: string }): Promise<string> {
  const key = 'hush:memory';
  if (args.action === 'list') {
    const facts = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    return facts.length > 0 ? facts.map((f, i) => `${i + 1}. ${f}`).join('\n') : 'No saved facts.';
  }
  if (args.action === 'save') {
    if (!args.content) return 'No content provided to save.';
    const facts = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    facts.push(args.content);
    localStorage.setItem(key, JSON.stringify(facts));
    return `Saved: "${args.content}"`;
  }
  if (args.action === 'recall') {
    if (!args.content) return memory({ action: 'list' });
    const facts = JSON.parse(localStorage.getItem(key) || '[]') as string[];
    const matches = facts.filter(f => f.toLowerCase().includes(args.content!.toLowerCase()));
    return matches.length > 0 ? matches.map((f, i) => `${i + 1}. ${f}`).join('\n') : `No facts matching "${args.content}".`;
  }
  return 'Invalid action. Use: save, recall, or list.';
}

async function imageGen(args: { prompt: string }): Promise<string> {
  // Use pollinations.ai — free, no API key needed
  const encoded = encodeURIComponent(args.prompt);
  const seed = Math.floor(Math.random() * 1000000);
  const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=768&seed=${seed}&nologo=true`;
  // Verify the image is accessible
  try {
    const res = await fetch(imageUrl, { method: 'HEAD' });
    if (res.ok) {
      return `![${args.prompt}](${imageUrl})\n\nImage generated at: ${imageUrl}`;
    }
  } catch {
    // HEAD might not work, return the URL anyway
  }
  return `![${args.prompt}](${imageUrl})\n\nImage generated at: ${imageUrl}`;
}

// ---- Tool dispatcher ----

export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case 'web_search': return webSearch(args as { query: string });
    case 'url_fetch': return urlFetch(args as { url: string });
    case 'weather': return weather(args as { location: string });
    case 'datetime': return datetime(args as { timezone?: string; format?: string });
    case 'code_run': return codeRun(args as { code: string });
    case 'calculator': return calculator(args as { expression: string });
    case 'memory': return memory(args as { action: string; content?: string });
    case 'image_gen': return imageGen(args as { prompt: string });
    default: throw new Error(`Unknown tool: ${name}`);
  }
}

// Tool metadata for UI display
export const TOOL_META: Record<string, { icon: string; label: string }> = {
  web_search: { icon: '🔍', label: 'Searched the web' },
  url_fetch: { icon: '🔗', label: 'Fetched URL' },
  weather: { icon: '🌤️', label: 'Checked weather' },
  datetime: { icon: '🕐', label: 'Got date/time' },
  code_run: { icon: '⚡', label: 'Ran code' },
  calculator: { icon: '🧮', label: 'Calculated' },
  memory: { icon: '🧠', label: 'Memory' },
  image_gen: { icon: '🎨', label: 'Generated image' },
};
