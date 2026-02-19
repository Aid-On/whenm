/**
 * Complex Timeline Example
 * Shows how WhenM handles overlapping events and state changes
 */

import { createMockEngine, createGroqEngine } from '../dist/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function complexTimeline() {
  // Use mock by default or Groq if API key is available
  let engine;
  
  if (process.env.GROQ_API_KEY && process.env.LLM_PROVIDER !== 'mock') {
    console.log('Using Groq LLM provider\n');
    engine = await createGroqEngine(process.env.GROQ_API_KEY, 'llama-3.3-70b-versatile');
  } else {
    console.log('Using mock LLM provider (set GROQ_API_KEY for real LLM)\n');
    engine = await createMockEngine();
  }

  console.log('=== Complex Timeline Example ===\n');

  // Simulate a person's career and life journey
  const events = [
    // Education
    { event: 'Alice started studying Computer Science', date: '2018-09-01' },
    { event: 'Alice learned Python', date: '2018-11-15' },
    { event: 'Alice learned JavaScript', date: '2019-02-20' },
    { event: 'Alice learned React', date: '2019-06-10' },
    { event: 'Alice graduated with CS degree', date: '2022-06-15' },
    
    // Career
    { event: 'Alice got job as Junior Developer at StartupX', date: '2022-07-01' },
    { event: 'Alice became Mid-level Developer', date: '2023-07-01' },
    { event: 'Alice left StartupX', date: '2024-03-31' },
    { event: 'Alice joined TechCorp as Senior Developer', date: '2024-04-15' },
    
    // Location
    { event: 'Alice moved to San Francisco', date: '2022-06-20' },
    { event: 'Alice moved to Seattle', date: '2024-04-01' },
    
    // Personal
    { event: 'Alice started learning Japanese', date: '2023-01-15' },
    { event: 'Alice joined gym', date: '2023-02-01' },
    { event: 'Alice bought a car', date: '2023-05-10' },
    { event: 'Alice quit gym', date: '2023-08-15' },
    { event: 'Alice joined yoga studio', date: '2023-09-01' },
    { event: 'Alice finished learning Japanese', date: '2024-01-20' },
    { event: 'Alice adopted a cat named Whiskers', date: '2024-05-01' },
  ];

  // Record all events
  console.log('Recording life events...\n');
  for (const { event, date } of events) {
    await engine.remember(event, date);
  }

  // Query different time periods
  console.log('--- Status in January 2023 ---');
  const jan2023 = {
    job: await engine.ask('What is Alice\'s job?', '2023-01-15'),
    location: await engine.ask('Where does Alice live?', '2023-01-15'),
    skills: await engine.ask('What programming languages does Alice know?', '2023-01-15'),
    learning: await engine.ask('Is Alice learning Japanese?', '2023-01-15'),
  };
  console.log('Job:', jan2023.job);
  console.log('Location:', jan2023.location);
  console.log('Skills:', jan2023.skills);
  console.log('Learning Japanese:', jan2023.learning);

  console.log('\n--- Status in June 2023 ---');
  const june2023 = {
    role: await engine.ask('What is Alice\'s role?', '2023-06-15'),
    fitness: await engine.ask('Is Alice a member of gym?', '2023-06-15'),
    possessions: await engine.ask('Does Alice have a car?', '2023-06-15'),
    learning: await engine.ask('Is Alice learning Japanese?', '2023-06-15'),
  };
  console.log('Role:', june2023.role);
  console.log('Gym member:', june2023.fitness);
  console.log('Has car:', june2023.possessions);
  console.log('Learning Japanese:', june2023.learning);

  console.log('\n--- Current Status (May 2024) ---');
  const current = {
    employer: await engine.ask('Where does Alice work?', '2024-05-15'),
    location: await engine.ask('Where does Alice live?', '2024-05-15'),
    skills: await engine.ask('Does Alice know Japanese?', '2024-05-15'),
    fitness: await engine.ask('Is Alice a member of yoga studio?', '2024-05-15'),
    pets: await engine.ask('Does Alice have any pets?', '2024-05-15'),
  };
  console.log('Employer:', current.employer);
  console.log('Location:', current.location);
  console.log('Knows Japanese:', current.skills);
  console.log('Yoga member:', current.fitness);
  console.log('Pets:', current.pets);

  // Complex queries
  console.log('\n--- Complex Queries ---');
  
  const careerPath = await engine.ask(
    'What companies has Alice worked for?',
    '2024-06-01'
  );
  console.log('Career path:', careerPath);

  const skillEvolution = await engine.ask(
    'What programming skills did Alice have when she started her first job?',
    '2022-07-01'
  );
  console.log('Initial skills:', skillEvolution);

  // Timeline analysis
  console.log('\n--- Timeline Analysis ---');
  const summary2023 = await engine.ask('What was Alice\'s status at the end of 2023?', '2023-12-31');
  console.log('End of 2023 state:', summary2023);

}

complexTimeline().catch(console.error);