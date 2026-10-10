// ❌ Deliberately WRONG: a plain variable instead of state
export default function BrokenLike() {
  let liked = false;

  function handleClick() {
    liked = !liked;
    console.log('[BrokenLike] liked =', liked); // the value does change…
  }

  return (
    <section className="card" aria-label="Broken Like button">
      <p className="muted">❌ Plain variable: click all you want, the screen never changes</p>
      <div className="actions">
        <button aria-pressed={liked} onClick={handleClick}>
          {liked ? '👍 Liked' : '👍 Like'}
        </button>
      </div>
    </section>
  );
}
