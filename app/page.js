import Board from './Board';
import { getBoard } from '@/lib/db';
export const dynamic = 'force-dynamic';

export default async function Page() {
  let initial = { rows: [], total: 0 };
  try { initial = await getBoard(); } catch {}
  return <Board initial={initial} />;
}
