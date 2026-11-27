import { assertEquals } from "jsr:@std/assert@1";
import { assessHermesReadiness, normalizeLimit } from "./contract.ts";

Deno.test("blocks local CLI configuration without a remote endpoint", () => {
  const result = assessHermesReadiness({
    state: "configured",
    endpoint: "local-cli",
    metadata: { live_remote_execution: false },
    last_verified_at: null,
  }, false);
  assertEquals(result.ready, false);
  assertEquals(result.reasons.length, 4);
});

Deno.test("allows only a verified and remotely configured Hermes runtime", () => {
  const result = assessHermesReadiness({
    state: "verified",
    endpoint: "https://hermes.example.invalid/execute",
    metadata: { live_remote_execution: true },
    last_verified_at: "2026-11-23T12:00:00.000Z",
  }, true);
  assertEquals(result.ready, true);
  assertEquals(result.reasons, []);
});

Deno.test("normalizes sample limits safely", () => {
  assertEquals(normalizeLimit(undefined), 10);
  assertEquals(normalizeLimit(-4), 1);
  assertEquals(normalizeLimit(100), 50);
  assertEquals(normalizeLimit("not-a-number"), 10);
});
