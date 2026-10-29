// Cloudflare Pages Function: GET /api/news
// Fetches Liverpool-related headlines from RSS feeds on the server (no browser CORS limits).
const FEEDS = [
  ['BBC Sport', 'https://feeds.bbci.co.uk/sport/football/rss.xml'],
  ['Liverpool Echo', 'https://www.liverpoolecho.co.uk/sport/?service=rss'],
  ['This Is Anfield', 'https://www.thisisanfield.com/feed/'],
];
const KEEP = /\b(liverpool|lfc|anfield|iraola|wirtz|isak|szoboszlai|van dijk|mac allister)\b/i;

const clean = (s) => (s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#0?39;|&apos;|&#8217;/g, "'").replace(/&amp;/g, '&')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const tag = (block, name) => {
  const m = block.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>', 'i'));
  return m ? m[1] : '';
};

async function readFeed([name, url]) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RedWire/1.0)' },
      signal: AbortSignal.timeout(6000),
      cf: { cacheTtl: 300 },
    });
    if (!r.ok) return [];
    const xml = await r.text();
    return (xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []).map((b) => ({
      t: clean(tag(b, 'title')),
      u: clean(tag(b, 'link')),
      d: clean(tag(b, 'pubDate')),
      x: clean(tag(b, 'description')).slice(0, 170),
      s: name,
    }));
  } catch (e) {
    return [];
  }
}

export async function onRequest() {
  const all = (await Promise.all(FEEDS.map(readFeed))).flat();
  const seen = new Set();
  const items = all
    .filter((i) => i.t && /^https?:\/\//.test(i.u) && KEEP.test(i.t + ' ' + i.x))
    .sort((a, b) => new Date(b.d) - new Date(a.d))
    .filter((i) => !seen.has(i.u) && seen.add(i.u))
    .slice(0, 12);
  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
  });
}
