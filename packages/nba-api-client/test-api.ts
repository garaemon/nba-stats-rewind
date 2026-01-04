import { getScoreboard } from './src/index';

async function test() {
  try {
    const games = await getScoreboard('01/01/2024');
    console.log('Scoreboard data received!');
    if (games.length > 0) {
      console.log('First game sample:');
      console.log('Home:', games[0].homeTeamName, 'Score:', games[0].homeScore);
      console.log('Visitor:', games[0].visitorTeamName, 'Score:', games[0].visitorScore);
      console.log('Status:', games[0].gameStatusText);
    }
  } catch (error) {
    console.error('Error fetching scoreboard:', error);
  }
}

test();