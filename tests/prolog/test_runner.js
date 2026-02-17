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

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  reset: '\x1b[0m'
};

async function assertFact(pl, fact) {
  await pl.queryOnce(`assertz(${fact}).`);
}

async function clearFacts(pl) {
  await pl.queryOnce('retractall(happens(_, _)).');
}

async function runTest(pl, name, fn) {
  try {
    await clearFacts(pl);
    const result = await fn();
    if (result) {
      return { name, passed: true };
    }
    return { name, passed: false };
  } catch (e) {
    return { name, passed: false, error: e.message };
  }
}

async function testBasicHoldsAt(pl) {
  await pl.queryOnce('retractall(current_date(_)).');
  await pl.queryOnce('assertz(current_date("2025-01-01")).');
  await assertFact(pl, 'happens(learned(user, python), "2024-01-01")');
  const result = await pl.queryOnce('holds_at(knows(user, python), "2024-06-01").');
  return result?.status === 'success';
}

async function testTermination(pl) {
  await assertFact(pl, 'happens(joined(user, chess_club), "2024-01-01")');
  await assertFact(pl, 'happens(quit(user, chess_club), "2024-06-01")');
  const before = await pl.queryOnce('holds_at(member_of(user, chess_club), "2024-03-01").');
  const after = await pl.queryOnce('holds_at(member_of(user, chess_club), "2024-07-01").');
  return before?.status === 'success' && after?.status === 'failure';
}

async function testPatternMatching(pl) {
  await assertFact(pl, 'happens(started_knows(user, java), "2024-01-01")');
  const result = await pl.queryOnce('holds_at(knows(user, java), "2024-06-01").');
  return result?.status === 'success';
}

async function testSingularFluent(pl) {
  await assertFact(pl, 'happens(became_role(user, developer), "2024-01-01")');
  await assertFact(pl, 'happens(became_role(user, tech_lead), "2024-06-01")');
  const old = await pl.queryOnce('holds_at(role(user, developer), "2024-07-01").');
  const cur = await pl.queryOnce('holds_at(role(user, tech_lead), "2024-07-01").');
  return old?.status === 'failure' && cur?.status === 'success';
}

async function testPossession(pl) {
  await assertFact(pl, 'happens(bought(user, car), "2024-01-01")');
  await assertFact(pl, 'happens(sold(user, car), "2024-06-01")');
  await assertFact(pl, 'happens(acquired(user, house), "2024-02-01")');
  const car = await pl.queryOnce('holds_at(has(user, car), "2024-07-01").');
  const house = await pl.queryOnce('holds_at(has(user, house), "2024-07-01").');
  return car?.status === 'failure' && house?.status === 'success';
}

async function testLocation(pl) {
  await assertFact(pl, 'happens(moved_to(user, tokyo), "2024-01-01")');
  await assertFact(pl, 'happens(moved_to(user, osaka), "2024-06-01")');
  const tokyo = await pl.queryOnce('holds_at(lives_in(user, tokyo), "2024-07-01").');
  const osaka = await pl.queryOnce('holds_at(lives_in(user, osaka), "2024-07-01").');
  return tokyo?.status === 'failure' && osaka?.status === 'success';
}

async function testLearning(pl) {
  await assertFact(pl, 'happens(started_learning(user, spanish), "2024-01-01")');
  await assertFact(pl, 'happens(finished_learning(user, spanish), "2024-06-01")');
  const learning = await pl.queryOnce('holds_at(learning(user, spanish), "2024-08-01").');
  const knows = await pl.queryOnce('holds_at(knows(user, spanish), "2024-08-01").');
  return learning?.status === 'failure' && knows?.status === 'success';
}

async function testComplexTimeline(pl) {
  const facts = [
    'happens(moved_to(user, tokyo), "2024-01-01")',
    'happens(hired_at(user, company_a), "2024-01-15")',
    'happens(married(user, alice), "2024-03-01")',
    'happens(bought(user, house), "2024-04-01")',
    'happens(left_company(user, company_a), "2024-07-01")',
    'happens(joined_company(user, company_b), "2024-07-15")',
    'happens(moved_to(user, osaka), "2024-08-01")'
  ];
  for (const fact of facts) await assertFact(pl, fact);

  const checks = await Promise.all([
    pl.queryOnce('holds_at(lives_in(user, osaka), "2024-12-01").'),
    pl.queryOnce('holds_at(lives_in(user, tokyo), "2024-12-01").'),
    pl.queryOnce('holds_at(employed_at(user, company_b), "2024-12-01").'),
    pl.queryOnce('holds_at(married_to(user, alice), "2024-12-01").'),
    pl.queryOnce('holds_at(has(user, house), "2024-12-01").')
  ]);
  return checks[0]?.status === 'success' && checks[1]?.status === 'failure' &&
    checks[2]?.status === 'success' && checks[3]?.status === 'success' && checks[4]?.status === 'success';
}

async function testAllHolding(pl) {
  await assertFact(pl, 'happens(learned(user, python), "2024-01-01")');
  await assertFact(pl, 'happens(joined(user, club), "2024-02-01")');
  await assertFact(pl, 'happens(bought(user, car), "2024-03-01")');
  const result = await pl.queryOnce('all_holding("2024-06-01", Fluents).');
  return result?.status === 'success' && result.answer?.Fluents;
}

async function testEdgeCase(pl) {
  await assertFact(pl, 'happens(quit(user, club), "2024-01-01")');
  await assertFact(pl, 'happens(joined(user, club), "2024-06-01")');
  const before = await pl.queryOnce('holds_at(member_of(user, club), "2024-03-01").');
  const after = await pl.queryOnce('holds_at(member_of(user, club), "2024-07-01").');
  return before?.status === 'failure' && after?.status === 'success';
}

async function runTests() {
  const pl = new Prolog();
  await pl.init();

  const ecPath = path.join(__dirname, '../../prolog/event_calculus.pl');
  const ecContent = await fs.readFile(ecPath, 'utf8');
  await pl.consultText(ecContent);

  const tests = [
    ['Basic holds_at', () => testBasicHoldsAt(pl)],
    ['Fluent termination', () => testTermination(pl)],
    ['Pattern matching', () => testPatternMatching(pl)],
    ['Singular fluent', () => testSingularFluent(pl)],
    ['Possession', () => testPossession(pl)],
    ['Location changes', () => testLocation(pl)],
    ['Learning progression', () => testLearning(pl)],
    ['Complex timeline', () => testComplexTimeline(pl)],
    ['all_holding', () => testAllHolding(pl)],
    ['Edge case', () => testEdgeCase(pl)]
  ];

  const results = [];
  for (const [name, fn] of tests) {
    const result = await runTest(pl, name, fn);
    results.push(result);
    const icon = result.passed ? `${colors.green}pass` : `${colors.red}fail`;
    process.stdout.write(`${icon}${colors.reset} ${name}\n`);
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(() => process.exit(1));
