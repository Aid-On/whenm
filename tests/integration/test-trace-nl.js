#!/usr/bin/env node

/**
 * Trace NL Query Execution
 * 
 * NLクエリの実行をトレース
 */

import { whenm } from '../../dist/whenm.js';
import { NaturalLanguageQuery } from '../../dist/natural-query.js';
import { MockUnifiedProvider } from '../../dist/final-engine.js';

async function traceNL() {
  console.log('🔍 Tracing NL Query Execution\n');
  
  // Use mock for speed
  const memory = await whenm.auto();
  
  // Store test event
  await memory.remember("Alice learned Python", "2024-01-15");
  
  const engine = memory.getEngine();
  const llm = new MockUnifiedProvider();
  
  // Override llm.complete to see what's happening
  const originalComplete = llm.complete.bind(llm);
  llm.complete = async (prompt, options) => {
    console.log('📤 LLM Complete called:');
    console.log('  Options:', options);
    console.log('  Prompt snippet:', prompt.slice(0, 200));
    
    if (options?.format === 'json') {
      const query = prompt.toLowerCase();
      
      // Better parsing
      const entities = [];
      if (query.includes('alice')) entities.push('alice');
      
      const verbs = [];
      if (query.includes('learn')) verbs.push('learned');
      
      const response = {
        action: 'query',
        entities: entities.length > 0 ? entities : undefined,
        filters: verbs.length > 0 ? { verbs } : undefined
      };
      
      console.log('  Response:', JSON.stringify(response));
      return JSON.stringify(response);
    }
    
    return originalComplete(prompt, options);
  };
  
  const nlq = new NaturalLanguageQuery(engine, llm);
  
  console.log('🎯 Executing query: "What did Alice learn?"\n');
  
  // Trace parseIntent
  console.log('Step 1: parseIntent');
  const intent = await nlq.parseIntent("What did Alice learn?");
  console.log('Intent:', intent);
  console.log();
  
  // Manually call handleQueryIntent
  console.log('Step 2: handleQueryIntent');
  const result = await nlq['handleQueryIntent'](intent);
  console.log('Result:', result);
  console.log();
  
  // Full query
  console.log('Step 3: Full query');
  const fullResult = await nlq.query("What did Alice learn?");
  console.log('Full result:', fullResult);
}

traceNL().catch(console.error);