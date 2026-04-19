'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for the usePlayback hook.
 */
export interface UsePlaybackOptions {
  /** Upper bound for currentTime. Playback clamps here. */
  maxTime: number;
  /** Initial playback speed multiplier. Defaults to 1. */
  initialSpeed?: number;
  /**
   * When true, reaching maxTime does not pause playback; currentTime stays
   * clamped to maxTime and resumes advancing once maxTime grows (e.g. new
   * live actions arrive). Defaults to false.
   */
  isLive?: boolean;
}

/**
 * Drives a 100ms timer that advances currentTime up to maxTime, with
 * optional live-follow behavior. When isLive is true, playback parks at
 * maxTime instead of pausing, and resumes automatically when maxTime grows.
 * The user can still pause manually via togglePlay / setIsPlaying(false).
 *
 * While isLive is true, seeking and manual pause behave normally;
 * setIsPlaying(true) while parked at the live edge is a no-op until maxTime
 * grows. The park logic assumes maxTime is monotonically non-decreasing
 * while isLive is true (NBA game duration only grows).
 *
 * @returns An object containing:
 *  - `isPlaying`, `currentTime`, `playbackSpeed`: current playback state
 *  - `setIsPlaying`, `setPlaybackSpeed`: direct state setters
 *  - `togglePlay`, `seek`: user-facing controls
 */
export function usePlayback({ maxTime, initialSpeed = 1, isLive = false }: UsePlaybackOptions) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(initialSpeed);
  
  const lastUpdateTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const update = useCallback(() => {
    const now = performance.now();
    if (lastUpdateTimeRef.current !== null) {
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
      setCurrentTime((prevTime) => {
        if (isLive && prevTime >= maxTime) {
          // Already parked at the live edge; wait for maxTime (derived from
          // totalDuration in RewindViewer, which grows as useLiveGame appends
          // new actions) to extend before advancing again.
          return prevTime;
        }
        const nextTime = prevTime + deltaTime * playbackSpeed;
        if (nextTime >= maxTime) {
          // During live playback, stay at the live edge so the UI resumes
          // advancing automatically once new actions extend maxTime.
          if (!isLive) {
            setIsPlaying(false);
          }
          return maxTime;
        }
        return nextTime;
      });
    }
    // Advance lastUpdateTimeRef unconditionally, including on parked ticks,
    // so the next non-parked tick sees a single-interval deltaTime rather
    // than the full parked duration.
    lastUpdateTimeRef.current = now;
    // Depending on isLive here causes the interval below to be torn down and
    // restarted on every isLive transition, which discards up to ~100ms of
    // wall-clock advance. That drift is imperceptible to users and simpler
    // than smuggling isLive through a ref just to keep the interval stable.
  }, [playbackSpeed, maxTime, isLive]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = performance.now();
      timerRef.current = setInterval(update, 100); // Update every 100ms
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      lastUpdateTimeRef.current = null;
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, update]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  
  // Seeking during live playback re-enters catch-up mode: currentTime will
  // advance from the seek target until it rejoins maxTime and parks again.
  const seek = (time: number) => {
    setCurrentTime(Math.min(Math.max(0, time), maxTime));
  };

  return {
    isPlaying,
    currentTime,
    playbackSpeed,
    setIsPlaying,
    setPlaybackSpeed,
    togglePlay,
    seek,
  };
}
