import { redirect } from 'next/navigation';
import CreateAgentClient from '@/components/CreateAgentClient';
import { getAuthenticatedUser } from '@/server/auth';

export default async function NewAgentPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/login?next=/agent/new');
  }

  return <CreateAgentClient />;
}
