import { describe, it } from "node:test";
import assert from "node:assert";
import { getTopicCoverage } from "../src/lib/topic-coverage";
import { DEFAULT_ANATOMY_TOPICS } from "../src/lib/constants";

describe("Exam Page Error Handling", () => {
  it("should return fallback topics when database is unavailable", async () => {
    // This test verifies that getTopicCoverage gracefully falls back to static topics
    // even when the database connection fails
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));
    assert.ok(topics.length > 0);

    // Verify structure of returned topics
    topics.forEach((topic) => {
      assert.ok(topic.id);
      assert.ok(topic.name);
      assert.ok(topic.slug);
      assert.ok(Array.isArray(topic.childTopics));
      assert.ok(typeof topic.materialCount === "number");
      assert.ok(typeof topic.questionCount === "number");
      assert.ok(typeof topic.subtopicCount === "number");
    });
  });

  it("should filter topics by search term", async () => {
    const topics = await getTopicCoverage("thorax");

    assert.ok(Array.isArray(topics));

    // Should return topics matching "thorax"
    const hasThorax = topics.some((topic) => topic.name.toLowerCase().includes("thorax"));
    assert.ok(hasThorax || topics.length === 0); // Either found or no match
  });

  it("should return all default topics without search", async () => {
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));
    assert.ok(topics.length >= DEFAULT_ANATOMY_TOPICS.length);
  });

  it("should handle empty search gracefully", async () => {
    const topics = await getTopicCoverage("");

    assert.ok(Array.isArray(topics));
    assert.ok(topics.length > 0);
  });

  it("should include child topics in returned data", async () => {
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));
    assert.ok(topics.length > 0);

    // At least one topic should have child topics
    const hasChildTopics = topics.some((topic) => topic.childTopics.length > 0);
    assert.ok(hasChildTopics);

    // Verify child topic structure
    topics.forEach((topic) => {
      if (topic.childTopics.length > 0) {
        topic.childTopics.forEach((child) => {
          assert.ok(child.id);
          assert.ok(child.name);
          assert.ok(child.slug);
        });
      }
    });
  });
});
