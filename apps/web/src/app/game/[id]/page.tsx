import { getPlayByPlayV3, PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';
import Link from 'next/link';
import { RewindViewer } from '@/components/RewindViewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameRewindPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const gameId = params.id;
  
  let actions: PlayByPlayV3Action[] = [];
  let errorMsg = '';

  try {
    actions = await getPlayByPlayV3(gameId);
  } catch (e) {
    console.error(e);
    errorMsg = 'Failed to load play-by-play data. The API might be rate-limiting or down.';
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-2 mb-2 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Scoreboard
            </Link>
            <h1 className="text-3xl font-black text-slate-900">
              Game Rewind
              <span className="ml-3 text-sm font-medium text-slate-500 bg-slate-200 px-2 py-1 rounded">
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

        <RewindViewer actions={actions} />
      </div>
    </main>
  );
}