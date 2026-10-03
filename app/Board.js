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
