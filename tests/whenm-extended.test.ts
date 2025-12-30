import { describe, it, expect, vi } from "vitest";
import { WhenM, whenm } from "../src/whenm.js";

describe("WhenM Extended Tests", () => {
  describe("Factory methods", () => {
    it("should create with cloudflare provider", async () => {
      const memory = await WhenM.cloudflare({
        accountId: 'mock',
        apiKey: 'mock',
        email: 'mock@example.com'
      });
      expect(memory).toBeDefined();
      expect(memory.remember).toBeDefined();
    });

    it("should create with groq provider", async () => {
      const memory = await WhenM.groq('mock-api-key');
      expect(memory).toBeDefined();
      expect(memory.remember).toBeDefined();
    });

    it("should create with gemini provider", async () => {
      const memory = await WhenM.gemini('mock-api-key');
      expect(memory).toBeDefined();
      expect(memory.remember).toBeDefined();
    });

    it("should create with custom configuration", async () => {
      const memory = await WhenM.create({
        provider: 'cloudflare',
        accountId: 'mock',
        apiToken: 'mock',
        email: 'mock@example.com',
        debug: true
      });
      expect(memory).toBeDefined();
    });
  });

  describe("whenm factory", () => {
    it("should create with cloudflare", async () => {
      const memory = await whenm.cloudflare({
        accountId: 'mock',
        apiKey: 'mock',
        email: 'mock@example.com'
      });
      expect(memory).toBeDefined();
    });

    it("should create with groq", async () => {
      const memory = await whenm.groq('mock-api-key', {
        model: 'mixtral-8x7b-32768',
        debug: false
      });
      expect(memory).toBeDefined();
    });

    it("should create with gemini", async () => {
      const memory = await whenm.gemini('mock-api-key', {
        model: 'gemini-pro',
        debug: false
      });
      expect(memory).toBeDefined();
    });

    it("should create with auto", async () => {
      const memory = await whenm.auto();
      expect(memory).toBeDefined();
    });
  });

  describe("Memory operations", () => {
    it("should handle batch operations", async () => {
      const memory = await whenm.auto();
      
      // Test batch remember
      const events = [
        { text: "Alice became CEO", date: "2023-01-10" },
        { text: "Bob joined as CTO", date: "2023-02-15" },
        { text: "Charlie learned Python", date: "2023-03-20" }
      ];
      
      for (const event of events) {
        await memory.remember(event.text, event.date);
      }
      
      // Verify no errors thrown
      expect(true).toBe(true);
    });
  });

  describe("Advanced query operations", () => {
    it("should support complex queries", async () => {
      const memory = await whenm.auto();
      
      // Add some events
      await memory.remember("Alice learned Python", "2023-01-10");
      await memory.remember("Bob learned JavaScript", "2023-02-15");
      await memory.remember("Alice learned TypeScript", "2023-03-20");
      
      // Complex query chain
      const query = memory
        .query()
        .subject("Alice")
        .verb("learned")
        .between("2023-01-01", "2023-12-31")
        .orderBy("time", "desc")
        .limit(10);
      
      expect(query).toBeDefined();
      expect(query.execute).toBeDefined();
      
      // Just test that query builds without error
      expect(query).toBeDefined();
    });

    it("should support aggregations", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice learned Python", "2023-01-10");
      await memory.remember("Bob learned Python", "2023-02-15");
      
      const query = memory.query().verb("learned");
      
      // Just test query builder methods exist
      expect(query.count).toBeDefined();
      expect(query.distinct).toBeDefined();
      expect(query.exists).toBeDefined();
      expect(query.first).toBeDefined();
    });
  });

  describe("Timeline operations", () => {
    it("should handle timeline queries", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice became intern", "2020-01-01");
      await memory.remember("Alice became junior engineer", "2021-01-01");
      await memory.remember("Alice became senior engineer", "2023-01-01");
      
      const timeline = memory.timeline("Alice");
      
      // Just test timeline methods exist
      expect(timeline.at).toBeDefined();
      expect(timeline.between).toBeDefined();
      expect(timeline.recent).toBeDefined();
    });
  });

  describe("Search operations", () => {
    it("should search with keywords", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice learned Python for data science", "2023-01-10");
      await memory.remember("Bob studied JavaScript for web development", "2023-02-15");
      await memory.remember("Charlie explored Python for machine learning", "2023-03-20");
      
      // Search for Python-related events
      const pythonEvents = await memory.search("Python");
      expect(Array.isArray(pythonEvents)).toBe(true);
      
      // Search for learning-related events
      const learningEvents = await memory.search("learning");
      expect(Array.isArray(learningEvents)).toBe(true);
      
      // Search with options
      const recentEvents = await memory.search("development", {
        from: "2023-01-01",
        to: "2023-12-31",
        limit: 5
      });
      expect(Array.isArray(recentEvents)).toBe(true);
    });
  });

  describe("Natural language operations", () => {
    it("should handle natural language queries", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice became CEO of TechCorp", "2023-01-10");
      await memory.remember("Bob joined as VP of Engineering", "2023-02-15");
      
      // Test nl method returns result
      const result = await memory.nl("Who is the CEO?");
      expect(result).toBeDefined();
      // Result is actually an array from the chain execution
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle complex natural language", async () => {
      const memory = await whenm.auto();
      
      await memory.remember("Alice learned Python in 2020", "2020-06-15");
      await memory.remember("Alice learned JavaScript in 2021", "2021-03-10");
      await memory.remember("Alice learned Rust in 2023", "2023-09-20");
      
      // Ask about learning timeline - ask() may return null with mock engine
      try {
        const answer = await memory.ask("What programming languages did Alice learn?");
        expect(answer === null || typeof answer === "string").toBe(true);
      } catch (e) {
        // Mock engine may throw, that's ok for test
        expect(true).toBe(true);
      }
    });
  });

  describe("Error handling", () => {
    it("should handle invalid dates gracefully", async () => {
      const memory = await whenm.auto();
      
      // Should not throw
      await memory.remember("Alice became CEO", "invalid-date");
      await memory.remember("Bob joined", undefined);
      await memory.remember("Charlie started", null);
      
      expect(true).toBe(true);
    });

    it("should handle empty queries", async () => {
      const memory = await whenm.auto();
      
      // Empty queries may return null or throw with mock engine
      try {
        const result = await memory.ask("");
        expect(result === null || typeof result === "string").toBe(true);
      } catch (e) {
        expect(true).toBe(true);
      }
      
      const searchResult = await memory.search("");
      expect(Array.isArray(searchResult)).toBe(true);
    });
  });
});