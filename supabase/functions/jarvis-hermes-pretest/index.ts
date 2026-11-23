import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

const expectedResponse = "JARVIS_HERMES_ACP_PRETEST_OK";

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const enabled = Deno.env.get("JARVIS_PRETEST_ENABLED") === "true";
  const callerSecret = Deno.env.get("JARVIS_PRETEST_CALLER_SECRET") ?? "";
  const bridgeUrl = Deno.env.get("HERMES_ACP_BRIDGE_URL") ?? "";
  const bridgeToken = Deno.env.get("HERMES_ACP_BRIDGE_TOKEN") ?? "";
  const missionKey = Deno.env.get("JARVIS_PRETEST_MISSION_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!enabled || !callerSecret || !bridgeUrl || !bridgeToken || !missionKey || !supabaseUrl || !serviceRole) {
    return json({ error: "Pre-test is disabled or required secrets are missing" }, 503);
  }
  if (req.headers.get("x-jarvis-pretest-secret") !== callerSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: existing, error: lookupError } = await db.schema("jarvis")
    .from("missions").select("id,mission_key,status").eq("mission_key", missionKey).maybeSingle();
  if (lookupError) return json({ error: lookupError.message }, 500);
  if (existing) return json({ error: "This one-time pre-test mission already exists", mission: existing }, 409);

  const { data: mission, error: missionError } = await db.schema("jarvis").from("missions").insert({
    mission_key: missionKey,
    title: "Hermes ACP connectivity pre-test",
    objective: "Prove that JARVIS can reach the independent Hermes ACP runtime and capture a real response. No business actions.",
    priority: "normal",
    status: "planned",
  }).select("id,mission_key,status").single();
  if (missionError || !mission) return json({ error: missionError?.message ?? "Mission creation failed" }, 500);

  const taskKey = `${missionKey}:task-1`;
  const taskPayload = { mode: "connectivity_pretest", mission_key: missionKey, expected_response: expectedResponse };
  const { data: task, error: taskError } = await db.schema("jarvis").from("tasks").insert({
    task_key: taskKey,
    mission_id: mission.id,
    title: "Verify Hermes ACP connectivity",
    action: "hermes_acp_pretest",
    status: "queued",
    payload: taskPayload,
  }).select("id,task_key,payload").single();

  if (taskError || !task) {
    await db.schema("jarvis").from("missions").delete().eq("id", mission.id);
    return json({ error: taskError?.message ?? "Task creation failed" }, 500);
  }

  await db.schema("jarvis").from("events").insert({
    event_type: "mission.created",
    source: "jarvis-hermes-pretest",
    mission_id: mission.id,
    task_id: task.id,
    payload: { mission_key: missionKey, task_key: taskKey, mode: "connectivity_pretest" },
  });

  let bridgeResult: Record<string, unknown>;
  try {
    const response = await fetch(bridgeUrl, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${bridgeToken}` },
      body: JSON.stringify({ mission_id: missionKey, idempotency_key: taskKey }),
      signal: AbortSignal.timeout(210_000),
    });
    const raw = await response.text();
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
    if (!response.ok || !parsed || typeof parsed !== "object") {
      throw new Error(`Hermes bridge failed (HTTP ${response.status})`);
    }
    bridgeResult = parsed as Record<string, unknown>;
    if (bridgeResult.ok !== true || bridgeResult.response !== expectedResponse) {
      throw new Error("Hermes did not return the expected ACP pre-test response");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Hermes bridge error";
    await db.schema("jarvis").from("tasks").update({ status: "failed", result: { error: message } }).eq("id", task.id);
    await db.schema("jarvis").from("missions").update({ status: "RETRY", updated_at: new Date().toISOString() }).eq("id", mission.id);
    await db.schema("jarvis").from("events").insert({
      event_type: "mission.execution_failed",
      source: "jarvis-hermes-pretest",
      mission_id: mission.id,
      task_id: task.id,
      payload: { error: message },
    });
    return json({ mission_id: mission.id, task_id: task.id, state: "EXECUTION_FAILED", error: message }, 502);
  }

  const executionKey = `${taskKey}:hermes-acp`;
  const evidence = {
    protocol: bridgeResult.protocol,
    session_id: bridgeResult.session_id,
    response: bridgeResult.response,
    bridge_evidence: bridgeResult.evidence,
    idempotency_key: taskKey,
  };
  const { data: execution, error: executionError } = await db.schema("jarvis").from("executions").insert({
    execution_key: executionKey,
    task_id: task.id,
    status: "succeeded",
    input: taskPayload,
    output: { result: bridgeResult.response, evidence },
    completed_at: new Date().toISOString(),
  }).select("id,status").single();

  if (executionError || !execution) {
    await db.schema("jarvis").from("tasks").update({ status: "failed", result: { error: executionError?.message ?? "Execution record failed" } }).eq("id", task.id);
    return json({ mission_id: mission.id, task_id: task.id, state: "RESULT_PERSISTENCE_FAILED", error: executionError?.message }, 500);
  }

  const { error: evidenceError } = await db.schema("jarvis").from("mission_evidence").insert({
    mission_id: mission.id,
    evidence_type: "hermes_acp_pretest",
    source: "hermes-acp-bridge",
    payload: { execution_id: execution.id, ...evidence },
  });
  if (evidenceError) return json({ mission_id: mission.id, task_id: task.id, state: "EVIDENCE_PERSISTENCE_FAILED", error: evidenceError.message }, 500);

  const { error: taskUpdateError } = await db.schema("jarvis").from("tasks").update({
    status: "completed",
    result: { execution_id: execution.id, result: bridgeResult.response, evidence },
    updated_at: new Date().toISOString(),
  }).eq("id", task.id);
  if (taskUpdateError) return json({ mission_id: mission.id, task_id: task.id, state: "TASK_UPDATE_FAILED", error: taskUpdateError.message }, 500);

  await db.schema("jarvis").from("missions").update({
    status: "EXECUTED",
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", mission.id);

  const verifyResponse = await fetch(`${supabaseUrl}/functions/v1/jarvis-verifier-v4`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${serviceRole}`, apikey: serviceRole },
    body: JSON.stringify({ missionId: mission.id }),
    signal: AbortSignal.timeout(30_000),
  });
  const verificationText = await verifyResponse.text();
  let verification: unknown;
  try { verification = JSON.parse(verificationText); } catch { verification = { raw: verificationText }; }
  const { data: finalMission } = await db.schema("jarvis").from("missions")
    .select("id,mission_key,status,verified_at").eq("id", mission.id).single();

  return json({
    mission: finalMission,
    task_id: task.id,
    execution_id: execution.id,
    hermes_response: bridgeResult.response,
    verification,
    verified: finalMission?.status === "VERIFIED",
    rule: "Only a response received from Hermes ACP is recorded as a successful execution.",
  }, verifyResponse.ok && finalMission?.status === "VERIFIED" ? 200 : 422);
});
