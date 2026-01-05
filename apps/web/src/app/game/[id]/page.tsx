import { getPlayByPlay, PlayByPlayEvent } from '@nba-stats-rewind/nba-api-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GameRewindPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const gameId = params.id;
  
  let events: PlayByPlayEvent[] = [];
  let errorMsg = '';

  try {
    events = await getPlayByPlay(gameId);
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Raw Play-by-Play</h2>
            <span className="text-xs font-black px-3 py-1 bg-slate-900 text-white rounded-full uppercase">
              {events.length} Events
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length > 0 ? (
                  events.map((event) => (
                    <tr key={event.eventnum} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{event.period}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{event.pctimestring}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{event.score || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        {event.homedescription && (
                          <div className="font-medium text-blue-700 mb-1">{event.homedescription}</div>
                        )}
                        {event.neutraldescription && (
                          <div className="italic text-slate-500 mb-1">{event.neutraldescription}</div>
                        )}
                        {event.visitordescription && (
                          <div className="font-medium text-red-700">{event.visitordescription}</div>
                        )}
                        {!event.homedescription && !event.neutraldescription && !event.visitordescription && (
                          <span className="text-slate-400 italic font-light">No description</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center text-slate-500">
                      No play-by-play data available for this game.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
