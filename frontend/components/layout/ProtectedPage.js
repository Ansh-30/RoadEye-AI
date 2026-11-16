'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function ProtectedPage({ children, requireAdmin = false }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      router.push('/login');
      return;
    }

    if (!loading && requireAdmin && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [loading, token, user, requireAdmin, router]);

  if (loading) {
    return (
      <div className="page-bg flex min-h-screen items-center justify-center">
        <div className="rounded-[28px] border border-border bg-white/80 px-8 py-6 text-lg font-semibold text-forest shadow-soft">
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (requireAdmin && user?.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
