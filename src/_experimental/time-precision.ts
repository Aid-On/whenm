/**
 * Enhanced time precision support for WhenM
 * 
 * Supports:
 * - ISO 8601 full timestamps with milliseconds
 * - Multiple time granularities (year, month, day, hour, minute, second, millisecond)
 * - Fuzzy time matching for natural language queries
 */

import { MultiLocaleTimeParser } from './locale-strategy.js';

export type TimeGranularity = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond';

export interface TimePoint {
  /** ISO 8601 timestamp */
  iso: string;
  
  /** Unix timestamp in milliseconds */
  unix: number;
  
  /** Granularity of the original input */
  granularity: TimeGranularity;
  
  /** Human-readable format */
  display: string;
}

export class TimePrecision {
  private static localeParser = new MultiLocaleTimeParser();
  
  /**
   * Set the default locale for relative time parsing
   */
  static setLocale(locale: string): void {
    this.localeParser.setDefaultLocale(locale);
  }
  
  /**
   * Parse various time formats into normalized TimePoint
   */
  static parse(input: string | Date | number, granularity?: TimeGranularity, locale?: string): TimePoint {
    let date: Date;
    let detectedGranularity = granularity || 'millisecond';
    
    if (typeof input === 'number') {
      // Unix timestamp (assume milliseconds)
      date = new Date(input);
    } else if (input instanceof Date) {
      date = input;
    } else {
      // String parsing with granularity detection
      const parsed = this.parseString(input, locale);
      date = parsed.date;
      detectedGranularity = granularity || parsed.granularity;
    }
    
    return {
      iso: date.toISOString(),
      unix: date.getTime(),
      granularity: detectedGranularity,
      display: this.format(date, detectedGranularity)
    };
  }
  
  /**
   * Parse string timestamps with granularity detection
   */
  private static parseString(input: string, locale?: string): { date: Date; granularity: TimeGranularity } {
    const trimmed = input.trim();
    
    // Full ISO 8601 with milliseconds: 2024-01-15T14:30:45.123Z
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$/.test(trimmed)) {
      return { date: new Date(trimmed), granularity: 'millisecond' };
    }
    
