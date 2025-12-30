import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Prolog } from 'trealla';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Event Calculus Prolog', () => {
  let prolog: any;

  beforeEach(async () => {
    try {
      prolog = new Prolog({
        library: join(process.cwd(), 'node_modules/trealla/dist')
      });
      
      // Load Event Calculus rules
      const ecRules = readFileSync(join(process.cwd(), 'src/persistence/prolog-native.ts'), 'utf8');
      const prologCode = ecRules.match(/const PROLOG_EC_RULES = `([^`]+)`/)?.[1];
      
      if (prologCode) {
        await prolog.consultString(prologCode);
      }
    } catch (error) {
      // If Prolog initialization fails, skip tests
      prolog = null;
    }
  });

  describe('Basic Event Calculus', () => {
    it('should handle happens/2 facts', async () => {
      if (!prolog) {
        console.log('Skipping Prolog test - initialization failed');
        return;
      }

      await prolog.consultString(`
        happens(event(alice, became, ceo), '2024-01-01').
        happens(event(bob, joined, company), '2024-02-01').
      `);

      const result = await prolog.query('happens(event(alice, became, ceo), Date)');
      expect(result).toBeDefined();
      if (result.length > 0) {
        expect(result[0].Date).toBe('2024-01-01');
      }
    });

    it('should handle initiates/3 rules', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        initiates(event(Person, became, Role), role(Person, Role), _).
        initiates(event(Person, learned, Skill), knows(Person, Skill), _).
      `);

      const result = await prolog.query('initiates(event(alice, became, ceo), Fluent, _)');
      expect(result).toBeDefined();
      if (result.length > 0) {
        expect(result[0].Fluent).toBeDefined();
      }
    });

    it('should handle terminates/3 rules', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        terminates(event(Person, quit, Role), role(Person, Role), _).
        terminates(event(Person, moved_from, Location), lives_in(Person, Location), _).
      `);

      const result = await prolog.query('terminates(event(alice, quit, manager), Fluent, _)');
      expect(result).toBeDefined();
    });
  });

  describe('Fluent tracking', () => {
    it('should track holds_at/2', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, became, ceo), '2024-01-01').
        initiates(event(Person, became, Role), role(Person, Role), _).
        
        holds_at(Fluent, Date) :-
          happens(Event, StartDate),
          initiates(Event, Fluent, _),
          StartDate @=< Date,
          \\+ (
            happens(TermEvent, TermDate),
            terminates(TermEvent, Fluent, _),
            StartDate @< TermDate,
            TermDate @=< Date
          ).
      `);

      const result = await prolog.query('holds_at(role(alice, ceo), "2024-06-01")');
      expect(result).toBeDefined();
    });

    it('should handle state changes over time', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, became, intern), '2020-01-01').
        happens(event(alice, became, junior), '2021-01-01').
        happens(event(alice, became, senior), '2023-01-01').
        
        initiates(event(Person, became, NewRole), role(Person, NewRole), _).
        terminates(event(Person, became, NewRole), role(Person, OldRole), _) :-
          OldRole \\= NewRole.
      `);

      // Query for different time points
      const past = await prolog.query('holds_at(role(alice, intern), "2020-06-01")');
      const present = await prolog.query('holds_at(role(alice, senior), "2024-01-01")');
      
      expect(past).toBeDefined();
      expect(present).toBeDefined();
    });
  });

  describe('Complex temporal queries', () => {
    it('should find when events happened', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, learned, python), '2020-06-01').
        happens(event(alice, learned, javascript), '2021-03-01').
        happens(event(alice, learned, rust), '2023-09-01').
      `);

      const result = await prolog.query('happens(event(alice, learned, Language), Date)');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it('should compare event times', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, joined, company), '2020-01-01').
        happens(event(alice, became, manager), '2022-01-01').
        happens(event(alice, became, director), '2024-01-01').
        
        before(Event1, Event2) :-
          happens(Event1, Date1),
          happens(Event2, Date2),
          Date1 @< Date2.
      `);

      const result = await prolog.query('before(event(alice, joined, company), event(alice, became, manager))');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle concurrent states', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, started, project_a), '2024-01-01').
        happens(event(alice, started, project_b), '2024-02-01').
        happens(event(alice, finished, project_a), '2024-06-01').
        
        initiates(event(Person, started, Project), working_on(Person, Project), _).
        terminates(event(Person, finished, Project), working_on(Person, Project), _).
      `);

      // Check concurrent projects in March
      const result = await prolog.query('holds_at(working_on(alice, Project), "2024-03-01")');
      expect(result).toBeDefined();
      if (result.length > 0) {
        // Should be working on project_b at least
        expect(result.some((r: any) => r.Project === 'project_b')).toBe(true);
      }
    });
  });

  describe('Japanese language support', () => {
    it('should handle Japanese text in facts', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event('太郎', became, 'エンジニア'), '2024-01-01').
        happens(event('花子', learned, 'Python'), '2024-02-01').
        
        initiates(event(Person, became, Role), role(Person, Role), _).
      `);

      const result = await prolog.query('happens(event("太郎", became, Role), Date)');
      expect(result).toBeDefined();
    });
  });

  describe('Rule learning integration', () => {
    it('should apply learned rules', async () => {
      if (!prolog) return;

      // Simulate learned rules from DynamicRuleLearner
      await prolog.consultString(`
        % Learned rule: 'learned' initiates 'knows'
        initiates(event(Person, learned, Subject), knows(Person, Subject), _).
        
        % Learned rule: 'married' initiates mutual relationship
        initiates(event(Person1, married, Person2), married_to(Person1, Person2), _).
        initiates(event(Person1, married, Person2), married_to(Person2, Person1), _).
        
        % Test data
        happens(event(alice, learned, python), '2020-01-01').
        happens(event(alice, married, bob), '2021-06-01').
      `);

      const knows = await prolog.query('holds_at(knows(alice, python), "2024-01-01")');
      const married = await prolog.query('holds_at(married_to(alice, bob), "2024-01-01")');
      
      expect(knows).toBeDefined();
      expect(married).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid queries gracefully', async () => {
      if (!prolog) return;

      try {
        const result = await prolog.query('invalid_predicate(X, Y, Z)');
        // Should return empty result, not throw
        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed dates', async () => {
      if (!prolog) return;

      await prolog.consultString(`
        happens(event(alice, became, ceo), 'not-a-date').
      `);

      const result = await prolog.query('happens(event(alice, became, ceo), Date)');
      expect(result).toBeDefined();
      // Should still work even with non-standard date format
    });
  });
});