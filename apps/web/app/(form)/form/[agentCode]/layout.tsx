export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100/80">
      <header className="border-b border-primary/10 bg-white/80 px-4 py-4 backdrop-blur-sm">
        <h1 className="text-center text-xl font-bold tracking-tight text-primary">
          랜드노트
        </h1>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
