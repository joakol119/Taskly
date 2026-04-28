'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-bg text-text">
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-bg/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-accent-soft border border-accent/30 flex items-center justify-center">
              <span className="text-accent font-mono text-sm font-medium">T</span>
            </div>
            <span className="font-medium tracking-tight">Taskly</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-mono rounded bg-surface border border-border text-text-muted">
              for developers
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/login')} className="px-3 py-1.5 text-sm text-text-muted hover:text-text transition-colors">
              Sign in
            </button>
            <button onClick={() => router.push('/login')} className="px-3 py-1.5 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors">
              Get started
            </button>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
            <span>GitHub integration - Beta</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-medium tracking-tight leading-tight">
            The task manager built<br />for <span className="text-accent">developers.</span>
          </h1>
          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Pull GitHub issues into a kanban board. Let AI break them down into subtasks. Ship faster.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button onClick={() => router.push('/login')} className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors">
              Get started, it is free
            </button>
            <a href="https://github.com/joakol119/Taskly" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium bg-surface border border-border text-text rounded-md hover:bg-surface-2 transition-colors text-center">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Built different</p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">Made for the way devs actually work.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
              <h3 className="text-lg font-medium tracking-tight">GitHub-native</h3>
              <p className="text-sm text-text-muted leading-relaxed">Connect your repos and import issues with one click.</p>
            </div>
            <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
              <h3 className="text-lg font-medium tracking-tight">AI breakdowns</h3>
              <p className="text-sm text-text-muted leading-relaxed">Drop a vague ticket. Get back subtasks and estimates, powered by Claude.</p>
            </div>
            <div className="p-6 rounded-lg bg-surface border border-border space-y-3">
              <h3 className="text-lg font-medium tracking-tight">Velocity insights</h3>
              <p className="text-sm text-text-muted leading-relaxed">See what you actually shipped. Track tasks completed and weekly velocity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">
            Stop juggling tabs.<br /><span className="text-accent">Start shipping.</span>
          </h2>
          <p className="text-text-muted">Free forever for personal projects. No credit card.</p>
          <button onClick={() => router.push('/login')} className="px-6 py-3 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors">
            Create your first board
          </button>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-mono text-text-subtle">
          <span>Taskly - Built by Joaquin</span>
          <span>Next.js, Express, PostgreSQL</span>
        </div>
      </footer>
    </main>
  );
}
