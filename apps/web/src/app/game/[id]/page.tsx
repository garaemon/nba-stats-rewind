import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';
import Link from 'next/link';
import { RewindViewer } from '@/components/RewindViewer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameRewindPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const gameId = params.id;

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

        <RewindViewer 
          gameId={gameId} 
          actions={[] as PlayByPlayV3Action[]} 
          initialData={null} 
          isLiveInitial={true}
        />
      </div>
    </main>
  );
}