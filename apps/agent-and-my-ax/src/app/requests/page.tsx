import RequestBoardClient from '@/components/RequestBoardClient';
import { getAuthenticatedUser } from '@/server/auth';

export default async function RequestsPage() {
  const user = await getAuthenticatedUser();
  return <RequestBoardClient isAuthenticated={Boolean(user)} />;
}
