export type HermesIntegration = {
  state: string;
  endpoint: string | null;
  metadata: Record<string, unknown> | null;
  last_verified_at: string | null;
};

export function assessHermesReadiness(
  integration: HermesIntegration | null,
  executionUrlConfigured: boolean,
): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!integration) reasons.push("Hermes integration record is missing");
  if (integration && integration.state !== "verified") {
    reasons.push(`Hermes integration state is ${integration.state}, not verified`);
  }
  const metadata = integration?.metadata ?? {};
  if (metadata.live_remote_execution !== true && !executionUrlConfigured) {
    reasons.push("No verified remote Hermes execution endpoint is configured");
  }
  if (integration?.endpoint === "local-cli" && !executionUrlConfigured) {
    reasons.push("Hermes is configured for local CLI only; Supabase Edge Functions cannot invoke that local process");
  }
  if (integration && !integration.last_verified_at) {
    reasons.push("Hermes has never completed a recorded live verification");
  }
  return { ready: reasons.length === 0, reasons };
}

export function normalizeLimit(value: unknown): number {
  const parsed = Number(value ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}
