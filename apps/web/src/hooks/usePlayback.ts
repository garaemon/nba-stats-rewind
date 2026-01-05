'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface UsePlaybackOptions {
  maxTime: number;
  initialSpeed?: number;
}

export function usePlayback({ maxTime, initialSpeed = 1 }: UsePlaybackOptions) {
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
        const nextTime = prevTime + deltaTime * playbackSpeed;
        if (nextTime >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return nextTime;
      });
    }
    lastUpdateTimeRef.current = now;
  }, [playbackSpeed, maxTime]);

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
