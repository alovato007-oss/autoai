import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { company_name, website, industry, location, fit_reason } = body;
    if (!company_name) {
      return NextResponse.json({ error: "company_name is required" }, { status: 400 });
    }

    const client = new OpenAI({ apiKey });
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input:
        `Score this B2B prospect for an AI automation agency. Return JSON only with score (0-100), priority (low|medium|high), reasoning, and recommended_action. ` +
        `Company: ${company_name}; Website: ${website ?? ""}; Industry: ${industry ?? ""}; Location: ${location ?? ""}; Fit reason: ${fit_reason ?? ""}`,
      text: { format: { type: "json_object" } },
    });

    if (!response.output_text) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    try {
      return NextResponse.json(JSON.parse(response.output_text));
    } catch {
      return NextResponse.json(
        {
          score: 0,
          priority: "low",
          reasoning: "The model response could not be parsed as JSON.",
          recommended_action: "Retry the scoring request.",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scoring failed" }, { status: 500 });
  }
}
