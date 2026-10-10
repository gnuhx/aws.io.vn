import { useState } from 'react';
import ChatWindow from './ChatWindow';
import ActiveStatus from './ActiveStatus';

const FRIENDS = ['An', 'Binh', 'Chi'];
const OPENED_AT = Date.now();

export default function Messenger() {
  const [friend, setFriend] = useState(FRIENDS[0]);
  const [open, setOpen] = useState(true);
  const [forgetCleanup, setForgetCleanup] = useState(false);

  return (
    <section className="card" aria-label="Messenger">
      <p className="row">
        {FRIENDS.map((f) => (
          <button key={f} aria-pressed={f === friend} onClick={() => setFriend(f)}>{f}</button>
        ))}
        <button onClick={() => setOpen((o) => !o)}>{open ? 'Close chat' : 'Open chat'}</button>
      </p>
      <label className="muted">
        <input type="checkbox" checked={forgetCleanup} onChange={(e) => setForgetCleanup(e.target.checked)} /> Forget cleanup (bug)
      </label>
      {open && (
        <>
          <p><ActiveStatus lastActiveAt={OPENED_AT} /></p>
          <ChatWindow key={friend} friend={friend} forgetCleanup={forgetCleanup} />
        </>
      )}
    </section>
  );
}
