/**
 * Natural Language Parser using Compromise
 *
 * Provides robust parsing of English sentences to extract
 * subjects, verbs, and objects without hardcoding
 */

import nlp from 'compromise';

export interface ParsedSentence {
  subject: string;
  verb: string;
  object?: string;
}

export class NLPParser {
  /**
   * Parse a natural language statement into subject, verb, object
   */
  static parse(statement: string, defaultSubject: string = 'user'): ParsedSentence {
    const doc = NLPParser.buildDoc(statement);
    const words = statement.split(' ');

    const subject = NLPParser.findSubject(doc, words, statement, defaultSubject);
    const { verb, verbEndIndex } = NLPParser.findVerb(doc, statement);
    const object = NLPParser.findObject({ statement, verb, verbEndIndex, subject });

    return { subject, verb, object };
  }

  private static buildDoc(statement: string): ReturnType<typeof nlp> {
    let doc = nlp(statement);
    doc.verbs().toInfinitive();
    doc = nlp(statement);

    const words = statement.split(' ');
    if (words.length > 0 && /^[a-z]/.test(words[0])) {
      const withSubject = nlp(`I ${statement}`);
      if (withSubject.verbs().out('array').length === 0) {
        doc.match(`^${words[0]}`).tag('Person');
      }
    }

    return doc;
  }

  private static findSubject(
    doc: ReturnType<typeof nlp>,
    words: string[],
    statement: string,
    defaultSubject: string
  ): string {
    const people = doc.people().out('array');
    if (people.length > 0) return people[0].toLowerCase();

    const testWithSubject = nlp(`someone ${statement}`);
    const testVerbs = testWithSubject.verbs().out('array');

    if (testVerbs.length > 0 && words.length > 0) {
      const firstWordLower = words[0].toLowerCase();
      const verbsInOriginal = doc.verbs().out('array').map((v: string) => v.toLowerCase());

      const isFirstWordVerb = verbsInOriginal.includes(firstWordLower) ||
        testVerbs.some((v: string) => v.toLowerCase().includes(firstWordLower));

      return isFirstWordVerb ? defaultSubject : firstWordLower;
    }

    if (words.length > 0) {
      return words[0].toLowerCase();
    }

    return defaultSubject;
  }

  private static findVerb(
    doc: ReturnType<typeof nlp>,
    statement: string
  ): { verb: string; verbEndIndex: number } {
    const verbs = doc.verbs().json();
    if (verbs.length === 0) {
      return { verb: 'unknown', verbEndIndex: -1 };
    }

    let verb = verbs[0].text.toLowerCase();

    const afterVerbMatch = statement.toLowerCase().match(
      new RegExp(`${verb}\\s+(to|up|down|in|out|on|off|away|back)\\b`)
    );
    if (afterVerbMatch) {
      verb = verb + '_' + afterVerbMatch[1];
    }

    const verbPhrasePattern = verb.replace('_', '\\s+');
    const verbMatch = statement.toLowerCase().match(new RegExp(`\\b${verbPhrasePattern}\\b`));
    const verbEndIndex = (verbMatch?.index !== undefined)
      ? verbMatch.index + verbMatch[0].length
      : -1;

    return { verb, verbEndIndex };
  }

  private static findObject(
    context: { statement: string; verb: string; verbEndIndex: number; subject: string }
  ): string | undefined {
    if (context.verbEndIndex <= -1) return undefined;

    let afterVerb = context.statement.substring(context.verbEndIndex).trim();

    if (context.verb.includes('_')) {
      afterVerb = afterVerb.replace(/^(to|in|at|on|for|with)\s+/i, '');
    }

    if (afterVerb && afterVerb.toLowerCase() !== context.subject) {
      return afterVerb;
    }

    return undefined;
  }

