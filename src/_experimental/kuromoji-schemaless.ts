/**
 * Kuromoji + Prologスキーマレスエンジン
 * 
 * 方針：
 * - 形態素解析はkuromojiに100%委託
 * - 品詞情報を使って主語・動詞・目的語を判定
 * - 動詞の原形もkuromojiから取得
 * - 自前の言語処理は一切しない
 */

import type { WhenMEngine } from './index.js';
import kuromoji from 'kuromoji';

interface Token {
  surface_form: string;      // 表層形
  pos: string;               // 品詞
  pos_detail_1: string;      // 品詞細分類1  
  pos_detail_2: string;      // 品詞細分類2
  pos_detail_3: string;      // 品詞細分類3
  basic_form: string;        // 基本形（原形）
}

export class KuromojiSchemalessEngine {
  private tokenizer: any = null;
  
  constructor(private engine: WhenMEngine) {}
  
  /**
   * 初期化：辞書をロード
   */
  async initialize(): Promise<void> {
    // Kuromojiの辞書をロード
    this.tokenizer = await new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err: any, tokenizer: any) => {
          if (err) reject(err);
          else resolve(tokenizer);
        });
    });
    
    // 基本的なProlog推論ルール
    const rules = `
      % 汎用的な因果関係
      initiates(action(Verb, Subject, Object), state(Subject, Verb, Object), _).
      
      % よくある動詞の効果
      initiates(action("引っ越す", P, L), at(P, L), _).
      initiates(action("move", P, L), at(P, L), _).
      initiates(action("学ぶ", P, S), knows(P, S), _).
      initiates(action("learn", P, S), knows(P, S), _).
      
      % 状態の問い合わせ
      current_state(Subject, Predicate, Object) :-
        holds_at(state(Subject, Predicate, Object), now).
      current_state(Subject, Predicate, Object) :-
        holds_at(Predicate(Subject, Object), now).
    `.trim();
    
    await this.engine.loadFacts(rules);
  }
  
  /**
   * 自然言語を記憶
   * Kuromojiで解析してPrologに変換
   */
  async remember(text: string, date: string): Promise<void> {
    if (!this.tokenizer) await this.initialize();
    
    const tokens: Token[] = this.tokenizer.tokenize(text);
    
    // 品詞情報から主語・動詞・目的語を抽出
    const parsed = this.extractSVO(tokens);
    
    // Prologイベントに変換
    const event = `action("${parsed.verb}", "${parsed.subject}", "${parsed.object || 'null'}")`;
    
    await this.engine.assertEvent(event, date);
  }
  
  /**
   * 質問に答える
   */
  async ask(question: string): Promise<string> {
    if (!this.tokenizer) await this.initialize();
    
    const tokens: Token[] = this.tokenizer.tokenize(question);
    
    // 質問の種類を判定
    const queryInfo = this.analyzeQuestion(tokens);
    
    // Prologクエリ構築
    const query = this.buildQuery(queryInfo);
    
    const results = await this.engine.query(query);
    
    return this.formatAnswer(results, queryInfo.type);
  }
  
  /**
   * 主語・動詞・目的語を抽出
   * Kuromojiの品詞情報を使用
   */
  private extractSVO(tokens: Token[]): any {
    let subject = '';
    let verb = '';
    let object = '';
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      
      // 名詞の後に「が」「は」→ 主語
      if (token.pos === '名詞' && i + 1 < tokens.length) {
        const next = tokens[i + 1];
        if (next.surface_form === 'が' || next.surface_form === 'は') {
          subject = token.surface_form;
        }
        // 「を」「に」の前の名詞 → 目的語
        else if (next.surface_form === 'を' || next.surface_form === 'に') {
          object = token.surface_form;
        }
      }
      
      // 動詞 → 基本形を使う
      if (token.pos === '動詞') {
        verb = token.basic_form || token.surface_form;
      }
    }
    
    // 英語の場合（品詞タグが異なる可能性）
    if (!verb && tokens.length >= 2) {
      // 単純な仮定：1語目が主語、2語目が動詞
      subject = tokens[0].surface_form;
      verb = tokens[1].surface_form;
      object = tokens.slice(2).map(t => t.surface_form).join(' ');
    }
    
    return { subject, verb, object };
  }
  
  /**
   * 質問を解析
   */
  private analyzeQuestion(tokens: Token[]): any {
    let type = 'general';
    let subject = '';
    
    for (const token of tokens) {
      // 疑問詞で質問タイプを判定
      if (token.surface_form === 'どこ' || token.surface_form.toLowerCase() === 'where') {
        type = 'location';
      } else if (token.surface_form === '何' || token.surface_form.toLowerCase() === 'what') {
        type = 'knowledge';
      }
      
      // 名詞を主語として抽出
      if (token.pos === '名詞' && !subject) {
        subject = token.surface_form;
      }
    }
    
    return { type, subject };
  }
  
  /**
   * Prologクエリ構築
   */
  private buildQuery(queryInfo: any): string {
    const { type, subject } = queryInfo;
    
    if (type === 'location') {
      return `current_state("${subject}", _, Location)`;
    }
    
    if (type === 'knowledge') {
      return `current_state("${subject}", "knows", Knowledge)`;
    }
    
    return `current_state("${subject}", _, _)`;
  }
  
  /**
   * 回答フォーマット
   */
  private formatAnswer(results: any[], type: string): string {
    if (results.length === 0) {
      return 'わかりません';
    }
    
    const value = results[0].Location || 
                  results[0].Knowledge || 
                  results[0].X || 
                  '不明';
                  
    return value === 'null' ? 'わかりません' : value;
  }
}

/**
 * Kuromojiベースのスキーマレスエンジンを作成
 */
export async function createKuromojiSchemalessWhenM() {
  const { createEngine } = await import('./index.js');
  const engine = await createEngine({ 
    currentDate: new Date().toISOString().split('T')[0] 
  });
  const schemaless = new KuromojiSchemalessEngine(engine);
  await schemaless.initialize();
  return schemaless;
}