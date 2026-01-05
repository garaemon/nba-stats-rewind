import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLiveGame } from './useLiveGame';

describe('useLiveGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
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

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ actions: mockActions, boxscore: mockBoxScore }),
    });

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

    expect(global.fetch).toHaveBeenCalledWith('/api/game/123');
  });

  it('should stop polling when game status becomes Final (3)', async () => {
    const initialActions = [] as any;
    const initialBoxScore = { gameId: '123', gameStatus: 2 };
    const mockBoxScore = { gameId: '123', gameStatus: 3 }; // Final

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ actions: [], boxscore: mockBoxScore }),
    });

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
