import { useState } from 'react';

// Click "+3" — like someone dropping 3 reactions in a row
export default function BatchDemo() {
  const [wrong, setWrong] = useState(0);
  const [right, setRight] = useState(0);

  function addThreeWrong() {
    setWrong(wrong + 1); // all 3 lines see wrong = 0
    setWrong(wrong + 1);
    setWrong(wrong + 1);
  }

  function addThreeRight() {
    setRight((n) => n + 1); // each line gets the LATEST value
    setRight((n) => n + 1);
    setRight((n) => n + 1);
  }

  return (
    <section className="card" aria-label="Batched updates demo">
      <p className="row">
        <button onClick={addThreeWrong}>❌ +3 the wrong way</button>
        <span data-testid="wrong">wrong = {wrong}</span>
      </p>
      <p className="row">
        <button onClick={addThreeRight}>✅ +3 the right way</button>
        <span data-testid="right">right = {right}</span>
      </p>
    </section>
  );
}
