/**
 * WhenMEngine Benchmark - 20 Questions
 *
 * LOCOMO-style comprehensive temporal reasoning benchmark.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { createEngine, type WhenMEngine } from "../src/index.js";

describe("WhenMEngine 20 Questions Benchmark", () => {
  let ec: WhenMEngine;

  // Setup: Create a rich life story
  beforeAll(async () => {
    ec = await createEngine({ currentDate: "2025-12-16" });

    // === USER LIFE STORY ===

    // Name & Age
    await ec.assertEvent('set_name(user, "田中太郎")', "1990-05-15");
    await ec.assertEvent('set_age(user, 35)', "2025-05-15");

    // Education & Career
    await ec.assertEvent('got_job(user, "インターン")', "2012-04-01");
    await ec.assertEvent('got_job(user, "ジュニアエンジニア")', "2013-04-01");
    await ec.assertEvent('got_job(user, "シニアエンジニア")', "2016-04-01");
    await ec.assertEvent('got_job(user, "テックリード")', "2019-07-01");
    await ec.assertEvent('got_job(user, "CTO")', "2022-01-15");

    // Residences
    await ec.assertEvent('moved_to(user, "仙台")', "1990-05-15"); // born
    await ec.assertEvent('moved_to(user, "東京")', "2012-04-01"); // for work
    await ec.assertEvent('moved_to(user, "サンフランシスコ")', "2017-09-01"); // overseas
    await ec.assertEvent('moved_to(user, "東京")', "2019-04-01"); // returned
    await ec.assertEvent('moved_to(user, "宮崎")', "2023-06-01"); // remote work

    // Relationships
    await ec.assertEvent('met(user, "鈴木")', "2013-06-15");
    await ec.assertEvent('met(user, "佐藤")', "2014-03-20");
    await ec.assertEvent('met(user, "山田")', "2017-11-10");
    await ec.assertEvent('met(user, "Smith")', "2018-02-28");
    await ec.assertEvent('married(user, "花子")', "2020-11-22");

    // Hobbies
    await ec.assertEvent('started_hobby(user, "プログラミング")', "2010-01-01");
    await ec.assertEvent('started_hobby(user, "ランニング")', "2015-03-01");
    await ec.assertEvent('started_hobby(user, "サーフィン")', "2023-07-01");
    await ec.assertEvent('quit_hobby(user, "ランニング")', "2021-06-01");

    // Likes & Dislikes
    await ec.assertEvent('started_liking(user, "コーヒー")', "2013-01-01");
    await ec.assertEvent('started_liking(user, "寿司")', "2010-01-01");
    await ec.assertEvent('started_liking(user, "ラーメン")', "2012-04-01");
    await ec.assertEvent('started_disliking(user, "満員電車")', "2012-04-01");
    await ec.assertEvent('stopped_disliking(user, "満員電車")', "2023-06-01"); // remote work

    // Pets
    await ec.assertEvent('got_pet(user, "猫", "ミケ")', "2021-03-15");
  });

  // ===========================================================================
  // Q1-5: Basic fact retrieval
  // ===========================================================================

  it("Q1: What is user's name?", async () => {
    const result = await ec.query<{ X: string }>('holds_now(name(user, X))');
    expect(result[0].X).toBe("田中太郎");
  });

  it("Q2: What is user's current job?", async () => {
    const result = await ec.query<{ X: string }>('holds_now(job(user, X))');
    expect(result[0].X).toBe("CTO");
  });

  it("Q3: Where does user currently live?", async () => {
    const result = await ec.query<{ X: string }>('holds_now(lives_in(user, X))');
    expect(result[0].X).toBe("宮崎");
  });

  it("Q4: Is user married?", async () => {
    const result = await ec.holdsNow('married_to(user, "花子")');
    expect(result).toBe(true);
  });

  it("Q5: Does user have a pet?", async () => {
    const result = await ec.query<{ Pet: string; Name: string }>(
      'holds_now(has_pet(user, Pet, Name))'
    );
    expect(result[0].Pet).toBe("猫");
    expect(result[0].Name).toBe("ミケ");
  });

  // ===========================================================================
  // Q6-10: Point-in-time queries
  // ===========================================================================

  it("Q6: What was user's job in 2015?", async () => {
    const result = await ec.query<{ X: string }>(
      'holds_at(job(user, X), "2015-06-01")'
    );
    expect(result[0].X).toBe("ジュニアエンジニア");
  });

  it("Q7: Where did user live in 2018?", async () => {
    const result = await ec.query<{ X: string }>(
      'holds_at(lives_in(user, X), "2018-06-01")'
    );
    expect(result[0].X).toBe("サンフランシスコ");
  });

  it("Q8: Was user doing ランニング in 2017?", async () => {
    const result = await ec.holdsAt('hobby(user, "ランニング")', "2017-01-01");
    expect(result).toBe(true);
  });

  it("Q9: Was user doing ランニング in 2022?", async () => {
    const result = await ec.holdsAt('hobby(user, "ランニング")', "2022-01-01");
    expect(result).toBe(false); // quit in 2021
  });

  it("Q10: Did user dislike 満員電車 in 2020?", async () => {
    const result = await ec.holdsAt('dislikes(user, "満員電車")', "2020-01-01");
    expect(result).toBe(true);
  });

  // ===========================================================================
  // Q11-15: Relational & multi-hop queries
  // ===========================================================================

  it("Q11: Who did user know when living in サンフランシスコ?", async () => {
    // SF period: 2017-09-01 to 2019-04-01
    const result = await ec.query<{ X: string }>(
      'holds_at(knows(user, X), "2018-12-01")'
    );
    const names = result.map((r) => r.X).sort();

    expect(names).toContain("鈴木");
    expect(names).toContain("佐藤");
    expect(names).toContain("山田");
    expect(names).toContain("Smith");
  });

  it("Q12: What job did user have when they got married?", async () => {
    // Married: 2020-11-22
    const result = await ec.query<{ X: string }>(
      'holds_at(job(user, X), "2020-11-22")'
    );
    expect(result[0].X).toBe("テックリード");
  });

  it("Q13: Where was user living when they became CTO?", async () => {
    // CTO: 2022-01-15
    const result = await ec.query<{ X: string }>(
      'holds_at(lives_in(user, X), "2022-01-15")'
    );
    expect(result[0].X).toBe("東京");
  });

  it("Q14: What hobbies did user have in 2016?", async () => {
    const result = await ec.query<{ X: string }>(
      'holds_at(hobby(user, X), "2016-06-01")'
    );
    const hobbies = result.map((r) => r.X).sort();

    expect(hobbies).toContain("プログラミング");
    expect(hobbies).toContain("ランニング");
    expect(hobbies).not.toContain("サーフィン"); // started 2023
  });

  it("Q15: How many people did user know by 2015?", async () => {
    const result = await ec.query<{ X: string }>(
      'holds_at(knows(user, X), "2015-01-01")'
    );
    expect(result.length).toBe(2); // 鈴木, 佐藤
  });

  // ===========================================================================
  // Q16-20: Complex temporal reasoning
  // ===========================================================================

  it("Q16: Did user change jobs after moving to 宮崎?", async () => {
    // Moved to 宮崎: 2023-06-01
    // CTO: 2022-01-15 (before move)
    const jobBeforeMove = await ec.query<{ X: string }>(
      'holds_at(job(user, X), "2023-05-01")'
    );
    const jobAfterMove = await ec.query<{ X: string }>(
      'holds_at(job(user, X), "2023-07-01")'
    );

    expect(jobBeforeMove[0].X).toBe("CTO");
    expect(jobAfterMove[0].X).toBe("CTO");
    // No job change after moving to Miyazaki
  });

  it("Q17: What was the sequence of user's jobs?", async () => {
    const jobs = [
      { date: "2012-06-01", expected: "インターン" },
      { date: "2014-01-01", expected: "ジュニアエンジニア" },
      { date: "2017-01-01", expected: "シニアエンジニア" },
      { date: "2020-01-01", expected: "テックリード" },
      { date: "2023-01-01", expected: "CTO" },
    ];

    for (const { date, expected } of jobs) {
      const result = await ec.query<{ X: string }>(
        `holds_at(job(user, X), "${date}")`
      );
      expect(result[0].X).toBe(expected);
    }
  });

  it("Q18: Did user start サーフィン before or after moving to 宮崎?", async () => {
    // サーフィン: 2023-07-01
    // 宮崎: 2023-06-01
    // So サーフィン started AFTER moving to 宮崎

    const surfBefore = await ec.holdsAt('hobby(user, "サーフィン")', "2023-06-15");
    const surfAfter = await ec.holdsAt('hobby(user, "サーフィン")', "2023-08-01");

    expect(surfBefore).toBe(false);
    expect(surfAfter).toBe(true);
  });

  it("Q19: Did user still dislike 満員電車 after moving to 宮崎?", async () => {
    // Stopped disliking: 2023-06-01 (same day as moving, remote work)
    const dislikeBefore = await ec.holdsAt('dislikes(user, "満員電車")', "2023-05-01");
    const dislikeAfter = await ec.holdsAt('dislikes(user, "満員電車")', "2023-07-01");

    expect(dislikeBefore).toBe(true);
    expect(dislikeAfter).toBe(false);
  });

  it("Q20: Comprehensive state check at 2018-01-01", async () => {
    const date = "2018-01-01";

    // Job
    const job = await ec.query<{ X: string }>(`holds_at(job(user, X), "${date}")`);
    expect(job[0].X).toBe("シニアエンジニア");

    // Location
    const loc = await ec.query<{ X: string }>(`holds_at(lives_in(user, X), "${date}")`);
    expect(loc[0].X).toBe("サンフランシスコ");

    // Hobbies
    const hobbies = await ec.query<{ X: string }>(`holds_at(hobby(user, X), "${date}")`);
    const hobbyList = hobbies.map((h) => h.X).sort();
    expect(hobbyList).toEqual(["プログラミング", "ランニング"]);

    // Relationships (Smith met on 2018-02-28, so not known yet on 2018-01-01)
    const knows = await ec.query<{ X: string }>(`holds_at(knows(user, X), "${date}")`);
    expect(knows.length).toBe(3); // 鈴木, 佐藤, 山田 (not Smith yet)

    // Marriage
    const married = await ec.holdsAt('married_to(user, "花子")', date);
    expect(married).toBe(false); // Not married yet

    // Likes
    const coffee = await ec.holdsAt('likes(user, "コーヒー")', date);
    expect(coffee).toBe(true);
  });
});