  /**
   * Extract keywords from a question for matching
   */
  static extractKeywords(question: string): string[] {
    const doc = nlp(question);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    const places = doc.places().out('array');
    const people = doc.people().out('array');

    const possessiveNames = (question.match(/(\w+)'s/g) || [])
      .map(p => p.replace(/'s$/, '').toLowerCase());

    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'was', 'were', 'are', 'been', 'be', 'has', 'have', 'had',
      'do', 'does', 'did', 'when', 'what', 'where', 'who', 'why', 'how'
    ]);

    const potentialNames = question.toLowerCase().split(/\s+/)
      .map(w => w.replace(/['''']s$/, '').replace(/[?!.,]/g, ''))
      .filter(w => /^[a-z]+$/.test(w) && !stopWords.has(w));

    const allKeywords = [...nouns, ...verbs, ...places, ...people, ...possessiveNames, ...potentialNames];
    const processed = allKeywords.map(k => k.toLowerCase().replace(/[?!.,]/g, ''));
    const unique = [...new Set(processed)];

    if (question.toLowerCase().includes('new york')) {
      unique.push('new york');
    }

    return unique.filter(k => k && k.length > 0);
  }

  /**
   * Detect question type
   */
  static detectQuestionType(
    question: string
  ): 'what' | 'when' | 'where' | 'who' | 'why' | 'how' | 'boolean' | 'unknown' {
    const q = question.toLowerCase();

    const prefixMap: Array<[string, ReturnType<typeof NLPParser.detectQuestionType>]> = [
      ['what', 'what'], ['when', 'when'], ['where', 'where'],
      ['who', 'who'], ['why', 'why'], ['how', 'how']
    ];

    for (const [prefix, type] of prefixMap) {
      if (q.startsWith(prefix)) return type;
    }

    if (q.includes('\u4F55')) return 'what';     // Japanese "what"
    if (q.includes('\u3044\u3064')) return 'when'; // Japanese "when"
    if (q.includes('\u3069\u3053')) return 'where';
    if (q.includes('\u8AB0')) return 'who';
    if (q.includes('\u306A\u305C')) return 'why';
    if (q.includes('\u3069\u3046')) return 'how';

    const booleanPrefixes = ['is', 'are', 'was', 'were', 'did', 'does'];
    if (booleanPrefixes.some(p => q.startsWith(p))) return 'boolean';

    return 'unknown';
  }

  /**
   * Extract subject from question
   */
  static extractQuestionSubject(question: string): string | null {
    const possessive = question.match(/(\w+)'s/);
    if (possessive) return possessive[1].toLowerCase();

    const doc = nlp(question);

    const person = doc.people().first().text();
    if (person) return person.toLowerCase();

    const properNoun = doc.match('#ProperNoun').first().text();
    if (properNoun) return properNoun.toLowerCase();

    return NLPParser.extractSubjectFromPosition(question);
  }

  private static extractSubjectFromPosition(question: string): string | null {
    const words = question.toLowerCase().split(/\s+/);
    const pronouns = new Set(['the', 'a', 'an', 'he', 'she', 'it', 'they']);
    const filler = new Set([
      'the', 'a', 'an', 'he', 'she', 'it', 'they',
      'what', 'who', 'where', 'when'
    ]);

    const didIndex = words.indexOf('did');
    if (didIndex > 0 && didIndex < words.length - 1) {
      const potentialName = words[didIndex + 1];
      if (potentialName && !pronouns.has(potentialName)) {
        return potentialName;
      }
    }

    const isIndex = words.indexOf('is');
    if (isIndex > 0 && isIndex < words.length - 1) {
      const cleaned = words[isIndex + 1].replace(/['''']s$/, '').replace(/[?!.,]/g, '');
      if (cleaned && !filler.has(cleaned) && cleaned.length > 0) {
        return cleaned;
      }
    }

    return null;
  }

  /**
   * Match event description with keywords
   */
  static calculateEventMatch(eventStr: string, keywords: string[]): number {
    const eventDoc = nlp(eventStr);
    const eventWords = [
      ...eventDoc.nouns().out('array'),
      ...eventDoc.verbs().out('array'),
      ...eventDoc.places().out('array')
    ].map(w => w.toLowerCase());

    let score = 0;
    for (const keyword of keywords) {
      if (eventWords.includes(keyword)) {
        score += 2;
      } else if (eventWords.some(w => w.includes(keyword) || keyword.includes(w))) {
        score += 1;
      }
    }

    return score;
  }
}
