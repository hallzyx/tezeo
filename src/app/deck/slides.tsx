/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
import { chainIcon, coinIcon } from "@/lib/icons";

export type Slide = { id: string; title: string; notes: string; body: ReactNode; tone?: "plain" | "weave" };

const v = (vars: Record<string, string>) => vars as CSSProperties;

/* ---------- shared pieces ---------- */

function Kicker({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="dk-kicker">
      <span className="dk-kicker__knot" aria-hidden="true">{String(n).padStart(2, "0")}</span>
      {children}
    </p>
  );
}


/** The logo knot (same geometry as the app's thank-you moment); draws in each time its slide is shown. */
function Knot({ size = 112, burst = false }: { size?: number; burst?: boolean }) {
  return (
    <div className="tz-knot is-playing dk-knot" style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <rect className="tz-knot__tile" width="64" height="64" rx="16" fill="#D1245A" />
        <path className="tz-knot__thread tz-knot__thread--a" pathLength="80" d="M9.5 19H22c9 0 15.5 6 15.5 14v19.5" fill="none" stroke="#FFC23D" strokeWidth="7.5" strokeLinecap="round" />
        <path className="tz-knot__gap" d="M42 19c-9 0-15.5 6-15.5 14" fill="none" stroke="#D1245A" strokeWidth="13.5" />
        <path className="tz-knot__thread tz-knot__thread--b" pathLength="80" d="M54.5 19H42c-9 0-15.5 6-15.5 14v19.5" fill="none" stroke="#FFF7EC" strokeWidth="7.5" strokeLinecap="round" />
      </svg>
      {burst && (
        <div className="tz-burst">
          <i style={v({ "--x": "-120px", "--y": "-80px", "--r": "200deg" })} />
          <i style={v({ "--x": "120px", "--y": "-90px", "--r": "-160deg", "--d": "40ms" })} />
          <i style={v({ "--x": "-140px", "--y": "20px", "--r": "120deg", "--d": "80ms" })} />
          <i style={v({ "--x": "140px", "--y": "16px", "--r": "-220deg" })} />
          <i style={v({ "--x": "-60px", "--y": "110px", "--r": "160deg", "--d": "60ms" })} />
          <i style={v({ "--x": "70px", "--y": "104px", "--r": "-120deg", "--d": "20ms" })} />
        </div>
      )}
    </div>
  );
}

function Lockup({ height = 40 }: { height?: number }) {
  return (
    <svg className="dk-letters" viewBox="82 4 154 56" style={{ height, width: "auto" }} role="img" aria-label="tezeo">
      <use href="#tz-letters" x="82" y="4" width="154" height="56" />
    </svg>
  );
}

/** A real app screenshot in a phone frame; the light/dark capture follows the deck theme. */
function Phone({ k, alt }: { k: string; alt: string }) {
  return (
    <div className="dk-phone">
      <img className="dk-only-dark" src={`/deck/fan-${k}-dark.webp`} width={390} height={844} alt={alt} />
      <img className="dk-only-light" src={`/deck/fan-${k}-light.webp`} width={390} height={844} alt={alt} />
    </div>
  );
}

function Logo({ src, label }: { src?: string; label: string }) {
  return src ? <img className="dk-logo" src={src} alt="" width={28} height={28} /> : <span className="dk-logo dk-logo--txt" aria-hidden="true">{label.slice(0, 1)}</span>;
}

