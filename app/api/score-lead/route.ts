import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { company_name, website, industry, location, fit_reason } = body;
    if (!company_name) return NextResponse.json({ error: "company_name is required" }, { status: 400 });
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `Score this B2B prospect for an AI automation agency. Return JSON only with score (0-100), priority (low|medium|high), reasoning, and recommended_action. Company: ${company_name}; Website: ${website ?? ""}; Industry: ${industry ?? ""}; Location: ${location ?? ""}; Fit reason: ${fit_reason ?? ""}`,
      text: { format: { type: "json_object" } }
    });
    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scoring failed" }, { status: 500 });
  }
}
