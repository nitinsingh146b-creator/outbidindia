import { getBoard } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return Response.json(await getBoard()); }
  catch { return Response.json({ error: 'Failed to load' }, { status: 500 }); }
}
