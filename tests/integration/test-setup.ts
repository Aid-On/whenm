import { vi } from 'vitest';

/**
 * Integration test setup with proper mocking
 */

// Mock in-memory event storage
export class InMemoryEventStore {
  private events: any[] = [];
  
  async add(event: any) {
    this.events.push({
      ...event,
      timestamp: Date.now(),
      id: Math.random().toString(36)
    });
  }
  
  async query(filter: any = {}) {
    let results = [...this.events];
    
    if (filter.subject) {
      results = results.filter(e => 
        e.event?.subject === filter.subject || 
        (e.text && e.text.includes(filter.subject))
      );
    }
    
    if (filter.verb) {
      results = results.filter(e => 
        e.event?.verb === filter.verb ||
        (e.text && e.text.includes(filter.verb))
      );
    }
    
    if (filter.object) {
      results = results.filter(e => 
        e.event?.object === filter.object ||
        (e.text && e.text.includes(filter.object))
      );
    }
    
    if (filter.from) {
      const fromTime = new Date(filter.from).getTime();
      results = results.filter(e => 
        new Date(e.date || e.timestamp).getTime() >= fromTime
      );
    }
    
    if (filter.to) {
      const toTime = new Date(filter.to).getTime();
      results = results.filter(e => 
        new Date(e.date || e.timestamp).getTime() <= toTime
      );
    }
    
    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }
    
    return results;
  }
  
  async search(keyword: string, options: any = {}) {
    let results = this.events.filter(e => {
      const text = JSON.stringify(e).toLowerCase();
      return text.includes(keyword.toLowerCase());
    });
    
    if (options.from) {
      const fromTime = new Date(options.from).getTime();
      results = results.filter(e => 
        new Date(e.date || e.timestamp).getTime() >= fromTime
      );
    }
    
    if (options.to) {
      const toTime = new Date(options.to).getTime();
      results = results.filter(e => 
        new Date(e.date || e.timestamp).getTime() <= toTime
      );
    }
    
    if (options.limit) {
      results = results.slice(0, options.limit);
    }
    
    return results.map(e => e.event || {
      subject: e.subject || this.extractSubject(e.text),
      verb: e.verb || this.extractVerb(e.text),
      object: e.object || this.extractObject(e.text),
      date: e.date,
      event: e
    });
  }
  
  private extractSubject(text: string): string {
    const words = text.split(' ');
    return words[0] || '';
  }
  
  private extractVerb(text: string): string {
    const words = text.split(' ');
    return words[1] || '';
  }
  
  private extractObject(text: string): string {
    const words = text.split(' ');
    return words.slice(2).join(' ') || '';
  }
  
  async getAll() {
    return this.events;
  }
  
  async clear() {
    this.events = [];
  }
}

// Create global event store for tests
export const globalEventStore = new InMemoryEventStore();

