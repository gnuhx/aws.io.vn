# TASK-03 — IAM Lesson Series (9 lessons)

**Status: Done**

Source doc: [docs/stupid-dev-learns-aws/IAM/IAM.md](../docs/stupid-dev-learns-aws/IAM/IAM.md)

## Scope
9 planned IAM lessons under the "Stupid Dev Learns AWS" learning tree:
1. Secure your Root Account
2. Use IAM Policy Documents to Control Access Rights
3. Managing IAM Users and AWS Resource Access
4. Practice: Policy Management, Users & Groups — Part 1
5. Practice: Policy Management, Users & Groups — Part 2
6. Practice: Policy Management, Users & Groups — Part 3
7. Practice Creating and Assuming Roles — Part 1
8. Practice Creating and Assuming Roles — Part 2
9. Practice Creating and Assuming Roles — Part 3

## Evidence
- All 9 have full-length markdown source docs in `docs/stupid-dev-learns-aws/IAM/`
  (250–611 lines each, fully written, not stubs).
- All 9 are wired into `src/data/posts.ts` as real post entries (`iam-secure-root-account`,
  `iam-policy-documents`, `iam-users-and-permanent-credentials`, `iam-policy-management-part-1/2/3`,
  `iam-assume-roles-part-1/2/3`).
- All 9 have a quiz in `src/data/quizzes.ts` keyed to the matching `postId`.
- All 9 are listed as lessons under the `iam` topic in `src/data/learningTrees.ts`.

## Notes
Fully complete end-to-end: written content → post data → quiz → learning-tree navigation.
