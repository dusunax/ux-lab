import { redirect } from 'next/navigation';
import LoginClient from '@/components/LoginClient';
import { getAuthenticatedUser } from '@/server/auth';

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeNext(params.next);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(next);
  }

  return <LoginClient next={next} />;
}

function sanitizeNext(value: string | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}
