import Link from "next/link";

export default function HomePage() {
  return (
    <div className="bg-black">
      <section className="relative min-h-[100dvh] overflow-hidden">
        <div className="grid min-h-[100dvh] grid-cols-1 md:grid-cols-2">
          <Link
            href="/charter"
            className="group relative flex flex-col justify-between overflow-hidden bg-guard-gradient px-6 py-16 transition-[filter] duration-300 hover:brightness-110 sm:px-12 md:py-20"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_20%_20%,rgba(57,255,143,0.18),transparent_70%)]" />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-guard-border bg-black/30 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-guard-accent">
                Side A · Defense
              </span>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-guard-ink sm:text-6xl md:text-7xl">
                Neura<span className="text-guard-accent">Guard</span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-guard-muted">
                Your mind. Your rules. A personal neurorights &amp; BCI consent OS — build a charter, run a
                live consent ledger, and decode what devices really collect.
              </p>
            </div>
            <div className="relative z-10 mt-10 flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-2 rounded-lg bg-guard-accent px-5 py-3 text-sm font-semibold text-guard-bg shadow-glow transition-transform group-hover:translate-x-1">
                Build your Neuro Charter
                <span aria-hidden>→</span>
              </span>
              <span className="text-sm text-guard-muted">6 pillars · local-only · 5 minutes</span>
            </div>
          </Link>

          <Link
            href="/probe"
            className="side-probe group relative flex flex-col justify-between overflow-hidden bg-probe-gradient px-6 py-16 transition-[filter] duration-300 hover:brightness-110 sm:px-12 md:py-20"
          >
            <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_50%_at_80%_20%,rgba(255,176,32,0.16),transparent_70%)]" />
            <div className="relative z-10 md:text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-probe-border bg-black/30 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-probe-accent">
                Side B · Acquisition
              </span>
              <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight text-probe-ink sm:text-6xl md:text-7xl">
                Neura<span className="text-probe-accent">Probe</span>
              </h1>
              <p className="mt-4 max-w-md text-lg text-probe-muted md:ml-auto">
                What can be sensed without your charter. A transparent sensor-fusion acquisition lab — camera
                PPG, motion, Bluetooth HR, and an oddball evoked-response test.
              </p>
            </div>
            <div className="relative z-10 mt-10 flex flex-wrap items-center gap-4 md:justify-end">
              <span className="text-sm text-probe-muted md:order-1">educational demo · consent-gated</span>
              <span className="inline-flex items-center gap-2 rounded-lg bg-probe-accent px-5 py-3 text-sm font-semibold text-probe-bg shadow-glow-probe transition-transform group-hover:-translate-x-1">
                <span aria-hidden>→</span>
                Enter the acquisition lab
              </span>
            </div>
          </Link>
        </div>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/60 text-sm font-bold tracking-wide text-white/80 backdrop-blur">
            VS
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black px-6 py-16 sm:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">One repo. Two honest sides.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-white/60">
            NeuraGuard is the shield everyone will eventually want: a charter, a consent ledger, a way to
            decode what a device&apos;s fine print really means. NeuraProbe is the opposing side — a real,
            consent-gated demonstration of how much a phone can sense about your body and reactions once
            you say yes. Seeing both makes the case for mental privacy rules concrete instead of abstract.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-guard-border bg-guard-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-guard-accent">NeuraGuard routes</h3>
            <ul className="mt-4 space-y-2 text-sm text-guard-muted">
              <li><Link className="hover:text-guard-ink underline underline-offset-2" href="/charter">/charter</Link> — build your Neuro Charter across 6 pillars</li>
              <li><Link className="hover:text-guard-ink underline underline-offset-2" href="/ledger">/ledger</Link> — local consent ledger, revoke-all in one tap</li>
              <li><Link className="hover:text-guard-ink underline underline-offset-2" href="/lab">/lab</Link> — Permission Lab: practice real access requests</li>
              <li><Link className="hover:text-guard-ink underline underline-offset-2" href="/decode">/decode</Link> — decode policies, upload &amp; scan your own</li>
              <li><Link className="hover:text-guard-ink underline underline-offset-2" href="/patents">/patents</Link> — Havana Syndrome, Frey effect &amp; directed energy patent registry</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-probe-border bg-probe-surface p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-probe-accent">NeuraProbe routes</h3>
            <ul className="mt-4 space-y-2 text-sm text-probe-muted">
              <li><Link className="hover:text-probe-ink underline underline-offset-2" href="/probe">/probe</Link> — consent gate &amp; channel picker</li>
              <li><Link className="hover:text-probe-ink underline underline-offset-2" href="/probe/live">/probe/live</Link> — live HR/HRV, motion &amp; Bluetooth fusion</li>
              <li><Link className="hover:text-probe-ink underline underline-offset-2" href="/probe/incident">/probe/incident</Link> — anomalous signal &amp; Frey effect incident monitor</li>
              <li><Link className="hover:text-probe-ink underline underline-offset-2" href="/probe/triangulate">/probe/triangulate</Link> — signal reverse engineering &amp; TDoA geolocation map</li>
              <li><Link className="hover:text-probe-ink underline underline-offset-2" href="/probe/aep">/probe/aep</Link> — oddball evoked-response session</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
