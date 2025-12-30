/**
 * Query Handlers for Different Intent Types
 * 
 * Handles execution of parsed query intents
 */

import { QueryBuilder, Timeline } from './query-builder.js';
import type { WhenMEngine } from './index.js';
import type { NaturalQueryIntent } from './query-intent-parser.js';

/**
 * Handles different types of query intents
 */
export class QueryHandlers {
  constructor(private engine: WhenMEngine) {}

  /**
   * Handle standard query intent
   */
  async handleQueryIntent(intent: NaturalQueryIntent): Promise<any> {
    const builder = new QueryBuilder(this.engine);

    // Apply entity filters
    if (intent.entities && intent.entities.length > 0) {
      if (intent.entities.length === 1) {
        builder.subject(intent.entities[0]);
      } else {
        builder.subject(intent.entities);
      }
    }

    // Apply timeframe
    if (intent.timeframe) {
      if (intent.timeframe.type === 'range' && intent.timeframe.from && intent.timeframe.to) {
        builder.between(intent.timeframe.from, intent.timeframe.to);
      } else if (intent.timeframe.type === 'relative' && intent.timeframe.duration) {
        const { amount, unit } = intent.timeframe.duration;
        builder.last(amount, unit as any);
      } else if (intent.timeframe.type === 'specific' && intent.timeframe.point) {
        builder.on(intent.timeframe.point);
      }
    }

    // Apply verb filters
    if (intent.filters?.verbs && intent.filters.verbs.length > 0) {
      builder.verb(intent.filters.verbs.length === 1 ? intent.filters.verbs[0] : intent.filters.verbs);
    }

    // Apply ordering
    if (intent.orderBy) {
      builder.orderBy(intent.orderBy.field as any, intent.orderBy.direction);
    }

    // Apply limit
    if (intent.limit) {
      builder.limit(intent.limit);
    }

    return builder.execute();
  }

  /**
   * Handle aggregation intent
   */
  async handleAggregateIntent(intent: NaturalQueryIntent): Promise<any> {
    const builder = new QueryBuilder(this.engine);

    // Apply filters first
    if (intent.entities && intent.entities.length > 0) {
      builder.subject(intent.entities[0]);
    }

    if (intent.timeframe?.type === 'relative' && intent.timeframe.duration) {
      const { amount, unit } = intent.timeframe.duration;
      builder.last(amount, unit as any);
    }

    // Execute aggregation
    switch (intent.aggregation) {
      case 'count':
        return { count: await builder.count() };
      case 'distinct':
        // Determine what field to get distinct values for
        const field = intent.filters?.verbs ? 'verb' : 'subject';
        return { distinct: await builder.distinct(field) };
      case 'first':
        return { first: await builder.first() };
      case 'exists':
        return { exists: await builder.exists() };
      default:
        return builder.execute();
    }
  }

  /**
   * Handle timeline intent
   */
  async handleTimelineIntent(intent: NaturalQueryIntent): Promise<any> {
    if (!intent.entities || intent.entities.length === 0) {
      return { error: 'Timeline requires an entity' };
    }

    const timeline = new Timeline(intent.entities[0], this.engine);

    if (intent.timeframe?.type === 'specific' && intent.timeframe.point) {
      return timeline.at(intent.timeframe.point);
    } else if (intent.timeframe?.type === 'range' && intent.timeframe.from && intent.timeframe.to) {
      return timeline.between(intent.timeframe.from, intent.timeframe.to);
    } else if (intent.timeframe?.type === 'relative' && intent.timeframe.duration) {
      // Convert relative time to days
      const { amount, unit } = intent.timeframe.duration;
      let days = amount;
      if (unit === 'weeks') days *= 7;
      else if (unit === 'months') days *= 30;
      else if (unit === 'years') days *= 365;
      
      return timeline.recent(days);
    }

    // Default to recent 30 days
    return timeline.recent(30);
  }

  /**
   * Handle when intent (temporal queries)
   */
  async handleWhenIntent(intent: NaturalQueryIntent): Promise<any> {
    const builder = new QueryBuilder(this.engine);

    // Apply filters
    if (intent.entities && intent.entities.length > 0) {
      builder.subject(intent.entities[0]);
    }

    if (intent.filters?.verbs && intent.filters.verbs.length > 0) {
      builder.verb(intent.filters.verbs[0]);
    }

    // Get results and extract timestamps
    const results = await builder.execute();
    
    if (results && results.length > 0) {
      // Return timestamps of matching events
      return results.map((event: any) => ({
        event: `${event.subject} ${event.verb} ${event.object || ''}`.trim(),
        time: event.time,
        timestamp: event.timestamp
      }));
    }

    return [];
  }

  /**
   * Handle search intent
   */
  async handleSearchIntent(intent: NaturalQueryIntent): Promise<any> {
    // For search, use keywords to filter
    if (!intent.filters?.keywords || intent.filters.keywords.length === 0) {
      return [];
    }

    // Get all events and filter by keywords
    const allEvents = await this.engine.getEvents();
    
    if (!allEvents) return [];

    const keywords = intent.filters.keywords.map(k => k.toLowerCase());
    
    return allEvents.filter((event: any) => {
      const eventStr = `${event.subject} ${event.verb} ${event.object || ''}`.toLowerCase();
      return keywords.some(keyword => eventStr.includes(keyword));
    });
  }

  /**
   * Handle comparison intent
   */
  async handleCompareIntent(intent: NaturalQueryIntent): Promise<any> {
    if (!intent.entities || intent.entities.length === 0) {
      return { error: 'Comparison requires entities' };
    }

    const results: any = {};

    // Compare multiple entities or time periods
    for (const entity of intent.entities) {
      const builder = new QueryBuilder(this.engine);
      builder.subject(entity);

      if (intent.timeframe?.type === 'range' && intent.timeframe.from && intent.timeframe.to) {
        builder.between(intent.timeframe.from, intent.timeframe.to);
      }

      results[entity] = await builder.execute();
    }

    return {
      comparison: results,
      entities: intent.entities,
      timeframe: intent.timeframe
    };
  }
}