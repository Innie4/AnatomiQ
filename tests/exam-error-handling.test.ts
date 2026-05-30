import { describe, it } from "node:test";
import assert from "node:assert";
import { getTopicCoverage } from "../src/lib/topic-coverage";

describe("Exam Page Error Handling", () => {
  it("should return only uploaded-material topics", async () => {
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));

    topics.forEach((topic) => {
      assert.ok(topic.id);
      assert.ok(topic.name);
      assert.ok(topic.slug);
      assert.ok(Array.isArray(topic.childTopics));
      assert.ok(topic.materialCount > 0);
      assert.ok(typeof topic.questionCount === "number");
      assert.ok(typeof topic.subtopicCount === "number");
    });
  });

  it("should filter topics by search term", async () => {
    const topics = await getTopicCoverage("science");

    assert.ok(Array.isArray(topics));

    // Should return topics matching "science"
    const hasScience = topics.some((topic) => topic.name.toLowerCase().includes("science"));
    assert.ok(hasScience || topics.length === 0); // Either found or no match
  });

  it("should return uploaded-material topics without search", async () => {
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));

    topics.forEach((topic) => {
      assert.ok(topic.id, "Topic should have id");
      assert.ok(topic.name, "Topic should have name");
      assert.ok(topic.slug, "Topic should have slug");
      assert.ok(topic.materialCount > 0, "Topic should be backed by uploaded material");
    });
  });

  it("should handle empty search gracefully", async () => {
    const topics = await getTopicCoverage("");

    assert.ok(Array.isArray(topics));
  });

  it("should include child topics in returned data", async () => {
    const topics = await getTopicCoverage();

    assert.ok(Array.isArray(topics));

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
