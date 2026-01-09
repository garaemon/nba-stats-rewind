import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    cdn: { status: 0, statusText: '', headers: {}, error: null as string | null },
    stats: { status: 0, statusText: '', headers: {}, error: null as string | null },
    ip: { ip: '' }
  };

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.nba.com/',
    'Origin': 'https://www.nba.com',
    'Connection': 'keep-alive',
  };

  // Check CDN
  try {
    const cdnUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
    const cdnRes = await fetch(cdnUrl, {
      headers: {
        ...headers,
        'Host': 'cdn.nba.com',
      }
    });
    results.cdn.status = cdnRes.status;
    results.cdn.statusText = cdnRes.statusText;
    const resHeaders: Record<string, string> = {};
    cdnRes.headers.forEach((v, k) => { resHeaders[k] = v; });
    results.cdn.headers = resHeaders;
  } catch (e: any) {
    results.cdn.error = e.message;
  }

  // Check Stats API
  try {
    const statsUrl = 'https://stats.nba.com/stats/scoreboardv2?DayOffset=0&LeagueID=00&gameDate=01/01/2024';
    const statsRes = await fetch(statsUrl, {
      headers: {
        ...headers,
        'Host': 'stats.nba.com',
        'x-nba-stats-origin': 'stats',
        'x-nba-stats-token': 'true',
      }
    });
    results.stats.status = statsRes.status;
    results.stats.statusText = statsRes.statusText;
    const resHeaders: Record<string, string> = {};
    statsRes.headers.forEach((v, k) => { resHeaders[k] = v; });
    results.stats.headers = resHeaders;
  } catch (e: any) {
    results.stats.error = e.message;
  }

  // Check IP
  try {
    const ipRes = await fetch('https://httpbin.org/ip');
    const ipData = await ipRes.json();
    results.ip = ipData;
  } catch (e) {
    // ignore ip check failure
  }

  return NextResponse.json(results);
}
