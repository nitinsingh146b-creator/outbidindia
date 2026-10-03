'use client';
import { useEffect, useState } from 'react';
import Script from 'next/script';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');
const keyOf = (u) => {
  try {
    return new URL(/^https?:\/\//i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
};

export default function Board({ initial }) {
  const [data, setData] = useState(initial);
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

  const top = data.rows[0]?.total || 0;
  const own = data.rows.find((r) => r.key.split('/')[0] === keyOf(f.url))?.total || 0;
  const needed = top ? Math.max(top - own + 1, 10) : 10;

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
          const j = await v.json().catch(() => ({}));
          if (!v.ok) {
            setErr(j.error || 'Payment not confirmed');
            setBusy(false);
            return;
          }
          await refresh();
          setOpen(false);
          setDone(true);
          setBusy(false);
          setF({ name: '', url: '', amount: '' });
          setTimeout(() => setDone(false), 5000);
        },
        modal: { ondismiss: () => setBusy(false) }
      });
      rz.on('payment.failed', () => {
        setErr('Payment failed. Try again.');
        setBusy(false);
      });
      rz.open();
    } catch (x) {
      setErr(x.message || 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-14 sm:pt-20">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <header>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">Outbid<span className="text-saffron">India</span></h1>
        <p className="mt-3 text-lg text-mute">Pay more. Rank higher. Get seen.</p>
      </header>
      <section className="mt-10 rounded-2xl border border-line bg-panel p-5 sm:p-6">
        <p className="text-sm text-mute">Current #1 bid</p>
        <p className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl">{top ? inr(top) : 'No bids yet'}</p>
        <p className="mt-1 truncate text-sm text-mute">{data.rows[0] ? 'by ' + data.rows[0].name : 'Be the first on the board.'}</p>
        <button onClick={() => { setOpen(true); setErr(''); }} className="mt-5 w-full rounded-xl bg-saffron px-5 py-3.5 text-base font-semibold text-black">
          {top ? 'Outbid to Rank #1' : 'Place Bid'}
        </button>
        {done && <p className="mt-3 text-sm text-saffron">Payment received. You're on the board.</p>}
      </section>
      <p className="mt-8 flex justify-between px-1 text-sm text-mute"><span>Leaderboard</span><span>{inr(data.total)} collected</span></p>
      <ol className="mt-2 overflow-hidden rounded-2xl border border-line bg-panel">
        {data.rows.length === 0 && <li className="p-8 text-center text-mute">Nobody here yet. The top spot costs ₹10.</li>}
        {data.rows.map((r, i) => (
          <li key={r.key} className={'flex items-center gap-4 px-4 py-4 ' + (i ? 'border-t border-line' : '')}>
            <span className={'w-9 text-2xl font-bold ' + (i === 0 ? 'text-saffron' : 'text-mute')}>{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.name}</p>
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-mute">{String(r.url || '').replace(/^https?:\/\//, '')}</a>
            </div>
            <span className="font-semibold">{inr(r.total)}</span>
          </li>
        ))}
      </ol>
      <footer className="mt-12 space-y-1 text-center text-sm text-mute">
        <p>Rank is decided only by total rupees paid.</p>
        <p>Payments via Razorpay. Bids are non-refundable.</p>
      </footer>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => !busy && setOpen(false)}>
          <form onSubmit={pay} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-4 rounded-t-2xl border border-line bg-panel p-6">
            <h2 className="text-xl font-bold">Place your bid</h2>
            <label className="block text-sm text-mute">Product name
              <input required value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-white" />
            </label>
            <label className="block text-sm text-mute">Website URL
              <input required value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-white" />
            </label>
            <label className="block text-sm text-mute">Bid amount (₹)
              <input required type="number" min="10" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-white" />
              <span className="mt-1 block">Pay at least {inr(needed)} to take Rank #1.</span>
            </label>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-saffron py-3.5 font-semibold text-black">{busy ? 'Opening payment…' : 'Pay with Razorpay'}</button>
            <button type="button" onClick={() => setOpen(false)} className="w-full text-sm text-mute">Cancel</button>
          </form>
        </div>
      )}
    </main>
  );
}
