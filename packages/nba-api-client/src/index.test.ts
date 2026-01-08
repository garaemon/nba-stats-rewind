import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getScoreboard, getPlayByPlayV3 } from './index';

describe('nba-api-client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('getScoreboard', () => {
    it('should fetch scoreboard data and parse it correctly', async () => {
      const mockResponse = {
        resultSets: [
          {
            name: 'GameHeader',
            headers: ['GAME_ID', 'GAME_DATE_EST', 'HOME_TEAM_ID', 'VISITOR_TEAM_ID', 'GAME_STATUS_TEXT'],
            rowSet: [['001', '2024-01-01', 10, 20, 'Final']],
          },
          {
            name: 'LineScore',
            headers: ['GAME_ID', 'TEAM_ID', 'TEAM_CITY_NAME', 'TEAM_NAME', 'PTS'],
            rowSet: [
              ['001', 10, 'Home', 'Team', 100],
              ['001', 20, 'Away', 'Team', 90],
            ],
          },
        ],
      };

      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getScoreboard('01/01/2024');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('scoreboardv2'),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        gameId: '001',
        gameDate: '2024-01-01',
        homeTeamId: 10,
        visitorTeamId: 20,
        homeTeamName: 'Home Team',
        visitorTeamName: 'Away Team',
        homeScore: 100,
        visitorScore: 90,
        gameStatusText: 'Final',
      });
    });

    it('should throw error when fetch fails', async () => {
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Error content',
      });

      await expect(getScoreboard('01/01/2024')).rejects.toThrow('Failed to fetch scoreboard: 404 Not Found - Error content');
    });
  });

  describe('getPlayByPlayV3', () => {
    it('should fetch V3 play-by-play data and return actions', async () => {
      const mockResponse = {
        game: {
          gameId: '001',
          actions: [
            { actionNumber: 1, description: 'Jump Ball', clock: 'PT12M00S', period: 1 },
          ],
        },
      };

      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getPlayByPlayV3('001');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('playbyplay_001.json'),
        expect.any(Object)
      );
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Jump Ball');
    });

    it('should throw error when fetch fails', async () => {
      (vi.mocked(fetch) as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Error',
      });

      await expect(getPlayByPlayV3('001')).rejects.toThrow('Failed to fetch after 3 retries');
    }, 20000);
  });
});
