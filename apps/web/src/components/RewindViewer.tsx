'use client';

import { useMemo, useState } from 'react';
import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';
import { clockToSeconds, getGameTimeSeconds, formatGameTime, formatClock, formatActualTime, parseActualTime } from '@/utils/format';
import { usePlayback } from '@/hooks/usePlayback';
import { calculateBoxScore, TeamStats, PlayerStats } from '@/utils/boxScore';
import { useLiveGame } from '@/hooks/useLiveGame';
import { MomentumGraph } from './MomentumGraph';
import { PlaybackControls } from './PlaybackControls';

interface RewindViewerProps {
  gameId: string;
  actions: PlayByPlayV3Action[];
  initialData?: any;
  isLiveInitial?: boolean;
}

export function RewindViewer({ gameId, actions: initialActions, initialData, isLiveInitial = false }: RewindViewerProps) {
  const {
    actions,
    boxScore: gameDetails,
    isLive,
    lastUpdated,
  } = useLiveGame({
    gameId,
    initialActions,
    initialBoxScore: initialData,
    enabled: isLiveInitial,
  });

  // Process actions and calculate relative wall-clock time
  const { processedActions, startTime, totalDuration, homeTeamId, awayTeamId } = useMemo(() => {
    if (actions.length === 0) {
      return { processedActions: [], startTime: 0, totalDuration: 2880, homeTeamId: 0, awayTeamId: 0 };
    }

    const sorted = [...actions].sort((a, b) => {
      const timeA = getGameTimeSeconds(a.period, clockToSeconds(a.clock));
      const timeB = getGameTimeSeconds(b.period, clockToSeconds(b.clock));
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a.actionNumber - b.actionNumber;
    });
    const start = parseActualTime(sorted[0].timeActual);
    const end = parseActualTime(sorted[sorted.length - 1].timeActual);
    
    // Use gameDetails if available, otherwise fallback to inference
    let hId = gameDetails?.homeTeam?.teamId || 0;
    let aId = gameDetails?.awayTeam?.teamId || 0;

    if (!hId || !aId) {
      for (const action of sorted) {
        if (action.scoreHome !== "0" || action.scoreAway !== "0") {
          const teamIds = Array.from(new Set(sorted.filter(a => a.teamId !== 0).map(a => a.teamId)));
          if (teamIds.length >= 2) {
            aId = teamIds[0];
            hId = teamIds[1];
          }
          break;
        }
      }
    }

    const processed = sorted.map((action) => ({
      ...action,
      gameTimeSeconds: getGameTimeSeconds(action.period, clockToSeconds(action.clock)),
      wallTimeOffset: (parseActualTime(action.timeActual) - start) / 1000, // Seconds from start
    }));

    return {
      processedActions: processed,
      startTime: start,
      totalDuration: (end - start) / 1000,
      homeTeamId: hId,
      awayTeamId: aId,
    };
  }, [actions, gameDetails]);

  const {
    isPlaying,
    currentTime, // Seconds from start (wall-clock)
    playbackSpeed,
    togglePlay,
    seek,
    setPlaybackSpeed,
  } = usePlayback({ maxTime: totalDuration });

  const [activeTab, setActiveTab] = useState<'pbp' | 'boxscore' | 'comparison'>('boxscore');

  const visibleActions = useMemo(() => {
    return processedActions.filter((action) => action.wallTimeOffset <= currentTime);
  }, [processedActions, currentTime]);

  const boxScore = useMemo(() => {
    const initialPlayers = gameDetails ? {
      home: gameDetails.homeTeam.players.map((p: any, i: number) => ({ personId: p.personId, name: p.name, order: i, position: p.position })),
      away: gameDetails.awayTeam.players.map((p: any, i: number) => ({ personId: p.personId, name: p.name, order: i, position: p.position })),
    } : undefined;
    return calculateBoxScore(visibleActions, homeTeamId, awayTeamId, initialPlayers);
  }, [visibleActions, homeTeamId, awayTeamId, gameDetails]);

  // Find the latest game clock to display
  const currentGameClock = useMemo(() => {
    const latest = visibleActions[visibleActions.length - 1];
    if (!latest) {
      return "Pre-game";
    }
    return formatGameTime(latest.gameTimeSeconds);
  }, [visibleActions]);

  const currentActualTime = startTime + currentTime * 1000;

  return (
    <div className="space-y-6">
      {/* Live Status Indicator */}
      {isLive && (
        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-600 rounded-full w-fit text-xs font-black animate-pulse">
          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
          LIVE UPDATING
          {lastUpdated && <span className="text-red-400 font-medium ml-1">Last: {lastUpdated.toLocaleTimeString()}</span>}
        </div>
      )}

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

          <div className="bg-slate-900 p-4 rounded-xl flex flex-col items-center justify-center text-center">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Score</span>
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                  {gameDetails?.awayTeam?.teamTricode || 'AWAY'}
                </span>
                <span className="text-2xl font-black text-white">
                  {visibleActions[visibleActions.length - 1]?.scoreAway || 0}
                </span>
              </div>
              <span className="text-slate-600 font-black">-</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">
                  {gameDetails?.homeTeam?.teamTricode || 'HOME'}
                </span>
                <span className="text-2xl font-black text-white">
                  {visibleActions[visibleActions.length - 1]?.scoreHome || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <MomentumGraph 
            actions={processedActions} 
            totalDuration={totalDuration} 
            currentTime={currentTime} 
            onSeek={seek} 
          />

          <PlaybackControls
            isPlaying={isPlaying}
            togglePlay={togglePlay}
            currentTime={currentTime}
            totalDuration={totalDuration}
            seek={seek}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            isLive={isLive}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('boxscore')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'boxscore' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Box Score
        </button>
        <button
          onClick={() => setActiveTab('pbp')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'pbp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Play-by-Play
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'comparison' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Team Comparison
        </button>
      </div>

      {activeTab === 'pbp' ? (
        /* Play-by-Play Table */
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score (A-H)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleActions.length > 0 ? (
                  [...visibleActions].reverse().map((action) => (
                    <tr key={action.actionNumber} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{action.period}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{formatClock(action.clock)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {action.scoreAway} - {action.scoreHome}
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
      ) : activeTab === 'boxscore' ? (
        /* Box Score View */
        <div className="space-y-8">
          {boxScore ? (
            <>
              <BoxScoreSection 
                title={gameDetails?.awayTeam ? `${gameDetails.awayTeam.teamCity} ${gameDetails.awayTeam.teamName}` : `AWAY: ${boxScore.away.teamTriplet}`} 
                stats={boxScore.away} 
              />
              <BoxScoreSection 
                title={gameDetails?.homeTeam ? `${gameDetails.homeTeam.teamCity} ${gameDetails.homeTeam.teamName}` : `HOME: ${boxScore.home.teamTriplet}`} 
                stats={boxScore.home} 
              />
            </>
          ) : (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 font-medium">
              No stats available yet.
            </div>
          )}
        </div>
      ) : (
        /* Team Comparison View */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-800">Team Comparison</h2>
          </div>
          <div className="p-6">
            {boxScore ? (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center items-center font-bold text-sm text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">
                  <span>{gameDetails?.awayTeam?.teamTricode || 'AWAY'}</span>
                  <span className="text-[10px]">Stat</span>
                  <span>{gameDetails?.homeTeam?.teamTricode || 'HOME'}</span>
                </div>
                
                <ComparisonRow label="Points" away={boxScore.away.points} home={boxScore.home.points} />
                <ComparisonRow 
                  label="Field Goal %" 
                  away={boxScore.away.fga > 0 ? (boxScore.away.fgm / boxScore.away.fga * 100).toFixed(1) : '0.0'} 
                  home={boxScore.home.fga > 0 ? (boxScore.home.fgm / boxScore.home.fga * 100).toFixed(1) : '0.0'} 
                  suffix="%"
                />
                <ComparisonRow 
                  label="3-Point %" 
                  away={boxScore.away.fg3a > 0 ? (boxScore.away.fg3m / boxScore.away.fg3a * 100).toFixed(1) : '0.0'} 
                  home={boxScore.home.fg3a > 0 ? (boxScore.home.fg3m / boxScore.home.fg3a * 100).toFixed(1) : '0.0'} 
                  suffix="%"
                />
                <ComparisonRow label="Rebounds" away={boxScore.away.reb} home={boxScore.home.reb} />
                <ComparisonRow label="Assists" away={boxScore.away.ast} home={boxScore.home.ast} />
                <ComparisonRow label="Steals" away={boxScore.away.stl} home={boxScore.home.stl} />
                <ComparisonRow label="Blocks" away={boxScore.away.blk} home={boxScore.home.blk} />
                <ComparisonRow label="Turnovers" away={boxScore.away.tov} home={boxScore.home.tov} invert />
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-medium">No stats available yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonRow({ label, away, home, suffix = '', invert = false }: { label: string; away: string | number; home: string | number; suffix?: string; invert?: boolean }) {
  const awayNum = parseFloat(away.toString());
  const homeNum = parseFloat(home.toString());
  
  const awayIsLeading = invert ? awayNum < homeNum : awayNum > homeNum;
  const homeIsLeading = invert ? homeNum < awayNum : homeNum > awayNum;

  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <div className={`text-right text-xl font-black ${awayIsLeading ? 'text-slate-900' : 'text-slate-300'}`}>
        {away}{suffix}
      </div>
      <div className="text-center">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</div>
        <div className="flex h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${awayIsLeading ? 'bg-blue-600' : 'bg-slate-300'}`} 
            style={{ width: `${(awayNum / (awayNum + homeNum || 1)) * 100}%` }}
          />
          <div 
            className={`h-full transition-all duration-500 ${homeIsLeading ? 'bg-blue-600' : 'bg-slate-300'}`} 
            style={{ width: `${(homeNum / (awayNum + homeNum || 1)) * 100}%` }}
          />
        </div>
      </div>
      <div className={`text-left text-xl font-black ${homeIsLeading ? 'text-slate-900' : 'text-slate-300'}`}>
        {home}{suffix}
      </div>
    </div>
  );
}

function BoxScoreSection({ title, stats }: { title: string; stats: TeamStats }) {
  const players = Object.values(stats.playerStats).sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return b.points - a.points;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50">Player</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">PTS</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">REB</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">AST</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">STL</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">BLK</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">TO</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">FG%</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">3P%</th>
              <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">FT%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {players.map((player) => (
              <tr key={player.personId} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-bold text-slate-900 sticky left-0 bg-white group-hover:bg-slate-50">{player.playerName}</td>
                <td className="px-4 py-3 text-sm font-black text-slate-900 text-right">{player.points}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">{player.reb}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">{player.ast}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">{player.stl}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">{player.blk}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">{player.tov}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">
                  <div className="font-bold">{player.fga > 0 ? ((player.fgm / player.fga) * 100).toFixed(1) : '0.0'}%</div>
                  <div className="text-[10px] text-slate-400">{player.fgm}-{player.fga}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">
                  <div className="font-bold">{player.fg3a > 0 ? ((player.fg3m / player.fg3a) * 100).toFixed(1) : '0.0'}%</div>
                  <div className="text-[10px] text-slate-400">{player.fg3m}-{player.fg3a}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-600 text-right">
                  <div className="font-bold">{player.fta > 0 ? ((player.ftm / player.fta) * 100).toFixed(1) : '0.0'}%</div>
                  <div className="text-[10px] text-slate-400">{player.ftm}-{player.fta}</div>
                </td>
              </tr>
            ))}
            {/* Team Totals */}
            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
              <td className="px-4 py-3 text-sm text-slate-900 sticky left-0 bg-slate-50">TOTALS</td>
              <td className="px-4 py-3 text-sm font-black text-slate-900 text-right">{stats.points}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">{stats.reb}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">{stats.ast}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">{stats.stl}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">{stats.blk}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">{stats.tov}</td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">
                <div>{stats.fga > 0 ? ((stats.fgm / stats.fga) * 100).toFixed(1) : '0.0'}%</div>
                <div className="text-[10px] text-slate-500 font-normal">{stats.fgm}-{stats.fga}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">
                <div>{stats.fg3a > 0 ? ((stats.fg3m / stats.fg3a) * 100).toFixed(1) : '0.0'}%</div>
                <div className="text-[10px] text-slate-500 font-normal">{stats.fg3m}-{stats.fg3a}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-900 text-right">
                <div>{stats.fta > 0 ? ((stats.ftm / stats.fta) * 100).toFixed(1) : '0.0'}%</div>
                <div className="text-[10px] text-slate-500 font-normal">{stats.ftm}-{stats.fta}</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

