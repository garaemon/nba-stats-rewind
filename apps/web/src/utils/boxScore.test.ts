import { describe, it, expect } from 'vitest';
import { calculateBoxScore } from './boxScore';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';

describe('calculateBoxScore', () => {
  it('calculates basic stats correctly', () => {
    const actions: Partial<PlayByPlayV3Action>[] = [
      {
        actionNumber: 1,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: '2pt',
        shotResult: 'Made',
        personId: 1,
        playerName: 'Player 1',
        scoreHome: '2',
        scoreAway: '0',
      },
      {
        actionNumber: 2,
        teamId: 102,
        teamTriplet: 'BBB',
        actionType: '3pt',
        shotResult: 'Made',
        personId: 2,
        playerName: 'Player 2',
        scoreHome: '2',
        scoreAway: '3',
      },
      {
        actionNumber: 3,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: 'rebound',
        subType: 'offensive',
        personId: 1,
        playerName: 'Player 1',
      }
    ];

    const result = calculateBoxScore(actions as PlayByPlayV3Action[], 101, 102);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.home.teamId).toBe(101);
      expect(result.away.teamId).toBe(102);
      expect(result.home.points).toBe(2);
      expect(result.away.points).toBe(3);
      expect(result.home.playerStats[1].points).toBe(2);
      expect(result.home.playerStats[1].oreb).toBe(1);
    }
  });

  it('handles assists and other stats', () => {
    const actions: any[] = [
      {
        actionNumber: 1,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: '2pt',
        shotResult: 'Made',
        personId: 1,
        playerName: 'Player 1',
        assistPersonId: 2,
        assistPlayerNameInitial: 'P. 2',
      },
      {
        actionNumber: 2,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: 'rebound',
        subType: 'defensive',
        personId: 2,
        playerName: 'Player 2',
      },
      {
        actionNumber: 3,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: 'turnover',
        personId: 1,
        playerName: 'Player 1',
      },
      {
        actionNumber: 4,
        teamId: 102,
        teamTriplet: 'BBB',
        actionType: 'steal',
        personId: 3,
        playerName: 'Player 3',
      }
    ];

    const result = calculateBoxScore(actions as PlayByPlayV3Action[], 101, 102);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.home.playerStats[2].ast).toBe(1);
      expect(result.home.playerStats[2].dreb).toBe(1);
      expect(result.home.playerStats[1].tov).toBe(1);
      expect(result.away.playerStats[3].stl).toBe(1);
    }
  });

  it('initializes with starters even with no actions', () => {
    const initialPlayers = {
      home: [{ personId: 10, name: 'Home Starter' }],
      away: [{ personId: 20, name: 'Away Starter' }]
    };

    const result = calculateBoxScore([], 101, 102, initialPlayers);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.home.playerStats[10]).toBeDefined();
      expect(result.home.playerStats[10].playerName).toBe('Home Starter');
      expect(result.away.playerStats[20]).toBeDefined();
      expect(result.away.playerStats[20].playerName).toBe('Away Starter');
      expect(result.home.points).toBe(0);
    }
  });

  it('handles free throws and team rebounds', () => {
    const actions: any[] = [
      {
        actionNumber: 1,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: 'freethrow',
        shotResult: 'Made',
        personId: 1,
        playerName: 'Player 1',
      },
      {
        actionNumber: 2,
        teamId: 101,
        teamTriplet: 'AAA',
        actionType: 'rebound',
        subType: 'offensive',
        personId: 0, // Team rebound
      },
      {
        actionNumber: 3,
        teamId: 102,
        teamTriplet: 'BBB',
        actionType: 'foul',
        personId: 3,
        playerName: 'Player 3',
      }
    ];

    const result = calculateBoxScore(actions as PlayByPlayV3Action[], 101, 102);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.home.ftm).toBe(1);
      expect(result.home.fta).toBe(1);
      expect(result.home.points).toBe(1);
      expect(result.home.oreb).toBe(1); // Team oreb
      expect(result.away.pf).toBe(1);
      expect(result.away.playerStats[3].pf).toBe(1);
    }
  });

  it('preserves order from initialPlayers', () => {
    const initialPlayers = {
      home: [
        { personId: 11, name: 'Starter 1', order: 0 },
        { personId: 12, name: 'Starter 2', order: 1 }
      ],
      away: []
    };

    const result = calculateBoxScore([], 101, 102, initialPlayers);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.home.playerStats[11].order).toBe(0);
      expect(result.home.playerStats[12].order).toBe(1);
    }
  });
});
