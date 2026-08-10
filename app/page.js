export default function Home() {
  return (
    <main style={{fontFamily:'Arial, sans-serif',padding:'48px',maxWidth:1100,margin:'0 auto'}}>
      <section style={{padding:'64px 0'}}>
        <p style={{fontWeight:700,letterSpacing:2}}>AUTOAI</p>
        <h1 style={{fontSize:'clamp(42px,7vw,76px)',lineHeight:1.02,maxWidth:850}}>AI employees that automate your business.</h1>
        <p style={{fontSize:20,lineHeight:1.6,maxWidth:700}}>Capture leads, follow up automatically, generate reports, and turn repetitive business work into an always-on revenue engine.</p>
        <div style={{display:'flex',gap:16,marginTop:28,flexWrap:'wrap'}}>
          <a href="#start" style={{padding:'14px 22px',background:'#111',color:'#fff',borderRadius:10,textDecoration:'none'}}>Start Automating</a>
          <a href="#how" style={{padding:'14px 22px',border:'1px solid #ccc',borderRadius:10,textDecoration:'none',color:'#111'}}>See How It Works</a>
        </div>
      </section>
      <section id="how" style={{padding:'40px 0',borderTop:'1px solid #eee'}}>
        <h2>One system. Multiple AI workers.</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:18,marginTop:24}}>
          {['Lead Agent','Follow-Up Agent','Revenue Reports','Automation Engine'].map((x,i)=><div key={x} style={{padding:24,border:'1px solid #eee',borderRadius:14}}><h3>{x}</h3><p>{['Qualify and prioritize new opportunities.','Keep prospects moving without manual chasing.','Turn business data into actionable daily insights.','Execute repeatable workflows across your stack.'][i]}</p></div>)}
        </div>
      </section>
      <section id="start" style={{padding:'70px 0'}}><h2>Ready to automate?</h2><p>AutoAI is being built as a production-ready business automation platform.</p></section>
    </main>
  )
}
