/**
 * LLM-Powered スキーマレスエンジン
 * 
 * 革新的アプローチ：
 * - 自然言語 → Prolog変換をLLMに完全委託
 * - パーサー不要、辞書不要、ルール定義不要
 * - あらゆる言語、あらゆるドメインに対応
 */

import type { WhenMEngine } from './index.js';

export interface LLMProvider {
  generateProlog(prompt: string): Promise<string>;
}

/**
 * Groq LLMプロバイダー実装例
 */
export class GroqProvider implements LLMProvider {
  constructor(private apiKey: string) {}
  
  async generateProlog(prompt: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a Prolog expert. Convert natural language to Event Calculus Prolog.
            
Rules:
- Events: verb(subject, object) format
- States: fluent(subject, value) format  
- Use initiates/3 for causality
- Use holds_at/2 for queries
- Output ONLY valid Prolog code, no explanation`
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });
    
    const data = await response.json() as any;
    return data.choices[0].message.content.trim();
  }
}

/**
 * ローカルLLMプロバイダー（Ollama等）
 */
export class LocalLLMProvider implements LLMProvider {
  constructor(private modelName: string = 'llama3.2') {}
  
  async generateProlog(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.modelName,
        prompt: `Convert to Event Calculus Prolog (output only code):
${prompt}`,
        stream: false,
        temperature: 0.1
      })
    });
    
    const data = await response.json() as any;
    return data.response.trim();
  }
}

export class LLMSchemalessEngine {
  
  constructor(
    private engine: WhenMEngine,
    private llm: LLMProvider
  ) {
    this.initialize();
  }
  
  private async initialize() {
    // Event Calculusの基本ルールのみ定義
    const basicRules = `
      % Event Calculus基盤
      holds_at(F, T) :- 
        initiates(E, F, T1),
        happens(E, T1),
        T1 =< T,
        \\+ (
          terminates(E2, F, T2),
          happens(E2, T2),
          T1 < T2,
          T2 =< T
        ).
    `.trim();
    
    await this.engine.loadFacts(basicRules);
  }
  
  /**
   * 自然言語を記憶
   * LLMが適切なPrologイベントを生成
   */
  async remember(text: string, date: string): Promise<void> {
    // LLMにイベント生成を依頼
    const prompt = `Convert this to an Event Calculus event:
"${text}"
Date: ${date}

Example output:
moved(person, location)
learned(person, skill)`;
    
    const prologEvent = await this.llm.generateProlog(prompt);
    
    // 生成されたイベントを記録
    await this.engine.assertEvent(prologEvent, date);
    
    // LLMに因果関係ルールも生成させる
    const rulesPrompt = `Generate initiates rule for this event:
Event: ${prologEvent}
What state does this event cause?

Example output:
initiates(moved(P, L), lives_at(P, L), _).`;
    
    const rule = await this.llm.generateProlog(rulesPrompt);
    await this.engine.loadFacts(rule);
  }
  
  /**
   * 自然言語で質問
   * LLMがPrologクエリを生成
   */
  async ask(question: string, date?: string): Promise<string> {
    const dateStr = date || new Date().toISOString().split('T')[0];
    
    // LLMにクエリ生成を依頼
    const prompt = `Convert this question to a Prolog query:
"${question}"
Date: ${dateStr}

Example queries:
- "Where is X?" → holds_at(lives_at(X, Location), "${dateStr}")
- "What does X know?" → holds_at(knows(X, Skill), "${dateStr}")

Output only the Prolog query:`;
    
    const query = await this.llm.generateProlog(prompt);
    
    // クエリ実行
    const results = await this.engine.query(query);
    
    // 結果を自然言語に変換（これもLLMに依頼可能）
    if (results.length === 0) {
      return await this.generateNaturalAnswer(question, 'No results found');
    }
    
    return await this.generateNaturalAnswer(question, JSON.stringify(results));
  }
  
  /**
   * Prolog結果を自然言語に変換
   */
  private async generateNaturalAnswer(question: string, prologResults: string): Promise<string> {
    const prompt = `Convert Prolog results to natural language answer:
Question: "${question}"
Prolog results: ${prologResults}

Answer in the same language as the question.
Be concise.`;
    
    return await this.llm.generateProlog(prompt);
  }
  
  /**
   * 新しいドメイン知識を学習
   * LLMが適切なルールを生成
   */
  async learn(description: string): Promise<void> {
    const prompt = `Generate Event Calculus rules for this domain:
${description}

Include:
- initiates/3 rules for causality
- terminates/3 rules if needed
- Domain-specific predicates

Output only Prolog code:`;
    
    const rules = await this.llm.generateProlog(prompt);
    await this.engine.loadFacts(rules);
  }
}

/**
 * LLMベースのスキーマレスWhenMを作成
 */
export async function createLLMSchemalessWhenM(
  llmProvider: LLMProvider
) {
  const { createEngine } = await import('./index.js');
  const engine = await createEngine({ 
    currentDate: new Date().toISOString().split('T')[0] 
  });
  return new LLMSchemalessEngine(engine, llmProvider);
}

/**
 * 使用例
 */
export async function example() {
  // Groq APIを使用
  const groq = new GroqProvider(process.env.GROQ_API_KEY!);
  const memory = await createLLMSchemalessWhenM(groq);
  
  // どんな言語でも、どんなドメインでも動作
  await memory.remember("太郎が東京に引っ越した", "2024-01-01");
  await memory.remember("The dragon attacked the castle", "2024-02-01");
  await memory.remember("El robot aprendió español", "2024-03-01");
  await memory.remember("🤖がプログラミングを学習した", "2024-04-01");
  
  // 新しいドメイン知識を学習
  await memory.learn(`
    In a game world:
    - When a player defeats a monster, they gain experience
    - When experience reaches 100, player levels up
    - Leveling up increases health and strength
  `);
  
  await memory.remember("Player defeated goblin", "2024-05-01");
  
  // 質問もどんな言語でも
  const answer1 = await memory.ask("太郎はどこに住んでいる？");
  const answer2 = await memory.ask("What happened to the castle?");
  const answer3 = await memory.ask("What is the player's level?");
  
  console.log(answer1, answer2, answer3);
}