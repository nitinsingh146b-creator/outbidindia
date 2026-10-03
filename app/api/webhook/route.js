import crypto from 'crypto';
import { db } from '@/lib/db';

// Backup confirmation if the user closes the tab after paying.
export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return new Response('bad signature', { status: 400 });
  const ev = JSON.parse(raw);
  const pay = ev.payload?.payment?.entity;
  if (pay?.order_id && (ev.event === 'payment.captured' || ev.event === 'order.paid'))
    await db().from('bids').update({ status: 'paid', payment_id: pay.id }).eq('order_id', pay.order_id).eq('status', 'pending');
  return new Response('ok');
}
