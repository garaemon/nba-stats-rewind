import { NBAApiResponse, GameSummary, parseResultSet, PlayByPlayEvent, PlayByPlayV3Response, PlayByPlayV3Action } from './types';

export * from './types';

export const NBA_STATS_BASE_URL = 'https://stats.nba.com/stats';
export const NBA_CDN_BASE_URL = 'https://cdn.nba.com/static/json/liveData';

export const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com',
};

const CDN_HEADERS = {
  ...DEFAULT_HEADERS,
};

async function fetchWithRetry(url: string, options: RequestInit, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    if (options.signal?.aborted) {
      throw new Error('Request aborted by timeout');
    }
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 403 || response.status === 429) {
        console.warn(`Fetch failed with ${response.status}. Retrying (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      return response;
    } catch (error) {
      if (options.signal?.aborted) throw error;
      if (i === retries - 1) throw error;
      console.warn(`Fetch error: ${error}. Retrying (${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch after ${retries} retries`);
}

async function fetchSchedule(): Promise<any> {
  try {
    const url = `https://cdn.nba.com/static/json/staticData/scheduleLeagueV2_2.json`;
    const response = await fetch(url, { headers: CDN_HEADERS, next: { revalidate: 3600 } } as any);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Failed to fetch schedule from CDN:', e);
  }
  return null;
}

export async function getScoreboard(date: string): Promise<GameSummary[]> {
  const isMockEnabled = process.env.USE_MOCK_DATA === 'true';
  
  if (isMockEnabled) {
    return [
      {
        gameId: "0022300001",
        gameDate: date,
        homeTeamId: 1610612737,
        visitorTeamId: 1610612754,
        homeTeamName: "Atlanta Hawks",
        visitorTeamName: "Indiana Pacers",
        homeScore: 110,
        visitorScore: 120,
        gameStatusText: "Final",
        arenaName: "State Farm Arena",
        arenaCity: "Atlanta",
        arenaState: "GA"
      },
    ];
  }

  // 1. Try "Today's Scoreboard" first (contains live scores)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const url = `${NBA_CDN_BASE_URL}/scoreboard/todaysScoreboard_00.json`;

    // Fetch both concurrently, but handle failures gracefully
    const [todaysResponse, scheduleData] = await Promise.all([
        fetch(url, { headers: CDN_HEADERS, cache: 'no-store', signal: controller.signal }),
        fetchSchedule()
    ]);

    clearTimeout(timeoutId);

    if (todaysResponse.ok) {
      const data = await todaysResponse.json();
      const games = data.scoreboard.games;
      
      const etFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const matchingGames = games.filter((game: any) => {
        try {
          // game.gameEt includes timezone info or is UTC. 
          // We must convert it to ET to determine the "NBA Day".
          const gameDateObj = new Date(game.gameEt);
          const parts = etFormatter.formatToParts(gameDateObj);
          const month = parts.find(p => p.type === 'month')?.value;
          const day = parts.find(p => p.type === 'day')?.value;
          const year = parts.find(p => p.type === 'year')?.value;
          
          const gameDateStr = `${month}/${day}/${year}`;
          return gameDateStr === date;
        } catch (e) {
          return false;
        }
      });

      // Create a map for arena info from schedule
      const arenaMap = new Map<string, { name: string, city: string, state: string }>();
      if (scheduleData && scheduleData.leagueSchedule && scheduleData.leagueSchedule.gameDates) {
          scheduleData.leagueSchedule.gameDates.forEach((d: any) => {
              d.games.forEach((g: any) => {
                  if (g.gameId) {
                      arenaMap.set(g.gameId, {
                          name: g.arenaName,
                          city: g.arenaCity,
                          state: g.arenaState
                      });
                  }
              });
          });
      }

      if (matchingGames.length > 0) {
        return matchingGames.map((game: any) => {
          const arenaInfo = arenaMap.get(game.gameId);
          return {
            gameId: game.gameId,
            gameDate: game.gameEt,
            homeTeamId: game.homeTeam.teamId,
            visitorTeamId: game.awayTeam.teamId,
            homeTeamName: `${game.homeTeam.teamCity} ${game.homeTeam.teamName}`,
            visitorTeamName: `${game.awayTeam.teamCity} ${game.awayTeam.teamName}`,
            homeScore: game.homeTeam.score,
            visitorScore: game.awayTeam.score,
            gameStatusText: game.gameStatusText,
            arenaName: arenaInfo?.name,
            arenaCity: arenaInfo?.city,
            arenaState: arenaInfo?.state,
          };
        });
      }
    }
  } catch (e) {
    console.warn('Failed to fetch from CDN (today), trying schedule:', e);
  }

  // 2. Fallback to Schedule API for past/future games (No scores, but lists games)
  try {
    const data = await fetchSchedule();

    if (data) {
      const gameDates = data.leagueSchedule.gameDates;
      
      // Find the specific date entry
      // The format in JSON is "MM/DD/YYYY 00:00:00"
      const targetDateEntry = gameDates.find((entry: any) => entry.gameDate.startsWith(date));

      if (targetDateEntry && targetDateEntry.games) {
        return targetDateEntry.games.map((game: any) => ({
          gameId: game.gameId,
          gameDate: game.gameDateEst,
          homeTeamId: game.homeTeam.teamId,
          visitorTeamId: game.awayTeam.teamId,
          homeTeamName: `${game.homeTeam.teamCity} ${game.homeTeam.teamName}`,
          visitorTeamName: `${game.awayTeam.teamCity} ${game.awayTeam.teamName}`,
          homeScore: 0, // Score not available in schedule
          visitorScore: 0, // Score not available in schedule
          gameStatusText: game.gameStatusText,
          arenaName: game.arenaName,
          arenaCity: game.arenaCity,
          arenaState: game.arenaState,
        }));
      }
    }
  } catch (e) {
    console.warn('Failed to fetch schedule from CDN:', e);
  }

  // 3. Last Resort: Stats API (Blocked on Vercel, but kept for local dev)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const url = `${NBA_STATS_BASE_URL}/scoreboardv2?DayOffset=0&LeagueID=00&gameDate=${encodeURIComponent(date)}`;
    
    const response = await fetchWithRetry(url, {
      headers: {
        ...DEFAULT_HEADERS,
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      throw new Error(`Failed to fetch scoreboard: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    const data: NBAApiResponse = await response.json();
    
    const gameHeaders = parseResultSet<any>(data.resultSets[0]);
    const lineScores = parseResultSet<any>(data.resultSets[1]);

    return gameHeaders.map((header) => {
      const homeTeam = lineScores.find(ls => ls.teamId === header.homeTeamId && ls.gameId === header.gameId);
      const visitorTeam = lineScores.find(ls => ls.teamId === header.visitorTeamId && ls.gameId === header.gameId);

      return {
        gameId: header.gameId,
        gameDate: header.gameDateEst,
        homeTeamId: header.homeTeamId,
        visitorTeamId: header.visitorTeamId,
        homeTeamName: homeTeam ? `${homeTeam.teamCityName} ${homeTeam.teamName}` : 'Unknown',
        visitorTeamName: visitorTeam ? `${visitorTeam.teamCityName} ${visitorTeam.teamName}` : 'Unknown',
        homeScore: homeTeam?.pts ?? 0,
        visitorScore: visitorTeam?.pts ?? 0,
        gameStatusText: header.gameStatusText,
        // Stats API might have arena info in GameHeader but we rely on CDN mostly now.
      };
    });
  } catch (error) {
    console.error('Scoreboard fetch failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
/**
 * @deprecated Use getPlayByPlayV3 instead
 */
export async function getPlayByPlay(gameId: string): Promise<PlayByPlayEvent[]> {
  const url = `${NBA_STATS_BASE_URL}/playbyplayv2?EndPeriod=10&GameID=${gameId}&StartPeriod=1`;
  
  const response = await fetchWithRetry(url, {
    headers: {
      ...DEFAULT_HEADERS,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch play-by-play: ${response.statusText}`);
  }

  const data: NBAApiResponse = await response.json();
  if (!data.resultSets || data.resultSets.length === 0) {
    return [];
  }
  return parseResultSet<PlayByPlayEvent>(data.resultSets[0]);
}

export async function getPlayByPlayV3(gameId: string): Promise<PlayByPlayV3Action[]> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return [
      {
        actionNumber: 2,
        clock: "PT12M00.00S",
        timeActual: "2024-01-01T00:00:00Z",
        period: 1,
        periodType: "REGULAR",
        actionType: "period",
        subType: "start",
        qualifiers: [],
        personId: 0,
        teamId: 0,
        teamTriplet: "",
        description: "Period Start",
        scoreHome: "0",
        scoreAway: "0",
        pointsTotal: 0,
        location: "h",
      },
      {
        actionNumber: 4,
        clock: "PT09M00.00S",
        timeActual: "2024-01-01T00:15:00Z",
        period: 1,
        periodType: "REGULAR",
        actionType: "2pt",
        subType: "jump-shot",
        qualifiers: [],
        personId: 1,
        playerName: "Player A",
        teamId: 1610612754,
        teamTriplet: "IND",
        description: "Jump Shot",
        scoreHome: "0",
        scoreAway: "2",
        pointsTotal: 2,
        location: "a",
      },
      {
        actionNumber: 7,
        clock: "PT00M00.00S",
        timeActual: "2024-01-01T00:48:00Z",
        period: 4,
        periodType: "REGULAR",
        actionType: "2pt",
        subType: "jump-shot",
        qualifiers: [],
        personId: 1,
        playerName: "Player A",
        teamId: 1610612754,
        teamTriplet: "IND",
        description: "Jump Shot",
        scoreHome: "110",
        scoreAway: "120",
        pointsTotal: 2,
        location: "a",
      },
    ];
  }

  const url = `${NBA_CDN_BASE_URL}/playbyplay/playbyplay_${gameId}.json`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetchWithRetry(url, {
      headers: CDN_HEADERS,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      throw new Error(`Failed to fetch play-by-play v3: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    const data: PlayByPlayV3Response = await response.json();
    return data.game.actions;
  } catch (error) {
    console.error('Play-by-Play fetch failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getBoxScoreV3(gameId: string): Promise<any> {
  if (process.env.USE_MOCK_DATA === 'true') {
    return {
      gameId: gameId,
      gameStatus: 3,
      homeTeam: {
        teamId: 1610612737,
        teamName: "Hawks",
        teamCity: "Atlanta",
        teamTricode: "ATL",
        players: [],
      },
      awayTeam: {
        teamId: 1610612754,
        teamName: "Pacers",
        teamCity: "Indiana",
        teamTricode: "IND",
        players: [],
      },
    };
  }

  const url = `${NBA_CDN_BASE_URL}/boxscore/boxscore_${gameId}.json`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  
  try {
    const response = await fetchWithRetry(url, {
      headers: CDN_HEADERS,
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      throw new Error(`Failed to fetch boxscore v3: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
    }

    const data = await response.json();
    return data.game;
  } catch (error) {
    console.error('Boxscore fetch failed:', error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
