# Build spec: Lazier project page + privacy policy

## Context

This is a React TypeScript site using React Router and plain CSS (no Tailwind, no UI library).
Each page lives in `src/pages/PageName.tsx` with a `PageName.css` sibling.
Routes are registered in `src/App.tsx`.

## What to build

Two new pages:

1. `src/pages/LazierPage.tsx` + `LazierPage.css`  
   Route: `/projects/lazier`

2. `src/pages/LazierPrivacyPage.tsx` + `LazierPrivacyPage.css`  
   Route: `/projects/lazier/privacy`

Register both routes in `src/App.tsx`.

---

## Page 1 — LazierPage (project showcase)

### Layout (top to bottom)

**Hero section**
- App name: `Lazier`
- Tagline: `Build good habits, one day at a time.`
- Two buttons side by side:
  - `Get it on Google Play` — link to `#` (placeholder, update later)
  - `Privacy Policy` — internal link to `/projects/lazier/privacy`

**Features section** — heading: `Features`
- Grid of 4 feature cards, each with an emoji icon + title + one-line description:
  - 📋 `Habit tracking` — Create and manage unlimited habits with ease.
  - 🔔 `Reminders` — Optional daily reminders so you never miss a day.
  - 📱 `Works offline` — All data stored locally on your device by default.
  - ☁️ `Optional cloud sync` — Sign in to sync your habits across devices.

**About section** — heading: `About`
- Short paragraph:  
  `Lazier is a no-nonsense habit tracker built for Android. No ads, no subscriptions, no trackers. Just you and your habits. Your data stays on your device unless you choose to sync.`

**Footer note** (small text, muted color):
- `© 2025 Gnuh Le · `
- link to `/projects/lazier/privacy` with text `Privacy Policy`

### Style guidelines (match existing site)
- Use the same font, background, and card style as `PostCard.css` / `HomePage.css`
- Keep it minimal — mostly white/light background, dark text
- Buttons: solid primary color for Play Store, outline/ghost for Privacy Policy
- Feature cards: light border, slight border-radius, padding, no shadow
- Max content width ~800px, centered

---

## Page 2 — LazierPrivacyPage (privacy policy)

### Layout

Simple long-form page. Heading + sections. No sidebar.

**Page title:** `Lazier – Privacy Policy`  
**Last updated:** `May 5, 2025`

**Sections (render as `<h2>` + `<p>` or `<ul>`):**

1. **Overview**  
   Lazier ("the app") is an Android habit-tracking app developed by Gnuh Le. This policy explains what data the app collects and how it is used.

2. **Data collected**  
   - The app stores habit data (habit names, descriptions, reminder times, completion logs) locally on your device by default.
   - If you choose to create an account, the app also collects your username and password (sent over HTTPS) and may upload your habit data to our servers for cloud sync.
   - The app does not collect any data if you use it without an account.

3. **How we use your data**  
   - Account credentials are used only for authentication.
   - Habit data uploaded during sync is stored solely to provide the sync feature.
   - We do not sell, share, or use your data for advertising or analytics.

4. **Third-party services**  
   The app does not include any third-party advertising, analytics, or crash reporting SDKs.

5. **Data security**  
   All communication between the app and our servers is encrypted using HTTPS. Passwords are not stored in plain text.

6. **Your rights**  
   You can stop cloud sync at any time by signing out of your account. To request deletion of your account and associated data, contact us at the email below.

7. **Contact**  
   Email: `huyhunglenguyen@gmail.com`

8. **Changes to this policy**  
   We may update this policy. The "last updated" date at the top reflects the most recent revision.

### Style guidelines
- Single column, readable line width (~65ch)
- `h1` for page title, `h2` for each section
- Small muted "Last updated" line below the title
- Match the typography and spacing from existing pages
- Add a back link at the top: `← Back to Lazier` pointing to `/projects/lazier`
