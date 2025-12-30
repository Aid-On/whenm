/**
 * Dynamic Rule Learner for WhenM
 * 
 * Learns and manages Event Calculus rules dynamically
 */

import type { WhenMEngine } from '../index.js';
import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

/**
 * Dynamic Rule Learner
 */
export class DynamicRuleLearner {
  private learnedRules = new Map<string, any>();
  private ruleCache = new Map<string, string>();
  
  constructor(
    private engine: WhenMEngine,
    private llm: UnifiedLLMProvider
  ) {}
  
  /**
   * Learn rules dynamically from verbs
   */
  async learnVerb(verb: string, exampleContext: string): Promise<void> {
    // Check cache
    if (this.learnedRules.has(verb)) {
      return;
    }
    
    // Generate causal relationship rules using LLM
    const rules = await this.llm.generateRules(verb, exampleContext);
    
    // Save rules
    this.learnedRules.set(verb, rules);
    
    // Convert to Prolog rules
    const prologRules: string[] = [];
    
    // initiates rules
    if (rules.initiates) {
      for (const init of rules.initiates) {
        const pattern = init.pattern || `${init.fluent}(Subject, Object)`;
        prologRules.push(
          `initiates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }
    
    // terminates rules
    if (rules.terminates) {
      for (const term of rules.terminates) {
        const pattern = term.pattern || `${term.fluent}(Subject, _)`;
        prologRules.push(
          `terminates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }
    
    // Instantaneous actions
    if (rules.type === 'instantaneous') {
      prologRules.push(
        `instantaneous("${verb}").`
      );
    }
    
    // Load into Prolog engine
    const ruleString = prologRules.join('\n');
    this.ruleCache.set(verb, ruleString);
    if (this.engine.loadFacts) {
      await this.engine.loadFacts(ruleString);
    }
  }
  
  /**
   * Get learned rules
   */
  getLearnedRules(): Map<string, any> {
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
        
        // Also restore Prolog rules
        if (this.ruleCache.has(verb) && this.engine.loadFacts) {
          await this.engine.loadFacts(this.ruleCache.get(verb)!);
        }
      }
    } catch (error) {
      console.error('Failed to import rules:', error);
    }
  }
  
  /**
   * Get rules for specific verb
   */
  getRuleForVerb(verb: string): any | undefined {
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