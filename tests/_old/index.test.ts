import { describe, it, expect, beforeEach } from "vitest";
import { createEngine, WhenMError, type WhenMEngine } from "../src/index.js";

describe("WhenMEngine - Event Calculus", () => {
  let ec: WhenMEngine;

  beforeEach(async () => {
    ec = await createEngine({
      currentDate: "2025-12-16",
    });
  });

  describe("Job changes over time", () => {
    it("should track job changes correctly", async () => {
      // User got a job as programmer in 2020
      await ec.assertEvent('got_job(user, "プログラマー")', "2020-01-15");

      // In 2023, they should still be a programmer
      const holds2023 = await ec.holdsAt('job(user, "プログラマー")', "2023-01-01");
      expect(holds2023).toBe(true);

      // They quit and became a firefighter in 2024
      await ec.assertEvent('quit_job(user, "プログラマー")', "2024-06-01");
      await ec.assertEvent('got_job(user, "消防士")', "2024-06-15");

      // In 2025, they should be a firefighter, not programmer
      const stillProgrammer = await ec.holdsAt('job(user, "プログラマー")', "2025-01-01");
      expect(stillProgrammer).toBe(false);

      const isFirefighter = await ec.holdsAt('job(user, "消防士")', "2025-01-01");
      expect(isFirefighter).toBe(true);
    });

    it("should handle holdsNow correctly", async () => {
      await ec.assertEvent('got_job(user, "エンジニア")', "2020-01-01");

      const holdsNow = await ec.holdsNow('job(user, "エンジニア")');
      expect(holdsNow).toBe(true);
    });
  });

  describe("Location changes", () => {
    it("should track moves correctly", async () => {
      await ec.assertEvent('moved_to(user, "東京")', "2015-04-01");
      await ec.assertEvent('moved_to(user, "宮崎")', "2022-01-15");

      // In 2020, they lived in Tokyo
      const tokyo2020 = await ec.holdsAt('lives_in(user, "東京")', "2020-01-01");
      expect(tokyo2020).toBe(true);

      // In 2023, they live in Miyazaki
      const miyazaki2023 = await ec.holdsAt('lives_in(user, "宮崎")', "2023-01-01");
      expect(miyazaki2023).toBe(true);

      // They no longer live in Tokyo in 2023
      const tokyo2023 = await ec.holdsAt('lives_in(user, "東京")', "2023-01-01");
      expect(tokyo2023).toBe(false);
    });
  });

  describe("Relationships (accumulative)", () => {
    it("should track multiple relationships", async () => {
      await ec.assertEvent('met(user, "田中")', "2018-05-01");
      await ec.assertEvent('met(user, "佐藤")', "2020-03-15");

      // In 2021, user knows both
      const knowsTanaka = await ec.holdsAt('knows(user, "田中")', "2021-01-01");
      const knowsSato = await ec.holdsAt('knows(user, "佐藤")', "2021-01-01");

      expect(knowsTanaka).toBe(true);
      expect(knowsSato).toBe(true);
    });

    it("should handle marriage and divorce", async () => {
      await ec.assertEvent('married(user, "花子")', "2015-06-01");

      const married2020 = await ec.holdsAt('married_to(user, "花子")', "2020-01-01");
      expect(married2020).toBe(true);

      await ec.assertEvent('divorced(user, "花子")', "2023-03-01");

      const married2024 = await ec.holdsAt('married_to(user, "花子")', "2024-01-01");
      expect(married2024).toBe(false);
    });
  });

  describe("Query operations", () => {
    it("should return all events", async () => {
      await ec.assertEvent('got_job(user, "A")', "2020-01-01");
      await ec.assertEvent('moved_to(user, "B")', "2021-01-01");

      const events = await ec.allEvents();
      expect(events.length).toBe(2);
    });

    it("should export and load facts", async () => {
      await ec.assertEvent('got_job(user, "テスト")', "2020-01-01");

      const exported = await ec.exportFacts();
      // Note: Prolog may omit spaces in output
      expect(exported).toContain('happens(got_job(user,"テスト"), "2020-01-01").');

      // Create new instance and load
      const ec2 = await createEngine();
      await ec2.loadFacts(exported);

      const holds = await ec2.holdsAt('job(user, "テスト")', "2021-01-01");
      expect(holds).toBe(true);
    });
  });

  describe("Raw Prolog queries", () => {
    it("should execute arbitrary Prolog queries", async () => {
      await ec.assertEvent('got_job(user, "Dev")', "2020-01-01");

      // Find job using variable
      const results = await ec.query<{ X: string }>(
        'holds_at(job(user, X), "2021-01-01")'
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].X).toBe("Dev");
    });
  });

  describe("Batch operations", () => {
    it("should assert multiple events at once", async () => {
      const events = [
        { event: 'met(user, "A")', time: "2020-01-01" },
        { event: 'met(user, "B")', time: "2020-02-01" },
        { event: 'met(user, "C")', time: "2020-03-01" },
      ];

      await ec.assertEvents(events);

      const knows = await ec.query<{ X: string }>('holds_at(knows(user, X), "2021-01-01")');
      expect(knows.length).toBe(3);
    });

    it("should handle empty events array", async () => {
      await ec.assertEvents([]);
      // Should not throw
    });
  });

  describe("Reset functionality", () => {
    it("should clear all facts on reset", async () => {
      await ec.assertEvent('got_job(user, "A")', "2020-01-01");
      await ec.assertEvent('met(user, "B")', "2020-02-01");

      let events = await ec.allEvents();
      expect(events.length).toBe(2);

      await ec.reset();

      events = await ec.allEvents();
      expect(events.length).toBe(0);
    });
  });

  describe("Validation and error handling", () => {
    it("should throw WhenMError for invalid date format", async () => {
      await expect(
        ec.assertEvent('got_job(user, "Dev")', "invalid-date")
      ).rejects.toThrow(WhenMError);

      await expect(
        ec.assertEvent('got_job(user, "Dev")', "2020/01/01")
      ).rejects.toThrow("Invalid date format");
    });

    it("should throw WhenMError for unbalanced parentheses", async () => {
      await expect(
        ec.assertEvent('got_job(user, "Dev"', "2020-01-01")
      ).rejects.toThrow(WhenMError);

      await expect(
        ec.assertEvent('got_job(user, "Dev"', "2020-01-01")
      ).rejects.toThrow("Unbalanced parentheses");
    });

    it("should validate events in batch operations", async () => {
      const events = [
        { event: 'met(user, "A")', time: "2020-01-01" },
        { event: 'met(user, "B")', time: "invalid" }, // Invalid date
      ];

      await expect(ec.assertEvents(events)).rejects.toThrow(WhenMError);
    });

    it("should validate holdsAt parameters", async () => {
      await expect(
        ec.holdsAt('job(user, "X"', "2020-01-01") // Unbalanced
      ).rejects.toThrow(WhenMError);

      await expect(
        ec.holdsAt('job(user, "X")', "invalid") // Invalid date
      ).rejects.toThrow(WhenMError);
    });
  });
});
