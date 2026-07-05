import test from "node:test";
import assert from "node:assert/strict";
import { headingsMatch, levenshtein } from "../src/lib/document/heading-match.ts";

test("heading match is case insensitive", () => {
  assert.equal(headingsMatch("Problem", "problem"), true);
  assert.equal(headingsMatch("Users", "Solution"), false);
});

test("heading match tolerates small typos via levenshtein", () => {
  assert.equal(headingsMatch("Open Questions", "Open Questons"), true);
  assert.equal(levenshtein("abc", "abd"), 1);
});

test("heading match uses substring containment", () => {
  assert.equal(headingsMatch("Problem Statement", "Problem"), true);
});
