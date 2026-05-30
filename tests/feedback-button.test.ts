import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const feedbackButtonSource = () =>
  fs.readFileSync(path.join(process.cwd(), "src", "components", "feedback-button.tsx"), "utf8");

test("feedback button offers WhatsApp material submission with a 20MB limit", () => {
  const source = feedbackButtonSource();

  assert.match(source, /type FeedbackType = "problem" \| "suggestion" \| "material"/);
  assert.match(source, /Send Materials/);
  assert.match(source, /20MB or less/);
  assert.match(source, /Please attach the material here on WhatsApp/);
});
