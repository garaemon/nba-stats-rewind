/**
 * Formats ISO 8601 duration string (e.g., PT12M00.00S) to MM:SS
 */
export const formatClock = (clock: string) => {
  return clock.replace('PT', '').replace('M', ':').replace('S', '');
};

/**
 * Converts ISO 8601 duration string (e.g., PT12M00.00S) to total seconds
 */
export const clockToSeconds = (clock: string): number => {
  const match = clock.match(/PT(\d+)M(\d+)(\.\d+)?S/);
  if (!match) {
    return 0;
  }
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return minutes * 60 + seconds;
};

/**
 * Calculates total game time in seconds from period and clock seconds.
 * NBA: 4 periods of 12 minutes (720s) each.
 * OT: 5 minutes (300s) each.
 */
export const getGameTimeSeconds = (period: number, clockSeconds: number): number => {
  if (period <= 4) {
    return (period - 1) * 720 + (720 - clockSeconds);
  } else {
    return 2880 + (period - 5) * 300 + (300 - clockSeconds);
  }
};

/**
 * Formats total game seconds back to Period and Clock display
 */
export const formatGameTime = (totalSeconds: number) => {
  if (totalSeconds < 2880) {
    const period = Math.floor(totalSeconds / 720) + 1;
    const remainingSeconds = 720 - (totalSeconds % 720);
    const m = Math.floor(remainingSeconds / 60);
    const s = Math.floor(remainingSeconds % 60);
    return `Q${period} ${m}:${s.toString().padStart(2, '0')}`;
  } else {
    const otSeconds = totalSeconds - 2880;
    const period = Math.floor(otSeconds / 300) + 5;
    const remainingSeconds = 300 - (otSeconds % 300);
    const m = Math.floor(remainingSeconds / 60);
    const s = Math.floor(remainingSeconds % 60);
    return `OT${period - 4} ${m}:${s.toString().padStart(2, '0')}`;
  }
};

/**
 * Formats ISO 8601 string to HH:mm:ss with timezone
 */
export const formatActualTime = (isoString: string | number) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
};

/**
 * Parses ISO 8601 string to epoch milliseconds
 */
export const parseActualTime = (isoString: string) => {
  return new Date(isoString).getTime();
};
