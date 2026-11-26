import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

const FIELD_LIMITS = {
  company_name: 160,
  website: 300,
  industry: 120,
  location: 120,
  fit_reason: 1200,
} as const;

type LeadInput = {
  company_name: string;
  website: string;
  industry: string;
  location: string;
  fit_reason: string;
};

function validateLeadInput(value: unknown): LeadInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const fields: Record<keyof LeadInput, string> = {
    company_name: "",
    website: "",
    industry: "",
    location: "",
    fit_reason: "",
  };

  for (const key of Object.keys(FIELD_LIMITS) as (keyof LeadInput)[]) {
    const field = input[key];
    if (field === undefined || field === null) continue;
    if (typeof field !== "string" || field.length > FIELD_LIMITS[key]) return null;
    fields[key] = field.trim();
  }

  if (!fields.company_name) return null;
  return fields;
}

function validScoreResult(value: unknown): value is {
  score: number;
  priority: "low" | "medium" | "high";
  reasoning: string;
  recommended_action: string;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  return Number.isInteger(result.score) &&
    Number(result.score) >= 0 &&
    Number(result.score) <= 100 &&
    ["low", "medium", "high"].includes(String(result.priority)) &&
    typeof result.reasoning === "string" &&
    result.reasoning.length <= 2000 &&
    typeof result.recommended_action === "string" &&
    result.recommended_action.length <= 500;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (!claims?.claims) {
      return NextResponse.json({ error: "Sign in to use AI prospect scoring." }, { status: 401 });
    }

    const { data: withinQuota, error: quotaError } = await supabase.rpc(
      "consume_ai_scoring_quota",
      { p_limit: 10, p_window_seconds: 3600 }
    );
    if (quotaError) {
      return NextResponse.json({ error: "AI scoring protection is not configured. Please try again later." }, { status: 503 });
    }
    if (!withinQuota) {
      return NextResponse.json(
        { error: "You have reached the scoring limit of 10 requests per hour." },
        { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } }
      );
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > 8192) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 8192) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }

    const input = validateLeadInput(body);
    if (!input) {
      return NextResponse.json({ error: "Provide a company name and valid text fields within the allowed limits." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "AI scoring is temporarily unavailable." }, { status: 503 });
    }

    const client = new OpenAI({ apiKey, timeout: 15000, maxRetries: 0 });
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input:
        "Score this B2B prospect for an AI automation agency. Return JSON only with score (0-100), priority (low|medium|high), reasoning, and recommended_action. " +
        `Company: ${input.company_name}; Website: ${input.website}; Industry: ${input.industry}; Location: ${input.location}; Fit reason: ${input.fit_reason}`,
      text: { format: { type: "json_object" } },
    });

    if (!response.output_text) {
      return NextResponse.json({ error: "The scoring service returned an empty response." }, { status: 502 });
    }

    let result: unknown;
    try {
      result = JSON.parse(response.output_text);
    } catch {
      return NextResponse.json({ error: "The scoring service returned an invalid response." }, { status: 502 });
    }

    if (!validScoreResult(result)) {
      return NextResponse.json({ error: "The scoring service returned an unexpected result." }, { status: 502 });
    }

    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Scoring failed. Please try again later." }, { status: 500 });
  }
}
