import { useState, useEffect, useRef } from 'react';
import { PlayByPlayV3Action, getPlayByPlayV3, getBoxScoreV3 } from '@nba-stats-rewind/nba-api-client';

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
  const [actions, setActions] = useState<PlayByPlayV3Action[]>(initialActions || []);
  const [boxScore, setBoxScore] = useState<any>(initialBoxScore || null);
  const [isLive, setIsLive] = useState(enabled);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(!initialActions || initialActions.length === 0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync isLive with enabled prop, but only if we have data or are loading
  useEffect(() => {
    if (enabled) setIsLive(true);
  }, [enabled]);

  const fetchData = async () => {
    try {
      const [actionsData, boxscoreData] = await Promise.all([
        getPlayByPlayV3(gameId),
        getBoxScoreV3(gameId),
      ]);
      
      setActions(actionsData);
      setBoxScore(boxscoreData);
      setLastUpdated(new Date());

      // If game is no longer live, stop polling
      // Assuming gameStatus 3 is Final
      if (boxscoreData?.gameStatus === 3) {
        setIsLive(false);
      }
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch if no data provided
  useEffect(() => {
    if (!initialActions || initialActions.length === 0) {
      fetchData();
    }
  }, [gameId]); // Only run on mount or gameId change

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
    isLoading,
    refresh: fetchData,
  };
}
