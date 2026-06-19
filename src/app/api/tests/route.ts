import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { wpm, accuracy, duration, mistakes, difficulty } = await request.json();
    const userId = (session.user as any).id;

    // Create the test result
    const testResult = await prisma.typingTest.create({
      data: {
        wpm: parseFloat(wpm),
        accuracy: parseFloat(accuracy),
        duration: parseInt(duration, 10),
        mistakes: parseInt(mistakes, 10),
        difficulty,
        userId,
      },
    });

    // Fetch user current personal best
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user && wpm > user.personalBestWpm) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          personalBestWpm: wpm,
          personalBestAccuracy: accuracy,
        },
      });
    }

    return NextResponse.json({ success: true, testId: testResult.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const tests = await prisma.typingTest.findMany({
    where: { userId },
    orderBy: { dateAttempted: 'desc' },
    take: 15,
  });

  return NextResponse.json(tests);
}
