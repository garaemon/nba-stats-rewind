import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    cdn: { status: 0, statusText: '', headers: {}, error: null as any, dataPreview: null as any, timing: 0 },
    stats: { status: 0, statusText: '', headers: {}, error: null as any, timing: 0 },
    scoreboard_fallback: { status: 0, statusText: '', headers: {}, error: null as any, dataPreview: null as any, timing: 0 },
    ip: { ip: '', error: null as any }
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
  };

  // 1. Check CDN (Basic Connectivity)
  const startCdn = performance.now();
  try {
    const cdnUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
    const cdnRes = await fetch(cdnUrl, {
      headers: { ...headers },
      cache: 'no-store'
    });
    results.cdn.status = cdnRes.status;
    results.cdn.statusText = cdnRes.statusText;
    const resHeaders: Record<string, string> = {};
    cdnRes.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    results.cdn.headers = resHeaders;

    if (cdnRes.ok) {
      const json = await cdnRes.json();
      results.cdn.dataPreview = {
        meta: json.meta,
        gameCount: json.scoreboard?.games?.length
      };
    }
  } catch (e: any) {
    results.cdn.error = {
      message: e.message,
      cause: e.cause ? String(e.cause) : undefined,
      name: e.name,
      stack: e.stack
    };
  }
  results.cdn.timing = performance.now() - startCdn;

  // 2. Check Stats API (Known to be blocked often)
  const startStats = performance.now();
  try {
    const statsUrl = 'https://stats.nba.com/stats/scoreboardv2?DayOffset=0&LeagueID=00&gameDate=01/01/2024';
    const statsRes = await fetch(statsUrl, {
      headers: {
        ...headers,
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
      },
      cache: 'no-store'
    });
    results.stats.status = statsRes.status;
    results.stats.statusText = statsRes.statusText;
    const resHeaders: Record<string, string> = {};
    statsRes.headers.forEach((v, k) => {
      resHeaders[k] = v;
    });
    results.stats.headers = resHeaders;
  } catch (e: any) {
    results.stats.error = {
      message: e.message,
      cause: e.cause ? String(e.cause) : undefined,
      name: e.name,
      stack: e.stack
    };
  }
  results.stats.timing = performance.now() - startStats;

  // 3. Simulate getScoreboard Logic (Logic inside nba-api-client)
  const startFallback = performance.now();
  try {
    // Format today as YYYY-MM-DD for checking against API response if needed,
    // but here we just test the specific URL structure used in client
    const url = `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`;

    const response = await fetch(url, {
      headers: { ...headers },
      cache: 'no-store'
    });

    results.scoreboard_fallback.status = response.status;
    results.scoreboard_fallback.statusText = response.statusText;

    if (response.ok) {
      const data = await response.json();
      results.scoreboard_fallback.dataPreview = {
        gamesFound: data.scoreboard?.games?.length || 0,
        firstGameId: data.scoreboard?.games?.[0]?.gameId
      };
    }
  } catch (e: any) {
    results.scoreboard_fallback.error = {
      message: e.message,
      cause: e.cause ? String(e.cause) : undefined,
      name: e.name
    };
  }
  results.scoreboard_fallback.timing = performance.now() - startFallback;

  // Check IP
  try {
    const ipRes = await fetch('https://httpbin.org/ip');
    const ipData = await ipRes.json();
    results.ip = ipData;
  } catch (e: any) {
    results.ip.error = e.message;
  }

  return NextResponse.json(results);
}