/** Opening / closing scene: Vale teaching on a screen, Ana on her phone, a thread between them. */
function Scene({ resolved }: { resolved: boolean }) {
  return (
    <div
      className={`dk-scene${resolved ? " dk-scene--done" : ""}`}
      role="img"
      aria-label={resolved
        ? "Illustration: a cochinilla thread now runs from Ana's phone to Vale's live class, tied with the Tezeo knot. Vale's screen shows a delivered tip."
        : "Illustration: Vale teaching a live class on a screen; Ana watching on her phone. A gold thread reaches from Ana toward Vale but stops short."}
    >
      <div className="dk-screen tz-creator">
        <div className="tz-weave tz-weave--slim" />
        <div className="dk-screen__body">
          <div className="dk-screen__top"><span className="dk-live">LIVE</span><p className="dk-screen__cap">Vale · live class</p></div>
          <div className="dk-code" aria-hidden="true">
            <i style={v({ "--w": "62%", "--c": "var(--tz-anil-500)" })} />
            <i style={v({ "--w": "44%", "--c": "var(--creator-accent-fill)", "--x": "24px" })} />
            <i style={v({ "--w": "70%", "--c": "var(--tz-border-strong)", "--x": "24px" })} />
            <i style={v({ "--w": "38%", "--c": "var(--tz-maiz-400)", "--x": "48px" })} />
            <i style={v({ "--w": "52%", "--c": "var(--tz-border-strong)", "--x": "24px" })} />
            <i style={v({ "--w": "28%", "--c": "var(--tz-cochinilla-400)" })} />
          </div>
          <div className="tz-avatar dk-screen__cam"><span>V</span></div>
          {resolved && (
            <div className="dk-alert">
              <span className="tz-pill" data-status="received">Delivered</span>
              <b>New tip from Ana</b>
              <small>Dollars, in Vale&apos;s own wallet</small>
            </div>
          )}
        </div>
      </div>

      <div className="dk-mini">
        <span className="dk-mini__notch" />
        <div className="tz-avatar tz-avatar--sm" style={v({ "--creator-accent": "#7C3AED" })}><span>A</span></div>
        <b className="dk-mini__name">Ana</b>
        <svg className="dk-mini__heart" aria-hidden="true"><use href="#i-heart" /></svg>
        <span className="dk-mini__amt">$5</span>
      </div>

      <svg className="dk-scene__thread" viewBox="0 0 560 470" aria-hidden="true">
        {resolved ? (
          <>
            <path className="dk-draw dk-thread--usdc" pathLength={1} d="M196 352 C 300 352, 300 300, 360 300 S 420 290, 430 272" />
          </>
        ) : (
          <>
            <path className="dk-thread--guide" d="M196 352 C 300 352, 300 300, 360 300 S 420 290, 430 272" />
            <path className="dk-draw dk-thread--gold" pathLength={1} d="M196 352 C 260 352, 280 336, 312 322" />
            <path className="dk-fibre" d="M312 322 l14 -12 M312 322 l18 -2 M312 322 l12 10" />
          </>
        )}
      </svg>
      {resolved && <div className="dk-scene__knot"><Knot size={92} burst /></div>}
    </div>
  );
}

/* ---------- the 11 slides ---------- */

