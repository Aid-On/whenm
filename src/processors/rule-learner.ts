/**
 * Dynamic Rule Learner for WhenM
 * 
 * Learns and manages Event Calculus rules dynamically
 */

import type { WhenMEngine } from '../index.js';
import type { UnifiedLLMProvider } from '../providers/llm-provider.js';

/**
 * 動的ルール学習器
 */
export class DynamicRuleLearner {
  private learnedRules = new Map<string, any>();
  private ruleCache = new Map<string, string>();
  
  constructor(
    private engine: WhenMEngine,
    private llm: UnifiedLLMProvider
  ) {}
  
  /**
   * 動詞から動的にルールを学習
   */
  async learnVerb(verb: string, exampleContext: string): Promise<void> {
    // キャッシュチェック
    if (this.learnedRules.has(verb)) {
      return;
    }
    
    // LLMに因果関係ルールを生成させる
    const rules = await this.llm.generateRules(verb, exampleContext);
    
    // ルールを保存
    this.learnedRules.set(verb, rules);
    
    // Prologルールに変換
    const prologRules: string[] = [];
    
    // initiatesルール
    if (rules.initiates) {
      for (const init of rules.initiates) {
        const pattern = init.pattern || `${init.fluent}(Subject, Object)`;
        prologRules.push(
          `initiates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }
    
    // terminatesルール
    if (rules.terminates) {
      for (const term of rules.terminates) {
        const pattern = term.pattern || `${term.fluent}(Subject, _)`;
        prologRules.push(
          `terminates(event(Subject, "${verb}", Object), ${pattern}, _).`
        );
      }
    }
    
    // 瞬間的アクション
    if (rules.type === 'instantaneous') {
      prologRules.push(
        `instantaneous("${verb}").`
      );
    }
    
    // Prologエンジンにロード
    const ruleString = prologRules.join('\n');
    this.ruleCache.set(verb, ruleString);
    if (this.engine.loadFacts) {
      await this.engine.loadFacts(ruleString);
    }
  }
  
  /**
   * 学習済みルールを取得
   */
  getLearnedRules(): Map<string, any> {
    return this.learnedRules;
  }
  
  /**
   * ルールをエクスポート（永続化用）
   */
  exportRules(): string {
    return JSON.stringify(
      Array.from(this.learnedRules.entries()),
      null,
      2
    );
  }
  
  /**
   * ルールをインポート（復元用）
   */
  async importRules(rulesJson: string): Promise<void> {
    try {
      const rules = JSON.parse(rulesJson);
      for (const [verb, rule] of rules) {
        this.learnedRules.set(verb, rule);
        
        // Prologルールも復元
        if (this.ruleCache.has(verb) && this.engine.loadFacts) {
          await this.engine.loadFacts(this.ruleCache.get(verb)!);
        }
      }
    } catch (error) {
      console.error('Failed to import rules:', error);
    }
  }
  
  /**
   * 特定の動詞のルールを取得
   */
  getRuleForVerb(verb: string): any | undefined {
    return this.learnedRules.get(verb);
  }
  
  /**
   * キャッシュされたPrologルールを取得
   */
  getCachedPrologRule(verb: string): string | undefined {
    return this.ruleCache.get(verb);
  }
  
  /**
   * すべてのルールをクリア
   */
  clearRules(): void {
    this.learnedRules.clear();
    this.ruleCache.clear();
  }
}