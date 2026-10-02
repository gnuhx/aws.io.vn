# Quiz schema

The shape of generated quizzes. Shared by the web app and Netlify Functions via `shared/schemas/quiz.ts` (created in Module 2).
Every generated quiz is validated against it; on failure, generation retries up to 2 times with the validation error.

## Zod schema (sketch)

```ts
export const QuestionSchema = z.object({
  id: z.string(),
  stem: z.string().min(20),
  choices: z.array(z.object({ id: z.string(), text: z.string() })).length(4),
  answer: z.array(z.string()).min(1),           // 1 answer (single) or several (multi)
  explanation: z.string().min(20),
  topic: z.string(),
  domain: z.string().optional(),                // SAA-C03 domain
  difficulty: z.enum(["easy", "medium", "hard"]),
  sources: z.array(z.string().url()).min(1),    // lesson links
});
export const QuizSchema = z.object({
  id: z.string(), title: z.string(), questions: z.array(QuestionSchema).min(1),
});
```

## Examples

_Add 2 examples in Module 2 (one single-answer, one multi-answer)._
