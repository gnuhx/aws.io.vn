import { useState, type FormEvent } from 'react';

type Comment = { id: string; author: string; text: string };

const POST_TEXT =
  'Our team just shipped the new ERP module today. We spent a whole week debugging a useEffect ' +
  'that ran twice, only to learn StrictMode does that on purpose to catch missing cleanups. ' +
  'Lesson learned: read the docs before blaming React. Thanks, team, for all the late nights!';
const PREVIEW_LENGTH = 90;
const SERVER_LIKES = 41; // like count from the server, NOT including mine
const DRAFT_KEY = 'draft:post-1';

export default function PostCard() {
  // 1) Boolean: have I liked it?
  const [liked, setLiked] = useState(false);
  // 2) Boolean: is the post expanded?
  const [expanded, setExpanded] = useState(false);
  // 3) Array: the comments
  const [comments, setComments] = useState<Comment[]>([
    { id: 'c1', author: 'Lan', text: 'Congrats, team! 🎉' },
  ]);
  // 4) String: the comment box — LAZY init from a saved draft
  const [draft, setDraft] = useState(() => {
    console.log('[PostCard] reading draft from localStorage (once)');
    return localStorage.getItem(DRAFT_KEY) ?? '';
  });

  // DERIVED values — no state needed
  const likeCount = SERVER_LIKES + (liked ? 1 : 0);
  const isLong = POST_TEXT.length > PREVIEW_LENGTH;
  const shownText = expanded || !isLong ? POST_TEXT : POST_TEXT.slice(0, PREVIEW_LENGTH) + '…';
  const canSend = draft.trim().length > 0;

  function handleDraftChange(value: string) {
    setDraft(value);
    localStorage.setItem(DRAFT_KEY, value); // keep the draft if the page reloads
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSend) return;
    const newComment = { id: crypto.randomUUID(), author: 'You', text: draft.trim() };
    setComments((prev) => [...prev, newComment]); // a NEW array, no push
    handleDraftChange('');
  }

  return (
    <article className="card" aria-label="Post">
      <p>
        <strong>Huy Nguyen</strong> <span className="muted">· 2h</span>
      </p>
      <p>
        {shownText}{' '}
        {isLong && (
          <button className="link" onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'See less' : 'See more'}
          </button>
        )}
      </p>

      <p className="muted" data-testid="summary">
        👍 {likeCount} · {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
      </p>

      <div className="actions">
        <button aria-pressed={liked} onClick={() => setLiked((l) => !l)}>
          {liked ? '👍 Liked' : '👍 Like'}
        </button>
        <button>💬 Comment</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {comments.map((c) => (
          <li key={c.id} className="comment">
            <strong>{c.author}</strong> {c.text}
          </li>
        ))}
      </ul>

      <form className="row" onSubmit={handleSubmit}>
        <input
          aria-label="Write a comment"
          placeholder="Write a comment…"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
        />
        <button type="submit" disabled={!canSend}>Send</button>
      </form>
    </article>
  );
}
