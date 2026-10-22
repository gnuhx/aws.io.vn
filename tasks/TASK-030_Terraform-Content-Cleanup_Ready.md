---
id: TASK-030
type: chore
module: none
decisions: []
created: 2026-10-22
---

# TASK-030: Clean up Terraform content files

## Goal
The Terraform content folder is consistent, small and safe to commit, so the loader (TASK-031) can rely on its layout.

## Context
Audit of `content/Terraform/` (330 lesson `.md` files, ~122k words, 28 MB in total, mostly `Code Files/`).

## Scope
- In:
  - Rename folder `content/Terraform` → `content/terraform` so the URL matches the other lowercase topics (`/terraform/...`).
  - Add the missing lesson `Chapter 01/1. Understanding Terraform Architecture/3. *.md` (likely "Extensibility"), or renumber 4→3, 5→4.
  - Normalize section numbering so every chapter starts at `0. Chapter Intro`: Ch06 (add a Chapter Intro), Ch17, Ch18 (shift 1..5 → 0..4).
  - Add the missing number prefix: `Ch04/0. Chapter Intro/Chapter Intro.md`, `Ch16/0. Chapter Intro/Chapter Intro.md`, `Ch16/5. Chapter Summary/Chapter Summary.md`.
  - Convert ~2,500 tab-indented code lines to fenced blocks with a language (`hcl`, `bash`, `yaml`, `json`, `dockerfile`) using a one-off script, then spot-check each chapter.
  - Remove `*.graffle` image sources (205 files): only the `.png` files are rendered.
  - In `Code Files/`: delete `terraform.tfstate*`, `terraform.tfstate.d/`, `.terraform/`, .NET `bin/obj`, and the vendored open-iconic fonts/READMEs. Replace real-looking IDs in `*.tfvars` (Azure object IDs `466a3a08-…`, `43072cf2-…`) with placeholders.
  - Add `.gitignore` rules so tfstate and `.terraform/` cannot be committed again.
- Out: Rewriting prose (TASK-029), loader changes (TASK-031).

## Acceptance criteria
- [ ] Every chapter has sections numbered `0..N` with no gaps, and every lesson file has a numeric prefix with no gaps.
- [ ] `grep -rc $'^\t' --include=*.md` reports no indented code blocks; every fenced block has a language.
- [ ] No `.tfstate`, `.graffle`, `bin/`, `obj/` or font files remain; folder size is well under the current 28 MB.
- [ ] No non-placeholder subscription, tenant, object or account IDs remain (checked with the secret scanner from TASK-024 or `gitleaks`).
- [ ] All image references still resolve to existing files.

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Numbering audit script | No gaps reported | script |
| 2 | Image-reference audit script | 0 broken references | script |
| 3 | Secret scan over `content/terraform` | No findings | script |

## Notes
Keep the `images/` folder per chapter; reference-style links (`![x][image-1]` + `[image-1]: ../images/x.png`) are fine for remark and handled in TASK-031.
