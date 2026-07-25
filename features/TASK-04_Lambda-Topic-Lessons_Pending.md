# TASK-04 — Lambda Topic Lessons (learning tree)

**Status: Pending (not started)**

Source: `lambda` topic block in [src/data/learningTrees.ts](../src/data/learningTrees.ts)
(no dedicated docs/ spec exists yet for this topic — inferred from the placeholder scaffold).

## Scope
A "Lambda" topic under the Stupid Dev Learns AWS tree, parallel to the completed IAM
topic, described in the roadmap example in `stupid-dev-learns-aws.md` (Networking/Deployment
tracks are similarly unstarted, but Lambda already has scaffolding in place).

## Current state
- Topic + 2 lesson slots exist in `src/data/learningTrees.ts` (`lambda-lesson-1`, `lambda-lesson-2`),
  explicitly labeled "Placeholder Lambda track so you can add serverless lessons next."
- Matching entries exist in `src/data/posts.ts` with placeholder body copy:
  "This lesson is ready for your content."
- No quiz entries exist for either lesson in `src/data/quizzes.ts`.
- No lesson content has been written (no docs/ file, unlike every IAM lesson).

## Note
This is unrelated to the separately-implemented `aws-lambda-ghost-kitchen` interactive
diagram post (see `src/pages/LambdaPage.tsx`), which is a different, already-shipped feature.
