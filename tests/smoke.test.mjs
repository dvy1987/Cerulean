import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Mirror api-keys hashing logic for unit test
function hashApiKey(rawKey) {
  return createHash("sha256").update(rawKey).digest("hex");
}

test("API key hash is deterministic", () => {
  const key = "cer_test_key_12345";
  assert.equal(hashApiKey(key), hashApiKey(key));
  assert.notEqual(hashApiKey(key), hashApiKey("cer_other"));
});

test("username pattern validation", () => {
  const re = /^[a-zA-Z0-9_]{3,32}$/;
  assert.ok(re.test("divya_pm"));
  assert.ok(!re.test("bad space"));
  assert.ok(!re.test("ab"));
});
