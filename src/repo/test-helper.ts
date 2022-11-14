/* eslint-disable @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any  */
import { it, expect, describe, beforeEach, afterEach } from "@jest/globals";
import { ulid } from "ulid";
import { Repository } from "./types";

/*
Use these tests on all variations of the Repository to ensure they have consistent behaviour
*/

interface WithRepository {
  repository: Repository;
}

export function standardRepoTests<T extends WithRepository>(
  setup: () => Promise<T>,
  teardown: (setupResult: T) => Promise<void>
) {
  let setupResult: T;
  let repository: Repository;

  beforeEach(async () => {
    setupResult = await setup();
    repository = setupResult.repository;
  });

  afterEach(async () => {
    await teardown(setupResult);
  });

  describe("LokeAuthAttempt", () => {
    describe("createLokeAuthAttempt", () => {
      it("should allow creating multiple attempts per organization", async () => {
        const attempt1 = await repository.createLokeAuthAttempt({
          state: "createLokeAuthAttempt1",
          codeVerifier: "verifier1",
        });
        const attempt2 = await repository.createLokeAuthAttempt({
          state: "createLokeAuthAttempt2",
          codeVerifier: "verifier2",
        });

        expect(attempt1.created instanceof Date).toBe(true);
        expect(attempt1.state === attempt2.state).toBe(false);
      });
    });

    describe("getLokeAuthAttemptByState", () => {
      it("should allow fetching attempts via state", async () => {
        const state1Str = ulid();
        const state2Str = ulid();
        const attempt1 = await repository.createLokeAuthAttempt({
          state: state1Str,
          codeVerifier: "verifier1",
        });
        const attempt2 = await repository.createLokeAuthAttempt({
          state: state2Str,
          codeVerifier: "verifier2",
        });

        const state1 = await repository.getLokeAuthAttemptByState(state1Str);
        const state2 = await repository.getLokeAuthAttemptByState(state2Str);

        expect(state1!.state).toBe(attempt1.state);
        expect(state2!.state).toBe(attempt2.state);
      });
    });
  });

  // describe("Streaks", () => {
  //   describe("createStreak", () => {
  //     it("should not allow creating multiple streaks per customer", async () => {
  //       const attempt1 = await repository.createStreak(
  //         "customer_1",
  //         "org_1",
  //         new Date(),
  //         new Date(),
  //         new Date()
  //       );
  //       const second = () =>
  //         repository.createStreak(
  //           "customer_1",
  //           "org_1",
  //           new Date(),
  //           new Date(),
  //           new Date()
  //         );
  //       expect(second()).rejects.toThrow();
  //     });
  //   });

  //   describe("getStreak", () => {
  //     it("should return null when no streak", async () => {
  //       const cust1 = ulid();
  //       const cust2 = ulid();
  //       await repository.createStreak(
  //         cust1,
  //         "org_1",
  //         new Date(),
  //         new Date(),
  //         new Date()
  //       );
  //       const streak = await repository.getStreak(cust2);

  //       expect(streak).toBe(null);
  //     });

  //     it("should return a streak when one exists", async () => {
  //       const cust1 = ulid();
  //       await repository.createStreak(
  //         cust1,
  //         "org_1",
  //         new Date(),
  //         new Date(),
  //         new Date()
  //       );
  //       const streak = await repository.getStreak(cust1);

  //       expect(streak?.customerId).toBe(cust1);
  //     });
  //   });

  //   describe("updateStreak", () => {
  //     it("should update existing streaks", async () => {
  //       const cust1 = ulid();
  //       await repository.createStreak(
  //         cust1,
  //         "org_1",
  //         new Date(),
  //         new Date(),
  //         new Date()
  //       );
  //       const d2a = new Date("2050-01-01");
  //       const d2b = new Date("2050-01-02");
  //       const streak = await repository.updateStreak(cust1, 2, d2a, d2b);

  //       expect(streak.count).toBe(2);
  //       expect(streak.nextPaymentMin.toISOString()).toBe(d2a.toISOString());
  //       expect(streak.nextPaymentMax.toISOString()).toBe(d2b.toISOString());
  //     });
  //   });

  //   describe("activateStreak", () => {
  //     it("should activate existing streaks", async () => {
  //       const cust1 = ulid();
  //       await repository.createStreak(
  //         cust1,
  //         "org_1",
  //         new Date(),
  //         new Date(),
  //         new Date()
  //       );
  //       const d = new Date("2050-01-01");
  //       const streak = await repository.activateStreak(cust1, d);

  //       expect(streak.streakAchieved?.toISOString()).toBe(d.toISOString());
  //     });
  //   });

  //   describe("getExpiredStreaks", () => {
  //     it("should update return streaks past nextPaymentMax", async () => {
  //       const dNow = new Date(Date.now());
  //       const dPast = new Date(dNow.getTime() - 60000);
  //       const dFuture = new Date(dNow.getTime() + 60000);
  //       const cust1 = ulid();
  //       const cust2 = ulid();
  //       await repository.createStreak(cust1, "org_1", dPast, dPast, dPast);
  //       await repository.createStreak(
  //         cust2,
  //         "org_1",
  //         dFuture,
  //         dFuture,
  //         dFuture
  //       );

  //       const expired = await repository.getExpiredStreaks(dNow);

  //       expect(expired.length).toBe(1);
  //       expect(expired[0].customerId).toBe(cust1);
  //     });
  //   });

  //   describe("archiveStreak", () => {
  //     it("should make the streak unavailable", async () => {
  //       const dNow = new Date(Date.now());
  //       const cust1 = ulid();
  //       await repository.createStreak(cust1, "org_1", dNow, dNow, dNow);
  //       const before = await repository.getStreak(cust1);

  //       await repository.archiveStreak(cust1);
  //       const after = await repository.getStreak(cust1);

  //       expect(before?.customerId).toBe(cust1);
  //       expect(after).toBe(null);
  //     });
  //   });
  // });

  describe("OrgConfigs", () => {
    describe("setConfig / getConfig", () => {
      it("should create new configs", async () => {
        const orgId = ulid();
        await repository.setConfig(orgId, {
          orgId,
          pointsForDollarSpent: 10,
        });

        const config = await repository.getConfig(orgId);
        expect(config?.orgId).toBe(orgId);
      });

      it("should overwrite configs", async () => {
        const orgId = ulid();

        await repository.setConfig(orgId, {
          orgId,
          pointsForDollarSpent: 10,
        });
        await repository.setConfig(orgId, {
          orgId,
          pointsForDollarSpent: 10,
        });

        const config = await repository.getConfig(orgId);
        expect(config?.orgId).toBe(orgId);
        expect(config?.pointsForDollarSpent).toBe(10);
      });
    });

    describe("clearConfig", () => {
      it("should remove existing configs", async () => {
        const orgId = ulid();

        await repository.setConfig(orgId, {
          orgId,
          pointsForDollarSpent: 10,
        });
        await repository.clearConfig(orgId);

        const config = await repository.getConfig(orgId);
        expect(config).toBe(null);
      });
    });
  });
}
