#!/usr/bin/env node

/**
 * Validation Scenarios for WhenM
 *
 * Evaluates usefulness across multiple domains:
 * HR, Game State, Medical, Education, Project Management
 */

import { WhenM } from '../../dist/whenm.js';

const section = (title) => {
  console.log('\n' + '='.repeat(60));
  console.log(`${title}`);
  console.log('='.repeat(60) + '\n');
};

function classifyAction(q) {
  if (q.includes('how many') || q.includes('count')) return 'aggregate';
  if (q.includes('timeline') || q.includes('history')) return 'timeline';
  if (q.includes('compare')) return 'compare';
  return 'query';
}

function createScenarioLLM(domain) {
  const domainPatterns = {
    hr: { 'hired': 'hired', 'promoted': 'promoted', 'completed': 'completed', 'transferred': 'transferred', 'resigned': 'resigned' },
    game: { 'defeated': 'defeated', 'unlocked': 'unlocked', 'reached': 'reached', 'joined': 'joined', 'learned': 'learned' },
    medical: { 'diagnosed': 'diagnosed', 'treated': 'treated', 'recovered': 'recovered', 'prescribed': 'prescribed', 'admitted': 'admitted' },
    education: { 'enrolled': 'enrolled', 'completed': 'completed', 'achieved': 'achieved', 'learned': 'learned', 'graduated': 'graduated' },
    project: { 'started': 'started', 'completed': 'completed', 'blocked': 'blocked', 'reviewed': 'reviewed', 'deployed': 'deployed' }
  };

  const ruleMap = {
    'hired': { type: 'state_change', initiates: [{ fluent: 'employed' }] },
    'resigned': { type: 'state_change', terminates: [{ fluent: 'employed' }] },
    'promoted': { type: 'singular', initiates: [{ fluent: 'role' }], terminates: [{ fluent: 'role' }] },
    'transferred': { type: 'singular', initiates: [{ fluent: 'location' }], terminates: [{ fluent: 'location' }] },
    'defeated': { type: 'instantaneous', initiates: [{ fluent: 'victory' }] },
    'unlocked': { type: 'accumulative', initiates: [{ fluent: 'achievement' }] },
    'reached': { type: 'singular', initiates: [{ fluent: 'level' }] },
    'diagnosed': { type: 'accumulative', initiates: [{ fluent: 'condition' }] },
    'recovered': { type: 'state_change', terminates: [{ fluent: 'condition' }] },
    'prescribed': { type: 'accumulative', initiates: [{ fluent: 'medication' }] },
    'enrolled': { type: 'accumulative', initiates: [{ fluent: 'course' }] },
    'graduated': { type: 'singular', initiates: [{ fluent: 'degree' }] },
    'learned': { type: 'accumulative', initiates: [{ fluent: 'skill' }] },
    'started': { type: 'state_change', initiates: [{ fluent: 'active_task' }] },
    'completed': { type: 'state_change', terminates: [{ fluent: 'active_task' }] },
    'blocked': { type: 'state_change', initiates: [{ fluent: 'blocked' }] },
    'deployed': { type: 'instantaneous', initiates: [{ fluent: 'release' }] }
  };

  const patterns = domainPatterns[domain] || domainPatterns.hr;

  return {
    async parseEvent(text) {
      const lower = text.toLowerCase();
      for (const [key, verb] of Object.entries(patterns)) {
        if (lower.includes(key)) {
          const parts = text.split(' ');
          return { subject: parts[0].toLowerCase(), verb, object: parts.slice(2).join(' ').replace(/\.$/, '') };
        }
      }
      return { subject: 'unknown', verb: 'unknown', object: text };
    },
    async generateRules(verb) { return ruleMap[verb] || { type: 'state_change' }; },
    async parseQuestion(_q) { return { queryType: 'what', subject: 'test', predicate: 'state' }; },
    async formatResponse(results) { return (!results || results.length === 0) ? "No data found" : JSON.stringify(results); },
    async complete(prompt, options = {}) {
      if (options.format !== 'json') return "Domain-specific response";
      const queryMatch = prompt.match(/Query: "([^"]+)"/);
      if (!queryMatch) return JSON.stringify({ action: 'query' });
      const action = classifyAction(queryMatch[1].toLowerCase());
      return JSON.stringify({ action });
    }
  };
}

