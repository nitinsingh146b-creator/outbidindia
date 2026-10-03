'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const CATS = ['All', 'Agents', 'Marketing', 'SEO', 'Crypto', 'Security', 'Business', 'Hiring', 'Developer', 'Healthcare', 'Social', 'Education', 'Ecommerce', 'Finance', 'Domains', 'Other'];
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const host = (u) => String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function Board({ initial }) {
  const [data, setData] = useState(initial || { rows: [], total: 0 });
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', url: '', amount: '', category: 'Agents' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const refresh = () => fetch('/api/leaderboard?ts=' + Date.now(), { cache: 'no-store' }).then((r) => r.json()).then((d) => d.rows && setData(d)).catch(() => {});
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, []);

  const rows = (data.rows || []).filter((r) => cat === 'All' || r.category === cat);
  const top = rows[0]?.total || 0;
  const claim = Math.max(top + 1, 10);

  async function pay(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const res = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
      const o = await res.json();
      if (!res.ok) throw new Error(o.error);
      const rz = new window.Razorpay({
        key: o.key, amount: o.amount, currency: 'INR', order_id: o.orderId, name: 'OutbidIndia', description: 'Bid for ' + f.name, theme: { color: '#ff9a3c' },
        handler: async (r) => {
          const v = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) });
          if (!v.ok) { setErr('Payment not confirmed'); setBusy(false); return; }
          await refresh(); setOpen(false); setDone(true); setBusy(false); setTimeout(() => setDone(false), 5000);
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      rz.on('payment.failed', () => { setErr('Payment failed.'); setBusy(false); });
      rz.open();
    } catch (x) { setErr(x.message || 'Something went wrong'); setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <p className="text-sm tracking-wide text-mute">outbid · india</p>
      <h1 className="text-4xl font-extrabold sm:text-6xl">Outbid<span className="text-saffron">India</span></h1>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={'shrink-0 rounded-full px-4 py-2 text-sm font-semibold ' + (cat === c ? 'bg-saffron text-black' : 'border border-line text-mute')}>{c}</button>
        ))}
      </div>
      <section className="mt-4 rounded-3xl border border-line bg-panel p-5">
        <p className="text-sm text-mute">Claim #1 in {cat} for</p>
        <p className="mt-1 text-5xl font-extrabold text-saffron">{inr(claim)}</p>
        <button onClick={() => { setF({ ...f, amount: String(claim), category: cat === 'All' ? 'Agents' : cat }); setOpen(true); }} className="mt-5 w-full rounded-2xl bg-saffron py-4 font-bold text-black">Claim rank #1</button>
        {done && <p className="mt-3 text-sm text-saffron">Payment received. Rank updating.</p>}
      </section>
      <ol className="mt-6 space-y-3">
        {rows.length === 0 && <li className="rounded-2xl border border-line bg-panel p-8 text-center text-mute">No bids in {cat} yet.</li>}
        {rows.map((r, i) => (
          <li key={r.key} className={'rounded-2xl border p-4 ' + (i === 0 ? 'border-saffron/60 bg-saffron/10' : 'border-line bg-panel')}>
            <div className="flex gap-3">
              <span className={'text-2xl font-black ' + (i === 0 ? 'text-saffron' : 'text-mute')}>#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{r.name}</p>
                <p className="truncate text-sm text-mute">{host(r.url)} · {r.category || 'Other'}</p>
              </div>
              <p className="font-bold">{inr(r.total)}</p>
            </div>
          </li>
        ))}
      </ol>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => !busy && setOpen(false)}>
          <form onSubmit={pay} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-t-3xl border border-line bg-panel p-6">
            <h2 className="text-xl font-bold">Place your bid</h2>
            <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="w-full rounded-xl border border-line bg-ink px-3 py-3 text-white">
              {CATS.filter((c) => c !== 'All').map((c) => <option key={c}>{c}</option>)}
            </select>
            <input required placeholder="Product name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            <input required placeholder="https://website.com" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className="w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            <input required type="number" min="10" placeholder="Amount" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button disabled={busy} className="w-full rounded-2xl bg-saffron py-3.5 font-bold text-black">{busy ? 'Opening payment…' : 'Pay with Razorpay'}</button>
            <button type="button" onClick={() => setOpen(false)} className="w-full text-sm text-mute">Cancel</button>
          </form>
        </div>
      )}
    </main>
  );
}
