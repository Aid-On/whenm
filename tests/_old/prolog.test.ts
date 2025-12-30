/**
 * Event Calculus Prolog Rules Test
 *
 * Tests the Prolog rules directly (event_calculus.pl)
 * Ensures pattern-based and semantic rules work correctly.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createEngine, type WhenMEngine } from "../src/index.js";

describe("Event Calculus Prolog Rules", () => {
  let ec: WhenMEngine;

  beforeEach(async () => {
    ec = await createEngine({ currentDate: "2025-01-15" });
  });

  // ===========================================================================
  // Pattern-Based Rules (started_, stopped_, became_, etc.)
  // ===========================================================================

  describe("Pattern-Based Rules", () => {
    describe("started_ pattern (accumulating)", () => {
      it("should initiate fluent", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");

        const result = await ec.holdsAt('knows("user", "Python")', "2024-06-01");
        expect(result).toBe(true);
      });

      it("should accumulate multiple values", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
        await ec.assertEvent('started_knows("user", "Rust")', "2024-06-01");

        const results = await ec.query<{ X: string }>('holds_now(knows("user", X))');
        const skills = results.map((r) => r.X).sort();
        expect(skills).toEqual(["Python", "Rust"]);
      });
    });

    describe("stopped_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_member_of("user", "chess_club")', "2024-01-01");
        await ec.assertEvent('stopped_member_of("user", "chess_club")', "2024-06-01");

        const before = await ec.holdsAt('member_of("user", "chess_club")', "2024-03-01");
        const after = await ec.holdsAt('member_of("user", "chess_club")', "2024-09-01");

        expect(before).toBe(true);
        expect(after).toBe(false);
      });
    });

    describe("quit_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_hobby("user", "running")', "2024-01-01");
        await ec.assertEvent('quit_hobby("user", "running")', "2024-06-01");

        const before = await ec.holdsAt('hobby("user", "running")', "2024-03-01");
        const after = await ec.holdsAt('hobby("user", "running")', "2024-09-01");

        expect(before).toBe(true);
        expect(after).toBe(false);
      });
    });

    describe("ended_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_project("user", "alpha")', "2024-01-01");
        await ec.assertEvent('ended_project("user", "alpha")', "2024-06-01");

        const after = await ec.holdsAt('project("user", "alpha")', "2024-09-01");
        expect(after).toBe(false);
      });
    });

    describe("finished_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_task("user", "report")', "2024-01-01");
        await ec.assertEvent('finished_task("user", "report")', "2024-06-01");

        const after = await ec.holdsAt('task("user", "report")', "2024-09-01");
        expect(after).toBe(false);
      });
    });

    describe("became_ pattern (singular)", () => {
      it("should initiate and terminate old value", async () => {
        await ec.assertEvent('became_role("user", "engineer")', "2024-01-01");
        await ec.assertEvent('became_role("user", "tech_lead")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(role("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(role("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["engineer"]);
        expect(jul.map((r) => r.X)).toEqual(["tech_lead"]);
      });
    });

    describe("set_ pattern (singular)", () => {
      it("should initiate and terminate old value", async () => {
        await ec.assertEvent('set_name("user", "Alice")', "2024-01-01");
        await ec.assertEvent('set_name("user", "Bob")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(name("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(name("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["Alice"]);
        expect(jul.map((r) => r.X)).toEqual(["Bob"]);
      });
    });

    describe("got_ pattern (singular)", () => {
      it("should initiate and terminate old value", async () => {
        await ec.assertEvent('got_job("user", "intern")', "2024-01-01");
        await ec.assertEvent('got_job("user", "engineer")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(job("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(job("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["intern"]);
        expect(jul.map((r) => r.X)).toEqual(["engineer"]);
      });
    });

    describe("changed_ pattern (singular)", () => {
      it("should initiate and terminate old value", async () => {
        await ec.assertEvent('changed_status("user", "active")', "2024-01-01");
        await ec.assertEvent('changed_status("user", "inactive")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(status("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(status("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["active"]);
        expect(jul.map((r) => r.X)).toEqual(["inactive"]);
      });
    });
  });

  // ===========================================================================
  // Semantic Event Rules (learned, joined, moved_to, etc.)
  // ===========================================================================

  describe("Semantic Event Rules", () => {
    describe("Knowledge/Skills", () => {
      it("learned → knows", async () => {
        await ec.assertEvent('learned("user", "Python")', "2024-01-01");

        const result = await ec.holdsNow('knows("user", "Python")');
        expect(result).toBe(true);
      });

      it("studied → knows", async () => {
        await ec.assertEvent('studied("user", "Math")', "2024-01-01");

        const result = await ec.holdsNow('knows("user", "Math")');
        expect(result).toBe(true);
      });

      it("mastered → knows", async () => {
        await ec.assertEvent('mastered("user", "Guitar")', "2024-01-01");

        const result = await ec.holdsNow('knows("user", "Guitar")');
        expect(result).toBe(true);
      });

      it("met → knows", async () => {
        await ec.assertEvent('met("user", "Alice")', "2024-01-01");

        const result = await ec.holdsNow('knows("user", "Alice")');
        expect(result).toBe(true);
      });
    });

    describe("Membership", () => {
      it("joined → member_of", async () => {
        await ec.assertEvent('joined("user", "chess_club")', "2024-01-01");

        const result = await ec.holdsNow('member_of("user", "chess_club")');
        expect(result).toBe(true);
      });

      it("left → terminates member_of", async () => {
        await ec.assertEvent('joined("user", "chess_club")', "2024-01-01");
        await ec.assertEvent('left("user", "chess_club")', "2024-06-01");

        const result = await ec.holdsNow('member_of("user", "chess_club")');
        expect(result).toBe(false);
      });

      it("quit → terminates member_of", async () => {
        await ec.assertEvent('joined("user", "gym")', "2024-01-01");
        await ec.assertEvent('quit("user", "gym")', "2024-06-01");

        const result = await ec.holdsNow('member_of("user", "gym")');
        expect(result).toBe(false);
      });
    });

    describe("Possession", () => {
      it("bought → has", async () => {
        await ec.assertEvent('bought("user", "car")', "2024-01-01");

        const result = await ec.holdsNow('has("user", "car")');
        expect(result).toBe(true);
      });

      it("acquired → has", async () => {
        await ec.assertEvent('acquired("user", "laptop")', "2024-01-01");

        const result = await ec.holdsNow('has("user", "laptop")');
        expect(result).toBe(true);
      });

      it("obtained → has", async () => {
        await ec.assertEvent('obtained("user", "certificate")', "2024-01-01");

        const result = await ec.holdsNow('has("user", "certificate")');
        expect(result).toBe(true);
      });

      it("got → has", async () => {
        await ec.assertEvent('got("user", "bike")', "2024-01-01");

        const result = await ec.holdsNow('has("user", "bike")');
        expect(result).toBe(true);
      });

      it("sold → terminates has", async () => {
        await ec.assertEvent('bought("user", "car")', "2024-01-01");
        await ec.assertEvent('sold("user", "car")', "2024-06-01");

        const result = await ec.holdsNow('has("user", "car")');
        expect(result).toBe(false);
      });

      it("lost → terminates has", async () => {
        await ec.assertEvent('got("user", "wallet")', "2024-01-01");
        await ec.assertEvent('lost("user", "wallet")', "2024-06-01");

        const result = await ec.holdsNow('has("user", "wallet")');
        expect(result).toBe(false);
      });
    });

    describe("Location (singular)", () => {
      it("moved_to → lives_in (terminates old)", async () => {
        await ec.assertEvent('moved_to("user", "Tokyo")', "2024-01-01");
        await ec.assertEvent('moved_to("user", "Osaka")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["Tokyo"]);
        expect(jul.map((r) => r.X)).toEqual(["Osaka"]);
      });

      it("relocated_to → lives_in (terminates old)", async () => {
        await ec.assertEvent('relocated_to("user", "SF")', "2024-01-01");
        await ec.assertEvent('relocated_to("user", "NYC")', "2024-06-01");

        const jul = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2024-09-01")');
        expect(jul.map((r) => r.X)).toEqual(["NYC"]);
      });
    });

    describe("Relationships", () => {
      it("married → married_to (singular)", async () => {
        await ec.assertEvent('married("user", "Alice")', "2024-01-01");

        const result = await ec.holdsNow('married_to("user", "Alice")');
        expect(result).toBe(true);
      });

      it("divorced → terminates married_to", async () => {
        await ec.assertEvent('married("user", "Alice")', "2024-01-01");
        await ec.assertEvent('divorced("user", "Alice")', "2024-06-01");

        const result = await ec.holdsNow('married_to("user", "Alice")');
        expect(result).toBe(false);
      });
    });

    describe("Likes/Dislikes", () => {
      it("started_liking → likes", async () => {
        await ec.assertEvent('started_liking("user", "coffee")', "2024-01-01");

        const result = await ec.holdsNow('likes("user", "coffee")');
        expect(result).toBe(true);
      });

      it("stopped_liking → terminates likes", async () => {
        await ec.assertEvent('started_liking("user", "coffee")', "2024-01-01");
        await ec.assertEvent('stopped_liking("user", "coffee")', "2024-06-01");

        const result = await ec.holdsNow('likes("user", "coffee")');
        expect(result).toBe(false);
      });

      it("started_disliking → dislikes", async () => {
        await ec.assertEvent('started_disliking("user", "crowded_trains")', "2024-01-01");

        const result = await ec.holdsNow('dislikes("user", "crowded_trains")');
        expect(result).toBe(true);
      });

      it("stopped_disliking → terminates dislikes", async () => {
        await ec.assertEvent('started_disliking("user", "crowded_trains")', "2024-01-01");
        await ec.assertEvent('stopped_disliking("user", "crowded_trains")', "2024-06-01");

        const result = await ec.holdsNow('dislikes("user", "crowded_trains")');
        expect(result).toBe(false);
      });
    });

    describe("Pets (3-arity)", () => {
      it("got_pet → has_pet", async () => {
        await ec.assertEvent('got_pet("user", "cat", "Mike")', "2024-01-01");

        const result = await ec.query<{ Type: string; Name: string }>(
          'holds_now(has_pet("user", Type, Name))'
        );
        expect(result[0].Type).toBe("cat");
        expect(result[0].Name).toBe("Mike");
      });

      it("lost_pet → terminates has_pet", async () => {
        await ec.assertEvent('got_pet("user", "cat", "Mike")', "2024-01-01");
        await ec.assertEvent('lost_pet("user", "cat", "Mike")', "2024-06-01");

        const result = await ec.holdsNow('has_pet("user", "cat", "Mike")');
        expect(result).toBe(false);
      });
    });

    describe("Business/Ownership", () => {
      it("started_business → owns", async () => {
        await ec.assertEvent('started_business("user", "TechStartup")', "2024-01-01");

        const result = await ec.holdsNow('owns("user", "TechStartup")');
        expect(result).toBe(true);
      });

      it("founded → owns", async () => {
        await ec.assertEvent('founded("user", "MyCompany")', "2024-01-01");

        const result = await ec.holdsNow('owns("user", "MyCompany")');
        expect(result).toBe(true);
      });

      it("closed_business → terminates owns", async () => {
        await ec.assertEvent('started_business("user", "TechStartup")', "2024-01-01");
        await ec.assertEvent('closed_business("user", "TechStartup")', "2024-06-01");

        const result = await ec.holdsNow('owns("user", "TechStartup")');
        expect(result).toBe(false);
      });
    });

    describe("Employment (singular)", () => {
      it("hired_at → employed_at (terminates old)", async () => {
        await ec.assertEvent('hired_at("user", "Google")', "2024-01-01");
        await ec.assertEvent('hired_at("user", "Apple")', "2024-06-01");

        const jan = await ec.query<{ X: string }>('holds_at(employed_at("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(employed_at("user", X), "2024-09-01")');

        expect(jan.map((r) => r.X)).toEqual(["Google"]);
        expect(jul.map((r) => r.X)).toEqual(["Apple"]);
      });

      it("left_company → terminates employed_at", async () => {
        await ec.assertEvent('hired_at("user", "Google")', "2024-01-01");
        await ec.assertEvent('left_company("user", "Google")', "2024-06-01");

        const result = await ec.holdsNow('employed_at("user", "Google")');
        expect(result).toBe(false);
      });
    });

    describe("Projects", () => {
      it("started_project → working_on", async () => {
        await ec.assertEvent('started_project("user", "ProjectX")', "2024-01-01");

        const result = await ec.holdsNow('working_on("user", "ProjectX")');
        expect(result).toBe(true);
      });

      it("finished_project → terminates working_on", async () => {
        await ec.assertEvent('started_project("user", "ProjectX")', "2024-01-01");
        await ec.assertEvent('finished_project("user", "ProjectX")', "2024-06-01");

        const result = await ec.holdsNow('working_on("user", "ProjectX")');
        expect(result).toBe(false);
      });
    });

    describe("Learning (ongoing)", () => {
      it("started_learning → learning", async () => {
        await ec.assertEvent('started_learning("user", "Piano")', "2024-01-01");

        const result = await ec.holdsNow('learning("user", "Piano")');
        expect(result).toBe(true);
      });

      it("finished_learning → terminates learning AND adds to knows", async () => {
        await ec.assertEvent('started_learning("user", "Piano")', "2024-01-01");
        await ec.assertEvent('finished_learning("user", "Piano")', "2024-06-01");

        const learning = await ec.holdsNow('learning("user", "Piano")');
        const knows = await ec.holdsNow('knows("user", "Piano")');

        expect(learning).toBe(false);
        expect(knows).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Core Event Calculus
  // ===========================================================================

  describe("Core Event Calculus", () => {
    describe("holds_at", () => {
      it("should return true if fluent holds at time", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");

        expect(await ec.holdsAt('knows("user", "Python")', "2024-06-01")).toBe(true);
        expect(await ec.holdsAt('knows("user", "Python")', "2023-06-01")).toBe(false);
      });

      it("should handle exact initiation time", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");

        expect(await ec.holdsAt('knows("user", "Python")', "2024-01-01")).toBe(true);
      });
    });

    describe("holds_now", () => {
      it("should use current_date", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");

        const result = await ec.holdsNow('knows("user", "Python")');
        expect(result).toBe(true);
      });
    });

    describe("clipped (termination)", () => {
      it("should not hold after termination", async () => {
        await ec.assertEvent('started_member_of("user", "club")', "2024-01-01");
        await ec.assertEvent('stopped_member_of("user", "club")', "2024-06-01");

        expect(await ec.holdsAt('member_of("user", "club")', "2024-05-01")).toBe(true);
        expect(await ec.holdsAt('member_of("user", "club")', "2024-06-01")).toBe(false);
        expect(await ec.holdsAt('member_of("user", "club")', "2024-07-01")).toBe(false);
      });

      it("should allow re-initiation after termination", async () => {
        await ec.assertEvent('started_member_of("user", "club")', "2024-01-01");
        await ec.assertEvent('stopped_member_of("user", "club")', "2024-06-01");
        await ec.assertEvent('started_member_of("user", "club")', "2024-09-01");

        expect(await ec.holdsAt('member_of("user", "club")', "2024-05-01")).toBe(true);
        expect(await ec.holdsAt('member_of("user", "club")', "2024-07-01")).toBe(false);
        expect(await ec.holdsAt('member_of("user", "club")', "2024-10-01")).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Query Helpers
  // ===========================================================================

  describe("Query Helpers", () => {
    describe("all_holding", () => {
      it("should return all fluents that hold at time", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
        await ec.assertEvent('started_knows("user", "Rust")', "2024-02-01");
        await ec.assertEvent('got_job("user", "engineer")', "2024-03-01");

        const result = await ec.allHolding("2024-06-01");
        expect(result.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe("ever_held", () => {
      it("should return true if fluent ever held", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
        await ec.assertEvent('stopped_knows("user", "Python")', "2024-06-01");

        const result = await ec.query('ever_held(knows("user", "Python"))');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
