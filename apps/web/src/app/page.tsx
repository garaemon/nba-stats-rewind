import { getScoreboard, GameSummary } from '@nba-stats-rewind/nba-api-client';

export default async function Home() {
  // テスト用に特定の日付を指定（最新の試合がない可能性があるため）
  const date = '01/01/2024';
  let games: GameSummary[] = [];
  
  try {
    games = await getScoreboard(date);
  } catch (error) {
    console.error('Failed to fetch games:', error);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">NBA Stats Rewind</h1>
        
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-700">Games on {date}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {games.length > 0 ? (
            games.map((game) => (
              <div 
                key={game.gameId} 
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-500">{game.gameStatusText}</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">{game.visitorTeamName}</span>
                    <span className="text-2xl font-bold text-gray-900">{game.visitorScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">{game.homeTeamName}</span>
                    <span className="text-2xl font-bold text-gray-900">{game.homeScore}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No games found for this date.</p>
          )}
        </div>
      </div>
    </main>
  );
}