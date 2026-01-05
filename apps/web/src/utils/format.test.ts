import { describe, it, expect } from 'vitest';
import { formatClock } from './format';

describe('formatClock', () => {
  it('formats full minutes correctly', () => {
    expect(formatClock('PT12M00.00S')).toBe('12:00.00');
  });

  it('formats mixed minutes and seconds correctly', () => {
    expect(formatClock('PT08M24.50S')).toBe('08:24.50');
  });

  it('handles small values', () => {
    expect(formatClock('PT00M01.00S')).toBe('00:01.00');
  });
});
