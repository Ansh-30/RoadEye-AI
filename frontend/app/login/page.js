
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Home } from 'lucide-react';
import { loginUser, getApiErrorMessage } from '@/services/api';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { saveSession } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const email = form.email.trim();

    if (!email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);

      const response = await loginUser({
        email,
        password: form.password,
      });

      const token = response.data?.token;
      const user = response.data?.user;

      if (!token || !user) {
        throw new Error('Authentication failed. Invalid server response.');
      }

      saveSession(token, user);

      router.push('/dashboard');
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          'Unable to sign in. Please try again.'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg auth-page flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:py-10">
      <div className="auth-topbar mb-5 flex w-full max-w-5xl items-center justify-between gap-4">
        <Link href="/" className="auth-home-link">
          <Home size={17} aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link href="/" className="auth-brand-link md:hidden" aria-label="RoadEye AI home">
          <span className="auth-brand-mark">R</span>
          <span>
            <span className="auth-brand-eyebrow">Road intelligence</span>
            <span className="auth-brand-name">RoadEye AI</span>
          </span>
        </Link>
      </div>

      <div className="auth-card grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-border bg-white/85 shadow-soft backdrop-blur md:grid-cols-2">

        <div className="auth-panel relative hidden overflow-hidden bg-[#1E3B2F] p-10 text-white md:block lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(200,180,138,0.2),transparent_35%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Link href="/" className="auth-panel-brand">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-base font-bold">
                  R
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#dfe7d6]">
                    Road intelligence
                  </p>
                  <h1 className="text-xl font-bold">RoadEye AI</h1>
                </div>
              </Link>
            </div>

            <div>
              <p className="max-w-md text-4xl font-black leading-[1.08] tracking-[-0.055em] lg:text-[2.75rem]">
                Smarter roads. Safer journeys.
              </p>

              <p className="mt-4 max-w-sm text-[15px] leading-7 text-white/75">
                Monitor potholes, track municipal repair work and keep your
                community connected to safer road conditions.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-form-panel p-6 sm:p-9 lg:p-12">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sage">
              Welcome back
            </p>

            <h2 className="mt-2 text-3xl font-bold leading-tight tracking-[-0.035em] text-forest sm:text-[2rem]">
              Log in to your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-secondaryText">
              Sign in to review reports and follow road repairs in your community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-darkText">
                Email address
              </label>

              <div className="auth-input-wrap relative">
                <Mail
                  size={18}
                  aria-hidden="true"
                  className="auth-input-icon absolute left-4 top-1/2 -translate-y-1/2 text-secondaryText"
                />

                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="input-shell auth-input"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-semibold text-darkText">
                Password
              </label>

              <div className="auth-input-wrap relative">
                <Lock
                  size={18}
                  aria-hidden="true"
                  className="auth-input-icon absolute left-4 top-1/2 -translate-y-1/2 text-secondaryText"
                />

                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input-shell auth-input auth-input--password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="auth-password-toggle absolute right-3 top-1/2 -translate-y-1/2 text-secondaryText"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-2xl border border-[#f2d1d1] bg-[#fff5f5] px-3 py-2 text-sm text-[#b33b3b]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="primary-btn auth-submit w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-sm text-secondaryText">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-forest">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
