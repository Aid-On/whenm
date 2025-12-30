/**
 * Use cases from README - executable examples
 * Run with: 
 *   - Mock provider: LLM_PROVIDER=mock node examples/use-cases.js
 *   - Groq provider: GROQ_API_KEY=your-key node examples/use-cases.js
 */

import { createMockEngine, createGroqEngine } from '../dist/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Use Groq if API key is provided, otherwise use Mock
async function createEngine() {
  if (process.env.GROQ_API_KEY) {
    console.log('Using Groq LLM provider');
    return await createGroqEngine(process.env.GROQ_API_KEY);
  } else {
    console.log('Using Mock LLM provider (set GROQ_API_KEY to use Groq)');
    return await createMockEngine();
  }
}

// Employee Performance & Career Tracking
async function employeeTracking() {
  console.log('\n=== Employee Performance & Career Tracking ===');
  const hr = await createEngine();
  
  // Track career progression
  await hr.remember("Sarah joined as Junior Developer", "2021-01-15");
  await hr.remember("Sarah completed React certification", "2021-06-20");
  await hr.remember("Sarah led the payment module project", "2021-09-01");
  await hr.remember("Sarah promoted to Senior Developer", "2022-01-15");
  await hr.remember("Sarah became Tech Lead", "2023-06-01");
  
  // Query career progression
  const currentRole = await hr.ask("What is Sarah's current role?");
  console.log(`Current role: ${currentRole}`);
  
  const achievements = await hr.ask("What achievements did Sarah have in 2021?");
  console.log(`2021 achievements: ${achievements}`);
}

// Patient Medical History
async function medicalHistory() {
  console.log('\n=== Patient Medical History ===');
  const medical = await createEngine();
  
  // Complex medical timeline
  await medical.remember("Patient diagnosed with hypertension", "2020-03-15");
  await medical.remember("Started lisinopril 10mg daily", "2020-03-20");
  await medical.remember("Blood pressure improved to 130/80", "2020-06-15");
  await medical.remember("Developed dry cough side effect", "2020-09-01");
  await medical.remember("Switched to losartan 50mg", "2020-09-05");
  await medical.remember("Blood pressure stabilized to normal", "2021-01-15");
  
  // Medical queries
  const currentMeds = await medical.ask("What medication is the patient currently taking?");
  console.log(`Current medication: ${currentMeds}`);
  
  const whyChanged = await medical.ask("Why was the medication changed in September 2020?");
  console.log(`Medication change reason: ${whyChanged}`);
}

// AI Agent Memory
async function aiAgentMemory() {
  console.log('\n=== AI Agent Memory System ===');
  const agent = await createEngine();
  
  // Agent learns user preferences
  await agent.remember("User prefers TypeScript over JavaScript", "2024-01-01");
  await agent.remember("User works in Tokyo timezone", "2024-01-05");
  await agent.remember("User dislikes verbose explanations", "2024-01-10");
  await agent.remember("Failed to solve bug with approach A", "2024-02-01");
  await agent.remember("Successfully solved bug with approach B", "2024-02-01");
  
  // Context-aware queries
  const preferences = await agent.ask("What are the user's preferences?");
  console.log(`User preferences: ${preferences}`);
  
  const debugging = await agent.ask("What debugging approach should I try?");
  console.log(`Debugging recommendation: ${debugging}`);
}

// Incident Management
async function incidentManagement() {
  console.log('\n=== Real-time Incident Management ===');
  const ops = await createEngine();
  
  // Track incident timeline
  await ops.remember("CPU usage spiked to 95%", "2024-03-15 14:30");
  await ops.remember("Database connection pool exhausted", "2024-03-15 14:31");
  await ops.remember("API response time degraded to 5s", "2024-03-15 14:32");
  await ops.remember("Deployed hotfix PR #1234", "2024-03-15 14:45");
  await ops.remember("System recovered", "2024-03-15 14:50");
  
  // Root cause analysis
  const rca = await ops.ask("What caused the API degradation on March 15?");
  console.log(`Root cause: ${rca}`);
  
  const duration = await ops.ask("How long did the incident last?");
  console.log(`Incident duration: ${duration}`);
}

// Financial Audit Trail
async function financialAudit() {
  console.log('\n=== Financial Audit Trail ===');
  const audit = await createEngine();
  
  // Maintain audit trail
  await audit.remember("Account opened by John", "2023-01-15");
  await audit.remember("KYC verification completed", "2023-01-16");
  await audit.remember("$50,000 deposited from Chase Bank", "2023-02-01");
  await audit.remember("Flagged for unusual activity", "2023-03-15");
  await audit.remember("Manual review cleared", "2023-03-16");
  await audit.remember("Account upgraded to Premium", "2023-06-01");
  
  // Compliance queries
  const kycStatus = await audit.ask("Was KYC completed before the first transaction?");
  console.log(`KYC compliance: ${kycStatus}`);
  
  const accountStatus = await audit.ask("What was the account status when flagged?");
  console.log(`Account status when flagged: ${accountStatus}`);
}

// Game State & Progression
async function gameProgression() {
  console.log('\n=== Game State & Player Progression ===');
  const game = await createEngine();
  
  // Player history
  await game.remember("Player discovered hidden dungeon", "2024-01-01 10:00");
  await game.remember("Player defeated Dragon Boss", "2024-01-01 11:30");
  await game.remember("Player earned 'Dragon Slayer' title", "2024-01-01 11:31");
  await game.remember("Player joined guild 'Knights'", "2024-01-02");
  await game.remember("Won guild battle", "2024-01-03");
  
  // Game queries
  const titles = await game.ask("What titles does the player have?");
  console.log(`Player titles: ${titles}`);
  
  const eligibility = await game.ask("Can player start the 'Ancient Evil' quest?");
  console.log(`Quest eligibility: ${eligibility}`);
}

// IoT Sensor Network
async function iotNetwork() {
  console.log('\n=== IoT Sensor Network ===');
  const iot = await createEngine();
  
  // Sensor monitoring
  await iot.remember("Machine-A vibration increased to 0.8mm/s", "2024-03-01");
  await iot.remember("Machine-A temperature at 75°C", "2024-03-02");
  await iot.remember("Machine-A bearing noise detected", "2024-03-03");
  await iot.remember("Machine-A scheduled maintenance", "2024-03-05");
  await iot.remember("Machine-A bearing replaced", "2024-03-05");
  
  // Predictive maintenance
  const warning = await iot.ask("What signs preceded the bearing replacement?");
  console.log(`Warning signs: ${warning}`);
  
  const status = await iot.ask("What is Machine-A's current status?");
  console.log(`Current status: ${status}`);
}

// Main runner
async function main() {
  console.log('WhenM Use Cases - Executable Examples');
  console.log('=====================================');
  
  try {
    await employeeTracking();
    await medicalHistory();
    await aiAgentMemory();
    await incidentManagement();
    await financialAudit();
    await gameProgression();
    await iotNetwork();
    
    console.log('\n✅ All use cases completed successfully!');
  } catch (error) {
    console.error('Error running use cases:', error);
  }
}

main();