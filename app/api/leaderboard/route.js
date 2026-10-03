import { getBoard } from '@/lib/db';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    return Response.json(await getBoard(), {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (e) {
    return Response.json({ error: e.message || 'Failed to load' }, { status: 500 });
  }
}
