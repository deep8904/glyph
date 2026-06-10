export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0D] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <a href="/" className="text-white font-semibold text-lg tracking-tight">
            Glyph
          </a>
        </div>
        <h1 className="text-title-1 text-white mb-2">Create account</h1>
        <p className="text-footnote text-[#636366] mb-8">
          Join Glyph — free forever for indie developers.
        </p>
        {/* Full auth implementation comes in Stage 1 of the main build */}
        <div className="card-apple p-6 shadow-glyph-lg">
          <p className="text-caption text-[#636366] text-center">
            Auth implementation coming in Stage 1
          </p>
        </div>
        <p className="mt-6 text-footnote text-center text-[#636366]">
          Already have an account?{" "}
          <a href="/login" className="text-[#0071E3] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
