import { createClient } from '@supabase/supabase-js';

export const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

export async function getBoard() {
  const { data, error } = await db()
    .from('bids')
    .select('name,url,url_key,amount_paise,created_at,status')
    .eq('status', 'paid');

  if (error) throw new Error(error.message);

  const map = new Map();
  for (const r of data || []) {
    const key = r.url_key || r.url || r.name;
    const prev = map.get(key);
    const amount = Number(r.amount_paise) / 100;
    if (!prev) {
      map.set(key, { key, name: r.name, url: r.url, total: amount, first: r.created_at });
    } else {
      prev.total += amount;
      if (r.created_at > prev.first) {
        prev.name = r.name;
        prev.url = r.url;
      }
    }
  }

  const rows = [...map.values()].sort((a, b) =>
