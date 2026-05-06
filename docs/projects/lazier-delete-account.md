Build a static React page at src/pages/LazierDeleteAccountPage.tsx + LazierDeleteAccountPage.css
Route: /lazier/delete-account
Register the route in src/App.tsx

This page must meet Google Play account deletion policy requirements.

--- PAGE CONTENT ---

Title: Delete Your Lazier Account

Intro paragraph:
"Lazier is a habit tracking app developed by Gnuh Le. This page explains how to request deletion of your account and all associated data."

Section: "How to delete your account"
Two options as a numbered list:

Option 1 — In the app (immediate):
1. Open Lazier on your Android device.
2. Go to the Profile tab.
3. Tap "Delete account".
4. Enter your password to confirm.
5. Your account and all data are deleted immediately.

Option 2 — By email (if you no longer have the app):
Send an email to huyhunglenguyen@gmail.com with subject "Delete my Lazier account"
and include your username. We will process the request within 7 days.

Section: "What gets deleted"
Bullet list:
- Your username and password hash — deleted permanently from our servers.
- All synced habit data (habit names, descriptions, reminder settings) — deleted permanently.
- All habit completion logs — deleted permanently.
- All local data on your device — deleted immediately when you use the in-app option.

Section: "What is retained"
- No data is retained after deletion. We do not keep backups of deleted accounts.

Section: "Contact"
For questions: huyhunglenguyen@gmail.com

--- STYLE ---
Single column, max-width 680px, centered.
Match the font, background, and text style of the existing pages (HomePage.tsx).
h1 for page title, h2 for each section.
Small muted subtitle under the title: "Lazier by Gnuh Le"
Add a link at the top: "← Back to Lazier app page" pointing to /lazier


Final result:
https://aws.io.vn/projects/lazier/delete-account