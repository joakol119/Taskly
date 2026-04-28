export default function TestPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <p className="text-xs uppercase tracking-widest text-text-subtle font-mono">
          Tailwind test
        </p>
        <h1 className="text-4xl font-medium tracking-tight">
          If you can read this in <span className="text-accent">pink</span>,
          everything works.
        </h1>
        <p className="text-text-muted">
          Background should be near-black. Text should be off-white.
          The accent word should be a vibrant rose-red.
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="px-3 py-1 text-xs rounded-md bg-surface border border-border text-text-muted font-mono">
            v0.1.0
          </span>
          <span className="px-3 py-1 text-xs rounded-md bg-accent-soft text-accent font-mono">
            tailwind-ok
          </span>
        </div>
      </div>
    </main>
  );
}