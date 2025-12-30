/**
 * スキーマレス推論エンジン
 * 
 * 自然言語を直接Prologに変換し、論理推論で回答を導く
 * 固定マッピング（schema.ts）に依存しない純粋な実装
 */

import type { WhenMEngine } from './index.js';
import { NLPParser } from './nlp-parser.js';

export interface SchemalessOptions {
  /** デバッグログ出力 */
  debug?: boolean;
  /** 初期推論ルール（Prolog） */
  initialRules?: string[];
}

export class SchemalessEngine {
  
  constructor(
    private engine: WhenMEngine,
    private options: SchemalessOptions = {}
  ) {
    this.initializeRules();
  }
  
  /**
   * 基本的な推論ルールを初期化
   * これらは「ヒント」であり、強制ではない
   */
  private async initializeRules() {
    const baseRules = `
      % 基本的なinitiatesルール（Event Calculusに必須）
      initiates(moved(Person, Place), lives_in(Person, Place), _).
      initiates(learned(Person, Skill), knows(Person, Skill), _).
      initiates(became(Person, Role), role(Person, Role), _).
      initiates(joined(Person, Group), member_of(Person, Group), _).
      
      % 日本語動詞のinitiatesルール
      initiates(引っ越した(Person, Place), lives_in(Person, Place), _).
      initiates(学んだ(Person, Skill), knows(Person, Skill), _).
      initiates(なった(Person, Role), role(Person, Role), _).
      initiates(参加した(Person, Group), member_of(Person, Group), _).
      
      % 汎用ルール：未知の動詞も受け入れる
      initiates(Event, state(Subject, Verb, Object), Time) :-
        Event =.. [Verb, Subject, Object],
        \\+ (Verb = moved; Verb = learned; Verb = became; Verb = joined;
            Verb = 引っ越した; Verb = 学んだ; Verb = なった; Verb = 参加した).
    `.trim();
    
    // ユーザー定義ルールを追加
    const allRules = [
      baseRules,
      ...(this.options.initialRules || [])
    ].join('\n');
    
    await this.engine.loadFacts(allRules);
  }
  
  /**
   * 自然言語を記憶（スキーマレス）
   * 
   * @example
   * await engine.remember("太郎が東京に引っ越した", "2024-01-01");
   * await engine.remember("Alice learned Python", "2024-06-01");
   * await engine.remember("ロボットが起動した", "2024-12-01");
   */
  async remember(text: string, date: string): Promise<void> {
    if (this.options.debug) {
      console.log(`[SchemalessEngine] Processing: "${text}"`);
    }
    
    // 自然言語を解析（どんな言語でも試みる）
    const parsed = this.parseUniversal(text);
    
    // Prologイベントとして記録
    const event = this.toPrologEvent(parsed);
    await this.engine.assertEvent(event, date);
    
    // 動的に推論ルールを学習（オプション）
    await this.learnPattern(parsed);
  }
  
  /**
   * 自然言語で質問（スキーマレス）
   * 
   * @example
   * await engine.ask("太郎はどこに住んでいる？");
   * // → "東京"
   * 
   * await engine.ask("What does Alice know?");
   * // → "Python"
   */
  async ask(question: string, date?: string): Promise<string> {
    if (this.options.debug) {
      console.log(`[SchemalessEngine] Question: "${question}"`);
    }
    
    // 質問を解析
    const { queryType, subject, predicate } = this.parseQuestion(question);
    
    // Prologクエリに変換
    const query = this.buildQuery(queryType, subject, predicate, date);
    
    // 推論実行
    const results = await this.engine.query(query);
    
    // 自然言語で回答
    return this.formatAnswer(results, queryType);
  }
  
  /**
   * 新しいパターンを学習
   */
  async teach(verb: string, effect: string): Promise<void> {
    const rule = `similar(${verb}, ${effect}).`;
    await this.engine.loadFacts(rule);
    
    if (this.options.debug) {
      console.log(`[SchemalessEngine] Learned: ${verb} → ${effect}`);
    }
  }
  
