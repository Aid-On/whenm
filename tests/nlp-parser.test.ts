import { describe, it, expect } from 'vitest';
import { NLPParser } from '../src/nlp-parser.js';

describe('NLPParser', () => {
  describe('parse', () => {
    it('should parse simple subject-verb statements', () => {
      const result = NLPParser.parse('alice quit');
      expect(result).toEqual({
        subject: 'alice',
        verb: 'quit',
        object: undefined
      });
    });
    
    it('should parse subject-verb-object statements', () => {
      const result = NLPParser.parse('alice learned Python');
      expect(result).toEqual({
        subject: 'alice',
        verb: 'learned',
        object: 'Python'
      });
    });
    
    it('should parse statements with phrasal verbs', () => {
      const result = NLPParser.parse('alice moved to Tokyo');
      expect(result).toEqual({
        subject: 'alice',
        verb: 'moved_to',
        object: 'Tokyo'
      });
    });
    
    it('should parse statements with "became"', () => {
      const result = NLPParser.parse('alice became CEO');
      expect(result).toEqual({
        subject: 'alice',
        verb: 'became',
        object: 'CEO'
      });
    });
    
    it('should handle default subject when not specified', () => {
      const result = NLPParser.parse('learned Python', 'bob');
      expect(result).toEqual({
        subject: 'bob',
        verb: 'learned',
        object: 'Python'
      });
    });
    
    it('should handle complex objects', () => {
      const result = NLPParser.parse('alice moved to New York');
      expect(result).toEqual({
        subject: 'alice',
        verb: 'moved_to',
        object: 'New York'
      });
    });
    
    it('should handle joined phrases', () => {
      const result = NLPParser.parse('bob joined chess club');
      expect(result).toEqual({
        subject: 'bob',
        verb: 'joined',
        object: 'chess club'
      });
    });
  });
  
  describe('extractKeywords', () => {
    it('should extract keywords from questions', () => {
      const keywords = NLPParser.extractKeywords('When did alice move to New York?');
      expect(keywords).toContain('alice');
      expect(keywords).toContain('move');
      expect(keywords).toContain('new york');
    });
    
    it('should extract job-related keywords', () => {
      const keywords = NLPParser.extractKeywords("What is alice's job?");
      expect(keywords).toContain('alice');
      expect(keywords).toContain('job');
    });
  });
  
  describe('detectQuestionType', () => {
    it('should detect "when" questions', () => {
      expect(NLPParser.detectQuestionType('When did alice move?')).toBe('when');
    });
    
    it('should detect "what" questions', () => {
      expect(NLPParser.detectQuestionType('What is alice\'s job?')).toBe('what');
    });
    
    it('should detect "where" questions', () => {
      expect(NLPParser.detectQuestionType('Where does alice live?')).toBe('where');
    });
    
    it('should detect boolean questions', () => {
      expect(NLPParser.detectQuestionType('Is alice a programmer?')).toBe('boolean');
      expect(NLPParser.detectQuestionType('Did alice learn Python?')).toBe('boolean');
    });
  });
  
  describe('extractQuestionSubject', () => {
    it('should extract subject from questions', () => {
      expect(NLPParser.extractQuestionSubject('What is alice\'s job?')).toBe('alice');
      expect(NLPParser.extractQuestionSubject('When did bob learn Python?')).toBe('bob');
    });
    
    it('should handle possessive forms', () => {
      expect(NLPParser.extractQuestionSubject('What is charlie\'s role?')).toBe('charlie');
    });
    
    it('should return null when no subject found', () => {
      expect(NLPParser.extractQuestionSubject('What time is it?')).toBe(null);
    });
  });
  
  describe('calculateEventMatch', () => {
    it('should calculate match scores for events', () => {
      const keywords = ['alice', 'move', 'tokyo'];
      const score1 = NLPParser.calculateEventMatch('alice moved to Tokyo', keywords);
      const score2 = NLPParser.calculateEventMatch('bob learned Python', keywords);
      
      expect(score1).toBeGreaterThan(score2);
    });
  });
});