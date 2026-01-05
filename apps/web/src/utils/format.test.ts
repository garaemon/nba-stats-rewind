import { describe, it, expect } from 'vitest';
import { formatClock, clockToSeconds, getGameTimeSeconds, formatGameTime } from './format';

describe('format utils', () => {
  describe('formatClock', () => {
    it('should format PT12M00.00S to 12:00.00', () => {
      expect(formatClock('PT12M00.00S')).toBe('12:00.00');
    });

    it('should format PT08M45.00S to 08:45.00', () => {
      expect(formatClock('PT08M45.00S')).toBe('08:45.00');
    });
  });

  describe('clockToSeconds', () => {
    it('should convert PT12M00.00S to 720', () => {
      expect(clockToSeconds('PT12M00.00S')).toBe(720);
    });

    it('should convert PT00M00.00S to 0', () => {
      expect(clockToSeconds('PT00M00.00S')).toBe(0);
    });

    it('should convert PT05M30.00S to 330', () => {
      expect(clockToSeconds('PT05M30.00S')).toBe(330);
    });
  });

  describe('getGameTimeSeconds', () => {
    it('should calculate start of Q1 as 0', () => {
      expect(getGameTimeSeconds(1, 720)).toBe(0);
    });

    it('should calculate end of Q1 as 720', () => {
      expect(getGameTimeSeconds(1, 0)).toBe(720);
    });

    it('should calculate start of Q2 as 720', () => {
      expect(getGameTimeSeconds(2, 720)).toBe(720);
    });

    it('should calculate end of Q4 as 2880', () => {
      expect(getGameTimeSeconds(4, 0)).toBe(2880);
    });

    it('should calculate start of OT1 as 2880', () => {
      expect(getGameTimeSeconds(5, 300)).toBe(2880);
    });

    it('should calculate end of OT1 as 3180', () => {
      expect(getGameTimeSeconds(5, 0)).toBe(3180);
    });
  });

  describe('formatGameTime', () => {
    it('should format 0 as Q1 12:00', () => {
      expect(formatGameTime(0)).toBe('Q1 12:00');
    });

    it('should format 720 as Q2 12:00', () => {
      expect(formatGameTime(720)).toBe('Q2 12:00');
    });

    it('should format 2880 as OT1 5:00', () => {
      expect(formatGameTime(2880)).toBe('OT1 5:00');
    });

    it('should format 360 as Q1 6:00', () => {
      expect(formatGameTime(360)).toBe('Q1 6:00');
    });
  });
});
