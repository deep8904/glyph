export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Developer Profile</h1>
      <p className="mt-4 text-muted-foreground">@{username}</p>
    </main>
  );
}