# GOOGLE_CLIENT_ID is not a Google OAuth Client ID

- Check: `google-client-id-malformed-google-client-id` (`npm run build`, src/backend/build/buildChecks.ts)
- Last seen: 2026-10-11T16:08:24.707Z

## What happened
GOOGLE_CLIENT_ID is still the `.env.example` placeholder, so Google answers "The OAuth client was not found" (401 invalid_client).

## How to fix
Copy the Client ID (not the client secret) from Google Cloud Console → Credentials and set GOOGLE_CLIENT_ID to exactly that value.
