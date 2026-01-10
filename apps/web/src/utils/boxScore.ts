import { PlayByPlayV3Action } from '@nba-stats-rewind/nba-api-client';

export interface PlayerStats {
  personId: number;
  playerName: string;
  teamId: number;
  teamTriplet: string;
  points: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  reb: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  plusMinus: number;
}

export interface TeamStats {
  teamId: number;
  teamTriplet: string;
  points: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  fta: number;
  reb: number;
  oreb: number;
  dreb: number;
  ast: number;
  stl: number;
  blk: number;
  tov: number;
  pf: number;
  playerStats: Record<number, PlayerStats>;
}

export interface BoxScore {
  home: TeamStats;
  away: TeamStats;
}

export function calculateBoxScore(
  actions: PlayByPlayV3Action[],
  homeTeamId?: number,
  awayTeamId?: number,
  initialPlayers?: { home: any[]; away: any[] }
): BoxScore | null {
  const teamIds = Array.from(new Set(actions.filter(a => a.teamId !== 0).map(a => a.teamId)));

  // If IDs not provided, try to infer or just pick.
  let finalHomeId = homeTeamId;
  let finalAwayId = awayTeamId;

  if (!finalHomeId || !finalAwayId) {
    if (teamIds.length >= 2) {
      finalAwayId = teamIds[0];
      finalHomeId = teamIds[1];
    } else if (teamIds.length === 1) {
      finalAwayId = teamIds[0];
      finalHomeId = 0;
    }
  }

  const createTeamStats = (teamId: number, triplet: string): TeamStats => ({
    teamId,
    teamTriplet: triplet,
    points: 0,
    fgm: 0,
    fga: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    fta: 0,
    reb: 0,
    oreb: 0,
    dreb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    tov: 0,
    pf: 0,
    playerStats: {},
  });

  const stats: Record<number, TeamStats> = {};

  const getOrCreatePlayer = (teamId: number, personId: number, playerName: string, teamTriplet: string): PlayerStats => {
    if (!stats[teamId]) {
      stats[teamId] = createTeamStats(teamId, teamTriplet);
    }
    if (!stats[teamId].playerStats[personId]) {
      stats[teamId].playerStats[personId] = {
        personId,
        playerName,
        teamId,
        teamTriplet,
        points: 0,
        fgm: 0,
        fga: 0,
        fg3m: 0,
        fg3a: 0,
        ftm: 0,
        fta: 0,
        reb: 0,
        oreb: 0,
        dreb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        pf: 0,
        plusMinus: 0,
      };
    }
    return stats[teamId].playerStats[personId];
  };

  // Initialize with starters if provided
  if (initialPlayers && finalHomeId && finalAwayId) {
    initialPlayers.home.forEach(p => getOrCreatePlayer(finalHomeId!, p.personId, p.name, ''));
    initialPlayers.away.forEach(p => getOrCreatePlayer(finalAwayId!, p.personId, p.name, ''));
  }

  actions.forEach((action) => {
    const { actionType, shotResult, teamId, personId, playerName, teamTriplet } = action;

    if (!teamId || teamId === 0) {
      return;
    }

    // Initialize team if not exists
    if (!stats[teamId]) {
      stats[teamId] = createTeamStats(teamId, teamTriplet);
    }

    // Handle shots
    if (actionType === '2pt' || actionType === '3pt') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      const is3pt = actionType === '3pt';
      const made = shotResult === 'Made';

      p.fga++;
      stats[teamId].fga++;
      if (is3pt) {
        p.fg3a++;
        stats[teamId].fg3a++;
      }

      if (made) {
        p.fgm++;
        stats[teamId].fgm++;
        const pts = is3pt ? 3 : 2;
        p.points += pts;
        stats[teamId].points += pts;
        if (is3pt) {
          p.fg3m++;
          stats[teamId].fg3m++;
        }

        // Assist
        if ((action as any).assistPersonId) {
          const ap = getOrCreatePlayer(teamId, (action as any).assistPersonId, (action as any).assistPlayerNameInitial || 'Unknown', teamTriplet);
          ap.ast++;
          stats[teamId].ast++;
        }
      }
    }

    if (actionType === 'freethrow') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      const made = shotResult === 'Made';
      p.fta++;
      stats[teamId].fta++;
      if (made) {
        p.ftm++;
        stats[teamId].ftm++;
        p.points += 1;
        stats[teamId].points += 1;
      }
    }

    if (actionType === 'rebound') {
      if (personId === 0) {
        // Team rebound
        if (action.subType === 'offensive') {
          stats[teamId].oreb++;
        } else {
          stats[teamId].dreb++;
        }
        stats[teamId].reb++;
      } else {
        const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
        if (action.subType === 'offensive') {
          p.oreb++;
          stats[teamId].oreb++;
        } else {
          p.dreb++;
          stats[teamId].dreb++;
        }
        p.reb++;
        stats[teamId].reb++;
      }
    }

    if (actionType === 'turnover') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      p.tov++;
      stats[teamId].tov++;
    }

    if (actionType === 'steal') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      p.stl++;
      stats[teamId].stl++;
    }

    if (actionType === 'block') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      p.blk++;
      stats[teamId].blk++;
    }

    if (actionType === 'foul') {
      const p = getOrCreatePlayer(teamId, personId, playerName || 'Unknown', teamTriplet);
      p.pf++;
      stats[teamId].pf++;
    }
  });

  return {
    home: stats[finalHomeId!] || createTeamStats(finalHomeId || 0, 'HOME'),
    away: stats[finalAwayId!] || createTeamStats(finalAwayId || 0, 'AWAY'),
  };
}
