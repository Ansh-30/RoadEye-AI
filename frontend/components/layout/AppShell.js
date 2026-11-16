'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, MapPinned, FileText, UploadCloud, User, Shield, LogOut, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Detect Potholes', href: '/detect', icon: UploadCloud },
  { name: 'My Reports', href: '/reports', icon: FileText },
  { name: 'Road Map', href: '/map', icon: MapPinned },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Admin', href: '/admin', icon: Shield }
];

export default function AppShell({ title, subtitle, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="page-bg">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-5 md:px-6">
        <aside className="hidden w-[270px] flex-col rounded-[28px] border border-border bg-white/80 p-5 shadow-soft backdrop-blur md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest text-lg font-bold text-white shadow-soft">
              R
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">Road intelligence</p>
              <h1 className="text-xl font-bold text-forest">RoadEye AI</h1>
            </div>
          </div>

          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-forest text-white shadow-soft'
                      : 'text-darkText hover:bg-[#f3f0e8]'
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[24px] border border-[#e5e0d5] bg-[#f7f3eb] p-4">
            <div className="mb-3 flex items-center gap-2 text-sage">
              <Sparkles size={15} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em]">Status</span>
            </div>
            <p className="text-sm font-semibold text-forest">{user?.role || 'CITIZEN'} workspace</p>
            <p className="mt-1 text-xs text-secondaryText">Live monitoring and municipal responses enabled.</p>
          </div>
        </aside>

        <main className="flex-1">
          <header className="mb-6 rounded-[28px] border border-border bg-white/80 p-4 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">RoadEye AI</p>
                <h2 className="mt-1 text-2xl font-bold text-forest">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-secondaryText">{subtitle}</p> : null}
              </div>

              <div className="flex items-center gap-3">
                <button type="button" className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-white text-sage transition hover:bg-[#f7f3eb]">
                  <Bell size={18} />
                </button>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-[#f9f6f0] px-3 py-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest text-sm font-semibold text-white">
                    {user?.name?.slice(0, 1) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-forest">{user?.name || 'User'}</p>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-secondaryText">{user?.role || 'CITIZEN'}</p>
                  </div>
                </div>
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 text-sm font-medium text-forest transition hover:bg-[#f7f3eb]">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
