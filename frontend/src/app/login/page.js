'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const ERROR_MESSAGES = {
  github_cancelled: 'GitHub sign in was cancelled.',
  github_no_code: 'GitHub did not return an authorization code. Please try again.',
  github_not_configured: 'GitHub sign in is not configured on this server.',
  github_token_failed: 'Could not exchange the authorization code with GitHub.',
  github_user_failed: 'Could not fetch your GitHub profile.',
  github_no_email: 'Your GitHub account has no verified email. Add one or sign up with email.',
  github_unexpected: 'Something went wrong with GitHub sign in. Please try again.',
};

function GitHubIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.34-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.35.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Surface OAuth errors coming back from the backend redirect
  useEffect(() => {
    const errCode = searchParams.get('error');
    if (errCode) {
      setError(ERROR_MESSAGES[errCode] || 'GitHub sign in failed.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = isLogin
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/boards');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text transition-colors"
        >
          <span>&larr;</span>
          <span>Back home</span>
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-md bg-accent-soft border border-accent/30 flex items-center justify-center">
            <span className="text-accent font-mono font-medium">T</span>
          </div>
          <span className="font-medium tracking-tight text-lg">Taskly</span>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-surface border border-border text-text-muted">
            for developers
          </span>
        </div>

        <div className="rounded-lg bg-surface border border-border p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-xl font-medium tracking-tight">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-text-muted">
              {isLogin
                ? 'Sign in to continue to your boards.'
                : 'No credit card required. Free forever for personal projects.'}
            </p>
          </div>

          {/* GitHub button */}
          <button
            type="button"
            onClick={handleGitHub}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-bg border border-border-strong text-text rounded-md hover:bg-surface-2 transition-colors"
          >
            <GitHubIcon />
            <span>Continue with GitHub</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-surface text-text-subtle font-mono uppercase tracking-wider">
                or with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-wider text-text-muted">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-bg border border-border rounded-md text-text placeholder:text-text-subtle focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <div className="px-3 py-2 text-sm rounded-md bg-danger/10 border border-danger/30 text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2.5 text-sm font-medium bg-text text-bg rounded-md hover:bg-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="text-center text-sm text-text-muted">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={toggleMode}
              className="text-accent hover:text-accent-hover font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs font-mono text-text-subtle mt-6">
          By continuing, you agree to our terms.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
