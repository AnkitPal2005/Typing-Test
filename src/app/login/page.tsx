'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid username/email or password.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 rounded-xl p-8 text-white mt-10 shadow-lg">
      <h2 className="text-[var(--main-color)] text-2xl font-bold mb-6 text-center">
        <i className="fa-solid fa-right-to-bracket"></i> Login
      </h2>

      {error && <div className="text-[var(--error-color)] bg-[var(--error-extra-color)] bg-opacity-20 text-sm p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Username or Email</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
            required
          />
        </div>

        <button
          type="submit"
          className="cursor-pointer bg-[var(--main-color)] text-[var(--bg-color)] font-bold py-2 rounded-lg hover:opacity-90 transition-opacity mt-2"
        >
          Log In
        </button>
      </form>

      {/* Social login stubs */}
      <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--sub-color)] border-opacity-10">
        <button
          onClick={() => signIn('google')}
          className="cursor-pointer bg-white text-black font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <i className="fa-brands fa-google"></i> Sign in with Google
        </button>
        <button
          onClick={() => signIn('github')}
          className="cursor-pointer bg-gray-900 text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <i className="fa-brands fa-github"></i> Sign in with GitHub
        </button>
      </div>

      <div className="text-center mt-4 text-sm text-[var(--sub-color)]">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-[var(--main-color)] hover:underline">
          Register here
        </Link>
      </div>
    </div>
  );
}
