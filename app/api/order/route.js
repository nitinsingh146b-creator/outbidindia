import { db } from '@/lib/db';

const CATS = ['Agents', 'Marketing', 'SEO', 'Crypto', 'Security', 'Business', 'Hiring', 'Developer', 'Healthcare', 'Social', 'Education', 'Ecommerce', 'Finance', 'Domains', 'Other'];

export async function POST(req) {
  let b; try { b = await req.json(); } catch { return Response.json({ error: 'Invalid request' }, { status: 400 }); }
  const name = String(b.name || '').trim().slice(0, 60);
  const rupees = Math.floor(Number(b.amount));
  const category = CATS.includes(b.category) ? b.category : 'Other';
  let u;
  try { u = new URL(/^https?:\/\//i.test(b.url) ? b.url.trim() : 'https://' + String(b.url || '').trim()); } catch {}
  if (!name) return Response.json({ error: 'Enter a product name' }, { status: 400 });
  if (!u || !u.hostname.includes('.') || !['http:', 'https:'].includes(u.protocol)) return Response.json({ error: 'Enter a valid website URL' }, { status: 400 });
  if (!(rupees >= 10 && rupees <= 1000000)) return Response.json({ error: 'Bid must be between ₹10 and ₹10,00,000' }, { status: 400 });

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return Response.json({ error: 'Razorpay keys missing on server' }, { status: 500 });

  const url = u.origin + (u.pathname === '/' ? '' : u.pathname);
  const url_key = u.hostname.replace(/^www\./, '').toLowerCase() + (u.pathname === '/' ? '' : u.pathname.toLowerCase());
  const auth = Buffer.from(keyId + ':' + keySecret).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: rupees * 100, currency: 'INR', receipt: url_key.slice(0, 40) })
  });
  const order = await res.json().catch(() => ({}));
  if (!res.ok) return Response.json({ error: order.error?.description || 'Could not start payment' }, { status: 502 });

  const { error } = await db().from('bids').insert({ name, url, url_key, amount_paise: rupees * 100, order_id: order.id, category });
  if (error) return Response.json({ error: 'Could not save bid' }, { status: 500 });
  return Response.json({ orderId: order.id, amount: order.amount, key: keyId });
}
