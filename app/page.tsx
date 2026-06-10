import { createClient } from "@/lib/supabase/server";

async function joinWaitlist(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!name || !email) return;
  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({ name, email });
  if (error) console.error("Waitlist insert error:", error.message);
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0F0F0D] overflow-x-hidden">

      {/* ── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 h-14 glass-thin flex items-center justify-between px-6 lg:px-10">
        <span className="text-white font-semibold text-lg tracking-tight">Glyph</span>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-[#98989F] text-sm hover:text-white transition-colors duration-150">
            Log in
          </a>
          <a href="/signup" className="btn-apple text-sm py-2 px-4">
            Join Beta
          </a>
        </div>
      </nav>

      {/* ── HERO — ref_14 Coordy split ──────────────────── */}
      <section className="min-h-screen grid lg:grid-cols-[1.15fr_0.85fr]">

        {/* Left — dark, huge type */}
        <div className="flex flex-col justify-between px-6 lg:px-16 pt-28 pb-16 bg-[#0F0F0D]">
          <div>
            <p className="text-label text-[#636366] mb-5 tracking-[0.2em]">
              PRE-LAUNCH PLATFORM · INDIE GAME DEVELOPERS
            </p>
            <h1 className="text-display text-white mb-6 max-w-2xl">
              Build your<br />
              reputation<br />
              before launch.
            </h1>
            <p className="text-body text-[#98989F] max-w-md mb-10">
              Glyph is where indie developers share projects, write devlogs,
              collect structured feedback, and build community — before the
              game ships.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <a href="#waitlist" className="btn-apple">
                Join Glyph — Free Forever
              </a>
              <a href="/dev" className="btn-apple-ghost">
                Browse Developers
              </a>
            </div>
          </div>

          {/* Bottom left: social proof */}
          <div className="border-t border-white/[0.08] pt-6">
            <p className="text-footnote text-[#636366]">
              Beta open to indie developers in Phoenix, AZ and beyond.
              Always free for individual developers.
            </p>
          </div>
        </div>

        {/* Right — cream, waitlist form */}
        <div
          id="waitlist"
          className="flex items-center justify-center px-8 py-20 lg:py-0"
          style={{ background: "#EDE8DF" }}
        >
          <div className="w-full max-w-sm">
            <p className="text-label mb-4" style={{ color: "#8A8360" }}>
              EARLY ACCESS
            </p>
            <h2 className="text-title-1 mb-2" style={{ color: "#0F0F0D", letterSpacing: "-0.02em" }}>
              First in line.
            </h2>
            <p className="text-footnote mb-8" style={{ color: "#636366" }}>
              Add your name and email. You&apos;ll be first to test Glyph
              when the beta opens.
            </p>

            <form action={joinWaitlist} className="space-y-3">
              <input
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-2xl px-5 py-4 text-sm transition-colors duration-150 outline-none"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#0F0F0D",
                }}
              />
              <input
                name="email"
                required
                type="email"
                placeholder="Your email"
                className="w-full rounded-2xl px-5 py-4 text-sm transition-colors duration-150 outline-none"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#0F0F0D",
                }}
              />
              <button
                type="submit"
                className="w-full rounded-2xl px-5 py-4 font-semibold text-white transition-colors duration-150"
                style={{ background: "#0071E3" }}
              >
                Join Waitlist
              </button>
            </form>

            <p className="mt-5 text-xs" style={{ color: "#98989F" }}>
              No spam. Just beta access and launch updates.
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS — cream section ────────────────────────── */}
      <section
        className="py-16 px-6 lg:px-16 border-t-2 border-black"
        style={{ background: "#EDE8DF" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {[
            { value: "$4.85B", label: "Indie game market 2025" },
            { value: "250K+", label: "Active developers globally" },
            { value: "~$180", label: "Median lifetime Steam revenue" },
            { value: "70%",   label: "Projects that never ship" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p
                className="text-headline mb-1"
                style={{ color: "#0F0F0D", fontWeight: 700 }}
              >
                {value}
              </p>
              <p className="text-footnote" style={{ color: "#636366" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES — ref_3 / ref_19 editorial ─────────── */}
      <section className="py-24 px-6 lg:px-16 bg-[#0F0F0D]">
        <div className="max-w-5xl mx-auto space-y-24">

          {/* Feature 1 — Developer Profile */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-label text-[#0071E3] mb-4">01 — IDENTITY</p>
              <h3 className="text-title-1 text-white mb-4">
                One profile. Every project. Your entire journey.
              </h3>
              <p className="text-body text-[#98989F]">
                Not a GitHub with commits. Not a LinkedIn with jobs. Your
                actual developer identity — engine, role, current build, and
                progress documented from day one.
              </p>
            </div>
            <div className="card-apple p-6 shadow-glyph-lg">
              {/* Profile card preview */}
              <div className="banner-dark rounded-xl h-20 mb-4" />
              <div className="flex items-end gap-3 -mt-8 mb-4">
                <div
                  className="w-14 h-14 rounded-full ring-2 ring-white/10 bg-[#2C2C2E]"
                  style={{ marginLeft: "1rem" }}
                />
              </div>
              <p className="text-title-3 text-white mb-1">Alex Kim</p>
              <p className="text-caption text-[#636366] mb-3">@alexkim · Phoenix, AZ · Godot</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="dot-available inline-block w-2 h-2" />
                <span className="text-footnote text-[#34C759]">Open to Collaborate</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
                {[["3", "Projects"], ["48", "Followers"], ["12", "Following"]].map(([n, l]) => (
                  <div key={l} className="text-center">
                    <p className="text-title-3 text-white">{n}</p>
                    <p className="text-caption text-[#636366]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2 — Structured Feedback */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div
              className="rounded-2xl p-6 order-1 lg:order-none shadow-glyph-lg"
              style={{ background: "#1D3829" }}
            >
              <p className="text-label mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                PLAYTEST FEEDBACK
              </p>
              <p className="text-title-2 text-white mb-6">Pixel Dungeon Alpha v0.3</p>
              {[
                { cat: "Controls & Feel", val: 8.2, delta: "+1.4" },
                { cat: "UI Clarity",      val: 7.1, delta: "+0.9" },
                { cat: "Difficulty",      val: 6.8, delta: "+0.3" },
                { cat: "Fun Factor",      val: 8.8, delta: "+2.1" },
              ].map(({ cat, val, delta }) => (
                <div key={cat} className="mb-3">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-footnote" style={{ color: "rgba(255,255,255,0.7)" }}>{cat}</span>
                    <span className="text-footnote text-[#34C759]">{delta}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${val * 10}%`, background: "#34C759" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="order-none lg:order-1">
              <p className="text-label text-[#0071E3] mb-4">02 — FEEDBACK</p>
              <h3 className="text-title-1 text-white mb-4">
                Structured playtests. Not Discord noise.
              </h3>
              <p className="text-body text-[#98989F]">
                Category-based feedback: controls, UI clarity, difficulty,
                fun factor. Track how your game improves over time — not just
                what the current score is.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ── BENTO DISCOVER — ref_15 Coordy earth tones ───── */}
      <section className="py-24 px-6 lg:px-16 bg-[#0F0F0D]">
        <div className="max-w-5xl mx-auto">
          <p className="text-label text-[#636366] mb-3">03 — COMMUNITY</p>
          <h3 className="text-headline text-white mb-10">
            Your local game dev scene.
          </h3>
          <div className="grid grid-cols-6 gap-3">
            {/* Large sage card */}
            <div className="col-span-6 md:col-span-3 row-span-2 rounded-2xl p-6 banner-sage min-h-[200px] flex flex-col justify-between">
              <p className="text-label" style={{ color: "rgba(255,255,255,0.5)" }}>PHOENIX, AZ</p>
              <div>
                <p className="text-title-2 text-white mb-1">Indie Dev Meetup</p>
                <p className="text-footnote" style={{ color: "rgba(255,255,255,0.6)" }}>
                  16 developers · 8 games · July 19
                </p>
              </div>
            </div>
            {/* Forest card */}
            <div className="col-span-6 md:col-span-3 rounded-2xl p-6 banner-forest flex flex-col justify-between min-h-[96px]">
              <p className="text-label" style={{ color: "rgba(255,255,255,0.4)" }}>OPEN PLAYTEST</p>
              <p className="text-title-3 text-white">Neon Drift v0.4</p>
            </div>
            {/* Coral card — CTA */}
            <div className="col-span-6 md:col-span-3 rounded-2xl p-6 banner-coral flex items-center justify-between min-h-[96px]">
              <p className="text-title-3 text-white font-semibold">Join Glyph</p>
              <span className="text-white text-xl">→</span>
            </div>
            {/* Taupe card — light, dark text */}
            <div className="col-span-6 md:col-span-2 rounded-2xl p-6 banner-taupe min-h-[96px]">
              <p className="text-label mb-2" style={{ color: "rgba(0,0,0,0.4)" }}>DEVELOPERS</p>
              <p className="text-title-2 font-bold" style={{ color: "#0F0F0D" }}>250K+</p>
            </div>
            {/* Blush card — light, dark text */}
            <div className="col-span-6 md:col-span-4 rounded-2xl p-6 banner-blush min-h-[96px] flex flex-col justify-between">
              <p className="text-label" style={{ color: "rgba(0,0,0,0.4)" }}>SEEKING TESTERS</p>
              <p className="text-footnote" style={{ color: "rgba(0,0,0,0.6)" }}>
                14 games open for playtesting this week
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA — ref_14 black/cream split ─────────── */}
      <section className="grid lg:grid-cols-2 min-h-[400px] border-t border-white/[0.06]">
        <div className="bg-black px-10 lg:px-16 py-16 flex flex-col justify-center">
          <h2
            className="text-white font-bold leading-none mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
            }}
          >
            YOUR GAME.<br />
            YOUR STORY.<br />
            YOUR COMMUNITY.
          </h2>
          <p className="text-body text-[#636366]">
            Free forever for individual developers.
          </p>
        </div>
        <div
          className="px-10 lg:px-16 py-16 flex flex-col justify-center"
          style={{ background: "#EDE8DF" }}
        >
          <p className="text-label mb-6" style={{ color: "#8A8360" }}>
            GET EARLY ACCESS
          </p>
          <form action={joinWaitlist} className="space-y-3 max-w-sm">
            <input
              name="name"
              required
              placeholder="Your name"
              className="w-full rounded-2xl px-5 py-4 text-sm outline-none border"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(0,0,0,0.1)",
                color: "#0F0F0D",
              }}
            />
            <input
              name="email"
              required
              type="email"
              placeholder="Your email"
              className="w-full rounded-2xl px-5 py-4 text-sm outline-none border"
              style={{
                background: "#FFFFFF",
                borderColor: "rgba(0,0,0,0.1)",
                color: "#0F0F0D",
              }}
            />
            <button
              type="submit"
              className="w-full rounded-2xl px-5 py-4 font-semibold text-white text-sm transition-colors duration-150"
              style={{ background: "#0071E3" }}
            >
              Join Waitlist
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] px-6 lg:px-16 py-8 bg-[#0F0F0D]">
        <div className="flex items-center justify-between">
          <p className="text-footnote text-[#636366]">Glyph · 2026</p>
          <p className="text-footnote text-[#636366]">Always free for developers.</p>
        </div>
      </footer>

    </main>
  );
}
