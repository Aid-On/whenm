/**
 * Demo: Simple API - No Prolog knowledge needed!
 */

import { createWhenM, simple } from "../src/index.js";

async function main() {
  console.log("🎯 WhenM Simple API Demo\n");
  console.log("=" .repeat(60));
  
  // Initialize
  const memory = await createWhenM({ currentDate: "2025-01-15" });
  const whenm = simple(memory.ec);
  
  // Setup some history
  await memory.record("user became junior_developer", "2020-04-01");
  await memory.record("user learned Python", "2020-06-01");
  await memory.record("user became programmer", "2021-06-01");
  await memory.record("user learned JavaScript", "2021-03-15");
  await memory.record("user became senior_engineer", "2023-03-01");
  await memory.record("user learned Rust", "2023-09-01");
  await memory.record("user became tech_lead", "2024-12-01");
  await memory.record("user learned Go", "2024-06-01");
  
  console.log("\n📅 1. Query at specific times");
  console.log("-".repeat(60));
  
  // What was the role in 2022?
  const role2022 = await whenm.at("2022-06-15").get("role", "user");
  console.log(`Role in June 2022: ${role2022}`);
  
  // What skills did I have in 2021?
  const skills2021 = await whenm.at("2021-12-31").getAll("knows", "user");
  console.log(`Skills end of 2021: [${skills2021.join(", ")}]`);
  
  console.log("\n🎯 2. Current state");
  console.log("-".repeat(60));
  
  // Current role
  const currentRole = await whenm.now().get("role", "user");
  console.log(`Current role: ${currentRole}`);
  
  // All current skills
  const currentSkills = await whenm.now().getAll("knows", "user");
  console.log(`Current skills: [${currentSkills.join(", ")}]`);
  
  console.log("\n📆 3. When did things happen?");
  console.log("-".repeat(60));
  
  // When did I become tech lead?
  const becameLead = await whenm.when("became", "user", "tech_lead");
  console.log(`Became tech lead: ${becameLead}`);
  
  // All role changes
  const allRoles = await whenm.when("became", "user");
  console.log("\nAll role changes:");
  if (Array.isArray(allRoles)) {
    for (const role of allRoles) {
      console.log(`  ${role.date} → ${role.value}`);
    }
  }
  
  console.log("\n🕐 4. Duration");
  console.log("-".repeat(60));
  
  // How long have I been a tech lead?
  const leadDuration = await whenm.duration("role", "user", "tech_lead");
  if (leadDuration) {
    console.log(`Tech lead for: ${leadDuration.days} days (${leadDuration.months} months)`);
    console.log(`Since: ${leadDuration.since}`);
  }
  
  console.log("\n📊 5. Timeline");
  console.log("-".repeat(60));
  
  // Complete timeline
  const timeline = await whenm.timeline("user");
  console.log("Career timeline:");
  for (const event of timeline.slice(0, 5)) { // First 5 events
    console.log(`  ${event.date} - ${event.event}`);
  }
  console.log(`  ... and ${timeline.length - 5} more events`);
  
  console.log("\n✨ Much simpler than Prolog queries!");
}

main().catch(console.error);