    // ISO 8601 with seconds: 2024-01-15T14:30:45
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      return { date: new Date(trimmed), granularity: 'second' };
    }
    
    // ISO 8601 with minutes: 2024-01-15T14:30
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
      return { date: new Date(trimmed), granularity: 'minute' };
    }
    
    // ISO 8601 with hours: 2024-01-15T14
    if (/^\d{4}-\d{2}-\d{2}T\d{2}/.test(trimmed)) {
      return { date: new Date(trimmed), granularity: 'hour' };
    }
    
    // Date only: 2024-01-15
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return { date: new Date(trimmed + 'T00:00:00.000Z'), granularity: 'day' };
    }
    
    // Month only: 2024-01
    if (/^\d{4}-\d{2}$/.test(trimmed)) {
      return { date: new Date(trimmed + '-01T00:00:00.000Z'), granularity: 'month' };
    }
    
    // Year only: 2024
    if (/^\d{4}$/.test(trimmed)) {
      return { date: new Date(trimmed + '-01-01T00:00:00.000Z'), granularity: 'year' };
    }
    
    // Try locale-based relative time parsing first
    const now = new Date();
    const relativeDate = this.localeParser.parseRelative(trimmed, now, locale);
    if (relativeDate) {
      // Determine granularity based on the relative expression
      const lower = trimmed.toLowerCase();
      let granularity: TimeGranularity = 'day';
      
      if (lower.includes('year') || lower.includes('年')) {
        granularity = 'year';
      } else if (lower.includes('month') || lower.includes('月')) {
        granularity = 'month';
      } else if (lower.includes('week') || lower.includes('週')) {
        granularity = 'day';
      } else if (lower.includes('hour') || lower.includes('時')) {
        granularity = 'hour';
      } else if (lower.includes('minute') || lower.includes('分')) {
        granularity = 'minute';
      } else if (lower.includes('now') || lower.includes('今')) {
        granularity = 'millisecond';
      }
      
      return { date: relativeDate, granularity };
    }
    
    // Time ago patterns: "3 days ago", "2 hours ago", etc.
    const agoMatch = trimmed.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/i);
    if (agoMatch) {
      const [, num, unit] = agoMatch;
      const amount = parseInt(num);
      const result = new Date(now);
      
      switch (unit.toLowerCase()) {
        case 'second':
          result.setSeconds(result.getSeconds() - amount);
          return { date: result, granularity: 'second' };
        case 'minute':
          result.setMinutes(result.getMinutes() - amount);
          return { date: result, granularity: 'minute' };
        case 'hour':
          result.setHours(result.getHours() - amount);
          return { date: result, granularity: 'hour' };
        case 'day':
          result.setDate(result.getDate() - amount);
          return { date: result, granularity: 'day' };
        case 'week':
          result.setDate(result.getDate() - amount * 7);
          return { date: result, granularity: 'day' };
        case 'month':
          result.setMonth(result.getMonth() - amount);
          return { date: result, granularity: 'month' };
        case 'year':
          result.setFullYear(result.getFullYear() - amount);
          return { date: result, granularity: 'year' };
      }
    }
    
    // Fallback: try native Date parsing
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return { date: fallback, granularity: 'day' };
    }
    
    // If all else fails, use current time
    return { date: now, granularity: 'millisecond' };
  }
  
  /**
   * Format date according to granularity
   */
  static format(date: Date, granularity: TimeGranularity): string {
    switch (granularity) {
      case 'year':
        return date.getFullYear().toString();
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'day':
        return date.toISOString().split('T')[0];
      case 'hour':
        return date.toISOString().slice(0, 13) + ':00';
      case 'minute':
        return date.toISOString().slice(0, 16);
      case 'second':
        return date.toISOString().slice(0, 19) + 'Z';
      case 'millisecond':
      default:
        return date.toISOString();
    }
  }
  
  /**
   * Compare two TimePoints with fuzzy matching based on granularity
   */
  static compare(t1: TimePoint, t2: TimePoint, fuzzy: boolean = true): number {
    if (!fuzzy) {
      return t1.unix - t2.unix;
    }
    
    // Use coarser granularity for comparison
    const granularity = this.coarserGranularity(t1.granularity, t2.granularity);
    
    const d1 = new Date(t1.unix);
    const d2 = new Date(t2.unix);
    
    switch (granularity) {
      case 'year':
        return d1.getFullYear() - d2.getFullYear();
      case 'month':
        return (d1.getFullYear() * 12 + d1.getMonth()) - 
               (d2.getFullYear() * 12 + d2.getMonth());
      case 'day':
        const days1 = Math.floor(t1.unix / (24 * 60 * 60 * 1000));
        const days2 = Math.floor(t2.unix / (24 * 60 * 60 * 1000));
        return days1 - days2;
      default:
        return t1.unix - t2.unix;
    }
  }
  
  /**
   * Check if two TimePoints are equal (with fuzzy matching)
   */
  static equals(t1: TimePoint, t2: TimePoint, fuzzy: boolean = true): boolean {
    return this.compare(t1, t2, fuzzy) === 0;
  }
  
  /**
   * Check if t1 is before t2
   */
  static isBefore(t1: TimePoint, t2: TimePoint, fuzzy: boolean = true): boolean {
    return this.compare(t1, t2, fuzzy) < 0;
  }
  
  /**
   * Check if t1 is after t2
   */
  static isAfter(t1: TimePoint, t2: TimePoint, fuzzy: boolean = true): boolean {
    return this.compare(t1, t2, fuzzy) > 0;
  }
  
  /**
   * Create a time range for queries
   */
  static range(
    start: string | Date | number,
    end: string | Date | number,
    granularity?: TimeGranularity
  ): { start: TimePoint; end: TimePoint } {
    return {
      start: this.parse(start, granularity),
      end: this.parse(end, granularity)
    };
  }
  
  /**
   * Get the coarser of two granularities
   */
  private static coarserGranularity(g1: TimeGranularity, g2: TimeGranularity): TimeGranularity {
    const order: TimeGranularity[] = ['year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond'];
    const i1 = order.indexOf(g1);
    const i2 = order.indexOf(g2);
    return order[Math.min(i1, i2)];
  }
  
  /**
   * Calculate duration between two TimePoints
   */
  static duration(t1: TimePoint, t2: TimePoint): {
    milliseconds: number;
    seconds: number;
    minutes: number;
    hours: number;
    days: number;
    display: string;
  } {
    const diff = Math.abs(t2.unix - t1.unix);
    
    const ms = diff;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    // Create human-readable display
    let display = '';
    if (days > 0) {
      display = `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      display = `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      display = `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (seconds > 0) {
      display = `${seconds} second${seconds > 1 ? 's' : ''}`;
    } else {
      display = `${ms} millisecond${ms > 1 ? 's' : ''}`;
    }
    
    return {
      milliseconds: ms,
      seconds,
      minutes,
      hours,
      days,
      display
    };
  }
}