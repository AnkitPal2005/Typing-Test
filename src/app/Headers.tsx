'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function Headers() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-[var(--sub-alt-color)] py-6">
      <div className="container mx-auto max-w-4xl px-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold font-sans text-[var(--main-color)] flex items-center gap-2">
            <i className="fa-solid fa-keyboard"></i> wottacore
          </Link>
          <nav className="flex items-center gap-4 text-sm font-semibold">
            <Link href="/" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
              <i className="fa-solid fa-keyboard"></i> test
            </Link>
            <Link href="/leaderboard" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
              <i className="fa-solid fa-crown"></i> leaderboard
            </Link>
            <Link href="/race" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
              <i className="fa-solid fa-bolt"></i> race
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          {session ? (
            <>
              <Link href="/profile" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
                <i className="fa-solid fa-user"></i> {session.user?.name}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="cursor-pointer text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1 bg-none border-none"
              >
                <i className="fa-solid fa-right-from-bracket"></i> logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
                <i className="fa-solid fa-right-to-bracket"></i> login
              </Link>
              <Link href="/register" className="text-[var(--sub-color)] hover:text-[var(--text-color)] transition-colors flex items-center gap-1">
                <i className="fa-solid fa-user-plus"></i> register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
