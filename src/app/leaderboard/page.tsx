import React from 'react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Leaderboard() {
  const users = await prisma.user.findMany({
    orderBy: { personalBestWpm: 'desc' },
    take: 100,
    select: {
      username: true,
      personalBestWpm: true,
      personalBestAccuracy: true,
      _count: {
        select: { tests: true }
      }
    }
  });

  return (
    <div className="max-w-2xl mx-auto bg-[var(--sub-alt-color)] border border-[var(--sub-color)] border-opacity-10 rounded-xl p-8 text-white shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <i className="fa-solid fa-crown text-[var(--main-color)] text-3xl"></i>
        <h2 className="text-[var(--main-color)] text-2xl font-bold font-sans">Global Leaderboard</h2>
      </div>
      <p className="text-[var(--sub-color)] text-sm mb-6">The top 100 highest typing speeds registered in the community.</p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--sub-color)] border-opacity-20 text-[var(--sub-color)] uppercase tracking-wider text-xs font-semibold">
              <th className="py-3 px-4">Rank</th>
              <th className="py-3 px-4">Player</th>
              <th className="py-3 px-4 text-right">Max WPM</th>
              <th className="py-3 px-4 text-right">Accuracy</th>
              <th className="py-3 px-4 text-right">Tests</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[var(--sub-color)]">No records found. Be the first to start!</td>
              </tr>
            ) : (
              users.map((user, idx) => (
                <tr key={idx} className="border-b border-[var(--sub-color)] border-opacity-10 hover:bg-[var(--bg-color)] hover:bg-opacity-20 transition-colors">
                  <td className="py-3 px-4 font-bold">
                    {idx === 0 && <span className="text-[var(--main-color)]">🥇 1</span>}
                    {idx === 1 && <span className="text-gray-300">🥈 2</span>}
                    {idx === 2 && <span className="text-amber-600">🥉 3</span>}
                    {idx > 2 && <span>#{idx + 1}</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold">{user.username}</td>
                  <td className="py-3 px-4 text-right text-[var(--main-color)] font-bold">{user.personalBestWpm.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right text-[var(--sub-color)]">{user.personalBestAccuracy.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-[var(--sub-color)]">{user._count.tests}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
