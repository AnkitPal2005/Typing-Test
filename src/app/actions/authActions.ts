'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function registerUser(formData: FormData) {
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!username || !email || !password) {
    return { error: 'All fields are required.' };
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return { error: 'Username or email already exists.' };
    }

    const hashedPassword = hashPassword(password);

    await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
      },
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
