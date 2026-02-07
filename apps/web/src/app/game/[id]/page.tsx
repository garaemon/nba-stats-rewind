import { getPlayByPlayV3, getBoxScoreV3, PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';
import Link from 'next/link';
import Image from 'next/image';
import { RewindViewer } from '@/components/RewindViewer';
import { formatDate } from '@/utils/format';
import { getTeamLogoUrl } from '@/utils/team';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameRewindPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const gameId = params.id;

  let actions: PlayByPlayV3Action[] = [];
  let gameDetails: any = null;
  let errorMsg = '';

  try {
    const [actionsData, boxscoreData] = await Promise.all([
      getPlayByPlayV3(gameId),
      getBoxScoreV3(gameId),
    ]);
    actions = actionsData;
    gameDetails = boxscoreData;
  } catch (e) {
    console.error('Game data fetch error:', e);
    const cause = (e as any)?.cause;
    const causeMsg = cause ? ` (Cause: ${cause.message || cause})` : '';
    errorMsg = `Failed to load game data: ${e instanceof Error ? e.message : 'Unknown error'}${causeMsg}. The API might be rate-limiting or down.`;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2 mb-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              Back to Scoreboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-4 flex-wrap">
              {gameDetails ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 relative flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(gameDetails.awayTeam.teamId)}
                        alt={`${gameDetails.awayTeam.teamName} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span>{gameDetails.awayTeam.teamName}</span>
                  </div>
                  <span className="text-slate-400">vs</span>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 relative flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(gameDetails.homeTeam.teamId)}
                        alt={`${gameDetails.homeTeam.teamName} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span>{gameDetails.homeTeam.teamName}</span>
                  </div>
                </>
              ) : (
                <span>Game Rewind</span>
              )}
              {gameDetails?.gameEt && (
                <span className="text-lg text-slate-500 font-bold ml-2">
                  {formatDate(gameDetails.gameEt)}
                </span>
              )}
              <span className="text-sm font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded ml-2">
                ID: {gameId}
              </span>
            </h1>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <RewindViewer
          gameId={gameId}
          actions={actions}
          initialData={gameDetails}
          isLiveInitial={gameDetails?.gameStatus === 2}
        />
      </div>
    </main>
  );
}