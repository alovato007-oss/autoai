import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const repo = "alovato007-oss/autoai";
const api = "https://api.github.com";

async function github(path: string) {
  const response = await fetch(`${api}${path}`, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status})`);
  return response.json();
}

export async function GET() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [pullsResult, runsResult] = await Promise.allSettled([
    github(`/repos/${repo}/pulls?state=all&per_page=20`),
    github(`/repos/${repo}/actions/runs?per_page=12`),
  ]);

  const pulls = pullsResult.status === "fulfilled" ? pullsResult.value : null;
  const runsPayload = runsResult.status === "fulfilled" ? runsResult.value : null;
  const pullRequests = Array.isArray(pulls) ? pulls.map((pr: any) => ({
    number: pr.number,
    title: pr.title,
    state: pr.state,
    draft: pr.draft,
    url: pr.html_url,
    branch: pr.head?.ref,
    updatedAt: pr.updated_at,
  })) : [];
  const runs = Array.isArray(runsPayload?.workflow_runs) ? runsPayload.workflow_runs.map((run: any) => ({
    id: run.id,
    name: run.name || run.workflow_id,
    branch: run.head_branch,
    status: run.status,
    conclusion: run.conclusion,
    url: run.html_url,
    updatedAt: run.updated_at,
  })) : [];

  return NextResponse.json({
    repository: repo,
    checkedAt: new Date().toISOString(),
    sources: {
      pullRequests: pullsResult.status === "fulfilled" ? "live" : "unavailable",
      workflows: runsResult.status === "fulfilled" ? "live" : "unavailable",
    },
    summary: {
      openPullRequests: pullRequests.filter((pr: any) => pr.state === "open").length,
      draftPullRequests: pullRequests.filter((pr: any) => pr.draft).length,
      failedRuns: runs.filter((run: any) => run.conclusion === "failure").length,
      successfulRuns: runs.filter((run: any) => run.conclusion === "success").length,
    },
    pullRequests,
    runs,
  }, { headers: { "Cache-Control": "no-store" } });
}
