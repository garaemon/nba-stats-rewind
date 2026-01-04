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
