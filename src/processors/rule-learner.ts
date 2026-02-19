/**
 * Dynamic Rule Learner for WhenM
 *
 * Learns and manages Event Calculus rules dynamically
 */

import type { WhenMEngine } from '../index.js';
import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

interface LearnedRule {
  type: 'state_change' | 'instantaneous' | 'continuous';
  initiates?: Array<{ fluent: string; pattern?: string }>;
  terminates?: Array<{ fluent: string; pattern?: string }>;
}

/**
 * Dynamic Rule Learner
 */
export class DynamicRuleLearner {
  private learnedRules = new Map<string, LearnedRule>();
  private ruleCache = new Map<string, string>();
  private engine: WhenMEngine;
  private llm: UnifiedLLMProvider;

  constructor(engine: WhenMEngine, llm: UnifiedLLMProvider) {
    this.engine = engine;
    this.llm = llm;
  }

  /**
   * Learn rules dynamically from verbs
   */
  async learnVerb(verb: string, exampleContext: string): Promise<void> {
    if (this.learnedRules.has(verb)) {
      return;
    }

    const rules = await this.llm.generateRules(verb, exampleContext);
    this.learnedRules.set(verb, rules as LearnedRule);

    const prologRules: string[] = [];

    if (rules.initiates) {
      for (const init of rules.initiates) {
        const pattern = init.pattern || `${init.fluent}(Subject, Object)`;
        prologRules.push(
          `initiates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }

    if (rules.terminates) {
      for (const term of rules.terminates) {
        const pattern = term.pattern || `${term.fluent}(Subject, _)`;
        prologRules.push(
          `terminates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }

    if (rules.type === 'instantaneous') {
      prologRules.push(`instantaneous("${verb}").`);
    }

    const ruleString = prologRules.join('\n');
    this.ruleCache.set(verb, ruleString);
    if (this.engine.loadFacts) {
      await this.engine.loadFacts(ruleString);
    }
  }

  /**
   * Get learned rules
   */
  getLearnedRules(): Map<string, LearnedRule> {
    return this.learnedRules;
  }

  /**
   * Export rules (for persistence)
   */
  exportRules(): string {
    return JSON.stringify(
      Array.from(this.learnedRules.entries()),
      null,
      2
    );
  }

  /**
   * Import rules (for restoration)
   */
  async importRules(rulesJson: string): Promise<void> {
    try {
      const rules = JSON.parse(rulesJson);
      for (const [verb, rule] of rules) {
        this.learnedRules.set(verb, rule);

        const cachedRule = this.ruleCache.get(verb);
        if (cachedRule && this.engine.loadFacts) {
          await this.engine.loadFacts(cachedRule);
        }
      }
    } catch {
      // Failed to import rules - silently continue
    }
  }

  /**
   * Get rules for specific verb
   */
  getRuleForVerb(verb: string): LearnedRule | undefined {
    return this.learnedRules.get(verb);
  }

  /**
   * Get cached Prolog rules
   */
  getCachedPrologRule(verb: string): string | undefined {
    return this.ruleCache.get(verb);
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.learnedRules.clear();
    this.ruleCache.clear();
  }
}
