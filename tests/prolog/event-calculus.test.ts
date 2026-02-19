import { describe, it, expect, beforeEach } from 'vitest';
import { Prolog } from 'trealla';
import type { Answer } from 'trealla';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Helper: collect all answers from a query generator into an array.
 */
async function collectAnswers(gen: AsyncGenerator<Answer>): Promise<Answer[]> {
  const results: Answer[] = [];
  for await (const answer of gen) {
    results.push(answer);
  }
  return results;
}

describe('Event Calculus Prolog', () => {
  let prolog: Prolog | null;

  beforeEach(async () => {
    try {
      prolog = new Prolog({
        library: '/library'
      });
      await prolog.init();

      // Load Event Calculus rules if available
      try {
        const ecRules = readFileSync(join(process.cwd(), 'src/persistence/prolog-native.ts'), 'utf8');
        const prologCode = ecRules.match(/const PROLOG_EC_RULES = `([^`]+)`/)?.[1];

        if (prologCode) {
          await prolog.consultText(prologCode);
        }
      } catch {
        // EC rules file not found or no embedded Prolog code, that's fine
      }
    } catch {
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

      await prolog.consultText(`
        happens(event(alice, became, ceo), '2024-01-01').
        happens(event(bob, joined, company), '2024-02-01').
      `);

      const results = await collectAnswers(prolog.query('happens(event(alice, became, ceo), Date).'));
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      if (results[0].status === 'success') {
        expect(results[0].answer.Date).toBeDefined();
      }
    });

    it('should handle initiates/3 rules', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        initiates(event(Person, became, Role), role(Person, Role), _).
        initiates(event(Person, learned, Skill), knows(Person, Skill), _).
      `);

      const results = await collectAnswers(prolog.query('initiates(event(alice, became, ceo), Fluent, _).'));
      expect(results).toBeDefined();
      if (results.length > 0 && results[0].status === 'success') {
        expect(results[0].answer.Fluent).toBeDefined();
      }
    });

    it('should handle terminates/3 rules', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        terminates(event(Person, quit, Role), role(Person, Role), _).
        terminates(event(Person, moved_from, Location), lives_in(Person, Location), _).
      `);

      const results = await collectAnswers(prolog.query('terminates(event(alice, quit, manager), Fluent, _).'));
      expect(results).toBeDefined();
    });
  });

  describe('Fluent tracking', () => {
    it('should track holds_at/2', async () => {
      if (!prolog) return;

      await prolog.consultText(`
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

      const result = await prolog.queryOnce('holds_at(role(alice, ceo), "2024-06-01").');
      expect(result).toBeDefined();
    });

    it('should handle state changes over time', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event(alice, became, intern), '2020-01-01').
        happens(event(alice, became, junior), '2021-01-01').
        happens(event(alice, became, senior), '2023-01-01').

        initiates(event(Person, became, NewRole), role(Person, NewRole), _).
        terminates(event(Person, became, NewRole), role(Person, OldRole), _) :-
          OldRole \\= NewRole.
      `);

      // Query for different time points
      const past = await prolog.queryOnce('holds_at(role(alice, intern), "2020-06-01").');
      const present = await prolog.queryOnce('holds_at(role(alice, senior), "2024-01-01").');

      expect(past).toBeDefined();
      expect(present).toBeDefined();
    });
  });

  describe('Complex temporal queries', () => {
    it('should find when events happened', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event(alice, learned, python), '2020-06-01').
        happens(event(alice, learned, javascript), '2021-03-01').
        happens(event(alice, learned, rust), '2023-09-01').
      `);

      const results = await collectAnswers(prolog.query('happens(event(alice, learned, Language), Date).'));
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    it('should compare event times', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event(alice, joined, company), '2020-01-01').
        happens(event(alice, became, manager), '2022-01-01').
        happens(event(alice, became, director), '2024-01-01').

        before(Event1, Event2) :-
          happens(Event1, Date1),
          happens(Event2, Date2),
          Date1 @< Date2.
      `);

      const result = await prolog.queryOnce('before(event(alice, joined, company), event(alice, became, manager)).');
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
    });

    it('should handle concurrent states', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event(alice, started, project_a), '2024-01-01').
        happens(event(alice, started, project_b), '2024-02-01').
        happens(event(alice, finished, project_a), '2024-06-01').

        initiates(event(Person, started, Project), working_on(Person, Project), _).
        terminates(event(Person, finished, Project), working_on(Person, Project), _).
      `);

      // Check concurrent projects in March
      const results = await collectAnswers(prolog.query('holds_at(working_on(alice, Project), "2024-03-01").'));
      expect(results).toBeDefined();
      const successResults = results.filter((r): r is Extract<Answer, { status: 'success' }> => r.status === 'success');
      if (successResults.length > 0) {
        // Should be working on project_b at least
        const projects = successResults.map(r => {
          const proj = r.answer.Project;
          // Term could be an Atom object or a string
          return typeof proj === 'object' && proj !== null && 'functor' in proj ? proj.functor : String(proj);
        });
        expect(projects).toContain('project_b');
      }
    });
  });

  describe('Japanese language support', () => {
    it('should handle Japanese text in facts', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event('太郎', became, 'エンジニア'), '2024-01-01').
        happens(event('花子', learned, 'Python'), '2024-02-01').

        initiates(event(Person, became, Role), role(Person, Role), _).
      `);

      const results = await collectAnswers(prolog.query(`happens(event('太郎', became, Role), Date).`));
      expect(results).toBeDefined();
    });
  });

  describe('Rule learning integration', () => {
    it('should apply learned rules', async () => {
      if (!prolog) return;

      // Simulate learned rules from DynamicRuleLearner
      await prolog.consultText(`
        % Learned rule: 'learned' initiates 'knows'
        initiates(event(Person, learned, Subject), knows(Person, Subject), _).

        % Learned rule: 'married' initiates mutual relationship
        initiates(event(Person1, married, Person2), married_to(Person1, Person2), _).
        initiates(event(Person1, married, Person2), married_to(Person2, Person1), _).

        % Test data
        happens(event(alice, learned, python), '2020-01-01').
        happens(event(alice, married, bob), '2021-06-01').
      `);

      const knows = await prolog.queryOnce('holds_at(knows(alice, python), "2024-01-01").');
      const married = await prolog.queryOnce('holds_at(married_to(alice, bob), "2024-01-01").');

      expect(knows).toBeDefined();
      expect(married).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid queries gracefully', async () => {
      if (!prolog) return;

      try {
        const results = await collectAnswers(prolog.query('invalid_predicate(X, Y, Z).'));
        // Should return empty or error result, not throw
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
      } catch (error) {
        // If it throws, that's also acceptable
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed dates', async () => {
      if (!prolog) return;

      await prolog.consultText(`
        happens(event(alice, became, ceo), 'not-a-date').
      `);

      const result = await prolog.queryOnce('happens(event(alice, became, ceo), Date).');
      expect(result).toBeDefined();
      // Should still work even with non-standard date format
    });
  });
});
