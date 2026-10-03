import { createClient } from '@supabase/supabase-js';
export const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function getBoard() {
  const { data, error } = await db().from('leaderboard').select('*').limit(100);
  if (error) throw error;
  const rows = (data || []).map((r) => ({ key: r.url_key, name: r.name, url: r.url, total: Number(r.total_paise) / 100 }));
  const { data: all } = await db().from('bids').select('amount_paise').eq('status', 'paid');
  const total = (all || []).reduce((s, r) => s + Number(r.amount_paise), 0) / 100;
  return { rows, total };
}
