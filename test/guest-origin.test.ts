import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameOrigin } from "../lib/guest-origin";

test("guest creation accepts only an origin matching the request host", () => {
  assert.equal(isSameOrigin("http://127.0.0.1:3011", "127.0.0.1:3011"), true);
  assert.equal(isSameOrigin("https://example.com", "example.com"), true);
  assert.equal(isSameOrigin("https://attacker.example", "example.com"), false);
  assert.equal(isSameOrigin("https://example.com.attacker.test", "example.com"), false);
  assert.equal(isSameOrigin("https://example.com/path", "example.com"), false);
  assert.equal(isSameOrigin(null, "example.com"), false);
});
