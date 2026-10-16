# Accessible name loses the space before a visually hidden span

- Check: manual (`npx vitest run src/frontend/...`)
- Last seen: 2026-10-16

## What happened
A button rendered `Mark all read<span class="visuallyHidden"> in Module 7</span>`. Testing Library's `getByRole('button', { name: 'Mark all read in Module 7' })` found nothing: the accessible-name computation trims text inside the child span, so the leading space is dropped and the name becomes `Mark all readin Module 7`.

## How to fix
Put the space outside the hidden span: `Mark all read{' '}<span className={styles.visuallyHidden}>in Module 7</span>`.
