import { redirect } from 'next/navigation';
import { getAuthenticatedUser } from '@/server/auth';

export default async function MePage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login?next=/me');
  }
  redirect(`/profile/${user.id}`);
}
