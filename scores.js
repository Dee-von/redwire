// Cloudflare Pages Function: GET /api/scores
// Uses the free football-data.org API. Set FOOTBALL_DATA_TOKEN as a secret in your host's settings.
const BASE = 'https://api.football-data.org/v4';
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const nm = (s) => String(s || '').replace(/\s+(FC|AFC)$/i, '');

export async function onRequest({ env }) {
  const token = env.FOOTBALL_DATA_TOKEN;
  const out = { fixtures: [], table: [] };
  if (token) {
    const get = (path) =>
      fetch(BASE + path, { headers: { 'X-Auth-Token': token }, signal: AbortSignal.timeout(8000) })
        .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [m, st] = await Promise.all([
      get(`/teams/64/matches?dateFrom=${day(-30)}&dateTo=${day(45)}`),
      get('/competitions/PL/standings'),
    ]);
    if (m && m.matches) {
      out.fixtures = m.matches.map((x) => {
        const ft = x.score.fullTime;
        const live = ['IN_PLAY', 'PAUSED'].includes(x.status);
        const done = x.status === 'FINISHED';
        return [
          x.utcDate, x.competition.name,
          nm(x.homeTeam.shortName || x.homeTeam.name), nm(x.awayTeam.shortName || x.awayTeam.name),
          done || live ? ft.home : null, done || live ? ft.away : null, live,
        ];
      });
    }
    const rows = st && st.standings && st.standings[0] && st.standings[0].table;
    if (rows) out.table = rows.map((r) => [nm(r.team.name), r.won, r.draw, r.lost]);
  }
  return new Response(JSON.stringify(out), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
}
