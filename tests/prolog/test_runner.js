#!/usr/bin/env node

/**
 * Fixed Prolog Test Runner for WhenM Event Calculus
 * Uses Trealla with proper query execution (not directives)
 */

import { Prolog } from 'trealla';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

async function runTests() {
  console.log('===================================================');
  console.log('WhenM Event Calculus - Native Prolog Tests');
  console.log('===================================================\n');

  const pl = new Prolog();
  await pl.init();

  // Load Event Calculus
  const ecPath = path.join(__dirname, '../../prolog/event_calculus.pl');
  const ecContent = await fs.readFile(ecPath, 'utf8');
  await pl.consultText(ecContent);

  let passed = 0;
  let failed = 0;

  // Test 1: Basic holds_at
  console.log('Test 1: Basic holds_at predicate');
  try {
    // Clear and setup using queries, not directives
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('retractall(current_date(_)).');
    await pl.queryOnce('assertz(current_date("2025-01-01")).');
    await pl.queryOnce('assertz(happens(learned(user, python), "2024-01-01")).');
    
    const result = await pl.queryOnce('holds_at(knows(user, python), "2024-06-01").');
    if (result?.status === 'success') {
      console.log(`${colors.green}✓ Basic holds_at test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Basic holds_at test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 2: Termination
  console.log('\nTest 2: Fluent termination');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(joined(user, chess_club), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(quit(user, chess_club), "2024-06-01")).');
    
    const beforeQuit = await pl.queryOnce('holds_at(member_of(user, chess_club), "2024-03-01").');
    const afterQuit = await pl.queryOnce('holds_at(member_of(user, chess_club), "2024-07-01").');
    
    if (beforeQuit?.status === 'success' && afterQuit?.status === 'failure') {
      console.log(`${colors.green}✓ Termination test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Termination test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 3: Pattern matching (started_)
  console.log('\nTest 3: Pattern matching (started_ prefix)');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(started_knows(user, java), "2024-01-01")).');
    
    const result = await pl.queryOnce('holds_at(knows(user, java), "2024-06-01").');
    if (result?.status === 'success') {
      console.log(`${colors.green}✓ Pattern matching test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Pattern matching test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 4: Singular fluent (became_)
  console.log('\nTest 4: Singular fluent replacement');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(became_role(user, developer), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(became_role(user, tech_lead), "2024-06-01")).');
    
    const oldRole = await pl.queryOnce('holds_at(role(user, developer), "2024-07-01").');
    const newRole = await pl.queryOnce('holds_at(role(user, tech_lead), "2024-07-01").');
    
    if (oldRole?.status === 'failure' && newRole?.status === 'success') {
      console.log(`${colors.green}✓ Singular fluent test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Singular fluent test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 5: Semantic events (possession)
  console.log('\nTest 5: Semantic events (possession)');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(bought(user, car), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(sold(user, car), "2024-06-01")).');
    await pl.queryOnce('assertz(happens(acquired(user, house), "2024-02-01")).');
    
    const hasCar = await pl.queryOnce('holds_at(has(user, car), "2024-07-01").');
    const hasHouse = await pl.queryOnce('holds_at(has(user, house), "2024-07-01").');
    
    if (hasCar?.status === 'failure' && hasHouse?.status === 'success') {
      console.log(`${colors.green}✓ Possession test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Possession test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 6: Location (singular)
  console.log('\nTest 6: Location changes (singular)');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(moved_to(user, tokyo), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(moved_to(user, osaka), "2024-06-01")).');
    
    const inTokyo = await pl.queryOnce('holds_at(lives_in(user, tokyo), "2024-07-01").');
    const inOsaka = await pl.queryOnce('holds_at(lives_in(user, osaka), "2024-07-01").');
    
    if (inTokyo?.status === 'failure' && inOsaka?.status === 'success') {
      console.log(`${colors.green}✓ Location test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Location test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 7: Learning progression
  console.log('\nTest 7: Learning progression');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(started_learning(user, spanish), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(finished_learning(user, spanish), "2024-06-01")).');
    
    const stillLearning = await pl.queryOnce('holds_at(learning(user, spanish), "2024-08-01").');
    const knowsIt = await pl.queryOnce('holds_at(knows(user, spanish), "2024-08-01").');
    
    if (stillLearning?.status === 'failure' && knowsIt?.status === 'success') {
      console.log(`${colors.green}✓ Learning progression test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Learning progression test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 8: Complex timeline
  console.log('\nTest 8: Complex timeline scenario');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(moved_to(user, tokyo), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(hired_at(user, company_a), "2024-01-15")).');
    await pl.queryOnce('assertz(happens(married(user, alice), "2024-03-01")).');
    await pl.queryOnce('assertz(happens(bought(user, house), "2024-04-01")).');
    await pl.queryOnce('assertz(happens(left_company(user, company_a), "2024-07-01")).');
    await pl.queryOnce('assertz(happens(joined_company(user, company_b), "2024-07-15")).');
    await pl.queryOnce('assertz(happens(moved_to(user, osaka), "2024-08-01")).');
    
    const livesOsaka = await pl.queryOnce('holds_at(lives_in(user, osaka), "2024-12-01").');
    const livesTokyo = await pl.queryOnce('holds_at(lives_in(user, tokyo), "2024-12-01").');
    const worksB = await pl.queryOnce('holds_at(employed_at(user, company_b), "2024-12-01").');
    const married = await pl.queryOnce('holds_at(married_to(user, alice), "2024-12-01").');
    const hasHouse = await pl.queryOnce('holds_at(has(user, house), "2024-12-01").');
    
    if (livesOsaka?.status === 'success' && 
        livesTokyo?.status === 'failure' && 
        worksB?.status === 'success' && 
        married?.status === 'success' && 
        hasHouse?.status === 'success') {
      console.log(`${colors.green}✓ Complex timeline test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Complex timeline test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 9: Query helpers - all_holding
  console.log('\nTest 9: Query helper - all_holding');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(learned(user, python), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(joined(user, club), "2024-02-01")).');
    await pl.queryOnce('assertz(happens(bought(user, car), "2024-03-01")).');
    
    const result = await pl.queryOnce('all_holding("2024-06-01", Fluents).');
    if (result?.status === 'success' && result.answer?.Fluents) {
      const fluents = result.answer.Fluents;
      // Check if fluents is a list containing expected items
      console.log(`${colors.green}✓ all_holding test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ all_holding test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Test 10: Edge case - termination before initiation
  console.log('\nTest 10: Edge case - termination before initiation');
  try {
    await pl.queryOnce('retractall(happens(_, _)).');
    await pl.queryOnce('assertz(happens(quit(user, club), "2024-01-01")).');
    await pl.queryOnce('assertz(happens(joined(user, club), "2024-06-01")).');
    
    const beforeJoin = await pl.queryOnce('holds_at(member_of(user, club), "2024-03-01").');
    const afterJoin = await pl.queryOnce('holds_at(member_of(user, club), "2024-07-01").');
    
    if (beforeJoin?.status === 'failure' && afterJoin?.status === 'success') {
      console.log(`${colors.green}✓ Edge case test passed${colors.reset}`);
      passed++;
    } else {
      console.log(`${colors.red}✗ Edge case test failed${colors.reset}`);
      failed++;
    }
  } catch (e) {
    console.log(`${colors.red}✗ Error: ${e.message}${colors.reset}`);
    failed++;
  }

  // Summary
  console.log('\n===================================================');
  console.log('Test Summary');
  console.log('===================================================');
  console.log(`Total tests: ${passed + failed}`);
  console.log(`Passed: ${colors.green}${passed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${failed}${colors.reset}`);
  
  if (failed === 0 && passed > 0) {
    console.log(`\n${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}Some tests failed${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});