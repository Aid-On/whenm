/**
 * Utility functions for WhenM
 */

/**
 * Normalize date to ISO string format
 */
export function normalizeDate(date: string | Date | undefined): string {
  if (!date) {
    return new Date().toISOString();
  }
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}

/**
 * Convert to Unix timestamp
 */
export function toUnixTime(date: string | Date | undefined): number {
  let d: Date;
  if (!date) {
    d = new Date();
  } else if (typeof date === 'string') {
    d = new Date(date);
  } else {
    d = date;
  }
  return Math.floor(d.getTime() / 1000);
}

/**
 * Parse time duration strings
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(second|minute|hour|day|week|month|year)s?$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000
  };
  
  return amount * multipliers[unit];
}