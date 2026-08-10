export type LeadScore = { score: number; priority: "low" | "medium" | "high"; reasoning: string; recommended_action: string };

export async function scoreLead(input: Record<string, string | null | undefined>): Promise<LeadScore> {
  const response = await fetch("/api/score-lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  if (!response.ok) throw new Error((await response.json()).error ?? "Unable to score lead");
  return response.json();
}