export const SLIDES: Slide[] = [
  {
    id: "moment",
    title: "The moment",
    notes:
      "This is Ana. On Sunday night she watched Vale, a creator who teaches coding live, explain the one thing that finally clicked for her. Ana wants to say thank you. Five dollars. That's all.",
    body: (
      <div className="dk-split">
        <div className="dk-split__copy">
          <Kicker n={1}>Sunday, 9 pm</Kicker>
          <h1 className="dk-h1">Vale&apos;s live class just changed Ana&apos;s <em className="dk-em">week.</em></h1>
          <p className="dk-lede">She wants to say thanks. Five dollars, nothing fancy.</p>
          <span className="dk-tag">Demo characters</span>
        </div>
        <Scene resolved={false} />
        <div className="dk-corner-brand"><Knot size={44} /><Lockup height={26} /></div>
      </div>
    ),
  },
  {
    id: "wall",
    title: "The wall",
    notes:
      "Here's what happens today. Ana has dollars on Base, and Vale's wallet is on Solana. Now Ana needs the right network, a bridge, gas in a coin she doesn't hold, and a guess about which coin Vale even takes. Most people stop right here, and the thanks never arrives.",
    body: (
      <>
        <Kicker n={2}>The wall</Kicker>
        <h2 className="dk-h2">Then saying thanks hits a <em className="dk-em">wall.</em></h2>
        <p className="dk-lede dk-lede--narrow">Both sides need the same app, the same wallet, the same chain.</p>
        <div className="dk-wall" role="img" aria-label="Ana's gold thread frays before a pile of questions: wrong network, bridge it first, gas in a coin you don't hold, which coin does Vale take. Vale waits on the other side.">
          <div className="dk-wall__who">
            <div className="tz-avatar" style={v({ "--_s": "88px", "--creator-accent": "#7C3AED" })}><span>A</span></div>
            <b>Ana</b>
          </div>
          <svg className="dk-wall__thread" viewBox="0 0 300 40" aria-hidden="true">
            <path className="dk-draw dk-thread--gold" pathLength={1} d="M0 20 C 80 20, 120 10, 210 20" />
            <path className="dk-fibre" d="M210 20 l16 -12 M210 20 l20 0 M210 20 l14 12" />
          </svg>
          <ul className="dk-wall__chips">
            <li style={v({ "--r": "-4deg", "--d": "250ms" })}><span className="dk-fray" aria-hidden="true" />Wrong network?</li>
            <li style={v({ "--r": "3deg", "--d": "400ms" })}><span className="dk-fray" aria-hidden="true" />Bridge it first</li>
            <li style={v({ "--r": "-2deg", "--d": "550ms" })}><span className="dk-fray" aria-hidden="true" />Gas in a coin you don&apos;t hold</li>
            <li style={v({ "--r": "4deg", "--d": "700ms" })}><span className="dk-fray" aria-hidden="true" />Which coin?</li>
          </ul>
          <div className="dk-wall__who dk-wall__who--far">
            <div className="tz-avatar" style={v({ "--_s": "88px" })}><span>V</span></div>
            <b>Vale</b>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "idea",
    title: "The idea",
    notes:
      "So we flipped it. Ana pays with whatever she already has, on whatever network it's on. Vale always receives the same thing: plain digital dollars. Many threads in, one thread out.",
    body: (
      <>
        <Kicker n={3}>The idea</Kicker>
        <h2 className="dk-h2">Pay with what you <em className="dk-em">have.</em> Vale gets <em className="dk-em">dollars.</em></h2>
        <div className="dk-loom" role="img" aria-label="Six threads, from Ethereum, Base, Arbitrum, Optimism, Polygon and Bitcoin, pass through one eye and leave as a single thread: USDC on Solana, in Vale's wallet.">
          <ul className="dk-loom__in" aria-hidden="true">
            {[["eth", "Ethereum"], ["base", "Base"], ["arb", "Arbitrum"], ["op", "Optimism"], ["pol", "Polygon"], ["btc", "Bitcoin"]].map(([s, name]) => (
              <li key={s}><Logo src={chainIcon(s)} label={name} />{name}</li>
            ))}
          </ul>
          <svg className="dk-loom__svg" viewBox="0 0 520 330" aria-hidden="true">
            {[22, 78, 134, 190, 246, 302].map((y, k) => (
              <path key={y} className={`dk-draw dk-t dk-t--${k + 1}`} pathLength={1} style={v({ "--d": `${k * 70}ms` })}
                d={`M0 ${y} C 220 ${y}, 260 165, 440 165`} />
            ))}
            <path className="dk-draw dk-thread--usdc dk-thread--thick" pathLength={1} style={v({ "--d": "700ms" })} d="M440 165 H520" />
            <circle className="dk-eye" cx="440" cy="165" r="17" />
            <rect className="dk-eye-rombo" x="433" y="158" width="14" height="14" rx="3" transform="rotate(45 440 165)" />
          </svg>
          <div className="dk-dest">
            <div className="dk-dest__logos"><Logo src={coinIcon("USDC")} label="USDC" /><Logo src={chainIcon("sol")} label="Solana" /></div>
            <b>USDC on Solana</b>
            <span>straight to Vale&apos;s wallet</span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "meet",
    title: "Meet Tezeo",
    tone: "weave",
    notes:
      "That's Tezeo. The name comes from tejer, to weave, plus -eo, the Spanish ending for a steady rhythm, like goteo, dripping. Small tips, one after another, woven into a creator's living. Every creator gets one link.",
    body: (
      <div className="dk-meet">
        <Kicker n={4}>Meet</Kicker>
        <div className="dk-meet__row">
          <Knot size={176} />
          <div className="dk-meet__name">
            <Lockup height={104} />
            <span className="dk-link"><span className="dk-link__dot" aria-hidden="true" />tezeo.app/<b>@vale</b></span>
          </div>
          <dl className="tz-card tz-card--stitched dk-etym">
            <div><dt>tejer</dt><dd>to weave</dd></div>
            <div><dt>+ -eo</dt><dd>a steady rhythm, as in <i>goteo</i>, <i>zapateo</i></dd></div>
            <div><dt>= tezeo</dt><dd>the steady weaving, tip after tip</dd></div>
          </dl>
        </div>
        <h2 className="dk-h2 dk-meet__h">Every tip is a thread. <em className="dk-em">Tezeo weaves them together.</em></h2>
      </div>
    ),
  },
  {
    id: "fan",
    title: "The fan's journey",
    notes:
      "Here's Ana's side, real screens from the app. She picks an amount, tells us where her money is, and pays in one tap from her wallet. She watches it travel, and lands here: you just made Vale's day. No account, and not one word about bridges or gas.",
    body: (
      <>
        <div className="dk-head-row">
          <div>
            <Kicker n={5}>The fan&apos;s side</Kicker>
            <h2 className="dk-h2 dk-h2--sm">One link. No account. <em className="dk-em">No chain talk.</em></h2>
          </div>
        </div>
        <ol className="dk-journey">
          <li><Phone k="amount" alt="Vale's tip page: pick $3, $5 or $15, then Send $5 to Valentina." /><span>Pick an amount</span></li>
          <li><Phone k="network" alt="Where's your money? Network chips (Base selected) and coin chips (USDC selected)." /><span>Pick a network</span></li>
          <li><Phone k="pay" alt="You send 5.00 USDC on Base, with a one-tap button to pay from the wallet." /><span>Pay in one tap</span></li>
          <li><Phone k="track" alt="Converting: We're weaving your USDC into dollars, with a live three-step thread." /><span>Watch it travel</span></li>
          <li><Phone k="thanks" alt="Delivered: You just made Valentina's day, under the Tezeo knot." /><span>Vale&apos;s day, made</span></li>
        </ol>
      </>
    ),
  },
  {
    id: "stream",
    title: "The streamer moment",
    notes:
      "And here's Vale's side. On our demo stage, a mock livestream, Ana's tip pops up as an alert over the video, and the goal bar moves. For a real streamer, that alert is a browser source they add to OBS.",
    body: (
      <div className="dk-stream">
        <div className="dk-stream__copy">
          <Kicker n={6}>On stream</Kicker>
          <h2 className="dk-h2">The thanks lands <em className="dk-em">live.</em></h2>
          <ul className="dk-bullets">
            <li>The alert pops over the video.</li>
            <li>The goal bar moves.</li>
            <li>Vale keeps teaching.</li>
          </ul>
          <span className="dk-tag">Demo stage</span>
          <p className="dk-caption">A demo livestream: the tip pops on stream the moment it lands.</p>
        </div>
        <figure className="dk-browser">
          <div className="dk-browser__bar" aria-hidden="true"><i /><i /><i /><span>Demo stage</span></div>
          <img src="/deck/demo-stage-delivered.webp" width={1280} height={800}
            alt="Tezeo demo stage: a mock livestream of Vale's coding class. An alert over the video reads New tip for Valentina, Ana, 4.72 USDC, and the goal bar for a new microphone shows 24%. The side panel shows Delivered." />
        </figure>
      </div>
    ),
  },
  {
    id: "hood",
    title: "Under the hood",
    notes:
      "Under the hood it's simple. Ana pays on her own chain. Aurora Intents gives every tip its own deposit address, swaps the coin, and delivers USDC on Solana straight to Vale's wallet. Tezeo never holds the money: we design the experience and track every step.",
    body: (
      <>
        <Kicker n={7}>Under the hood</Kicker>
        <h2 className="dk-h2">Three stops, <em className="dk-em">one thread.</em></h2>
        <div className="dk-flow" role="img" aria-label="Diagram: the fan pays on any chain, Aurora Intents swaps it and delivers it, the creator receives USDC on Solana in their own wallet. Tezeo never holds the money.">
          <svg className="dk-flow__thread" viewBox="0 0 1120 40" preserveAspectRatio="none" aria-hidden="true">
            <path className="dk-thread--guide" d="M150 20 H970" />
            <path className="dk-draw dk-thread--gold" pathLength={1} style={v({ "--d": "200ms", "--dur": "700ms" })} d="M150 20 H560" />
            <path className="dk-draw dk-thread--usdc dk-thread--thick" pathLength={1} style={v({ "--d": "900ms", "--dur": "700ms" })} d="M560 20 H970" />
          </svg>
          <div className="dk-stop">
            <span className="dk-stop__n">1</span>
            <b>Fan pays</b>
            <div className="dk-stop__logos">
              {["eth", "base", "arb", "pol", "btc"].map((s) => <Logo key={s} src={chainIcon(s)} label={s} />)}
            </div>
            <span>any chain, any coin</span>
          </div>
          <div className="dk-stop dk-stop--loom">
            <span className="dk-stop__n">2</span>
            <b>Aurora Intents</b>
            <svg className="dk-stop__eye" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="16" /><rect x="18" y="18" width="12" height="12" rx="2.5" transform="rotate(45 24 24)" /></svg>
            <span>own deposit address per tip; swaps and delivers</span>
          </div>
          <div className="dk-stop">
            <span className="dk-stop__n">3</span>
            <b>Creator receives</b>
            <div className="dk-stop__logos"><Logo src={coinIcon("USDC")} label="USDC" /><Logo src={chainIcon("sol")} label="Solana" /></div>
            <span>USDC on Solana, in their own wallet</span>
          </div>
        </div>
        <p className="dk-promise">
          <svg aria-hidden="true"><use href="#i-shield" /></svg>
          <span><b>Tezeo never holds the money.</b> We design the experience and track every step.</span>
        </p>
      </>
    ),
  },
  {
    id: "real",
    title: "Built and working",
    notes:
      "And this is not a mockup. A real payment went through the deployed app and landed as USDC in a Solana wallet. Quotes come live from Aurora across chains, delivery costs about a cent, and the whole product is built around it: one-tap payment, live tracking, a dashboard where the creator sees where every cent went, alerts for the stream, goals and a membership pass.",
    body: (
      <>
        <Kicker n={8}>Where we are</Kicker>
        <h2 className="dk-h2">Built, live and <em className="dk-em">working.</em></h2>
        <div className="dk-status">
          <section className="dk-status__col dk-status__col--yes" aria-labelledby="dk-yes">
            <h3 id="dk-yes" className="dk-status__h"><span className="tz-pill" data-status="received">Proven live</span></h3>
            <ul>
              <li>A real tip through the deployed app, delivered as USDC to a Solana wallet.</li>
              <li>Live Aurora quotes across chains, right in the app.</li>
              <li>Delivery measured on real quotes: about a cent per tip.</li>
            </ul>
          </section>
          <section className="dk-status__col dk-status__col--yes" aria-labelledby="dk-not">
            <h3 id="dk-not" className="dk-status__h"><span className="tz-pill" data-status="received">Built into the product</span></h3>
            <ul>
              <li>One-tap wallet payment with live tracking.</li>
              <li>A creator dashboard: every tip, every cost.</li>
              <li>Stream alerts, funding goals and a Membership Pass.</li>
            </ul>
          </section>
        </div>
      </>
    ),
  },
  {
    id: "who",
    title: "For whom, and why now",
    notes:
      "Who is it for? Creators in Latin America, streamers, teachers, community builders, whose fans are already international and already hold crypto, scattered across chains. Today that goodwill gets lost to friction. Cents-level fees on Solana are what make a one-dollar tip worth sending.",
    body: (
      <>
        <Kicker n={9}>Latin America</Kicker>
        <h2 className="dk-h2">For creators whose fans are <em className="dk-em">everywhere.</em></h2>
        <ul className="dk-who">
          <li><svg aria-hidden="true"><use href="#i-stream" /></svg><b>Streamers</b><span>Thanks during the live.</span></li>
          <li><svg aria-hidden="true"><use href="#i-chat" /></svg><b>Teachers</b><span>Thanks after the class.</span></li>
          <li><svg aria-hidden="true"><use href="#i-users" /></svg><b>Communities</b><span>Members chip in together.</span></li>
        </ul>
        <div className="dk-why">
          <span className="tz-rombo" style={v({ "--_s": "14px", "--_c": "var(--tz-gold)" })} aria-hidden="true" />
          <p><b>Why now:</b> fans abroad already hold crypto, and on Solana a $1 tip costs about a cent to deliver.</p>
        </div>
      </>
    ),
  },
  {
    id: "model",
    title: "Business model and what's next",
    notes:
      "How we earn: a small fee on each swap, configured in Aurora's Client Portal. The fan sees only what they pay; the creator sees where every cent of every tip went, in their dashboard. Next: an editable profile, WalletConnect, and more chains.",
    body: (
      <>
        <Kicker n={10}>Model and next</Kicker>
        <h2 className="dk-h2">A small fee per swap. <em className="dk-em">Clear on both sides.</em></h2>
        <div className="dk-model">
          <div className="tz-card dk-receipt">
            <div className="dk-receipt__head"><b>One tip, in Vale&apos;s dashboard</b><span className="dk-tag dk-tag--sm">Example</span></div>
            <dl className="tz-quote">
              <div className="tz-quote__row"><dt>Ana sent</dt><span className="tz-quote__lead" /><dd>$5.00</dd></div>
              <div className="tz-quote__row"><dt>Delivery to Solana</dt><span className="tz-quote__lead" /><dd>~$0.01</dd></div>
              <div className="tz-quote__row"><dt>Tezeo fee</dt><span className="tz-quote__lead" /><dd>Set per swap</dd></div>
            </dl>
            <p className="dk-receipt__note">Fee set per swap in the Aurora Client Portal. Ana only sees what she pays.</p>
          </div>
          <div className="dk-next">
            <h3 className="dk-next__h">What&apos;s next</h3>
            <ol className="dk-next__list">
              <li>Editable creator profile</li>
              <li>WalletConnect</li>
              <li>More chains</li>
            </ol>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "close",
    title: "Close",
    notes:
      "Back to Sunday night. Ana said thanks with the money she already had. Vale got dollars. Neither of them thought about chains. Every tip is a thread, and Tezeo weaves them together. Thank you.",
    body: (
      <div className="dk-split">
        <div className="dk-split__copy">
          <Kicker n={11}>Sunday, 9:01 pm</Kicker>
          <h2 className="dk-h1">Ana said thanks. Vale got <em className="dk-em">dollars.</em></h2>
          <p className="dk-lede">Nobody thought about chains.</p>
          <p className="dk-sign"><Lockup height={30} /><span>Every tip is a thread.</span></p>
          <div className="dk-team">
            <span className="dk-link dk-link--sm"><span className="dk-link__dot" aria-hidden="true" />tezeo.arroz.dev</span>
          </div>
        </div>
        <Scene resolved />
      </div>
    ),
  },
];
