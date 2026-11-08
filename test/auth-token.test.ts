import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, sessionEmail, passwordHash, verifyPassword } from "../lib/auth-token";
test("signed sessions reject changed identities and expired tokens",()=>{
  process.env.SESSION_SECRET="test-secret-32-characters-long-enough-for-tests";
  const token=createSessionToken("owner@example.test",1000);
  assert.equal(sessionEmail(token,2000),"owner@example.test");
  assert.equal(sessionEmail(token.replace(".","x."),2000),null);
  assert.equal(sessionEmail(token,1000+8*3600_000+1),null);
  assert.equal(sessionEmail("owner@example.test",2000),null);
});
test("password verification uses salted hashes",()=>{
  const first=passwordHash("correct-horse-demo");
  assert.notEqual(first,passwordHash("correct-horse-demo"));
  assert.equal(verifyPassword("correct-horse-demo",first),true);
  assert.equal(verifyPassword("wrong-password",first),false);
  assert.equal(verifyPassword("correct-horse-demo",null),false);
});
