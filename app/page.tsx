import { createClient } from "@/lib/supabase/server";

async function joinWaitlist(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!name || !email) return;

  const supabase = await createClient();

  const { error } = await supabase.from("waitlist").insert({
    name,
    email,
  });

  if (error) {
    console.error("Supabase waitlist insert error:", error.message);
    return;
  }
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#080807] text-white">
      <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,61,0,0.35),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(255,0,80,0.25),transparent_30%)]" />

        <div className="relative grid w-full gap-8 rounded-[2rem] border border-white/10 bg-black/70 p-6 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="flex flex-col justify-between rounded-[1.5rem] bg-[#0d0d0b] p-8">
            <nav className="mb-20 flex items-center justify-between">
              <div className="text-xl font-bold tracking-tight">Glyph</div>
              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
                Beta Access
              </div>
            </nav>

            <div>
              <p className="mb-4 text-sm font-medium tracking-[0.3em] text-[#ff5a4f] uppercase">
                Indie game identity platform
              </p>

              <h1 className="max-w-3xl text-6xl leading-[0.9] font-black tracking-tight md:text-8xl">
                Build your reputation before launch.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
                Glyph helps indie developers share projects, write devlogs,
                collect feedback, and build visibility before their game goes
                live.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white p-5 text-black">
            <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-[#ff3d00]/30 blur-3xl" />
            <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#ff0055]/25 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between rounded-[1.25rem] bg-[#f7f4ef] p-8">
              <div>
                <p className="text-sm font-semibold text-black/50">
                  Join the whitelist
                </p>

                <h2 className="mt-4 text-4xl leading-none font-black tracking-tight">
                  Early access for indie developers.
                </h2>

                <p className="mt-4 text-black/60">
                  Add your name and email. You’ll be first to test Glyph when
                  the beta opens.
                </p>
              </div>

              <form action={joinWaitlist} className="mt-10 space-y-3">
                <input
                  name="name"
                  required
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-black/10 bg-white px-5 py-4 transition outline-none focus:border-[#ff3d00]"
                />

                <input
                  name="email"
                  required
                  type="email"
                  placeholder="Your email"
                  className="w-full rounded-2xl border border-black/10 bg-white px-5 py-4 transition outline-none focus:border-[#ff3d00]"
                />

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#ff3d00] px-5 py-4 font-bold text-white transition hover:bg-[#e63600]"
                >
                  Join Whitelist
                </button>
              </form>

              <p className="mt-5 text-xs text-black/40">
                No spam. Just beta access, product updates, and launch news.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
