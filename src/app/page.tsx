import { TopBar, Weave, Icon, Mark } from "@/components/ui";

export default function Landing() {
  return (
    <div className="tzs-page">
      <Weave height={14} />
      <TopBar><a className="tz-btn tz-btn--secondary" href="/onboarding">Create my page</a></TopBar>
      <main className="tzs-wide">
        <section className="tzs-hero">
          <div className="tzs-hero__grid">
            <div className="tz-stack" style={{ ["--tz-stack-gap" as string]: "24px" }}>
              <span className="tz-overline">Tips for creators</span>
              <h1 className="tz-display">Every tip is a thread.</h1>
              <p className="lede">Your fans pay from any wallet on any chain. You always receive USDC on Solana. No logins, no waiting on bank hours.</p>
              <div className="tz-row" style={{ flexWrap: "wrap" }}>
                <a className="tz-btn tz-btn--primary tz-btn--lg" href="/onboarding">Create my page</a>
                <a className="tz-btn tz-btn--ghost tz-btn--lg" href="#how">How it works</a>
              </div>
              <p className="tzs-trust" style={{ justifyContent: "flex-start" }}><Icon name="shield" />Your link is yours: <b>tezeo.app/@you</b>. Funds go straight to your Solana wallet.</p>
            </div>
            <div className="tz-card tz-card--raised tz-creator tz-stack" style={{ padding: 0, overflow: "hidden", ["--creator-accent" as string]: "#1A9E8F" }}>
              <Weave height={72} />
              <div style={{ padding: "0 var(--tz-space-5) var(--tz-space-5)", display: "grid", gap: 12 }}>
                <div className="tzs-id"><div className="tz-avatar"><span>V</span></div><h2 style={{ font: "800 var(--tz-text-xl)/1.1 var(--tz-font-display)", margin: 0 }}>Valentina Ríos</h2><span className="tzs-handle">@vale</span></div>
                <p className="tzs-bubble" style={{ margin: 0 }}>“Every tip buys another live hour. ¡Gracias!”</p>
                <div className="tz-amounts"><span className="tz-amount-opt" aria-hidden="true"><span className="tz-amount">$3</span><small>a cafecito</small></span><span className="tz-amount-opt" aria-pressed="true"><span className="tz-amount">$5</span><small>lunch</small></span><span className="tz-amount-opt" aria-hidden="true"><span className="tz-amount">$15</span><small>big hug</small></span></div>
                <span className="tz-btn tz-btn--primary tz-btn--block" aria-hidden="true">Send $5 to Vale</span>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="tzs-how" aria-label="How it works">
          <div className="tz-card"><span className="tz-overline">1 · Share</span><b>One link, one QR</b><span className="tz-muted tz-small">Set up your page in a minute. Share it in your bio or show the QR on stream.</span></div>
          <div className="tz-card"><span className="tz-overline">2 · Weave</span><b>Fans pay with what they have</b><span className="tz-muted tz-small">ETH, Base, Arbitrum, BTC and more. We show the exact deal before they send anything.</span></div>
          <div className="tz-card"><span className="tz-overline">3 · Receive</span><b>You get USDC on Solana</b><span className="tz-muted tz-small">Converted for you by Aurora Intents and delivered to your wallet. If anything fails, your fan gets a refund.</span></div>
        </section>
      </main>
      <footer className="tzs-foot" style={{ padding: "var(--tz-space-8) 0" }}><Mark />woven by tezeo · powered by Solana &amp; Aurora Intents</footer>
    </div>
  );
}
