import { createClient } from "@/lib/supabase/server";

async function joinWaitlist(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  if (!name || !email) {
    return;
  }

  const supabase = await createClient();

  await supabase.from("waitlist").insert({
    name,
    email,
  });
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
          Glyph Beta Waitlist
        </p>

        <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
          Build your indie game identity before launch.
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/60">
          Glyph helps indie developers share projects, write devlogs, collect
          feedback, and grow visibility before their game goes live.
        </p>

        <form
          action={joinWaitlist}
          className="mt-10 flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
        >
          <input
            name="name"
            required
            placeholder="Your name"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <input
            name="email"
            required
            type="email"
            placeholder="Your email"
            className="rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-white/40"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90"
          >
            Join Waitlist
          </button>
        </form>

        <p className="mt-4 text-sm text-white/40">
          No spam. Just early access and product updates.
        </p>
      </section>
    </main>
  );
}
