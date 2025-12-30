import { describe, it, expect } from "vitest";
import { whenm } from "../src/whenm.js";

describe("WhenM", () => {
  describe("auto() factory", () => {
    it("should create instance with auto provider", async () => {
      const memory = await whenm.auto();
      expect(memory).toBeDefined();
      expect(memory.remember).toBeDefined();
      expect(memory.ask).toBeDefined();
      expect(memory.nl).toBeDefined();
    });
  });

  describe("basic operations", () => {
    it("should remember and query events", async () => {
      const memory = await whenm.auto();
      
      // Remember an event
      await memory.remember("Alice learned Python", "2023-01-10");
      
      // The actual query would need a real LLM provider
      // For now, just test that methods exist and don't throw
      expect(memory.ask).toBeDefined();
      expect(memory.query).toBeDefined();
    });

    it("should support method chaining", async () => {
      const memory = await whenm.auto();
      
      // Test chaining
      const chain = memory
        .remember("Bob joined the company", "2023-02-01")
        .then(() => memory.remember("Bob became senior engineer", "2024-01-01"));
      
      await expect(chain).resolves.not.toThrow();
    });
  });

  describe("query builder", () => {
    it("should create query builder", async () => {
      const memory = await whenm.auto();
      const builder = memory.query();
      
      expect(builder).toBeDefined();
      expect(builder.subject).toBeDefined();
      expect(builder.verb).toBeDefined();
      expect(builder.between).toBeDefined();
      expect(builder.execute).toBeDefined();
    });

    it("should build queries fluently", async () => {
      const memory = await whenm.auto();
      
      const query = memory
        .query()
        .subject("Alice")
        .verb("learned");
      
      expect(query).toBeDefined();
      // Actual execution would need LLM provider
    });
  });

  describe("timeline", () => {
    it("should create timeline", async () => {
      const memory = await whenm.auto();
      const timeline = memory.timeline("Alice");
      
      expect(timeline).toBeDefined();
      expect(timeline.at).toBeDefined();
      expect(timeline.between).toBeDefined();
      expect(timeline.recent).toBeDefined();
    });
  });

  describe("search", () => {
    it("should search events", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice learned Python", "2023-01-10");
      await memory.remember("Bob learned JavaScript", "2023-02-01");
      
      // Search function exists
      expect(memory.search).toBeDefined();
      
      // Search returns array (even if empty without real engine)
      const results = await memory.search("Python");
      expect(Array.isArray(results)).toBe(true);
    });
  });
});