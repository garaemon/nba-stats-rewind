'use client';

import { useMemo } from 'react';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';
import { clockToSeconds, getGameTimeSeconds, formatGameTime, formatClock, formatActualTime, parseActualTime } from '@/utils/format';
import { usePlayback } from '@/hooks/usePlayback';

interface RewindViewerProps {
  actions: PlayByPlayV3Action[];
}

export function RewindViewer({ actions }: RewindViewerProps) {
  // Process actions and calculate relative wall-clock time
  const { processedActions, startTime, totalDuration } = useMemo(() => {
    if (actions.length === 0) return { processedActions: [], startTime: 0, totalDuration: 2880 };

    const sorted = [...actions].sort((a, b) => a.actionNumber - b.actionNumber);
    const start = parseActualTime(sorted[0].timeActual);
    const end = parseActualTime(sorted[sorted.length - 1].timeActual);
    
    const processed = sorted.map((action) => ({
      ...action,
      gameTimeSeconds: getGameTimeSeconds(action.period, clockToSeconds(action.clock)),
      wallTimeOffset: (parseActualTime(action.timeActual) - start) / 1000, // Seconds from start
    }));

    return {
      processedActions: processed,
      startTime: start,
      totalDuration: (end - start) / 1000,
    };
  }, [actions]);

  const {
    isPlaying,
    currentTime, // Seconds from start (wall-clock)
    playbackSpeed,
    togglePlay,
    seek,
    setPlaybackSpeed,
  } = usePlayback({ maxTime: totalDuration });

  const visibleActions = useMemo(() => {
    return processedActions.filter((action) => action.wallTimeOffset <= currentTime).reverse();
  }, [processedActions, currentTime]);

  // Find the latest game clock to display
  const currentGameClock = useMemo(() => {
    const latest = visibleActions[0];
    if (!latest) return "Pre-game";
    return formatGameTime(latest.gameTimeSeconds);
  }, [visibleActions]);

  const currentActualTime = startTime + currentTime * 1000;

  return (
    <div className="space-y-6">
      {/* Playback Controls & Status */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Game Clock</span>
            <span className="text-2xl font-black text-slate-900" data-testid="current-game-clock">
              {currentGameClock}
            </span>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Actual Time</span>
            <span className="text-2xl font-black text-blue-900" data-testid="current-actual-time">
              {formatActualTime(currentActualTime)}
            </span>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Status</span>
            <span className="text-xl font-bold text-white uppercase">
              {isPlaying ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Rewinding {playbackSpeed}x
                </span>
              ) : "Paused"}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          <button
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
            )}
          </button>

          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-tighter">
              <span data-testid="current-time-offset">{Math.floor(currentTime / 60)}m elapsed</span>
              <span data-testid="total-duration">{Math.floor(totalDuration / 60)}m total</span>
            </div>
            <input
              type="range"
              min="0"
              max={totalDuration}
              step="1"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              data-testid="seek-slider"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-500 uppercase">Speed</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className="bg-slate-100 border-none text-sm font-bold rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {[1, 2, 4, 10, 20, 50, 100].map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Play-by-Play Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Play-by-Play</h2>
          <span className="text-xs font-black px-3 py-1 bg-slate-900 text-white rounded-full uppercase">
            {visibleActions.length} / {processedActions.length} Events
          </span>
        </div>
        
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score (H-A)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleActions.length > 0 ? (
                visibleActions.map((action) => (
                  <tr key={action.actionNumber} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{action.period}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatClock(action.clock)}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      {action.scoreHome} - {action.scoreAway}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="font-medium text-slate-800">{action.description}</div>
                      {action.playerName && (
                        <div className="text-xs text-slate-500 mt-1">{action.playerName} ({action.teamTriplet})</div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center text-slate-500 font-medium">
                    {currentTime === 0 ? "Press play to start the game!" : "No events to display yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
