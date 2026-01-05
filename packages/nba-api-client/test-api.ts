import { getScoreboard, getPlayByPlayV3 } from './src/index';

async function test() {
  try {
    const date = '01/01/2024';
    console.log(`Testing Scoreboard for ${date}...`);
    const games = await getScoreboard(date);
    console.log(`Scoreboard data received! Found ${games.length} games.`);
    
    if (games.length > 0) {
      const firstGame = games[0];
      console.log(`Testing Play-by-Play V3 for Game ID: ${firstGame.gameId} (${firstGame.visitorTeamName} @ ${firstGame.homeTeamName})...`);
      
      const actions = await getPlayByPlayV3(firstGame.gameId);
      console.log(`Play-by-Play V3 data received! Found ${actions.length} actions.`);
      
      if (actions.length > 0) {
        console.log('First action sample:');
        console.log(JSON.stringify(actions[0], null, 2));
      } else {
        console.log('No actions found for this game.');
      }
    }
  } catch (error) {
    console.error('Error during API test:', error);
  }
}

test();