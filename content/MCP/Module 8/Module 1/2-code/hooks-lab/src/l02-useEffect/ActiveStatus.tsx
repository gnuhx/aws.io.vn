import { useEffect, useState } from 'react';

// "Active 2m ago" under a friend's name. Demo uses SECONDS so you can watch it change.
export default function ActiveStatus({ lastActiveAt }: { lastActiveAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  // EFFECT 3 — a timer that must be stopped when the component goes away
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const secs = Math.floor((now - lastActiveAt) / 1000); // derived, no state
  return <span className="muted" data-testid="active">Active {secs}s ago</span>;
}
