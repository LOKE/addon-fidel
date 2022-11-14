import { describe } from "@jest/globals";
import { MockRepository } from "./repository";
import { standardRepoTests } from "../repo/test-helper";

describe("MockRepository", () => {
  async function setup() {
    const repository = new MockRepository();
    return { repository };
  }

  async function teardown(/* setupResults: { repository: MockRepository } */) {
    // nothing to do
  }

  standardRepoTests(setup, teardown);
});
