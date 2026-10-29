# Red Wire 3D: self-updating hosting (Cloudflare Pages, free)

Files
- index.html            the page
- functions/api/news.js   headlines from BBC Sport, Liverpool Echo, This Is Anfield
- functions/api/scores.js fixtures, results and the Premier League table (football-data.org)

Steps
1. Get a free token at https://www.football-data.org/client/register (it arrives by email).
2. Put this folder in a new GitHub repository (index.html and the functions folder at the top level).
3. In Cloudflare: Workers & Pages > Create > Pages > Connect to Git > pick the repo.
   Framework preset: None. Build command: leave empty. Output directory: /  (root).
4. After the first deploy: Settings > Variables and Secrets > add FOOTBALL_DATA_TOKEN (type Secret) > redeploy.
5. Open your *.pages.dev address. The title card turns green and says "Live" once data loads.

What updates by itself
- News: every 5 minutes (first 6 cards). The 1892 and Shankly history cards stay pinned.
- Fixtures, results, countdown, live score and the table: every minute (needs the token).
- Squad lists and injury tags: edit by hand in index.html.
- Carabao Cup games are not in football-data.org's free plan, so the Cup result in the snapshot is kept as is.
