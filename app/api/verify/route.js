import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(req) {
  const { razorpay_order_id: o, razorpay_payment_id: p, razorpay_signature: s } = await req.json().catch(() => ({}));
  if (!o || !p || !s) return Response.json({ error: 'Missing fields' }, { status: 400 });
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${o}|${p}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return Response.json({ error: 'Invalid signature' }, { status: 400 });
  await db().from('bids').update({ status: 'paid', payment_id: p }).eq('order_id', o).eq('status', 'pending');
  return Response.json({ ok: true });
}
