export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background">
      <div className="mt-12 mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          랜드노트
        </h1>
      </div>
      <main className="flex w-full flex-1 flex-col items-center justify-start">
        {children}
      </main>
    </div>
  );
}
