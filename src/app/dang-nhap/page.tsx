import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { safeNext } from '@/lib/auth';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  robots: { index: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getSession()) redirect(safeNext(next));
  return (
    <main className="container">
      <AuthForm mode="login" next={next} />
    </main>
  );
}
