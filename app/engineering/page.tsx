"use client";

import { useCallback, useEffect, useState } from "react";

type PullRequest = { number: number; title: string; state: string; draft: boolean; url: string; branch: string; updatedAt: string };
type Run = { id: number; name: string; branch: string; status: string; conclusion: string | null; url: string; updatedAt: string };
type Snapshot = {
  repository: string; checkedAt: string;
  sources: { pullRequests: string; workflows: string };
  summary: { openPullRequests: number; draftPullRequests: number; failedRuns: number; successfulRuns: number };
  pullRequests: PullRequest[]; runs: Run[];
};

export default function EngineeringDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/engineering", { cache: "no-store" });
      if (response.status === 401) throw new Error("Sign in to view engineering telemetry.");
      if (!response.ok) throw new Error("Engineering telemetry is temporarily unavailable.");
      setSnapshot(await response.json());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return (
    <main className="engineering-shell">
      <header className="engineering-header">
        <a href="/dashboard" className="engineering-back">← Agency dashboard</a>
        <div><span className="engineering-kicker">AUTOAI / OPERATIONS</span><h1>Engineering observability</h1><p>Live repository activity, pull requests, and CI evidence.</p></div>
        <button onClick={() => { setLoading(true); void refresh(); }}>Refresh</button>
      </header>

      {error && <div className="engineering-alert">{error}</div>}
      {loading && !snapshot ? <div className="engineering-panel">Connecting to GitHub telemetry…</div> : snapshot && <>
        <div className="engineering-meta"><span>Repository: <b>{snapshot.repository}</b></span><span>Last checked: <b>{new Date(snapshot.checkedAt).toLocaleString()}</b></span><span>Auto-refresh: <b>30 seconds</b></span></div>
        <section className="engineering-metrics">
          <Metric label="Open pull requests" value={snapshot.summary.openPullRequests} />
          <Metric label="Draft pull requests" value={snapshot.summary.draftPullRequests} />
          <Metric label="Successful CI runs" value={snapshot.summary.successfulRuns} />
          <Metric label="Failed CI runs" value={snapshot.summary.failedRuns} />
        </section>
        <section className="engineering-columns">
          <div className="engineering-panel"><div className="engineering-section-head"><div><span className="engineering-kicker">SOURCE CONTROL</span><h2>Pull requests</h2></div><span className={snapshot.sources.pullRequests === "live" ? "engineering-live" : "engineering-muted"}>{snapshot.sources.pullRequests.toUpperCase()}</span></div>
            {snapshot.pullRequests.length ? <div className="engineering-list">{snapshot.pullRequests.map(pr => <a className="engineering-row" href={pr.url} target="_blank" rel="noreferrer" key={pr.number}><div><b>#{pr.number} · {pr.title}</b><small>{pr.branch} · Updated {new Date(pr.updatedAt).toLocaleString()}</small></div><span className={pr.state === "open" ? "engineering-live" : "engineering-muted"}>{pr.draft ? "DRAFT" : pr.state.toUpperCase()}</span></a>)}</div> : <p className="engineering-empty">No pull requests returned.</p>}
          </div>
          <div className="engineering-panel"><div className="engineering-section-head"><div><span className="engineering-kicker">AUTOMATED VERIFICATION</span><h2>Recent CI runs</h2></div><span className={snapshot.sources.workflows === "live" ? "engineering-live" : "engineering-muted"}>{snapshot.sources.workflows.toUpperCase()}</span></div>
            {snapshot.runs.length ? <div className="engineering-list">{snapshot.runs.map(run => <a className="engineering-row" href={run.url} target="_blank" rel="noreferrer" key={run.id}><div><b>{run.name}</b><small>{run.branch} · Updated {new Date(run.updatedAt).toLocaleString()}</small></div><span className={run.conclusion === "success" ? "engineering-live" : run.conclusion === "failure" ? "engineering-fail" : "engineering-muted"}>{run.conclusion?.toUpperCase() || run.status.toUpperCase()}</span></a>)}</div> : <p className="engineering-empty">No workflow runs returned.</p>}
          </div>
        </section>
        <p className="engineering-footnote">Telemetry is read-only. GitHub data is fetched on the server after authentication. Database parity and security audit results will be added only when backed by a recorded staging check.</p>
      </>}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="engineering-metric"><span>{label}</span><b>{value}</b></div>;
}
