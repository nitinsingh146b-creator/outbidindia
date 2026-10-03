'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const host = (u) => String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');

export default function Board({ initial }) {
  const [data, setData] = useState(initial || { rows: [], total: 0 });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', url: '', amount: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const refresh = () =>
    fetch('/api/leaderboard?ts=' + Date.now(), { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.rows && setData(d))
      .catch(() => {});

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 3000);
    return () => clearInterval(t);
  }, []);

  const rows = data.rows || [];
  const top = rows[0]?.total || 0;
  const claim = Math.max(top + 1, 10);

  async function pay(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(f)
      });
      const o = await res.json();
      if (!res.ok) throw new Error(o.error);
      const rz = new window.Razorpay({
        key: o.key,
        amount: o.amount,
        currency: 'INR',
        order_id: o.orderId,
        name: 'OutbidIndia',
        description: 'Bid for ' + f.name,
        theme: { color: '#ff9a3c' },
        handler: async (r) => {
          const v = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(r)
          });
          if (!v.ok) { setErr('Payment not confirmed'); setBusy(false); return; }
          await refresh();
          setOpen(false);
          setDone(true);
          setBusy(false);
          setF({ name: '', url: '', amount: '' });
          setTimeout(() => setDone(false), 5000);
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      rz.on('payment.failed', () => { setErr('Payment failed. Try again.'); setBusy(false); });
      rz.open();
    } catch (x) {
      setErr(x.message || 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-20 pt-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm tracking-wide text-mute">outbid · india</p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">Outbid<span className="text-saffron">India</span></h1>
        </div>
        <p className="text-right text-sm text-mute">{inr(data.total)}<br />collected</p>
      </header>

      <section className="mt-8 rounded-3xl border border-line bg-panel/80 p-5 shadow-2xl shadow-black/40 sm:p-7">
        <p className="text-sm text-mute">Claim #1 for</p>
        <p className="mt-1 text-5xl font-extrabold tabular-nums text-saffron sm:text-6xl">{inr(claim)}</p>
        <p className="mt-2 text-mute">{top ? rows[0].name + ' holds it at ' + inr(top) : 'No one has claimed it yet.'}</p>
        <button onClick={() => { setF({ ...f, amount: String(claim) }); setOpen(true); setErr(''); }} className="mt-5 w-full rounded-2xl bg-saffron py-4 text-lg font-bold text-black">
          Claim rank #1
        </button>
        {done && <p className="mt-3 text-sm text-saffron">Payment received. Rank updating.</p>}
      </section>

      <ol className="mt-8 space-y-3">
        {rows.length === 0 && <li className="rounded-2xl border border-line bg-panel p-8 text-center text-mute">The top spot costs ₹10.</li>}
        {rows.map((r, i) => (
          <li key={r.key} className={'rounded-2xl border p-4 sm:p-5 ' + (i === 0 ? 'border-saffron/60 bg-saffron/10' : 'border-line bg-panel')}>
            <div className="flex items-start gap-4">
              <span className={'text-3xl font-black tabular-nums ' + (i === 0 ? 'text-saffron' : 'text-mute')}>#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold">{r.name}</p>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-mute">{host(r.url)}</a>
              </div>
              <p className="text-right font-bold tabular-nums">{inr(r.total)}</p>
            </div>
            <button onClick={() => { setF({ name: '', url: '', amount: String(Math.max(r.total + 1, 10)) }); setOpen(true); setErr(''); }} className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm font-semibold hover:border-saffron">
              Claim this rank for {inr(Math.max(r.total + 1, 10))}
            </button>
          </li>
        ))}
      </ol>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={() => !busy && setOpen(false)}>
          <form onSubmit={pay} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-t-3xl border border-line bg-panel p-6 sm:rounded-3xl">
            <h2 className="text-2xl font-bold">Place your bid</h2>
            <label className="block text-sm text-mute">Product name
              <input required value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            </label>
            <label className="block text-sm text-mute">Website URL
              <input required value={f.url} placeholder="https://" onChange={(e) => setF({ ...f, url: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            </label>
            <label className="block text-sm text-mute">Bid amount (₹)
              <input required type="number" min="10" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-3 text-white" />
            </label>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button disabled={busy} className="w-full rounded-2xl bg-saffron py-3.5 font-bold text-black">{busy ? 'Opening payment…' : 'Pay with Razorpay'}</button>
            <button type="button" onClick={() => setOpen(false)} className="w-full text-sm text-mute">Cancel</button>
          </form>
        </div>
      )}
    </main>
  );
}
