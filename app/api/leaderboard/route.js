import { getBoard } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try { return Response.json(await getBoard()); }
  catch (e) { return Response.json({ error: e.message || 'Failed to load' }, { status: 500 }); }
}
