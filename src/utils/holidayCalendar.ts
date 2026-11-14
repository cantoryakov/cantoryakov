/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HolidayOccurrence {
  year: number;
  start: string; // YYYY-MM-DD (holiday starts at sundown on this date)
  end: string;   // YYYY-MM-DD (holiday ends at nightfall on this date)
}

export interface NextOccurrenceResult {
  status: 'upcoming' | 'active';
  dateText: string;
}

export const HOLIDAY_OCCURRENCES: Record<string, HolidayOccurrence[]> = {
  'rosh-hashanah': [
    { year: 2026, start: '2026-09-11', end: '2026-09-13' },
    { year: 2027, start: '2027-10-01', end: '2027-10-03' },
    { year: 2028, start: '2028-09-20', end: '2028-09-22' },
    { year: 2029, start: '2029-09-09', end: '2029-09-11' },
    { year: 2030, start: '2030-09-27', end: '2030-09-29' }
  ],
  'yom-kippur': [
    { year: 2026, start: '2026-09-20', end: '2026-09-21' },
    { year: 2027, start: '2027-10-10', end: '2027-10-11' },
    { year: 2028, start: '2028-09-29', end: '2028-09-30' },
    { year: 2029, start: '2029-09-18', end: '2029-09-19' },
    { year: 2030, start: '2030-10-06', end: '2030-10-07' }
  ],
  'sukkot': [
    { year: 2026, start: '2026-09-25', end: '2026-10-02' },
    { year: 2027, start: '2027-10-15', end: '2027-10-22' },
    { year: 2028, start: '2028-10-04', end: '2028-10-11' },
    { year: 2029, start: '2029-09-23', end: '2029-09-30' },
    { year: 2030, start: '2030-10-11', end: '2030-10-18' }
  ],
  'simchat-torah': [
    { year: 2026, start: '2026-10-02', end: '2026-10-04' },
    { year: 2027, start: '2027-10-22', end: '2027-10-24' },
    { year: 2028, start: '2028-10-11', end: '2028-10-13' },
    { year: 2029, start: '2029-09-30', end: '2029-10-02' },
    { year: 2030, start: '2030-10-18', end: '2030-10-20' }
  ],
  'sigd': [
    { year: 2026, start: '2026-11-09', end: '2026-11-10' },
    { year: 2027, start: '2027-11-28', end: '2027-11-29' },
    { year: 2028, start: '2028-11-17', end: '2028-11-18' },
    { year: 2029, start: '2029-11-06', end: '2029-11-07' },
    { year: 2030, start: '2030-11-25', end: '2030-11-26' }
  ],
  'hanukkah': [
    { year: 2026, start: '2026-12-04', end: '2026-12-12' },
    { year: 2027, start: '2027-12-24', end: '2028-01-01' },
    { year: 2028, start: '2028-12-12', end: '2028-12-20' },
    { year: 2029, start: '2029-12-01', end: '2029-12-09' },
    { year: 2030, start: '2030-12-20', end: '2030-12-28' }
  ],
  'tu-bishvat': [
    { year: 2026, start: '2026-02-01', end: '2026-02-02' },
    { year: 2027, start: '2027-01-22', end: '2027-01-23' },
    { year: 2028, start: '2028-02-11', end: '2028-02-12' },
    { year: 2029, start: '2029-01-30', end: '2029-01-31' },
    { year: 2030, start: '2030-01-18', end: '2030-01-19' }
  ],
  'purim': [
    { year: 2026, start: '2026-03-02', end: '2026-03-03' },
    { year: 2027, start: '2027-03-22', end: '2027-03-23' },
    { year: 2028, start: '2028-03-11', end: '2028-03-12' },
    { year: 2029, start: '2029-02-28', end: '2029-03-01' },
    { year: 2030, start: '2030-03-18', end: '2030-03-19' }
  ],
  'passover': [
    { year: 2026, start: '2026-04-01', end: '2026-04-09' },
    { year: 2027, start: '2027-04-21', end: '2027-04-29' },
    { year: 2028, start: '2028-04-10', end: '2028-04-18' },
    { year: 2029, start: '2029-03-30', end: '2029-04-07' },
    { year: 2030, start: '2030-04-17', end: '2030-04-25' }
  ],
  'yom-haatzmaut': [
    { year: 2026, start: '2026-04-21', end: '2026-04-22' },
    { year: 2027, start: '2027-05-11', end: '2027-05-12' },
    { year: 2028, start: '2028-05-01', end: '2028-05-02' },
    { year: 2029, start: '2029-04-18', end: '2029-04-19' },
    { year: 2030, start: '2030-05-07', end: '2030-05-08' }
  ],
  'lag-baomer': [
    { year: 2026, start: '2026-05-04', end: '2026-05-05' },
    { year: 2027, start: '2027-05-24', end: '2027-05-25' },
    { year: 2028, start: '2028-05-13', end: '2028-05-14' },
    { year: 2029, start: '2029-05-02', end: '2029-05-03' },
    { year: 2030, start: '2030-05-20', end: '2030-05-21' }
  ],
  'yom-yerushalayim': [
    { year: 2026, start: '2026-05-14', end: '2026-05-15' },
    { year: 2027, start: '2027-06-03', end: '2027-06-04' },
    { year: 2028, start: '2028-05-23', end: '2028-05-24' },
    { year: 2029, start: '2029-05-12', end: '2029-05-13' },
    { year: 2030, start: '2030-05-30', end: '2030-05-31' }
  ],
  'shavuot': [
    { year: 2026, start: '2026-05-21', end: '2026-05-23' },
    { year: 2027, start: '2027-06-10', end: '2027-06-12' },
    { year: 2028, start: '2028-05-30', end: '2028-06-01' },
    { year: 2029, start: '2029-05-19', end: '2029-05-21' },
    { year: 2030, start: '2030-06-06', end: '2030-06-08' }
  ],
  'tu-bav': [
    { year: 2026, start: '2026-07-28', end: '2026-07-29' },
    { year: 2027, start: '2027-08-17', end: '2027-08-18' },
    { year: 2028, start: '2028-08-06', end: '2028-08-07' },
    { year: 2029, start: '2029-07-26', end: '2029-07-27' },
    { year: 2030, start: '2030-08-13', end: '2030-08-14' }
  ],
  'rosh-hashanah-labehemot': [
    { year: 2026, start: '2026-08-13', end: '2026-08-14' },
    { year: 2027, start: '2027-09-02', end: '2027-09-03' },
    { year: 2028, start: '2028-08-22', end: '2028-08-23' },
    { year: 2029, start: '2029-08-11', end: '2029-08-12' },
    { year: 2030, start: '2030-08-30', end: '2030-08-31' }
  ]
};

