import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLiveGame } from './useLiveGame';
import * as api from '@nba-stats-rewind/nba-api-client';

vi.mock('@nba-stats-rewind/nba-api-client', async () => {
  const actual = await vi.importActual('@nba-stats-rewind/nba-api-client');
  return {
    ...actual,
    getPlayByPlayV3: vi.fn(),
    getBoxScoreV3: vi.fn(),
  };
});

describe('useLiveGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with initial data', () => {
    const initialActions = [{ actionNumber: 1 }] as any;
    const initialBoxScore = { gameId: '123' };
    
    const { result } = renderHook(() => useLiveGame({
      gameId: '123',
      initialActions,
      initialBoxScore,
      enabled: false
    }));

    expect(result.current.actions).toEqual(initialActions);
    expect(result.current.boxScore).toEqual(initialBoxScore);
    expect(result.current.isLive).toBe(false);
  });

  it('should fetch data periodically when enabled', async () => {
    const initialActions = [] as any;
    const initialBoxScore = { gameId: '123', gameStatus: 2 };
    const mockActions = [{ actionNumber: 1 }];
    const mockBoxScore = { gameId: '123', gameStatus: 2 };

    vi.mocked(api.getPlayByPlayV3).mockResolvedValue(mockActions as any);
    vi.mocked(api.getBoxScoreV3).mockResolvedValue(mockBoxScore as any);

    renderHook(() => useLiveGame({
      gameId: '123',
      initialActions,
      initialBoxScore,
      enabled: true,
      interval: 1000
    }));

    // Advance time to trigger polling
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(api.getPlayByPlayV3).toHaveBeenCalledWith('123');
    expect(api.getBoxScoreV3).toHaveBeenCalledWith('123');
  });

  it('should stop polling when game status becomes Final (3)', async () => {
    const initialActions = [] as any;
    const initialBoxScore = { gameId: '123', gameStatus: 2 };
    const mockBoxScore = { gameId: '123', gameStatus: 3 }; // Final

    vi.mocked(api.getPlayByPlayV3).mockResolvedValue([] as any);
    vi.mocked(api.getBoxScoreV3).mockResolvedValue(mockBoxScore as any);

    const { result } = renderHook(() => useLiveGame({
      gameId: '123',
      initialActions,
      initialBoxScore,
      enabled: true,
      interval: 1000
    }));

    expect(result.current.isLive).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.isLive).toBe(false);
  });
});
