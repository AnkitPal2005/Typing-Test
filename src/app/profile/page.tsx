import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const tests = await prisma.typingTest.findMany({
    where: { userId },
    orderBy: { dateAttempted: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-user text-[var(--main-color)] text-3xl"></i>
        <h2 className="text-[var(--main-color)] text-2xl font-bold font-sans">
          {session.user.name}&apos;s Profile
        </h2>
      </div>
      <ProfileClient tests={tests} user={user} />
    </div>
  );
}
