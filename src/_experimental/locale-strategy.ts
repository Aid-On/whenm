/**
 * Locale-specific time expression parsing strategies
 * 
 * Extensible system for handling relative time expressions in different languages
 */

/**
 * Interface for locale-specific time parsing
 */
export interface LocaleTimeParser {
  /** Language code (e.g., 'en', 'ja', 'es') */
  locale: string;
  
  /** Parse relative time expressions */
  parseRelative(text: string, baseDate: Date): Date | null;
  
  /** Get supported relative time patterns */
  getPatterns(): RelativeTimePattern[];
}

/**
 * Relative time pattern definition
 */
export interface RelativeTimePattern {
  pattern: RegExp;
  unit: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute';
  offset: number; // negative for past, positive for future
  description?: string;
}

/**
 * English time parser
 */
export class EnglishTimeParser implements LocaleTimeParser {
  locale = 'en';
  
  getPatterns(): RelativeTimePattern[] {
    return [
      // Past
      { pattern: /\blast\s+year\b/i, unit: 'year', offset: -1 },
      { pattern: /\blast\s+month\b/i, unit: 'month', offset: -1 },
      { pattern: /\blast\s+week\b/i, unit: 'week', offset: -1 },
      { pattern: /\byesterday\b/i, unit: 'day', offset: -1 },
      { pattern: /\b(\d+)\s+years?\s+ago\b/i, unit: 'year', offset: -1 },
      { pattern: /\b(\d+)\s+months?\s+ago\b/i, unit: 'month', offset: -1 },
      { pattern: /\b(\d+)\s+weeks?\s+ago\b/i, unit: 'week', offset: -1 },
      { pattern: /\b(\d+)\s+days?\s+ago\b/i, unit: 'day', offset: -1 },
      
      // Future
      { pattern: /\bnext\s+year\b/i, unit: 'year', offset: 1 },
      { pattern: /\bnext\s+month\b/i, unit: 'month', offset: 1 },
      { pattern: /\bnext\s+week\b/i, unit: 'week', offset: 1 },
      { pattern: /\btomorrow\b/i, unit: 'day', offset: 1 },
      { pattern: /\bin\s+(\d+)\s+years?\b/i, unit: 'year', offset: 1 },
      { pattern: /\bin\s+(\d+)\s+months?\b/i, unit: 'month', offset: 1 },
      { pattern: /\bin\s+(\d+)\s+weeks?\b/i, unit: 'week', offset: 1 },
      { pattern: /\bin\s+(\d+)\s+days?\b/i, unit: 'day', offset: 1 },
      
      // Current
      { pattern: /\btoday\b/i, unit: 'day', offset: 0 },
      { pattern: /\bnow\b/i, unit: 'minute', offset: 0 },
      { pattern: /\bthis\s+year\b/i, unit: 'year', offset: 0 },
      { pattern: /\bthis\s+month\b/i, unit: 'month', offset: 0 },
      { pattern: /\bthis\s+week\b/i, unit: 'week', offset: 0 }
    ];
  }
  
  parseRelative(text: string, baseDate: Date): Date | null {
    const patterns = this.getPatterns();
    
    for (const pattern of patterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        const result = new Date(baseDate);
        let multiplier = pattern.offset;
        
        // If pattern captures a number, use it as multiplier
        if (match[1]) {
          multiplier = parseInt(match[1]) * (pattern.offset < 0 ? -1 : 1);
        }
        
        switch (pattern.unit) {
          case 'year':
            result.setFullYear(result.getFullYear() + multiplier);
            break;
          case 'month':
            result.setMonth(result.getMonth() + multiplier);
            break;
          case 'week':
            result.setDate(result.getDate() + (multiplier * 7));
            break;
          case 'day':
            result.setDate(result.getDate() + multiplier);
            break;
          case 'hour':
            result.setHours(result.getHours() + multiplier);
            break;
          case 'minute':
            result.setMinutes(result.getMinutes() + multiplier);
            break;
        }
        
        return result;
      }
    }
    
    return null;
  }
}

/**
 * Japanese time parser
 */
export class JapaneseTimeParser implements LocaleTimeParser {
  locale = 'ja';
  
