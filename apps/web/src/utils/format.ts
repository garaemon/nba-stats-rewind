/**
 * Formats ISO 8601 duration string (e.g., PT12M00.00S) to MM:SS
 */
export const formatClock = (clock: string) => {
  return clock.replace('PT', '').replace('M', ':').replace('S', '');
};
