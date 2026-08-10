const metrics = [
  ["Prospects Found", "0"],
  ["Qualified", "0"],
  ["Opportunities", "0"],
  ["Pipeline", "$0"],
];

const stages = ["Discover", "Research", "Score", "Review", "Revenue"];

export default function Home() {
  return (
    <div className="shell">
      <nav className="nav"><div className="brand">AUTOAI</div><div className="badge">MVP • Lead Engine</div></nav>
      <main className="main">
        <div className="eyebrow">Revenue Command Center</div>
        <h1 className="title">Turn market intelligence into pipeline.</h1>
        <p className="subtitle">AutoAI finds prospects, researches companies, scores opportunities, and turns qualified intelligence into a measurable sales pipeline.</p>
        <a className="cta" href="#pipeline">View Lead Engine</a>
        <div className="grid">{metrics.map(([label,value])=><div className="card" key={label}><div className="label">{label}</div><div className="value">{value}</div></div>)}</div>
        <section className="section" id="pipeline"><h2>Lead Engine Pipeline</h2><div className="pipeline">{stages.map((stage)=><div className="stage" key={stage}>{stage}</div>)}</div></section>
      </main>
    </div>
  );
}