  getPatterns(): RelativeTimePattern[] {
    return [
      // Past
      { pattern: /去年|昨年/i, unit: 'year', offset: -1 },
      { pattern: /先月/i, unit: 'month', offset: -1 },
      { pattern: /先週/i, unit: 'week', offset: -1 },
      { pattern: /昨日|きのう/i, unit: 'day', offset: -1 },
      { pattern: /(\d+)年前/i, unit: 'year', offset: -1 },
      { pattern: /(\d+)ヶ月前|(\d+)か月前/i, unit: 'month', offset: -1 },
      { pattern: /(\d+)週間前/i, unit: 'week', offset: -1 },
      { pattern: /(\d+)日前/i, unit: 'day', offset: -1 },
      
      // Future
      { pattern: /来年/i, unit: 'year', offset: 1 },
      { pattern: /来月/i, unit: 'month', offset: 1 },
      { pattern: /来週/i, unit: 'week', offset: 1 },
      { pattern: /明日|あした/i, unit: 'day', offset: 1 },
      { pattern: /(\d+)年後/i, unit: 'year', offset: 1 },
      { pattern: /(\d+)ヶ月後|(\d+)か月後/i, unit: 'month', offset: 1 },
      { pattern: /(\d+)週間後/i, unit: 'week', offset: 1 },
      { pattern: /(\d+)日後/i, unit: 'day', offset: 1 },
      
      // Current
      { pattern: /今日|きょう/i, unit: 'day', offset: 0 },
      { pattern: /今|いま/i, unit: 'minute', offset: 0 },
      { pattern: /今年|ことし/i, unit: 'year', offset: 0 },
      { pattern: /今月/i, unit: 'month', offset: 0 },
      { pattern: /今週/i, unit: 'week', offset: 0 }
    ];
  }
  
  parseRelative(text: string, baseDate: Date): Date | null {
    const patterns = this.getPatterns();
    
    for (const pattern of patterns) {
      const match = text.match(pattern.pattern);
      if (match) {
        const result = new Date(baseDate);
        let multiplier = pattern.offset;
        
        // If pattern captures a number, use it as multiplier
        if (match[1]) {
          multiplier = parseInt(match[1]) * (pattern.offset < 0 ? -1 : 1);
        } else if (match[2]) {
          // For alternative patterns like "か月"
          multiplier = parseInt(match[2]) * (pattern.offset < 0 ? -1 : 1);
        }
        
        switch (pattern.unit) {
          case 'year':
            result.setFullYear(result.getFullYear() + multiplier);
            break;
          case 'month':
            result.setMonth(result.getMonth() + multiplier);
            break;
          case 'week':
            result.setDate(result.getDate() + (multiplier * 7));
            break;
          case 'day':
            result.setDate(result.getDate() + multiplier);
            break;
          case 'hour':
            result.setHours(result.getHours() + multiplier);
            break;
          case 'minute':
            result.setMinutes(result.getMinutes() + multiplier);
            break;
        }
        
        return result;
      }
    }
    
    return null;
  }
}

/**
 * Multi-locale time parser manager
 */
export class MultiLocaleTimeParser {
  private parsers: Map<string, LocaleTimeParser> = new Map();
  private defaultLocale: string = 'en';
  
  constructor(defaultLocale: string = 'en') {
    this.defaultLocale = defaultLocale;
    
    // Register default parsers
    this.register(new EnglishTimeParser());
    this.register(new JapaneseTimeParser());
  }
  
  /**
   * Register a locale parser
   */
  register(parser: LocaleTimeParser): void {
    this.parsers.set(parser.locale, parser);
  }
  
  /**
   * Parse relative time expression
   */
  parseRelative(text: string, baseDate: Date = new Date(), locale?: string): Date | null {
    // Try specified locale first
    if (locale) {
      const parser = this.parsers.get(locale);
      if (parser) {
        const result = parser.parseRelative(text, baseDate);
        if (result) return result;
      }
    }
    
    // Try default locale
    const defaultParser = this.parsers.get(this.defaultLocale);
    if (defaultParser) {
      const result = defaultParser.parseRelative(text, baseDate);
      if (result) return result;
    }
    
    // Try all parsers (auto-detect)
    for (const parser of this.parsers.values()) {
      const result = parser.parseRelative(text, baseDate);
      if (result) return result;
    }
    
    return null;
  }
  
  /**
   * Get available locales
   */
  getAvailableLocales(): string[] {
    return Array.from(this.parsers.keys());
  }
  
  /**
   * Set default locale
   */
  setDefaultLocale(locale: string): void {
    if (this.parsers.has(locale)) {
      this.defaultLocale = locale;
    } else {
      throw new Error(`Locale ${locale} is not registered`);
    }
  }
}