#!/usr/bin/env node

/**
 * Debug NaturalLanguageQuery
 * 
 * NLクエリの詳細デバッグ
 */

import { whenm } from '../../dist/whenm.js';
import { NaturalLanguageQuery } from '../../dist/natural-query.js';
import { QueryBuilder } from '../../dist/query-builder.js';

async function debugNL() {
  console.log('🔍 Debugging NaturalLanguageQuery\n');
  
  // Use mock for speed
  const memory = await whenm.auto();
  
  // Store test event
  await memory.remember("Alice learned Python", "2024-01-15");
  
  const engine = memory.getEngine();
  
  // Test 1: Direct engine query
  console.log('1️⃣ Direct engine.allEvents():');
  const allEvents = await engine.allEvents();
  console.log('Result:', allEvents);
  console.log();
  
  // Test 2: QueryBuilder directly
  console.log('2️⃣ QueryBuilder directly:');
  const qb = new QueryBuilder(engine);
  const qbResult = await qb.subject('alice').execute();
  console.log('Result:', qbResult);
  console.log();
  
  // Test 3: QueryBuilder with verb filter
  console.log('3️⃣ QueryBuilder with verb filter:');
  const qb2 = new QueryBuilder(engine);
  const qbResult2 = await qb2.verb('learned').execute();
  console.log('Result:', qbResult2);
  console.log();
  
  // Test 4: Raw Prolog query
  console.log('4️⃣ Raw Prolog query:');
  const rawQuery = 'event_at(event(Subject, Verb, Object), Time)';
  const rawResult = await engine.query(rawQuery);
  console.log('Result:', rawResult);
  console.log();
  
  // Test 5: NaturalLanguageQuery
  console.log('5️⃣ NaturalLanguageQuery:');
  const nlq = new NaturalLanguageQuery(engine, memory.engine.getLLM());
  const nlResult = await nlq.query("What did Alice learn?");
  console.log('Result:', nlResult);
  console.log();
  
  // Test 6: Check parseResults in QueryBuilder
  console.log('6️⃣ Testing QueryBuilder.parseResults:');
  const qb3 = new QueryBuilder(engine);
  // Manually call buildPrologQuery
  const prologQuery = qb3['buildPrologQuery']();
  console.log('Prolog query:', prologQuery);
  const results = await engine.query(prologQuery);
  console.log('Raw query results:', results);
  const parsed = qb3['parseResults'](results);
  console.log('Parsed results:', parsed);
}

debugNL().catch(console.error);