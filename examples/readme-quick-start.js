/**
 * Quick Start example from README
 * Tests the exact code shown in the README
 */

import { WhenM } from '../dist/whenm.js';
import dotenv from 'dotenv';

dotenv.config();

async function quickStart() {
  console.log('=== WhenM Quick Start Example ===\n');

  // Initialize (uses Groq if API key is set, otherwise mock)
  const memory = process.env.GROQ_API_KEY 
    ? await WhenM.groq(process.env.GROQ_API_KEY)
    : await WhenM.mock();
  
  console.log(`Using ${process.env.GROQ_API_KEY ? 'Groq' : 'Mock'} LLM provider\n`);

  // Remember events - any language, any domain
  console.log('Recording events...');
  await memory.remember("Alice joined as engineer", "2020-01-15");
  await memory.remember("Alice became team lead", "2022-06-01");
  await memory.remember("Pikachu learned Thunderbolt", "2023-01-01");
  console.log('✓ Events recorded\n');

  // Ask temporal questions
  console.log('Asking questions...\n');
  
  const role2021 = await memory.ask("What was Alice's role in 2021?");
  console.log("Q: What was Alice's role in 2021?");
  console.log(`A: ${role2021}\n`);
  
  const currentRole = await memory.ask("What is Alice's current role?");
  console.log("Q: What is Alice's current role?");
  console.log(`A: ${currentRole}\n`);
  
  const pikachuSkill = await memory.ask("When did Pikachu learn Thunderbolt?");
  console.log("Q: When did Pikachu learn Thunderbolt?");
  console.log(`A: ${pikachuSkill}\n`);
  
  console.log('✅ Quick start example completed!');
}

async function main() {
  try {
    await quickStart();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();