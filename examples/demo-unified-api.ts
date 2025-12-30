/**
 * Demo: New Unified API - One entry point, natural language everything!
 */

import { createWhenM } from "../src/index.js";

async function main() {
  console.log("🚀 WhenM Unified API Demo - Dynamic & Flexible!\n");
  console.log("=" .repeat(60));
  
  // Single entry point
  const memory = await createWhenM({
    currentDate: "2025-01-15",
    defaultSubject: "alice"  // No more hardcoded "user"!
  });
  
  console.log("\n📝 1. Recording events for multiple subjects");
  console.log("-".repeat(60));
  
  // Record events for different people
  await memory.remember("alice became programmer", "2021-06-01");
  await memory.remember("bob joined chess_club", "2021-03-01");
  await memory.remember("alice learned Python", "2021-09-01");
  await memory.remember("charlie became manager", "2022-01-01");
  await memory.remember("alice became tech_lead", "2024-12-01");
  await memory.remember("bob learned Go", "2023-06-01");
  
  // Dynamic events - no predefined types needed!
  await memory.remember("alice ate sushi", "2024-12-20");
  await memory.remember("charlie played_tennis", "2024-11-15");
  
  console.log("✓ Recorded 8 events for 3 different subjects");
  console.log("✓ Including custom events like 'ate sushi' - no schema needed!");
  
  console.log("\n❓ 2. Natural language questions");
  console.log("-".repeat(60));
  
  // Ask about different people
  const aliceJob = await memory.ask("What is alice's job?");
  console.log(`Q: What is alice's job?\nA: ${aliceJob}`);
  
  const bobSkills = await memory.ask("What does bob know?");
  console.log(`\nQ: What does bob know?\nA: ${bobSkills}`);
  
  const charlieRole = await memory.ask("What was charlie's role in 2023?");
  console.log(`\nQ: What was charlie's role in 2023?\nA: ${charlieRole}`);
  
  console.log("\n📅 3. Timeline for different subjects");
  console.log("-".repeat(60));
  
  const aliceHistory = await memory.history("alice");
  console.log("Alice's timeline:");
  for (const event of aliceHistory) {
    console.log(`  ${event.date} - ${event.event}`);
  }
  
  console.log("\n🔍 4. State at specific times");
  console.log("-".repeat(60));
  
  const aliceState2022 = await memory.stateAt("2022-01-01", "alice");
  console.log("Alice's state on 2022-01-01:");
  console.log(JSON.stringify(aliceState2022, null, 2));
  
  const bobStateNow = await memory.stateAt("2025-01-15", "bob");
  console.log("\nBob's state now:");
  console.log(JSON.stringify(bobStateNow, null, 2));
  
  console.log("\n✨ Benefits of the new approach:");
  console.log("-".repeat(60));
  console.log("✓ Single entry point: createWhenM()");
  console.log("✓ No type definitions needed");
  console.log("✓ Dynamic schema - any event works");
  console.log("✓ Multiple subjects supported");
  console.log("✓ Natural language for everything");
}

main().catch(console.error);