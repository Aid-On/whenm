/**
 * WhenMEngine Benchmark Tests
 *
 * LOCOMO-style temporal reasoning benchmarks.
 * Tests the system's ability to track facts over time accurately.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createEngine, type WhenMEngine } from "../src/index.js";

describe("WhenMEngine Benchmark - Temporal Reasoning", () => {
  let ec: WhenMEngine;

  beforeEach(async () => {
    ec = await createEngine({ currentDate: "2025-12-16" });
  });

  // ===========================================================================
  // LOCOMO Category: Single-hop temporal queries
  // ===========================================================================

  describe("Single-hop temporal queries", () => {
    it("Q: What was user's job in 2022?", async () => {
      // Setup: User was programmer 2018-2023, then became manager
      await ec.assertEvent('got_job(user, "Software Engineer")', "2018-04-01");
      await ec.assertEvent('got_job(user, "Engineering Manager")', "2023-06-15");

      // Query for 2022 (should be Software Engineer)
      const results = await ec.query<{ X: string }>(
        'holds_at(job(user, X), "2022-06-01")'
      );

      expect(results.length).toBe(1);
      expect(results[0].X).toBe("Software Engineer");
    });

    it("Q: Where did user live in 2020?", async () => {
      await ec.assertEvent('moved_to(user, "Tokyo")', "2015-04-01");
      await ec.assertEvent('moved_to(user, "Osaka")', "2021-03-01");
      await ec.assertEvent('moved_to(user, "Fukuoka")', "2024-01-15");

      const results = await ec.query<{ X: string }>(
        'holds_at(lives_in(user, X), "2020-06-01")'
      );

      expect(results.length).toBe(1);
      expect(results[0].X).toBe("Tokyo");
    });

    it("Q: Was user married in 2019?", async () => {
      await ec.assertEvent('married(user, "Hanako")', "2017-05-20");
      await ec.assertEvent('divorced(user, "Hanako")', "2022-08-01");

      const married2019 = await ec.holdsAt('married_to(user, "Hanako")', "2019-01-01");
      const married2023 = await ec.holdsAt('married_to(user, "Hanako")', "2023-01-01");

      expect(married2019).toBe(true);
      expect(married2023).toBe(false);
    });
  });

  // ===========================================================================
  // LOCOMO Category: Multi-hop temporal queries
  // ===========================================================================

  describe("Multi-hop temporal queries", () => {
    it("Q: What jobs did user have before moving to Osaka?", async () => {
      // Events
      await ec.assertEvent('got_job(user, "Intern")', "2016-04-01");
      await ec.assertEvent('got_job(user, "Junior Dev")', "2017-04-01");
      await ec.assertEvent('moved_to(user, "Osaka")', "2018-06-01");
      await ec.assertEvent('got_job(user, "Senior Dev")', "2019-01-01");

      // Find when user moved to Osaka, then query jobs before that
      // This requires chaining: find move date, then query jobs at earlier dates

      // Jobs at 2017-10-01 (before Osaka move)
      const jobsBefore = await ec.query<{ X: string }>(
        'holds_at(job(user, X), "2017-10-01")'
      );

      expect(jobsBefore.length).toBe(1);
      expect(jobsBefore[0].X).toBe("Junior Dev");
    });

    it("Q: Who did user know when living in Tokyo?", async () => {
      await ec.assertEvent('moved_to(user, "Tokyo")', "2015-01-01");
      await ec.assertEvent('met(user, "Tanaka")', "2016-03-15");
      await ec.assertEvent('met(user, "Sato")', "2017-08-20");
      await ec.assertEvent('moved_to(user, "Kyoto")', "2018-04-01");
      await ec.assertEvent('met(user, "Yamada")', "2019-05-10");

      // Query who user knew at end of Tokyo period (2018-03-01)
      const knewInTokyo = await ec.query<{ X: string }>(
        'holds_at(knows(user, X), "2018-03-01")'
      );

      const names = knewInTokyo.map((r) => r.X).sort();
      expect(names).toContain("Tanaka");
      expect(names).toContain("Sato");
      expect(names).not.toContain("Yamada"); // Met after Tokyo
    });
  });

  // ===========================================================================
  // LOCOMO Category: Temporal ordering
  // ===========================================================================

  describe("Temporal ordering queries", () => {
    it("Q: Did user change jobs before or after marriage?", async () => {
      await ec.assertEvent('got_job(user, "Developer")', "2015-04-01");
      await ec.assertEvent('married(user, "Hanako")', "2018-06-15");
      await ec.assertEvent('got_job(user, "Manager")', "2020-01-01");

      // Check job at marriage time
      const jobAtMarriage = await ec.query<{ X: string }>(
        'holds_at(job(user, X), "2018-06-15")'
      );

      // Check job after marriage
      const jobAfterMarriage = await ec.query<{ X: string }>(
        'holds_at(job(user, X), "2021-01-01")'
      );

      expect(jobAtMarriage[0].X).toBe("Developer");
      expect(jobAfterMarriage[0].X).toBe("Manager");
      // Therefore: job change happened AFTER marriage
    });

    it("Q: What was the sequence of user's residences?", async () => {
      await ec.assertEvent('moved_to(user, "Sendai")', "2010-04-01");
      await ec.assertEvent('moved_to(user, "Tokyo")', "2014-04-01");
      await ec.assertEvent('moved_to(user, "Nagoya")', "2018-09-01");
      await ec.assertEvent('moved_to(user, "Osaka")', "2022-03-01");

      // Query at different times to reconstruct sequence
      const loc2012 = await ec.query<{ X: string }>('holds_at(lives_in(user, X), "2012-01-01")');
      const loc2016 = await ec.query<{ X: string }>('holds_at(lives_in(user, X), "2016-01-01")');
      const loc2020 = await ec.query<{ X: string }>('holds_at(lives_in(user, X), "2020-01-01")');
      const loc2024 = await ec.query<{ X: string }>('holds_at(lives_in(user, X), "2024-01-01")');

      expect(loc2012[0].X).toBe("Sendai");
      expect(loc2016[0].X).toBe("Tokyo");
      expect(loc2020[0].X).toBe("Nagoya");
      expect(loc2024[0].X).toBe("Osaka");
    });
  });

  // ===========================================================================
  // LOCOMO Category: Fact updates and contradictions
  // ===========================================================================

  describe("Fact updates and contradictions", () => {
    it("Singular facts should be replaced (job)", async () => {
      await ec.assertEvent('got_job(user, "A")', "2020-01-01");
      await ec.assertEvent('got_job(user, "B")', "2021-01-01");
      await ec.assertEvent('got_job(user, "C")', "2022-01-01");

      // At each point, only one job should hold
      const job2020 = await ec.query<{ X: string }>('holds_at(job(user, X), "2020-06-01")');
      const job2021 = await ec.query<{ X: string }>('holds_at(job(user, X), "2021-06-01")');
      const job2022 = await ec.query<{ X: string }>('holds_at(job(user, X), "2022-06-01")');

      expect(job2020.length).toBe(1);
      expect(job2020[0].X).toBe("A");

      expect(job2021.length).toBe(1);
      expect(job2021[0].X).toBe("B");

      expect(job2022.length).toBe(1);
      expect(job2022[0].X).toBe("C");
    });

    it("Accumulative facts should persist (knows)", async () => {
      await ec.assertEvent('met(user, "A")', "2020-01-01");
      await ec.assertEvent('met(user, "B")', "2021-01-01");
      await ec.assertEvent('met(user, "C")', "2022-01-01");

      // All three should be known by 2023
      const knows2023 = await ec.query<{ X: string }>('holds_at(knows(user, X), "2023-01-01")');
      const names = knows2023.map((r) => r.X).sort();

      expect(names).toEqual(["A", "B", "C"]);
    });
  });

  // ===========================================================================
  // LOCOMO Category: Current state queries (holds_now)
  // ===========================================================================

  describe("Current state queries", () => {
    it("Q: What is user's current job?", async () => {
      await ec.setCurrentDate("2025-12-16");
      await ec.assertEvent('got_job(user, "Startup Founder")', "2024-01-01");

      const currentJob = await ec.query<{ X: string }>("holds_now(job(user, X))");

      expect(currentJob.length).toBe(1);
      expect(currentJob[0].X).toBe("Startup Founder");
    });

    it("Q: Where does user currently live?", async () => {
      await ec.setCurrentDate("2025-12-16");
      await ec.assertEvent('moved_to(user, "Miyazaki")', "2023-04-01");

      const currentLocation = await ec.query<{ X: string }>("holds_now(lives_in(user, X))");

      expect(currentLocation.length).toBe(1);
      expect(currentLocation[0].X).toBe("Miyazaki");
    });
  });

  // ===========================================================================
  // Performance benchmark
  // ===========================================================================

  describe("Performance", () => {
    it("should handle 100 events efficiently", async () => {
      const start = Date.now();

      // Insert 100 events
      for (let i = 0; i < 100; i++) {
        const year = 2000 + Math.floor(i / 10);
        const month = String((i % 12) + 1).padStart(2, "0");
        await ec.assertEvent(`met(user, "Person${i}")`, `${year}-${month}-01`);
      }

      const insertTime = Date.now() - start;

      // Query
      const queryStart = Date.now();
      const knows2025 = await ec.query<{ X: string }>('holds_at(knows(user, X), "2025-01-01")');
      const queryTime = Date.now() - queryStart;

      console.log(`Insert 100 events: ${insertTime}ms`);
      console.log(`Query all knows: ${queryTime}ms`);
      console.log(`Results: ${knows2025.length}`);

      expect(knows2025.length).toBe(100);
      expect(insertTime).toBeLessThan(5000); // Should be fast
      expect(queryTime).toBeLessThan(1000);
    });
  });
});
