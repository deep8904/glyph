export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="max-w-4xl px-6 text-center">
        <p className="text-muted-foreground mb-4 text-sm">IndieBase Beta</p>

        <h1 className="text-6xl font-bold tracking-tight">
          Where Indie Developers Build Their Reputation.
        </h1>

        <p className="text-muted-foreground mt-6 text-xl">
          Share your games. Collect feedback. Find collaborators. Grow your
          audience before launch.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <button className="rounded-lg bg-black px-6 py-3 text-white">
            Join Waitlist
          </button>

          <button className="rounded-lg border px-6 py-3">
            Explore Projects
          </button>
        </div>
      </div>
    </main>
  );
}
