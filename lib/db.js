import { createClient } from '@supabase/supabase-js';

export const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function getBoard() {
  const { data, error } = await db().from('bids').select('name,url,url_key,amount_paise,created_at,status').eq('status', 'paid');
  if (error) throw new Error(error.message);
  const map = new Map();
  for (const r of data || []) {
    const prev = map.get(r.url_key);
    if (!prev) map.set(r.url_key, { key: r.url_key, name: r.name, url: r.url, total: Number(r.amount_paise) / 100, first: r.created_at });
    else {
      prev.total += Number(r.amount_paise) / 100;
      if (r.created_at > prev.first) { prev.name = r.name; prev.url = r.url; }
    }
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total);
  const total = rows.reduce((s, r) => s + r.total, 0);
  return { rows, total };
}
