import { describe, it, expect } from 'vitest';
import { parseResultSet, ResultSet } from './types';

describe('parseResultSet', () => {
  it('should parse a basic ResultSet correctly', () => {
    const resultSet: ResultSet = {
      name: 'TestResult',
      headers: ['GAME_ID', 'HOME_TEAM_ID', 'VISITOR_TEAM_ID'],
      rowSet: [
        ['001', 10, 20],
        ['002', 11, 21],
      ],
    };

    const result = parseResultSet<{ gameId: string; homeTeamId: number; visitorTeamId: number }>(resultSet);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      gameId: '001',
      homeTeamId: 10,
      visitorTeamId: 20,
    });
    expect(result[1]).toEqual({
      gameId: '002',
      homeTeamId: 11,
      visitorTeamId: 21,
    });
  });

  it('should handle complex header names and convert to camelCase', () => {
    const resultSet: ResultSet = {
      name: 'ComplexResult',
      headers: ['VERY_LONG_HEADER_NAME', 'ID'],
      rowSet: [['Value', 1]],
    };

    const result = parseResultSet<any>(resultSet);
    expect(result[0]).toHaveProperty('veryLongHeaderName', 'Value');
    expect(result[0]).toHaveProperty('id', 1);
  });
});
