'use client';

import { useTimezone } from './TimezoneProvider';

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC'
];

export function TimezoneSelector() {
  const { timezone, setTimezone } = useTimezone();

  // Try to get all supported timezones, fallback to common list
  const allTimezones = typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl
    ? (Intl as any).supportedValuesOf('timeZone')
    : COMMON_TIMEZONES;

  // Ensure current timezone is in the list (if unique)
  const timezoneList = Array.from(new Set([...allTimezones, timezone])).sort();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="timezone-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
        Timezone:
      </label>
      <select
        id="timezone-select"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[150px] sm:max-w-[200px]"
      >
        {timezoneList.map((tz: string) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, ' ')}
          </option>
        ))}
      </select>
    </div>
  );
}
