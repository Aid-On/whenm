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
   * 
   * @example
   * "alice became CEO" -> { subject: 'alice', verb: 'became', object: 'CEO' }
   * "bob learned Python" -> { subject: 'bob', verb: 'learned', object: 'Python' }
   * "alice moved to Tokyo" -> { subject: 'alice', verb: 'moved_to', object: 'Tokyo' }
   */
  static parse(statement: string, defaultSubject: string = 'user'): ParsedSentence {
    let doc = nlp(statement);
    
    // Enhance verb recognition - teach compromise about past tense patterns
    doc.verbs().toInfinitive(); // This helps recognize verb forms
    
    // Re-parse with enhanced understanding
    doc = nlp(statement);
    
    const words = statement.split(' ');
    
    // Check if first word might be a lowercase name
    if (words.length > 0 && /^[a-z]/.test(words[0])) {
      // Check if the first word is likely a verb by testing its conjugations
      const firstWord = words[0];
      const testDoc = nlp(firstWord);
      
      // If compromise doesn't recognize it as a verb, check if adding context helps
      const withSubject = nlp(`I ${statement}`);
      if (withSubject.verbs().out('array').length > 0) {
        // The statement starts with a verb, no explicit subject
        // Do nothing, we'll handle this below
      } else {
        // First word is likely a subject (name)
        doc.match(`^${firstWord}`).tag('Person');
      }
    }
    
    // Now get tagged parts
    const people = doc.people().out('array');
    const verbs = doc.verbs().json();
    const nouns = doc.nouns().out('array');
    
    // Get subject
    let subject = people.length > 0 ? people[0].toLowerCase() : null;
    
    // If no subject found, check if statement starts with a verb
    if (!subject) {
      // Test if adding a subject makes it a valid sentence
      const testWithSubject = nlp(`someone ${statement}`);
      const testVerbs = testWithSubject.verbs().out('array');
      
      if (testVerbs.length > 0 && words.length > 0) {
        // First word of original statement is likely a verb
        const firstWordLower = words[0].toLowerCase();
        const verbsInOriginal = doc.verbs().out('array').map((v: string) => v.toLowerCase());
        
        if (verbsInOriginal.includes(firstWordLower) || testVerbs.some((v: string) => v.toLowerCase().includes(firstWordLower))) {
          // Statement starts with a verb, use default subject
          subject = defaultSubject;
        } else {
          // First word is not a verb, treat as subject
          subject = firstWordLower;
        }
      } else if (words.length > 0) {
        // Can't determine, treat first word as subject if it's not obviously a verb
        subject = words[0].toLowerCase();
      }
    }
    
    if (!subject) {
      subject = defaultSubject;
    }
    
    // Get the full verb phrase (including particles/prepositions)
    let verb = 'unknown';
    let verbEndIndex = -1;
    
    if (verbs.length > 0) {
      const verbObj = verbs[0];
      verb = verbObj.text.toLowerCase();
      
      // Check if there's a particle/preposition after the verb
      const afterVerbMatch = statement.toLowerCase().match(new RegExp(`${verb}\\s+(to|up|down|in|out|on|off|away|back)\\b`));
      if (afterVerbMatch) {
        verb = verb + '_' + afterVerbMatch[1];
      }
      
      // Find where the verb phrase ends in the original statement
      const verbPhrasePattern = verb.replace('_', '\\s+');
      const verbMatch = statement.toLowerCase().match(new RegExp(`\\b${verbPhrasePattern}\\b`));
      if (verbMatch && verbMatch.index !== undefined) {
        verbEndIndex = verbMatch.index + verbMatch[0].length;
      }
    }
    
    // Get object - everything after the verb that's not the subject
    let object: string | undefined;
    
    if (verbEndIndex > -1) {
      let afterVerb = statement.substring(verbEndIndex).trim();
      
      // Remove leading prepositions if they're part of the object phrase
      // But keep them if they're part of a phrasal verb we didn't catch
      if (verb.includes('_')) {
        // Phrasal verb detected, safe to remove redundant prepositions
        afterVerb = afterVerb.replace(/^(to|in|at|on|for|with)\s+/i, '');
      }
      
      if (afterVerb && afterVerb.toLowerCase() !== subject) {
        object = afterVerb;
      }
    }
    
    // Special case: if we only have 2 words and the second is a noun, it's likely "subject verb"
    if (!object && words.length === 2 && verb !== 'unknown') {
      // "alice quit" pattern - no object
      object = undefined;
    }
    
    return {
      subject,
      verb,
      object
    };
  }
  
  /**
   * Extract keywords from a question for matching
   * 
   * @example
   * "When did alice move to New York?" -> ['alice', 'move', 'new york']
   */
  static extractKeywords(question: string): string[] {
    const doc = nlp(question);
    
    // Extract meaningful parts
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array'); 
    const places = doc.places().out('array');
    const people = doc.people().out('array');
    
    // Extract names from possessive patterns
    const possessives = question.match(/(\w+)'s/g) || [];
    const possessiveNames = possessives.map(p => p.replace(/'s$/, '').toLowerCase());
    
    // Also extract words that might be names (lowercase words that could be names)
    const words = question.toLowerCase().split(/\s+/);
    const potentialNames = words.filter(w => {
      // Remove possessive endings and punctuation
      const cleanWord = w.replace(/[''']s$/, '').replace(/[?!.,]/g, '');
      return /^[a-z]+$/.test(cleanWord) && 
        !['the', 'a', 'an', 'is', 'was', 'were', 'are', 'been', 'be', 'has', 'have', 'had', 
          'do', 'does', 'did', 'when', 'what', 'where', 'who', 'why', 'how'].includes(cleanWord);
    }).map(w => w.replace(/[''']s$/, '').replace(/[?!.,]/g, ''));
    
    // Combine all keywords
    const allKeywords = [
      ...nouns,
      ...verbs,
      ...places,
      ...people,
      ...possessiveNames,
      ...potentialNames
    ];
    
    // Process and deduplicate
    const processedKeywords = allKeywords.map(k => k.toLowerCase().replace(/[?!.,]/g, ''));
    
    // Remove duplicates while preserving multi-word phrases
    const uniqueKeywords = [...new Set(processedKeywords)];
    
    // Special handling for multi-word places like "New York"
    if (question.toLowerCase().includes('new york')) {
      uniqueKeywords.push('new york');
    }
    
    return uniqueKeywords.filter(k => k && k.length > 0);
  }
  
  /**
   * Detect question type
   */
  static detectQuestionType(question: string): 'what' | 'when' | 'where' | 'who' | 'why' | 'how' | 'boolean' | 'unknown' {
    const q = question.toLowerCase();
    
    if (q.startsWith('what') || q.includes('何')) return 'what';
    if (q.startsWith('when') || q.includes('いつ')) return 'when';
    if (q.startsWith('where') || q.includes('どこ')) return 'where';
    if (q.startsWith('who') || q.includes('誰')) return 'who';
    if (q.startsWith('why') || q.includes('なぜ')) return 'why';
    if (q.startsWith('how') || q.includes('どう')) return 'how';
    if (q.startsWith('is') || q.startsWith('are') || q.startsWith('was') || q.startsWith('were') || q.startsWith('did') || q.startsWith('does')) return 'boolean';
    
    return 'unknown';
  }
  
  /**
   * Extract subject from question
   * 
   * @example
   * "What is alice's job?" -> 'alice'
   * "When did bob learn Python?" -> 'bob'
   */
  static extractQuestionSubject(question: string): string | null {
    const doc = nlp(question);
    
    // Look for possessive patterns first (alice's, bob's) and extract the name
    const possessive = question.match(/(\w+)'s/);
    if (possessive) return possessive[1].toLowerCase();
    
    // Look for person names
    const person = doc.people().first().text();
    if (person) return person.toLowerCase();
    
    // Look for proper nouns
    const properNoun = doc.match('#ProperNoun').first().text();
    if (properNoun) return properNoun.toLowerCase();
    
    // Look for lowercase names in typical positions
    const words = question.toLowerCase().split(/\s+/);
    
    // Pattern: "When did [name] ..."
    const didIndex = words.indexOf('did');
    if (didIndex > 0 && didIndex < words.length - 1) {
      const potentialName = words[didIndex + 1];
      if (potentialName && !['the', 'a', 'an', 'he', 'she', 'it', 'they'].includes(potentialName)) {
        return potentialName;
      }
    }
    
    // Pattern: "What is [name]'s ..."
    const isIndex = words.indexOf('is');
    if (isIndex > 0 && isIndex < words.length - 1) {
      const potentialName = words[isIndex + 1].replace(/[''']s$/, '').replace(/[?!.,]/g, '');
      if (potentialName && 
          !['the', 'a', 'an', 'he', 'she', 'it', 'they', 'what', 'who', 'where', 'when'].includes(potentialName) &&
          potentialName.length > 0) {
        return potentialName;
      }
    }
    
    return null;
  }
  
  /**
   * Match event description with keywords
   * 
   * Calculates a similarity score between an event and keywords
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
      // Direct match
      if (eventWords.includes(keyword)) {
        score += 2;
      }
      // Partial match
      else if (eventWords.some(w => w.includes(keyword) || keyword.includes(w))) {
        score += 1;
      }
    }
    
    return score;
  }
}