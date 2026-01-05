import { NBAApiResponse, GameSummary, parseResultSet, PlayByPlayEvent, PlayByPlayV3Response, PlayByPlayV3Action } from './types';

export * from './types';

export const NBA_STATS_BASE_URL = 'https://stats.nba.com/stats';
export const NBA_CDN_BASE_URL = 'https://cdn.nba.com/static/json/liveData';

export const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.nba.com/',
  'Origin': 'https://www.nba.com',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': '*/*',
};

export async function getScoreboard(date: string): Promise<GameSummary[]> {
  const url = `${NBA_STATS_BASE_URL}/scoreboardv2?DayOffset=0&LeagueID=00&gameDate=${encodeURIComponent(date)}`;
  
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch scoreboard: ${response.statusText}`);
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
    };
  });
}

/**
 * @deprecated Use getPlayByPlayV3 instead
 */
export async function getPlayByPlay(gameId: string): Promise<PlayByPlayEvent[]> {
  const url = `${NBA_STATS_BASE_URL}/playbyplayv2?EndPeriod=10&GameID=${gameId}&StartPeriod=1`;
  
  const response = await fetch(url, {
    headers: DEFAULT_HEADERS,
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
  const url = `${NBA_CDN_BASE_URL}/playbyplay/playbyplay_${gameId}.json`;
  
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch play-by-play v3: ${response.statusText}`);
  }

  const data: PlayByPlayV3Response = await response.json();
  return data.game.actions;
}

export async function getBoxScoreV3(gameId: string): Promise<any> {
  const url = `${NBA_CDN_BASE_URL}/boxscore/boxscore_${gameId}.json`;
  
  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch boxscore v3: ${response.statusText}`);
  }

  const data = await response.json();
  return data.game;
}