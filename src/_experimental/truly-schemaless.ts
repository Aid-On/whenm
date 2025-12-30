/**
 * 真のスキーマレスエンジン
 * 
 * 原則:
 * 1. 言語解析をしない（形態素解析、品詞タグ付けなし）
 * 2. 動詞の原形化をしない
 * 3. 単純なトークン分割のみ
 * 4. Prologに論理推論を任せる
 */

import type { WhenMEngine } from './index.js';

export class TrulySchemalessEngine {
  constructor(private engine: WhenMEngine) {
    this.initialize();
  }
  
  private async initialize() {
    // 最小限のルール：Prologに「似ている」関係を教える
    const rules = `
      % 動詞の活用形を同一視するルール
      same_action("引っ越した", "引っ越す").
      same_action("学んだ", "学ぶ").
      same_action("moved", "move").
      same_action("learned", "learn").
      
      % 推論ルール：同じアクションなら同じ効果
      initiates(Action1(S, O), Effect, T) :-
        same_action(Action1, Action2),
        initiates(Action2(S, O), Effect, T).
        
      % 基本的な因果関係（最小限）
      initiates(引っ越す(P, L), at(P, L), _).
      initiates(move(P, L), at(P, L), _).
      initiates(学ぶ(P, S), knows(P, S), _).
      initiates(learn(P, S), knows(P, S), _).
    `.trim();
    
    await this.engine.loadFacts(rules);
  }
  
  /**
   * テキストを記憶
   * 最小限の処理：トークン化のみ
   */
  async remember(text: string, date: string): Promise<void> {
    // Step 1: 単純なトークン化
    const tokens = this.tokenize(text);
    
    // Step 2: そのままPrologイベントにする
    const event = this.tokensToProlog(tokens);
    
    // Step 3: Event Calculusに記録
    await this.engine.assertEvent(event, date);
  }
  
  /**
   * 質問に答える
   */
  async ask(question: string): Promise<string> {
    // 質問のキーワードを抽出
    const tokens = this.tokenize(question);
    const query = this.buildQuery(tokens);
    
    const results = await this.engine.query(query);
    return this.formatResults(results);
  }
  
  /**
   * 最小限のトークン化
   * 助詞とスペースで分割するだけ
   */
  private tokenize(text: string): string[] {
    // 日本語助詞とスペースで分割
    return text
      .split(/[がをにへとでからまでは\s]+/)
      .filter(t => t.length > 0);
  }
  
  /**
   * トークンをPrologイベントに変換
   * ルール：[主語, 目的語..., 動詞] → 動詞(主語, 目的語)
   */
  private tokensToProlog(tokens: string[]): string {
    if (tokens.length === 0) return 'unknown()';
    
    if (tokens.length === 1) {
      return `${tokens[0]}()`;
    }
    
    // 最後のトークンを動詞と見なす
    const verb = tokens[tokens.length - 1];
    const args = tokens.slice(0, -1);
    
    // Prolog関数形式に変換
    return `${verb}(${args.map(a => `"${a}"`).join(', ')})`;
  }
  
  /**
   * クエリ構築
   */
  private buildQuery(tokens: string[]): string {
    // "どこ" or "where" → 場所を聞いている
    if (tokens.some(t => t.includes('どこ') || t.toLowerCase() === 'where')) {
      const subject = tokens[0]; // 最初のトークンを主語とする
      return `holds_at(at("${subject}", Place), now)`;
    }
    
    // "何" or "what" → 知識を聞いている
    if (tokens.some(t => t.includes('何') || t.toLowerCase() === 'what')) {
      const subject = tokens[0];
      return `holds_at(knows("${subject}", What), now)`;
    }
    
    // デフォルト
    return 'true';
  }
  
  private formatResults(results: any[]): string {
    if (results.length === 0) return 'わかりません';
    
    const values = results.map(r => 
      r.Place || r.What || r.X || '不明'
    );
    
    return values[0];
  }
}

/**
 * 真のスキーマレスWhenMを作成
 */
export async function createTrulySchemalessWhenM() {
  const { createEngine } = await import('./index.js');
  const engine = await createEngine({ 
    currentDate: new Date().toISOString().split('T')[0] 
  });
  return new TrulySchemalessEngine(engine);
}