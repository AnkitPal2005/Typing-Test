'use client';

import React, { useState } from 'react';
import { registerUser } from '@/app/actions/authActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Register() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const res = await registerUser(formData);

    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 rounded-xl p-8 text-white mt-10 shadow-lg">
      <h2 className="text-[var(--main-color)] text-2xl font-bold mb-6 text-center">
        <i className="fa-solid fa-user-plus"></i> Register
      </h2>

      {error && <div className="text-[var(--error-color)] bg-[var(--error-extra-color)] bg-opacity-20 text-sm p-3 rounded-lg mb-4">{error}</div>}
      {success && <div className="text-[var(--correct-color)] bg-[var(--sub-alt-color)] text-sm p-3 rounded-lg mb-4 text-center">Registration successful! Redirecting to login...</div>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Username</label>
          <input
            name="username"
            type="text"
            className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Email Address</label>
          <input
            name="email"
            type="email"
            className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
            required
          />
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-[var(--sub-color)] font-semibold mb-2">Password</label>
          <input
            name="password"
            type="password"
            className="w-full bg-[var(--bg-color)] border border-[var(--sub-color)] border-opacity-25 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--main-color)]"
            required
          />
        </div>

        <button
          type="submit"
          className="cursor-pointer bg-[var(--main-color)] text-[var(--bg-color)] font-bold py-2 rounded-lg hover:opacity-90 transition-opacity mt-2"
        >
          Register Account
        </button>
      </form>

      <div className="text-center mt-4 text-sm text-[var(--sub-color)]">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--main-color)] hover:underline">
          Log in here
        </Link>
      </div>
    </div>
  );
}
