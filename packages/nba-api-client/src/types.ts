export interface NBAApiResponse {
  resource: string;
  parameters: any;
  resultSets: ResultSet[];
}

export interface ResultSet {
  name: string;
  headers: string[];
  rowSet: any[][];
}

export interface GameSummary {
  gameId: string;
  gameDate: string;
  homeTeamId: number;
  visitorTeamId: number;
  homeTeamName: string;
  visitorTeamName: string;
  homeScore: number;
  visitorScore: number;
  gameStatusText: string;
  arenaName?: string;
  arenaCity?: string;
  arenaState?: string;
}

export interface PlayByPlayEvent {
  gameId: string;
  eventnum: number;
  eventmsgtype: number;
  eventmsgactiontype: number;
  period: number;
  wctimestring: string;
  pctimestring: string;
  homedescription: string | null;
  neutraldescription: string | null;
  visitordescription: string | null;
  score: string | null;
  scoremargin: string | null;
  person1type: number;
  player1Id: number;
  player1Name: string | null;
  player1TeamId: number | null;
  player1TeamCity: string | null;
  player1TeamNickname: string | null;
  player1TeamAbbreviation: string | null;
  person2type: number;
  player2Id: number;
  player2Name: string | null;
  player2TeamId: number | null;
  player2TeamCity: string | null;
  player2TeamNickname: string | null;
  player2TeamAbbreviation: string | null;
  person3type: number;
  player3Id: number;
  player3Name: string | null;
  player3TeamId: number | null;
  player3TeamCity: string | null;
  player3TeamNickname: string | null;
  player3TeamAbbreviation: string | null;
  videoAvailableFlag: number;
}

export interface PlayByPlayV3Response {
  meta: any;
  game: {
    gameId: string;
    actions: PlayByPlayV3Action[];
  };
}

export interface PlayByPlayV3Action {
  actionNumber: number;
  clock: string;
  timeActual: string;
  period: number;
  periodType: string;
  actionType: string;
  subType: string;
  qualifiers: string[];
  personId: number;
  playerName?: string;
  playerNameI?: string;
  teamId: number;
  teamTriplet: string;
  description: string;
  shotResult?: string;
  scoreHome: string;
  scoreAway: string;
  displayValue?: string;
  pointsTotal: number;
  location: string;
}

/**
 * ResultSet形式のデータをオブジェクトの配列に変換するユーティリティ
 */
export function parseResultSet<T>(resultSet: ResultSet): T[] {
  const { headers, rowSet } = resultSet;
  return rowSet.map((row) => {
    const obj: any = {};
    headers.forEach((header, index) => {
      // キャメルケースに変換（簡易版）
      const key = header.toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      obj[key] = row[index];
    });
    return obj as T;
  });
}