export function getNextHolidayOccurrence(holidayId: string, testDate?: Date): NextOccurrenceResult {
  const today = testDate || new Date();
  
  // Format today's date as YYYY-MM-DD for comparison in local timezone
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (holidayId === 'shabbat') {
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    
    if (daysUntilFriday === 0) {
      const hours = today.getHours();
      if (hours >= 18) {
        return {
          status: 'active',
          dateText: 'Happening Now! (Ends Saturday night)'
        };
      } else {
        return {
          status: 'upcoming',
          dateText: 'Starts tonight at sundown!'
        };
      }
    } else if (currentDay === 6) {
      return {
        status: 'active',
        dateText: 'Happening Now! (Ends tonight at nightfall)'
      };
    } else {
      const nextFriday = new Date(today);
      nextFriday.setDate(today.getDate() + daysUntilFriday);
      const formattedDate = nextFriday.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
      return {
        status: 'upcoming',
        dateText: `${formattedDate} (Starts at sundown)`
      };
    }
  }

  const occurrences = HOLIDAY_OCCURRENCES[holidayId];
  if (!occurrences) {
    return {
      status: 'upcoming',
      dateText: 'Weekly'
    };
  }

  // Find either the current active window or the next upcoming instance
  for (const occurrence of occurrences) {
    // If today falls strictly inside the holiday boundaries
    if (todayStr >= occurrence.start && todayStr <= occurrence.end) {
      if (todayStr === occurrence.end) {
        return {
          status: 'active',
          dateText: 'Happening Now! (Ends tonight at nightfall)'
        };
      } else if (todayStr === occurrence.start) {
        return {
          status: 'active',
          dateText: 'Starts tonight at sundown!'
        };
      } else {
        const endDateObj = new Date(occurrence.end + 'T12:00:00');
        const formattedEnd = endDateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
        return {
          status: 'active',
          dateText: `Happening Now! (Ends ${formattedEnd} nightfall)`
        };
      }
    }

    // If today is before this occurrence, then this is the next one!
    if (todayStr < occurrence.start) {
      const startDateObj = new Date(occurrence.start + 'T12:00:00');
      const formattedStart = startDateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      return {
        status: 'upcoming',
        dateText: `${formattedStart} (Starts at sundown)`
      };
    }
  }

  // Fallback if we overrun 2030
  const lastOccur = occurrences[occurrences.length - 1];
  return {
    status: 'upcoming',
    dateText: `Fall ${lastOccur.year + 1} (Starts at sundown)`
  };
}

export function getNextUpcomingHolidayId(testDate?: Date): string | null {
  const today = testDate || new Date();
  
  // Format today's date as YYYY-MM-DD for comparison in local timezone
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  let nextHolidayId: string | null = null;
  let earliestStart: string | null = null;

  for (const [holidayId, occurrences] of Object.entries(HOLIDAY_OCCURRENCES)) {
    // Find the first occurrence where the holiday has not ended yet
    const nextOccur = occurrences.find((o) => o.end >= todayStr);
    if (nextOccur) {
      if (!earliestStart || nextOccur.start < earliestStart) {
        earliestStart = nextOccur.start;
        nextHolidayId = holidayId;
      }
    }
  }

  return nextHolidayId;
}

/**
 * Calculates the current Hebrew month ID based on today's date.
 */
export function getCurrentHebrewMonthId(testDate?: Date): string {
  const today = testDate || new Date();
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();

  // Approximate Gregorian to Hebrew month mapping based on civil calendar dates
  if ((month === 9 && day >= 10) || (month === 10 && day <= 15)) return 'tishrei';
  if ((month === 10 && day > 15) || (month === 11 && day <= 15)) return 'cheshvan';
  if ((month === 11 && day > 15) || (month === 12 && day <= 20)) return 'kislev';
  if ((month === 12 && day > 20) || (month === 1 && day <= 15)) return 'tevet';
  if ((month === 1 && day > 15) || (month === 2 && day <= 15)) return 'shevat';
  if ((month === 2 && day > 15) || (month === 3 && day <= 20)) return 'adar';
  if ((month === 3 && day > 20) || (month === 4 && day <= 20)) return 'nisan';
  if ((month === 4 && day > 20) || (month === 5 && day <= 15)) return 'iyyar';
  if ((month === 5 && day > 15) || (month === 6 && day <= 15)) return 'sivan';
  if ((month === 6 && day > 15) || (month === 7 && day <= 15)) return 'tammuz';
  if ((month === 7 && day > 15) || (month === 8 && day <= 15)) return 'av';
  if ((month === 8 && day > 15) || (month === 9 && day < 10)) return 'elul';

  return 'tishrei';
}

