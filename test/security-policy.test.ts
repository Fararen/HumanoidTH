import { test } from "node:test";
import assert from "node:assert/strict";
import { localRedirectPath } from "../lib/redirect-path";
import { imageExtension, MAX_UPLOAD_BYTES } from "../lib/upload-policy";

test("sign-in return URLs cannot leave the application through browser normalization", () => {
  assert.equal(localRedirectPath("/learn/navigation?continue=1#exercise"), "/learn/navigation?continue=1#exercise");
  for (const path of ["https://outside.test", "//outside.test", "/\\outside.test", "/\t/outside.test", "javascript:alert(1)", ""]) {
    assert.equal(localRedirectPath(path), "/me", path);
  }
});

test("uploads reject active documents, spoofed extensions and oversized image data", () => {
  for (const contents of ["<svg onload='alert(1)'/>", "<!doctype html><script>alert(1)</script>", "not an image", ""]) {
    assert.equal(imageExtension(Buffer.from(contents)), null);
  }
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=", "base64");
  assert.equal(imageExtension(png), ".png");
  assert.equal(imageExtension(Buffer.concat([png, Buffer.alloc(MAX_UPLOAD_BYTES)])), null);
});