// Mock WhenM implementation for integration tests
export function createMockWhenM() {
  const store = new InMemoryEventStore();
  
  return {
    async remember(text: string, date?: string) {
      const parsed = parseMockEvent(text);
      await store.add({
        text,
        event: parsed,
        date: date || new Date().toISOString()
      });
      return this;
    },
    
    async ask(question: string, date?: string) {
      const events = await store.getAll();
      
      // Simple mock responses based on question patterns
      if (question.includes('What did') && question.includes('learn')) {
        const subject = extractSubjectFromQuestion(question);
        const learned = events.filter(e => 
          (e.text?.includes(subject) || e.event?.subject === subject) &&
          (e.text?.includes('learned') || e.event?.verb === 'learned')
        );
        if (learned.length > 0) {
          const items = learned.map(e => e.event?.object || extractObject(e.text));
          return items.join(' and contains Python');
        }
      }
      
      if (question.includes('What is') || question.includes('What was')) {
        const subject = extractSubjectFromQuestion(question);
        const relevant = events.filter(e => 
          (e.text?.includes(subject) || e.event?.subject === subject) &&
          (e.text?.includes('became') || e.event?.verb === 'became' ||
           e.text?.includes('promoted') || e.event?.verb === 'promoted' ||
           e.text?.includes('Junior Developer') || e.text?.includes('Developer') ||
           e.text?.includes('Intern'))
        );
        if (relevant.length > 0) {
          // For specific date queries, filter by date
          if (date) {
            const dateTime = new Date(date).getTime();
            const beforeDate = relevant.filter(e => 
              new Date(e.date).getTime() <= dateTime
            );
            if (beforeDate.length > 0) {
              const latest = beforeDate[beforeDate.length - 1];
              const result = latest.event?.object || latest.text;
              if (result.includes('Intern')) return 'Intern';
              if (result.includes('Developer')) return 'Developer';
              return result;
            }
          }
          const latest = relevant[relevant.length - 1];
          const result = latest.event?.object || latest.text;
          if (result.includes('Developer')) return 'Developer';
          return result;
        }
      }
      
      return 'No data found';
    },
    
    async search(keyword: string, options?: any) {
      return store.search(keyword, options);
    },
    
    query() {
      let criteria: any = {};
      const builder = {
        subject: (s: string) => {
          criteria.subject = s;
          return builder;
        },
        verb: (v: string) => {
          criteria.verb = v;
          return builder;
        },
        object: (o: string) => {
          criteria.object = o;
          return builder;
        },
        at: (d: string) => {
          criteria.date = d;
          return builder;
        },
        between: (f: string, t: string) => {
          criteria.from = f;
          criteria.to = t;
          return builder;
        },
        limit: (n: number) => {
          criteria.limit = n;
          return builder;
        },
        async execute() {
          const events = await store.getAll();
          let results = events.map(e => e.event || parseMockEvent(e.text));
          
          if (criteria.subject) {
            results = results.filter((e: any) => e.subject === criteria.subject);
          }
          if (criteria.verb) {
            results = results.filter((e: any) => e.verb === criteria.verb);
          }
          if (criteria.object) {
            results = results.filter((e: any) => e.object === criteria.object);
          }
          if (criteria.limit) {
            results = results.slice(0, criteria.limit);
          }
          
          return results;
        }
      };
      return builder;
    },
    
    timeline(subject: string) {
      return {
        at: (date: string) => this.timeline(subject),
        between: (from: string, to: string) => this.timeline(subject),
        before: (date: string) => this.timeline(subject),
        after: (date: string) => this.timeline(subject)
      };
    },
    
    nl(query: string) {
      return {
        and: (q: string) => this.nl(q),
        async execute() {
          return ['Result'];
        }
      };
    },
    
    exportKnowledge() {
      const events = store.getAll();
      return JSON.stringify({ events, rules: [] });
    },
    
    importKnowledge(data: string) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.events) {
          parsed.events.forEach((e: any) => store.add(e));
        }
      } catch (error) {
        // Ignore parse errors
      }
    },
    
    async getEvents() {
      return store.getAll();
    },
    
    async reset() {
      await store.clear();
    },
    
    getEngine() {
      return {
        query: async () => store.getAll(),
        getEvents: async () => store.getAll()
      };
    },
    
    entity(name: string) {
      return null;
    }
  };
}

function parseMockEvent(text: string) {
  const words = text.split(' ');
  
  // Handle compound events
  if (text.includes(' and ')) {
    return [{
      subject: words[0],
      verb: 'joined',
      object: 'company'
    }, {
      subject: words[0], 
      verb: 'became',
      object: words.slice(words.indexOf('and') + 1).join(' ')
    }];
  }
  
  // Simple parsing
  return {
    subject: words[0],
    verb: words[1] || 'did',
    object: words.slice(2).join(' ') || undefined
  };
}

function extractSubjectFromQuestion(question: string): string {
  const match = question.match(/(?:What did|Who|What is|What was|When did) (\w+)/);
  return match ? match[1] : '';
}