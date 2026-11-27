export type HermesIntegration = {
  state: string;
  endpoint: string | null;
  metadata: Record<string, unknown> | null;
  last_verified_at: string | null;
};

export type HermesReadiness = { ready: boolean; reasons: string[] };

export function assessHermesReadiness(
  integration: HermesIntegration | null,
  configuredExecutionUrl: string | null,
): HermesReadiness {
  const reasons: string[] = [];

  if (!integration) {
    reasons.push("Hermes integration record is missing");
    return { ready: false, reasons };
  }

  if (integration.state !== "verified") {
    reasons.push(`Hermes integration state is ${integration.state}, not verified`);
  }

  if (!integration.last_verified_at) {
    reasons.push("Hermes has no recorded successful live verification");
  } else if (!Number.isFinite(Date.parse(integration.last_verified_at))) {
    reasons.push("Hermes verification timestamp is invalid");
  }

  const registeredEndpoint = integration.endpoint;
  if (!registeredEndpoint || registeredEndpoint === "local-cli") {
    reasons.push("Hermes is not registered with a remote execution endpoint");
  } else {
    try {
      const parsed = new URL(registeredEndpoint);
      if (parsed.protocol !== "https:") {
        reasons.push("Hermes execution endpoint must use HTTPS");
      }
    } catch {
      reasons.push("Hermes registered execution endpoint is not a valid URL");
    }
  }

  if (integration.metadata?.live_remote_execution !== true) {
    reasons.push("Hermes integration is not marked for live remote execution");
  }

  if (!configuredExecutionUrl) {
    reasons.push("HERMES_EXECUTION_URL is not configured");
  } else if (configuredExecutionUrl !== registeredEndpoint) {
    reasons.push("Configured Hermes URL does not exactly match the verified integration endpoint");
  }

  return { ready: reasons.length === 0, reasons };
}

export function normalizeLimit(value: unknown): number {
  const parsed = Number(value ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(50, Math.max(1, Math.floor(parsed)));
}
