import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/server/agentService';

export default function MePage() {
  redirect(`/profile/${getCurrentUser().id}`);
}