async function runScenario(name, domain, setupFn, testFn) {
  section(`Scenario: ${name}`);
  const instance = await WhenM.custom(createScenarioLLM(domain), { debug: false });
  await setupFn(instance);
  console.log('Test Cases:\n');
  await testFn(instance);
  console.log(`Done: ${name}`);
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('WhenM Validation Scenarios');
  console.log('='.repeat(60));

  try {
    await runScenario('HR System', 'hr',
      async (hr) => {
        await hr.remember("Sarah hired as Junior Developer", "2019-01-15");
        await hr.remember("Sarah completed React training", "2019-03-01");
        await hr.remember("Sarah promoted to Developer", "2020-01-01");
        await hr.remember("Sarah transferred to Tokyo office", "2021-06-01");
        await hr.remember("Sarah promoted to Senior Developer", "2022-01-01");
        await hr.remember("Sarah promoted to Tech Lead", "2024-01-01");
      },
      async (hr) => {
        const career = await hr.nl("Show all promotions").about("Sarah").orderBy("chronological");
        console.log('  Promotions tracked:', career.length);
        const training = await hr.nl("What training did Sarah complete?");
        console.log('  Training events:', training.length);
      }
    );

    await runScenario('Game State', 'game',
      async (game) => {
        await game.remember("Player unlocked Bronze Sword", "2024-01-01");
        await game.remember("Player reached Level 10", "2024-01-05");
        await game.remember("Player defeated Fire Dragon", "2024-01-15");
        await game.remember("Player unlocked Silver Sword", "2024-01-20");
        await game.remember("Player reached Level 20", "2024-02-01");
        await game.remember("Player defeated Ice Dragon", "2024-02-10");
      },
      async (game) => {
        const achievements = await game.nl("What has the player unlocked?");
        console.log('  Unlocked items:', achievements.filter(e => e.verb === 'unlocked').length);
        const bosses = await game.nl("Which bosses were defeated?");
        console.log('  Bosses defeated:', bosses.filter(e => e.verb === 'defeated').length);
      }
    );

    await runScenario('Medical Records', 'medical',
      async (med) => {
        await med.remember("Patient diagnosed with hypertension", "2022-01-15");
        await med.remember("Patient prescribed lisinopril", "2022-01-15");
        await med.remember("Patient diagnosed with diabetes", "2023-03-01");
        await med.remember("Patient prescribed metformin", "2023-03-01");
        await med.remember("Patient recovered from acute episode", "2023-06-20");
      },
      async (med) => {
        const diagnoses = await med.nl("What conditions were diagnosed?");
        console.log('  Conditions:', diagnoses.filter(e => e.verb === 'diagnosed').length);
        const meds = await med.nl("What medications were prescribed?");
        console.log('  Prescriptions:', meds.filter(e => e.verb === 'prescribed').length);
      }
    );

    await runScenario('Education', 'education',
      async (edu) => {
        await edu.remember("Alex enrolled in Introduction to Programming", "2023-09-01");
        await edu.remember("Alex learned basic Python syntax", "2023-09-15");
        await edu.remember("Alex completed Introduction to Programming", "2023-12-15");
        await edu.remember("Alex enrolled in Data Structures", "2024-01-15");
        await edu.remember("Alex graduated with Computer Science degree", "2024-06-01");
      },
      async (edu) => {
        const courses = await edu.nl("What courses did Alex enroll in?");
        console.log('  Courses enrolled:', courses.filter(e => e.verb === 'enrolled').length);
      }
    );

    await runScenario('Project Management', 'project',
      async (proj) => {
        await proj.remember("Team started authentication module", "2024-01-01");
        await proj.remember("Team completed authentication module", "2024-01-15");
        await proj.remember("Team started payment integration", "2024-01-16");
        await proj.remember("Team blocked on payment API access", "2024-01-20");
        await proj.remember("Team deployed version 1.0", "2024-02-10");
      },
      async (proj) => {
        const tasks = await proj.query().where({ verb: 'started' }).execute();
        console.log('  Tasks started:', tasks.length);
        const blockers = await proj.nl("What got blocked?");
        console.log('  Blockers:', blockers.filter(e => e.verb === 'blocked').length);
      }
    );

    // Performance test
    section('Performance Test');
    const perf = await WhenM.custom(createScenarioLLM('hr'), { debug: false });
    const startInsert = Date.now();
    for (let i = 0; i < 1000; i++) {
      await perf.remember(`Employee${i} joined the company`, `2024-01-${String(Math.floor(i / 33) + 1).padStart(2, '0')}`);
    }
    console.log(`Inserted 1000 events in ${Date.now() - startInsert}ms`);
    const startQuery = Date.now();
    const results = await perf.query().between('2024-01-01', '2024-01-31').execute();
    console.log(`Queried ${results.length} events in ${Date.now() - startQuery}ms`);

    section('Overall Assessment');
    console.log('All 5 domain scenarios completed successfully.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main().catch(console.error);
