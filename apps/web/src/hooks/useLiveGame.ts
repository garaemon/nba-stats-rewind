import { useState, useEffect, useRef } from 'react';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';

interface UseLiveGameProps {
  gameId: string;
  initialActions: PlayByPlayV3Action[];
  initialBoxScore: any;
  enabled: boolean;
  interval?: number;
}

export function useLiveGame({
  gameId,
  initialActions,
  initialBoxScore,
  enabled,
  interval = 30000, // Default 30 seconds
}: UseLiveGameProps) {
  const [actions, setActions] = useState<PlayByPlayV3Action[]>(initialActions);
  const [boxScore, setBoxScore] = useState<any>(initialBoxScore);
  const [isLive, setIsLive] = useState(enabled);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync isLive with enabled prop
  useEffect(() => {
    setIsLive(enabled);
  }, [enabled]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/game/${gameId}`);
      if (!response.ok) {throw new Error('Failed to fetch');}
      const data = await response.json();
      
      setActions(data.actions);
      setBoxScore(data.boxscore);
      setLastUpdated(new Date());

      // If game is no longer live, stop polling
      // Assuming gameStatus 3 is Final
      if (data.boxscore?.gameStatus === 3) {
        setIsLive(false);
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  };

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(fetchData, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, interval, gameId]);

  return {
    actions,
    boxScore,
    isLive,
    lastUpdated,
    refresh: fetchData,
  };
}
