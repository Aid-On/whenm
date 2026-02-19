// Event Calculus Prolog Rules Test - tests event_calculus.pl directly
import { describe, it, expect, beforeEach } from "vitest";
import { createEngine, type WhenMEngine } from "../src/index.js";

describe("Event Calculus Prolog Rules", () => {
  let ec: WhenMEngine;
  beforeEach(async () => { ec = await createEngine({ currentDate: "2025-01-15" }); });

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
        expect(results.map((r) => r.X).sort()).toEqual(["Python", "Rust"]);
      });
    });

    describe("stopped_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_member_of("user", "chess_club")', "2024-01-01");
        await ec.assertEvent('stopped_member_of("user", "chess_club")', "2024-06-01");
        expect(await ec.holdsAt('member_of("user", "chess_club")', "2024-03-01")).toBe(true);
        expect(await ec.holdsAt('member_of("user", "chess_club")', "2024-09-01")).toBe(false);
      });
    });

    describe("quit_ pattern (terminator)", () => {
      it("should terminate fluent", async () => {
        await ec.assertEvent('started_hobby("user", "running")', "2024-01-01");
        await ec.assertEvent('quit_hobby("user", "running")', "2024-06-01");
        expect(await ec.holdsAt('hobby("user", "running")', "2024-03-01")).toBe(true);
        expect(await ec.holdsAt('hobby("user", "running")', "2024-09-01")).toBe(false);
      });
    });

    describe("ended_ and finished_ patterns", () => {
      it("ended_ should terminate fluent", async () => {
        await ec.assertEvent('started_project("user", "alpha")', "2024-01-01");
        await ec.assertEvent('ended_project("user", "alpha")', "2024-06-01");
        expect(await ec.holdsAt('project("user", "alpha")', "2024-09-01")).toBe(false);
      });

      it("finished_ should terminate fluent", async () => {
        await ec.assertEvent('started_task("user", "report")', "2024-01-01");
        await ec.assertEvent('finished_task("user", "report")', "2024-06-01");
        expect(await ec.holdsAt('task("user", "report")', "2024-09-01")).toBe(false);
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

    describe("set_ and got_ patterns (singular)", () => {
      it("set_ should initiate and terminate old value", async () => {
        await ec.assertEvent('set_name("user", "Alice")', "2024-01-01");
        await ec.assertEvent('set_name("user", "Bob")', "2024-06-01");
        const jan = await ec.query<{ X: string }>('holds_at(name("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(name("user", X), "2024-09-01")');
        expect(jan.map((r) => r.X)).toEqual(["Alice"]);
        expect(jul.map((r) => r.X)).toEqual(["Bob"]);
      });

      it("got_ should initiate and terminate old value", async () => {
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

  describe("Semantic Event Rules", () => {
    describe("Knowledge/Skills", () => {
      it("learned/studied/mastered/met -> knows", async () => {
        await ec.assertEvent('learned("user", "Python")', "2024-01-01");
        expect(await ec.holdsNow('knows("user", "Python")')).toBe(true);
        await ec.assertEvent('studied("user", "Math")', "2024-01-01");
        expect(await ec.holdsNow('knows("user", "Math")')).toBe(true);
        await ec.assertEvent('mastered("user", "Guitar")', "2024-01-01");
        expect(await ec.holdsNow('knows("user", "Guitar")')).toBe(true);
        await ec.assertEvent('met("user", "Alice")', "2024-01-01");
        expect(await ec.holdsNow('knows("user", "Alice")')).toBe(true);
      });
    });

    describe("Membership", () => {
      it("joined -> member_of", async () => {
        await ec.assertEvent('joined("user", "chess_club")', "2024-01-01");
        expect(await ec.holdsNow('member_of("user", "chess_club")')).toBe(true);
      });

      it("left/quit -> terminates member_of", async () => {
        await ec.assertEvent('joined("user", "chess_club")', "2024-01-01");
        await ec.assertEvent('left("user", "chess_club")', "2024-06-01");
        expect(await ec.holdsNow('member_of("user", "chess_club")')).toBe(false);
        await ec.assertEvent('joined("user", "gym")', "2024-01-01");
        await ec.assertEvent('quit("user", "gym")', "2024-06-01");
        expect(await ec.holdsNow('member_of("user", "gym")')).toBe(false);
      });
    });

    describe("Possession", () => {
      it("bought/acquired/obtained/got -> has", async () => {
        await ec.assertEvent('bought("user", "car")', "2024-01-01");
        expect(await ec.holdsNow('has("user", "car")')).toBe(true);
        await ec.assertEvent('acquired("user", "laptop")', "2024-01-01");
        expect(await ec.holdsNow('has("user", "laptop")')).toBe(true);
        await ec.assertEvent('obtained("user", "certificate")', "2024-01-01");
        expect(await ec.holdsNow('has("user", "certificate")')).toBe(true);
        await ec.assertEvent('got("user", "bike")', "2024-01-01");
        expect(await ec.holdsNow('has("user", "bike")')).toBe(true);
      });

      it("sold/lost -> terminates has", async () => {
        await ec.assertEvent('bought("user", "car")', "2024-01-01");
        await ec.assertEvent('sold("user", "car")', "2024-06-01");
        expect(await ec.holdsNow('has("user", "car")')).toBe(false);
        await ec.assertEvent('got("user", "wallet")', "2024-01-01");
        await ec.assertEvent('lost("user", "wallet")', "2024-06-01");
        expect(await ec.holdsNow('has("user", "wallet")')).toBe(false);
      });
    });

    describe("Location (singular)", () => {
      it("moved_to/relocated_to -> lives_in (terminates old)", async () => {
        await ec.assertEvent('moved_to("user", "Tokyo")', "2024-01-01");
        await ec.assertEvent('moved_to("user", "Osaka")', "2024-06-01");
        const jan = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2024-09-01")');
        expect(jan.map((r) => r.X)).toEqual(["Tokyo"]);
        expect(jul.map((r) => r.X)).toEqual(["Osaka"]);
        await ec.assertEvent('relocated_to("user", "NYC")', "2024-12-01");
        const dec = await ec.query<{ X: string }>('holds_at(lives_in("user", X), "2025-01-01")');
        expect(dec.map((r) => r.X)).toEqual(["NYC"]);
      });
    });

    describe("Relationships", () => {
      it("married -> married_to (singular), divorced terminates", async () => {
        await ec.assertEvent('married("user", "Alice")', "2024-01-01");
        expect(await ec.holdsNow('married_to("user", "Alice")')).toBe(true);
        await ec.assertEvent('divorced("user", "Alice")', "2024-06-01");
        expect(await ec.holdsNow('married_to("user", "Alice")')).toBe(false);
      });
    });

    describe("Likes/Dislikes", () => {
      it("started_liking/stopped_liking -> likes", async () => {
        await ec.assertEvent('started_liking("user", "coffee")', "2024-01-01");
        expect(await ec.holdsNow('likes("user", "coffee")')).toBe(true);
        await ec.assertEvent('stopped_liking("user", "coffee")', "2024-06-01");
        expect(await ec.holdsNow('likes("user", "coffee")')).toBe(false);
      });

      it("started_disliking/stopped_disliking -> dislikes", async () => {
        await ec.assertEvent('started_disliking("user", "crowded_trains")', "2024-01-01");
        expect(await ec.holdsNow('dislikes("user", "crowded_trains")')).toBe(true);
        await ec.assertEvent('stopped_disliking("user", "crowded_trains")', "2024-06-01");
        expect(await ec.holdsNow('dislikes("user", "crowded_trains")')).toBe(false);
      });
    });

    describe("Pets (3-arity)", () => {
      it("got_pet -> has_pet, lost_pet terminates", async () => {
        await ec.assertEvent('got_pet("user", "cat", "Mike")', "2024-01-01");
        const result = await ec.query<{ Type: string; Name: string }>('holds_now(has_pet("user", Type, Name))');
        expect(result[0].Type).toBe("cat");
        expect(result[0].Name).toBe("Mike");
        await ec.assertEvent('lost_pet("user", "cat", "Mike")', "2024-06-01");
        expect(await ec.holdsNow('has_pet("user", "cat", "Mike")')).toBe(false);
      });
    });

    describe("Business/Ownership", () => {
      it("started_business/founded -> owns, closed_business terminates", async () => {
        await ec.assertEvent('started_business("user", "TechStartup")', "2024-01-01");
        expect(await ec.holdsNow('owns("user", "TechStartup")')).toBe(true);
        await ec.assertEvent('founded("user", "MyCompany")', "2024-01-01");
        expect(await ec.holdsNow('owns("user", "MyCompany")')).toBe(true);
        await ec.assertEvent('closed_business("user", "TechStartup")', "2024-06-01");
        expect(await ec.holdsNow('owns("user", "TechStartup")')).toBe(false);
      });
    });

    describe("Employment (singular)", () => {
      it("hired_at -> employed_at (terminates old), left_company terminates", async () => {
        await ec.assertEvent('hired_at("user", "Google")', "2024-01-01");
        await ec.assertEvent('hired_at("user", "Apple")', "2024-06-01");
        const jan = await ec.query<{ X: string }>('holds_at(employed_at("user", X), "2024-03-01")');
        const jul = await ec.query<{ X: string }>('holds_at(employed_at("user", X), "2024-09-01")');
        expect(jan.map((r) => r.X)).toEqual(["Google"]);
        expect(jul.map((r) => r.X)).toEqual(["Apple"]);
        await ec.assertEvent('left_company("user", "Apple")', "2024-12-01");
        expect(await ec.holdsNow('employed_at("user", "Apple")')).toBe(false);
      });
    });

    describe("Projects and Learning", () => {
      it("started_project/finished_project -> working_on", async () => {
        await ec.assertEvent('started_project("user", "ProjectX")', "2024-01-01");
        expect(await ec.holdsNow('working_on("user", "ProjectX")')).toBe(true);
        await ec.assertEvent('finished_project("user", "ProjectX")', "2024-06-01");
        expect(await ec.holdsNow('working_on("user", "ProjectX")')).toBe(false);
      });

      it("started_learning/finished_learning -> learning and knows", async () => {
        await ec.assertEvent('started_learning("user", "Piano")', "2024-01-01");
        expect(await ec.holdsNow('learning("user", "Piano")')).toBe(true);
        await ec.assertEvent('finished_learning("user", "Piano")', "2024-06-01");
        expect(await ec.holdsNow('learning("user", "Piano")')).toBe(false);
        expect(await ec.holdsNow('knows("user", "Piano")')).toBe(true);
      });
    });
  });

  describe("Core Event Calculus", () => {
    describe("holds_at and holds_now", () => {
      it("should return true if fluent holds at time", async () => {
        await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
        expect(await ec.holdsAt('knows("user", "Python")', "2024-06-01")).toBe(true);
        expect(await ec.holdsAt('knows("user", "Python")', "2023-06-01")).toBe(false);
        expect(await ec.holdsAt('knows("user", "Python")', "2024-01-01")).toBe(true);
        expect(await ec.holdsNow('knows("user", "Python")')).toBe(true);
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

  describe("Query Helpers", () => {
    it("all_holding should return all fluents at time", async () => {
      await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
      await ec.assertEvent('started_knows("user", "Rust")', "2024-02-01");
      await ec.assertEvent('got_job("user", "engineer")', "2024-03-01");
      const result = await ec.allHolding("2024-06-01");
      expect(result.length).toBeGreaterThanOrEqual(3);
    });

    it("ever_held should return true if fluent ever held", async () => {
      await ec.assertEvent('started_knows("user", "Python")', "2024-01-01");
      await ec.assertEvent('stopped_knows("user", "Python")', "2024-06-01");
      const result = await ec.query('ever_held(knows("user", "Python"))');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
