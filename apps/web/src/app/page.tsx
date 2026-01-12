import { getScoreboard, GameSummary } from '@nba-stats-rewind/nba-api-client';
import { GameCard } from '@/components/GameCard';
import { TimezoneSelector } from '@/components/TimezoneSelector';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home(props: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await props.searchParams;
  const dateParam = params.date;
  
  // Default to Eastern Time (ET) - NBA Standard
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // YYYY-MM-DD format
    timeZone: "America/New_York",
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const defaultDate = formatter.format(now);
  
  const selectedDateStr = dateParam || defaultDate;
  
  // Parse date manually (YYYY-MM-DD)
  const parts = selectedDateStr.split('-');
  let year = now.getFullYear(), month = 1, day = 1;
  
  if (parts.length === 3) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  }

  // Display Date: Construct a UTC date at noon to avoid any timezone rollover issues when formatting
  const displayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // NBA API Format (MM/DD/YYYY) - derived strictly from the YYYY-MM-DD parts
  const apiDate = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  
  // Navigation dates
  const currentMs = Date.UTC(year, month - 1, day);
  const oneDay = 24 * 60 * 60 * 1000;
  const prevDate = new Date(currentMs - oneDay);
  const nextDate = new Date(currentMs + oneDay);

  const formatDate = (d: Date) => 
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

  let games: GameSummary[] = [];
  let errorDetail: any = null;

  try {
    games = await getScoreboard(apiDate);
  } catch (e: any) {
    console.error('Scoreboard fetch error:', e);
    const cause = e?.cause;
    
    let message = e instanceof Error ? e.message : 'Unknown error';
    // Check for AbortError or timeout related messages
    if (e?.name === 'AbortError' || message.includes('aborted') || message.includes('timeout')) {
      message = 'Connection timed out. The NBA API server is not responding (likely due to rate limiting or IP blocking).';
    }

    errorDetail = {
      message: message,
      name: e instanceof Error ? e.name : 'Error',
      stack: e instanceof Error ? e.stack : undefined,
      cause: cause ? (cause.message || JSON.stringify(cause)) : undefined,
      fullError: JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
    };
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
              href={`/?date=${formatDate(prevDate)}`}
              className="p-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-full transition-all text-slate-600"
              prefetch={false}
              data-testid="prev-date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </Link>
            
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {displayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Data for: {apiDate}
              </p>
            </div>
            
            <Link 
              href={`/?date=${formatDate(nextDate)}`}
              className="p-3 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-full transition-all text-slate-600"
              prefetch={false}
              data-testid="next-date"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <div>
              <TimezoneSelector />
            </div>
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

        {errorDetail && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm font-medium">
            <p className="font-bold mb-2">Failed to load games: {errorDetail.message}</p>
            {errorDetail.cause && <p className="mb-2">Cause: {errorDetail.cause}</p>}
            <p className="mb-2">The API might be rate-limiting or down.</p>
            
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider hover:underline">Show Technical Details</summary>
              <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                {errorDetail.stack || errorDetail.fullError}
              </pre>
            </details>
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

        <footer className="mt-16 py-8 text-center border-t border-slate-200">
          <a
            href="https://github.com/garaemon/nba-stats-rewind"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium inline-flex items-center gap-2"
          >
            {/* GitHub Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            View on GitHub
          </a>
        </footer>
      </div>
    </main>
  );
}