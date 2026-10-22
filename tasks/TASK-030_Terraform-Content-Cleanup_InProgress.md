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
Audit of `content/Terraform/` (330 lesson `.md` files, ~122k words, 28 MB in total). Source: Packt's *Mastering Terraform* GitHub repo (MIT, see TASK-029).

## Scope
- In:
  - Rename folder `content/Terraform` → `content/terraform` so the URL matches the other lowercase topics (`/terraform/...`).
  - Close the lesson-number gap in `Chapter 01/1. Understanding Terraform Architecture/`.
  - Section numbering starts at `0. Chapter Intro` where a chapter intro exists (Ch17, Ch18 shifted 1..5 → 0..4).
  - Add the missing number prefix to unnumbered lesson files.
  - Strip the `N. ` prefix from lesson H1s (titles come from the H1; numbering comes from file names).
  - Convert tab-indented code to fenced blocks and tag every fence with a language.
  - Fix markdown escapes inside code (`client\_id`, `CMD \[`).
  - Fix broken image references.
  - Remove `*.graffle` image sources and `terraform.tfstate*` / `terraform.tfstate.d/` from `Code Files/`.
  - Replace the real-looking Azure object IDs in `Code Files/Chapter11/src/terraform/infra/terraform.tfvars` with placeholders.
  - `.gitignore` rules so tfstate and `.terraform/` cannot be committed.
- Out: Rewriting prose (TASK-029), loader changes (TASK-031). Keeping `Code Files/**/wwwroot` (bootstrap, open-iconic): the sample .NET apps need them to run; TASK-031 keeps them off the site via the glob instead.

## Acceptance criteria
- [x] Every chapter has sections numbered with no gaps, and every lesson file has a numeric prefix with no gaps.
- [x] No tab-indented code blocks remain; every fenced block has a language (hcl 314, yaml 52, bash 26, text 12, csharp 2, json 2, dockerfile 1+5, go 1, ini 1, javascript 1).
- [x] No `.tfstate` or `.graffle` files remain; folder is 18 MB (was 28 MB).
- [x] No non-placeholder subscription, tenant or object IDs remain (`099720109477` is Canonical's public AMI owner, kept).
- [x] All image references resolve to existing files (checked case-sensitively).
- [ ] Spot-check rendered code blocks per chapter in the dev server (needs TASK-031 to render).

## Test cases
| # | Input / action | Expected result | Type |
|---|---|---|---|
| 1 | Numbering audit script | No gaps reported | script |
| 2 | Image-reference audit script (inline + reference-style) | 0 broken references | script |
| 3 | Secret / ID scan over `content/terraform` | No findings | script |

## Notes
- 2026-10-22 done:
  - Ch01 lesson 3 ("Extensibility"/Providers) is **missing upstream too**: the section summary mentions Providers and `images/Terraform-Providers-AWS.png` / `-Azure.png` are unused. Renumbered `4. Modularity` → 3 and `5. Section Summary` → 4. A new Extensibility lesson can be written later as `3. Extensibility.md` (shift Modularity/Summary again).
  - Ch06 has no Chapter Intro upstream; its sections stay 1..4. The loader must not assume section 0 exists.
  - Renamed `Ch04/0. Chapter Intro/Chapter Intro.md`, `Ch16/0. Chapter Intro/Chapter Intro.md`, `Ch16/5. Chapter Summary/Chapter Summary.md` to `1. …`.
  - Removed leading blank lines in `Ch01/…/2. INIT.md` and `Ch03/…/4. Configuring DNS Records.md`.
  - Code fencing: 211 indented blocks + ~200 bare fences tagged by a heuristic converter (kept in the session scratchpad, not the repo). One indented block after a list item (Ch10 `2. Packer.md`) previously rendered as list text; now a code block.
  - Image fixes: Ch10 `Azure-NSG-FrontEnd/BackEnd.png` → `Frontend/Backend` (case); Ch13 Overview had a duplicate `[image-1]` pointing at a non-existent Azure diagram — removed.
  - Upstream `LICENSE` copied to `content/terraform/LICENSE`.