  /**
   * 汎用パーサー（言語を問わない）
   */
  private parseUniversal(text: string): any {
    // 最小限の分割ルール：助詞で分割するだけ
    // 日本語: が、を、に、へ、と、で、から、まで、は
    // 英語: スペース
    
    // 日本語の助詞でスプリット
    const jpParticles = /([がをにへとでからまでは])/;
    const jpParts = text.split(jpParticles).filter(p => p && !p.match(jpParticles));
    
    if (jpParts.length >= 2) {
      // 最初が主語、最後が動詞、間が目的語
      const subject = jpParts[0].trim();
      const verb = jpParts[jpParts.length - 1]
        .replace(/した$/, '')     // 〜した → 動詞の原形
        .replace(/んだ$/, 'ぶ')    // 学んだ → 学ぶ
        .replace(/った$/, 'る')    // 作った → 作る
        .trim();
      const object = jpParts.length > 2 ? jpParts.slice(1, -1).join('').trim() : null;
      
      if (subject && verb) {
        return { subject, verb, object };
      }
    }
    
    // 英語: 単純なスペース区切り
    const words = text.split(/\s+/);
    if (words.length >= 2) {
      return {
        subject: words[0],
        verb: words[1].replace(/ed$/, ''),  // learned → learn
        object: words.slice(2).join(' ').replace(/^to\s+/, '') || null
      };
    }
    
    // どちらでもない場合
    return {
      subject: 'unknown',
      verb: text.replace(/\s+/g, '_'),
      object: null
    };
  }
  
  /**
   * 質問を解析
   */
  private parseQuestion(question: string): any {
    // 「〜はどこ？」「〜は何？」パターン
    if (question.includes('どこ') || question.includes('where')) {
      const subject = question.match(/(.+?)[はが]/)?.[1] || 
                      question.match(/where.+?(\w+)/i)?.[1] ||
                      'unknown';
      return { queryType: 'location', subject, predicate: 'located_at' };
    }
    
    if (question.includes('何を知') || question.includes('know')) {
      const subject = question.match(/(.+?)[はが]/)?.[1] || 
                      question.match(/what.+?(\w+)/i)?.[1] ||
                      'unknown';
      return { queryType: 'knowledge', subject, predicate: 'knows' };
    }
    
    // 汎用質問
    return { queryType: 'general', subject: 'unknown', predicate: 'state' };
  }
  
  /**
   * Prologイベントに変換
   */
  private toPrologEvent(parsed: any): string {
    const { subject, verb, object } = parsed;
    
    if (object) {
      return `${verb}("${subject}", "${object}")`;
    } else {
      return `${verb}("${subject}")`;
    }
  }
  
  /**
   * Prologクエリを構築
   */
  private buildQuery(queryType: string, subject: string, predicate: string, date?: string): string {
    const dateStr = date || new Date().toISOString().split('T')[0];
    
    // 類似動詞も含めて検索
    return `
      (holds_at(${predicate}("${subject}", X), "${dateStr}");
       (similar(_, ${predicate}), holds_at(state("${subject}", _, X), "${dateStr}")))
    `.trim();
  }
  
  /**
   * 回答をフォーマット
   */
  private formatAnswer(results: any[], queryType: string): string {
    if (results.length === 0) {
      return 'わかりません';
    }
    
    const values = results.map(r => r.X || r.Value || '不明');
    
    if (queryType === 'location') {
      return values[0];
    }
    
    if (queryType === 'knowledge') {
      return values.join('、');
    }
    
    return JSON.stringify(values);
  }
  
  /**
   * パターンを動的に学習
   */
  private async learnPattern(parsed: any): Promise<void> {
    // 頻出パターンを自動的に記憶する実装
    // （将来的な拡張ポイント）
  }
}

/**
 * スキーマレスWhenMを作成
 */
export async function createSchemalessWhenM(options: SchemalessOptions = {}) {
  const { createEngine } = await import('./index.js');
  const engine = await createEngine({ currentDate: new Date().toISOString().split('T')[0] });
  return new SchemalessEngine(engine, options);
}