import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { safeNext } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Tạo tài khoản',
  robots: { index: false },
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect(safeNext(next));
  return <AuthForm mode="register" next={next} />;
}
