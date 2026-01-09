'use client';

interface PlaybackControlsProps {
  isPlaying: boolean;
  togglePlay: () => void;
  currentTime: number;
  totalDuration: number;
  seek: (time: number) => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  isLive: boolean;
}

/**
 * PlaybackControls Component
 *
 * Handles the media playback interface for the game viewer.
 * Responsibilities:
 * - Play/Pause toggling
 * - Seeking forward/backward (15s skip)
 * - Seeking via timeline slider
 * - Adjusting playback speed
 * - Displaying current time and total duration
 * - Syncing to live edge
 */
export function PlaybackControls({
  isPlaying,
  togglePlay,
  currentTime,
  totalDuration,
  seek,
  playbackSpeed,
  setPlaybackSpeed,
  isLive,
}: PlaybackControlsProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => seek(currentTime - 15)}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all active:scale-95"
          aria-label="Rewind 15 seconds"
        >
          <SkipIcon isRewind />
        </button>

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

        <button
          onClick={() => seek(currentTime + 15)}
          className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-all active:scale-95"
          aria-label="Skip forward 15 seconds"
        >
          <SkipIcon />
        </button>
      </div>

      <div className="flex-1 w-full space-y-2">
        <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-tighter">
          <span data-testid="current-time-offset">{Math.floor(currentTime / 60)}m elapsed</span>
          <div className="flex items-center gap-2">
            {isLive && currentTime < totalDuration - 5 && (
              <button
                onClick={() => seek(totalDuration)}
                className="px-2 py-1 bg-red-600 text-white rounded text-[10px] animate-pulse hover:bg-red-700 transition-colors"
              >
                SYNC TO LIVE
              </button>
            )}
            <span data-testid="total-duration">{Math.floor(totalDuration / 60)}m total</span>
          </div>
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
  );
}

function SkipIcon({ isRewind, className }: { isRewind?: boolean; className?: string }) {
  const arrowPath = (
    <path d="m12 5l1.104-1.545c.41-.576.617-.864.487-1.13c-.13-.268-.46-.283-1.12-.314Q12.237 2 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10a9.99 9.99 0 0 0-4-8"/>
  );

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {isRewind ? (
        <g transform="translate(24, 0) scale(-1, 1)">
          {arrowPath}
        </g>
      ) : (
        arrowPath
      )}
      <path d="M8 11c.528-.42 1.008-1.113 1.308-.984c.3.128.204.552.204 1.212v4.776"/>
      <path d="M16 10h-2.64a.5.5 0 0 0-.49.402l-.366 2.102c.636-.264.957-.361 1.673-.361c1.036 0 1.927.637 1.825 1.957c.018 1.56-1.242 1.92-1.825 1.9c-.584-.02-1.517.2-1.677-1"/>
    </svg>
  );
}
