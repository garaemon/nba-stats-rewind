import { NBAApiResponse, GameSummary, parseResultSet, PlayByPlayEvent } from './types';

export * from './types';

export const NBA_STATS_BASE_URL = 'https://stats.nba.com/stats';

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
  return parseResultSet<PlayByPlayEvent>(data.resultSets[0]);
}