import { getScoreboard, GameSummary } from '@nba-stats-rewind/nba-api-client';
import { GameCard } from '@/components/GameCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home(props: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await props.searchParams;
  const dateParam = params.date;
  
  // Default to 2026-01-04 if no param
  const defaultDate = '2026-01-04';
  const selectedDateStr = dateParam || defaultDate;
  
  // Parse date manually to avoid timezone issues (YYYY-MM-DD)
  const parts = selectedDateStr.split('-');
  let year = 2026, month = 1, day = 4;
  
  if (parts.length === 3) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }

  // Current date object (using local time for calendar consistency)
  const current = new Date(year, month - 1, day);
  
  // NBA API Format (MM/DD/YYYY)
  const apiDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  
  // Navigation dates
  const prev = new Date(year, month - 1, day - 1);
  const next = new Date(year, month - 1, day + 1);

  const formatDate = (d: Date) => 
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  let games: GameSummary[] = [];
  let errorMsg = '';

  try {
    games = await getScoreboard(apiDate);
  } catch (e) {
    console.error(e);
    errorMsg = 'Failed to load games. The API might be rate-limiting or down.';
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 text-slate-900">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <Link href="/">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2 hover:text-blue-600 transition-colors">
              NBA Stats Rewind
            </h1>
          </Link>
          <p className="text-slate-600 font-medium">Relive the action, play by play.</p>
        </header>
        
        <nav className="mb-8 flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 pb-6 gap-6">
          <div className="flex items-center gap-6">
            <Link 
              href={`/?date=${formatDate(prev)}`}
              className="p-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-full transition-all text-slate-600"
              prefetch={false}
              data-testid="prev-date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {current.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Data for: {apiDate}
              </p>
            </div>
            
            <Link 
              href={`/?date=${formatDate(next)}`}
              className="p-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-full transition-all text-slate-600"
              prefetch={false}
              data-testid="next-date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-xs font-black px-4 py-1.5 bg-slate-900 text-white rounded-full uppercase tracking-tighter">
               {games.length} Games Found
             </span>
             {dateParam && (
               <Link href="/" className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
                 Today
               </Link>
             )}
          </div>
        </nav>

        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.length > 0 ? (
            games.map((game) => (
              <GameCard key={game.gameId} game={game} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
              </div>
              <p className="text-slate-500 text-xl font-bold">No games scheduled</p>
              <p className="text-slate-400 text-sm mt-1">Check another date using the arrows above.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
