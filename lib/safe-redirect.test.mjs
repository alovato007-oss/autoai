import test from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "./safe-redirect.mjs";

test("accepts a same-origin path with query and fragment", () => {
  assert.equal(safeInternalPath("/dashboard?tab=missions#latest"), "/dashboard?tab=missions#latest");
});

test("rejects protocol-relative external redirects", () => {
  assert.equal(safeInternalPath("//evil.example/path"), "/dashboard");
});

test("rejects absolute external URLs", () => {
  assert.equal(safeInternalPath("https://evil.example"), "/dashboard");
});

test("rejects backslash-based URL confusion", () => {
  assert.equal(safeInternalPath("/" + String.fromCharCode(92) + "evil.example"), "/dashboard");
});

test("rejects control characters and oversized values", () => {
  assert.equal(safeInternalPath("/dashboard" + String.fromCharCode(10) + "https://evil.example"), "/dashboard");
  assert.equal(safeInternalPath("/" + "a".repeat(2048)), "/dashboard");
});

test("uses a safe fallback when supplied", () => {
  assert.equal(safeInternalPath("//evil.example", "/"), "/");
});
