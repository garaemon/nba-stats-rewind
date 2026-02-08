
export function getPlayerImageUrl(personId: number): string {
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${personId}.png`;
}

export function getPlayerStatsUrl(personId: number): string {
    return `https://www.nba.com/player/${personId}`;
}
