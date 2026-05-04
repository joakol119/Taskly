'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (!token || !userParam) {
      router.replace('/login?error=github_unexpected');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      router.replace('/boards');
    } catch (err) {
      console.error('Failed to parse user payload:', err);
      router.replace('/login?error=github_unexpected');
    }
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-bg text-text flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-sm text-text-muted">Signing you in...</span>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <CallbackHandler />
    </Suspense>
  );
}
