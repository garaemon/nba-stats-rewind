
import { describe, it, expect } from 'vitest';
import { getPlayerImageUrl, getPlayerStatsUrl } from './player';

describe('Player Utils', () => {
  it('generates correct player image URL', () => {
    const personId = 2544; // LeBron James
    expect(getPlayerImageUrl(personId)).toBe('https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png');
  });

  it('generates correct player stats URL', () => {
    const personId = 2544;
    expect(getPlayerStatsUrl(personId)).toBe('https://www.nba.com/player/2544');
  });
});
