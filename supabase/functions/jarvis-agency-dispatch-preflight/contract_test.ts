import { assertEquals } from "jsr:@std/assert@1";
import { assessHermesReadiness, normalizeLimit } from "./contract.ts";

const verifiedIntegration = {
  state: "verified",
  endpoint: "https://hermes.example.com/execute",
  metadata: { live_remote_execution: true },
  last_verified_at: "2026-11-23T12:00:00.000Z",
};

Deno.test("blocks local CLI even when an unrelated remote URL is configured", () => {
  const result = assessHermesReadiness({
    state: "verified",
    endpoint: "local-cli",
    metadata: { live_remote_execution: false },
    last_verified_at: "2026-11-23T12:00:00.000Z",
  }, "https://hermes.example.com/execute");
  assertEquals(result.ready, false);
  assertEquals(result.reasons.length, 3);
});

Deno.test("blocks a configured URL that does not match the verified endpoint", () => {
  const result = assessHermesReadiness(
    verifiedIntegration,
    "https://other.example.com/execute",
  );
  assertEquals(result.ready, false);
  assertEquals(result.reasons, [
    "Configured Hermes URL does not exactly match the verified integration endpoint",
  ]);
});

Deno.test("blocks HTTP endpoints", () => {
  const result = assessHermesReadiness({
    ...verifiedIntegration,
    endpoint: "http://hermes.example.com/execute",
  }, "http://hermes.example.com/execute");
  assertEquals(result.ready, false);
  assertEquals(result.reasons, ["Hermes execution endpoint must use HTTPS"]);
});

Deno.test("allows only a verified, timestamped, HTTPS endpoint that exactly matches configuration", () => {
  const result = assessHermesReadiness(
    verifiedIntegration,
    "https://hermes.example.com/execute",
  );
  assertEquals(result.ready, true);
  assertEquals(result.reasons, []);
});

Deno.test("blocks missing integration and missing configuration", () => {
  assertEquals(
    assessHermesReadiness(null, null).ready,
    false,
  );
  assertEquals(
    assessHermesReadiness(verifiedIntegration, null).ready,
    false,
  );
});

Deno.test("normalizes sample limits safely", () => {
  assertEquals(normalizeLimit(undefined), 10);
  assertEquals(normalizeLimit(-4), 1);
  assertEquals(normalizeLimit(100), 50);
  assertEquals(normalizeLimit("not-a-number"), 10);
});
