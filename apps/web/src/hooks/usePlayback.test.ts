import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePlayback } from './usePlayback';

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 100 }));
    
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.playbackSpeed).toBe(1);
  });

  it('should toggle play/pause', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 100 }));
    
    act(() => {
      result.current.togglePlay();
    });
    expect(result.current.isPlaying).toBe(true);
    
    act(() => {
      result.current.togglePlay();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('should update currentTime when playing', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 100 }));
    
    act(() => {
      result.current.togglePlay();
    });

    // Manually trigger requestAnimationFrame
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Since we use requestAnimationFrame, we need to mock it or rely on how vitest handles it.
    // Vitest's fake timers handle requestAnimationFrame.
    
    expect(result.current.currentTime).toBeGreaterThan(0);
  });

  it('should seek to a specific time', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 100 }));
    
    act(() => {
      result.current.seek(50);
    });
    
    expect(result.current.currentTime).toBe(50);
  });

  it('should respect playback speed', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 100, initialSpeed: 2 }));
    
    act(() => {
      result.current.togglePlay();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // At 2x speed, after 1s, currentTime should be around 2
    expect(result.current.currentTime).toBeCloseTo(2, 1);
  });

  // Non-live regression guard: reaching maxTime must pause playback when
  // isLive is false, even with all the live-edge logic around it.
  it('should stop at maxTime', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 10 }));

    act(() => {
      result.current.seek(9.5);
      result.current.setIsPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).toBe(10);
    expect(result.current.isPlaying).toBe(false);
  });

  it('should stay playing at maxTime when isLive is true', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 10, isLive: true }));

    act(() => {
      result.current.seek(9.5);
      result.current.setIsPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).toBe(10);
    expect(result.current.isPlaying).toBe(true);
  });

  it('should resume advancing when maxTime grows during live follow', () => {
    const { result, rerender } = renderHook(
      ({ maxTime, isLive }) => usePlayback({ maxTime, isLive }),
      { initialProps: { maxTime: 10, isLive: true } },
    );

    act(() => {
      result.current.seek(9.5);
      result.current.setIsPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).toBe(10);

    rerender({ maxTime: 20, isLive: true });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.currentTime).toBeCloseTo(11, 1);
    expect(result.current.isPlaying).toBe(true);
  });

  it('should pause when user pauses at the live edge', () => {
    const { result } = renderHook(() => usePlayback({ maxTime: 10, isLive: true }));

    act(() => {
      result.current.seek(9.5);
      result.current.setIsPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.currentTime).toBe(10);
    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.setIsPlaying(false);
    });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(10);
  });

  it('should pause at maxTime when live ends', () => {
    const { result, rerender } = renderHook(
      ({ maxTime, isLive }) => usePlayback({ maxTime, isLive }),
      { initialProps: { maxTime: 10, isLive: true } },
    );

    act(() => {
      result.current.seek(9.5);
      result.current.setIsPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.isPlaying).toBe(true);

    rerender({ maxTime: 10, isLive: false });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isPlaying).toBe(false);
  });
});
