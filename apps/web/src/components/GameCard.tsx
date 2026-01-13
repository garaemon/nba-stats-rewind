'use client';

import { useState } from 'react';
import { GameSummary } from '@nba-stats-rewind/nba-api-client';
import Link from 'next/link';

export function GameCard({ game }: { game: GameSummary }) {
  const [showScore, setShowScore] = useState(false);

  return (
    <Link 
      href={`/game/${game.gameId}`}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-slate-200 cursor-pointer block"
      data-testid="game-card"
    >
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            game.gameStatusText.toLowerCase().includes('final') 
              ? 'bg-slate-300' 
              : (game.gameStatusText.toLowerCase().includes('et') || game.gameStatusText.toLowerCase().includes('pm') || game.gameStatusText.toLowerCase().includes('am'))
                ? 'bg-blue-500'
                : 'bg-green-500 animate-pulse'
          }`}></div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {game.gameStatusText}
          </span>
        </div>
        {showScore && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">
            Visible
          </span>
        )}
      </div>
      
      <div className="p-6 space-y-4">
        {game.arenaName && (
          <div className="text-xs text-slate-400 text-right -mt-2 mb-2 font-medium">
            @ {game.arenaName}{game.arenaCity ? `, ${game.arenaCity}` : ''}{game.arenaState ? `, ${game.arenaState}` : ''}
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-slate-700">{game.visitorTeamName}</span>
          <span 
            className={`text-2xl font-black transition-all duration-300 ${showScore ? 'text-slate-900 blur-none' : 'text-slate-100 blur-md select-none'}`}
            data-testid="visitor-score"
          >
            {game.visitorScore}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-slate-700">{game.homeTeamName}</span>
          <span 
            className={`text-2xl font-black transition-all duration-300 ${showScore ? 'text-slate-900 blur-none' : 'text-slate-100 blur-md select-none'}`}
            data-testid="home-score"
          >
            {game.homeScore}
          </span>
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 text-center flex justify-between items-center">
        <button 
          className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowScore(!showScore);
          }}
        >
          {showScore ? 'Hide Score' : 'Show Score'}
        </button>
        <span className="text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          Rewind Game →
        </span>
      </div>
    </Link>
  );
}