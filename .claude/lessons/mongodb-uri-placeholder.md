# MONGODB_URI is still the .env.example placeholder

- Check: `mongodb-uri-placeholder` (`npm run build`, src/backend/build/buildChecks.ts)
- Last seen: 2026-10-11T16:18:07.507Z

## What happened
Host, user or password are placeholder text, so every request that needs Atlas fails with 500 ("request failed").

## How to fix
In Atlas → Database → Connect → Drivers, copy the real `mongodb+srv://` string, fill in the database user and its (rotated) password, and set MONGODB_URI.
