'use client';

import { useAuth } from '@/context/auth-context';
import AppShell from '@/components/layout/AppShell';
import ProtectedPage from '@/components/layout/ProtectedPage';
import { User, Mail, ShieldCheck, Clock3 } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedPage>
      <AppShell title="Profile & Settings" subtitle="Manage account details and keep your citizen or municipal profile up to date.">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[28px] border border-border bg-white/80 p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#1E3B2F] text-3xl font-black text-white">
                {user?.name?.slice(0, 1) || 'U'}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Logged in user</p>
                <h3 className="mt-2 text-2xl font-bold text-forest">{user?.name || 'RoadEye User'}</h3>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <User size={18} className="text-sage" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-secondaryText">Name</p>
                  <p className="mt-1 font-semibold text-forest">{user?.name || 'Not available'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <Mail size={18} className="text-sage" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-secondaryText">Email</p>
                  <p className="mt-1 font-semibold text-forest">{user?.email || 'Not available'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <ShieldCheck size={18} className="text-sage" />
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-secondaryText">Role</p>
                  <p className="mt-1 font-semibold text-forest">{user?.role || 'CITIZEN'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-white/80 p-6 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef2e6] text-forest">
                <Clock3 size={22} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Account activity</p>
                <h3 className="mt-1 text-xl font-bold text-forest">Preferences & account summary</h3>
              </div>
            </div>

            <div className="space-y-4 text-base text-secondaryText">
              <div className="rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <p className="font-semibold text-forest">Regional monitoring</p>
                <p className="mt-2">Active road intelligence monitoring enabled for your assigned region.</p>
              </div>

              <div className="rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <p className="font-semibold text-forest">Notifications</p>
                <p className="mt-2">You will receive updates for pothole verification, repair scheduling and issue resolution.</p>
              </div>

              <div className="rounded-[22px] border border-border bg-[#f9f7f3] p-4">
                <p className="font-semibold text-forest">Security</p>
                <p className="mt-2">Your account is protected with JWT-based authentication and role-aware access.</p>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
