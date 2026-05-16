import { useState } from 'react';
import type { LessonQuiz, QuizQuestion, Difficulty } from '../../data/quizzes';
import './LessonQuiz.css';

type Mode = 'instant' | 'exam';

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  hard: 'Hard',
  expert: 'Expert',
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  beginner: 'quiz-diff--beginner',
  intermediate: 'quiz-diff--intermediate',
  hard: 'quiz-diff--hard',
  expert: 'quiz-diff--expert',
};

function QuestionCard({
  question,
  index,
  mode,
  submitted,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  mode: Mode;
  submitted: boolean;
  selected: 'A' | 'B' | 'C' | 'D' | null;
  onSelect: (answer: 'A' | 'B' | 'C' | 'D') => void;
}) {
  const revealed = mode === 'instant' ? selected !== null : submitted;
  const isCorrect = selected === question.correct;

  return (
    <div className={`quiz-card ${revealed && isCorrect ? 'quiz-card--correct' : ''} ${revealed && !isCorrect && selected ? 'quiz-card--wrong' : ''}`}>
      <div className="quiz-card__header">
        <span className="quiz-card__num">Q{index + 1}</span>
        <span className={`quiz-card__diff ${DIFFICULTY_COLOR[question.difficulty]}`}>
          {DIFFICULTY_LABEL[question.difficulty]}
        </span>
        <span className="quiz-card__topic">{question.topic}</span>
      </div>

      <p className="quiz-card__question">{question.question}</p>

      <div className="quiz-card__options">
        {question.options.map((opt) => {
          let cls = 'quiz-opt';
          if (revealed) {
            if (opt.id === question.correct) cls += ' quiz-opt--correct';
            else if (opt.id === selected) cls += ' quiz-opt--wrong';
          } else if (opt.id === selected) {
            cls += ' quiz-opt--selected';
          }

          return (
            <button
              key={opt.id}
              className={cls}
              disabled={mode === 'instant' ? selected !== null : submitted}
              onClick={() => onSelect(opt.id)}
            >
              <span className="quiz-opt__label">{opt.id}</span>
              <span className="quiz-opt__text">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className="quiz-reveal">
          <div className={`quiz-reveal__verdict ${isCorrect ? 'quiz-reveal__verdict--correct' : 'quiz-reveal__verdict--wrong'}`}>
            {isCorrect ? '✅ Correct!' : `❌ Incorrect — Correct answer: ${question.correct}`}
          </div>

          <p className="quiz-reveal__explanation">{question.explanation}</p>

          {!isCorrect && selected && question.wrongExplanations[selected] && (
            <div className="quiz-reveal__wrong-note">
              <strong>Why {selected} is wrong:</strong> {question.wrongExplanations[selected]}
            </div>
          )}

          <div className="quiz-reveal__flowchart">
            <div className="quiz-reveal__flowchart-label">Decision flow</div>
            <pre>{question.flowchart}</pre>
          </div>

          {!isCorrect && (
            <div className="quiz-reveal__guidance">
              💡 {question.wrongGuidance}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LessonQuizComponent({ quiz }: { quiz: LessonQuiz }) {
  const [mode, setMode] = useState<Mode>('instant');
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [started, setStarted] = useState(false);

  const total = quiz.questions.length;
  const answered = Object.keys(answers).length;
  const score = submitted
    ? quiz.questions.filter((q) => answers[q.id] === q.correct).length
    : null;

  function handleSelect(questionId: string, answer: 'A' | 'B' | 'C' | 'D') {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode);
    setAnswers({});
    setSubmitted(false);
    setStarted(false);
  }

  function handleStart() {
    setStarted(true);
    setAnswers({});
    setSubmitted(false);
  }

  function handleSubmit() {
    setSubmitted(true);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    setStarted(true);
  }

  return (
    <section className="lesson-quiz">
      <div className="lesson-quiz__header">
        <h2 className="lesson-quiz__title">🎯 Quiz — {total} SAA-C03 Questions</h2>

        <div className="lesson-quiz__mode-picker">
          <button
            className={`quiz-mode-btn ${mode === 'instant' ? 'quiz-mode-btn--active' : ''}`}
            onClick={() => handleModeChange('instant')}
          >
            🅰️ Instant Feedback
          </button>
          <button
            className={`quiz-mode-btn ${mode === 'exam' ? 'quiz-mode-btn--active' : ''}`}
            onClick={() => handleModeChange('exam')}
          >
            🅱️ Exam Mode
          </button>
        </div>

        <p className="lesson-quiz__mode-desc">
          {mode === 'instant'
            ? 'Answer each question and see the explanation immediately after selecting.'
            : 'Answer all questions first, then submit to reveal all results at once.'}
        </p>
      </div>

      {!started ? (
        <div className="lesson-quiz__start">
          <div className="lesson-quiz__start-info">
            <span className="quiz-pill quiz-pill--beginner">🟢 Q1–Q3 Beginner</span>
            <span className="quiz-pill quiz-pill--intermediate">🟡 Q4–Q6 Intermediate</span>
            <span className="quiz-pill quiz-pill--hard">🔴 Q7–Q9 Hard</span>
            <span className="quiz-pill quiz-pill--expert">⚫ Q10 Expert</span>
          </div>
          <button className="quiz-start-btn" onClick={handleStart}>
            Start Quiz →
          </button>
        </div>
      ) : (
        <>
          {mode === 'exam' && !submitted && (
            <div className="quiz-progress">
              <div className="quiz-progress__bar">
                <div
                  className="quiz-progress__fill"
                  style={{ width: `${(answered / total) * 100}%` }}
                />
              </div>
              <span className="quiz-progress__text">{answered} / {total} answered</span>
            </div>
          )}

          <div className="quiz-questions">
            {quiz.questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                mode={mode}
                submitted={submitted}
                selected={answers[q.id] ?? null}
                onSelect={(ans) => handleSelect(q.id, ans)}
              />
            ))}
          </div>

          {mode === 'exam' && !submitted && (
            <button
              className="quiz-submit-btn"
              disabled={answered < total}
              onClick={handleSubmit}
            >
              {answered < total
                ? `Answer all questions to submit (${answered}/${total})`
                : 'Submit & See Results'}
            </button>
          )}

          {submitted && score !== null && (
            <div className={`quiz-score ${score >= 8 ? 'quiz-score--great' : score >= 6 ? 'quiz-score--ok' : 'quiz-score--retry'}`}>
              <div className="quiz-score__number">{score} / {total}</div>
              <div className="quiz-score__label">
                {score === total
                  ? '🏆 Perfect score! You nailed every question.'
                  : score >= 8
                  ? '🎉 Great job! You have a strong grasp of this topic.'
                  : score >= 6
                  ? '👍 Good effort — review the questions you missed.'
                  : '📚 Keep studying — re-read the lesson and retry.'}
              </div>
              <button className="quiz-retry-btn" onClick={handleRetry}>
                Retry Quiz
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
