# Netlify secrets scan fails: real values committed in .env.example

- Check: manual (Netlify deploy log, "Secrets scanning found N instance(s) of secrets")
- Last seen: 2026-10-11 (commit 8fcf28b "add roadmap checkpoint")

## What happened
Real values for MONGODB_URI, MONGODB_DB_NAME, VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID were pasted into `.env.example` instead of `.env`. Netlify compares every repo/build file with the site's environment variables and fails the build when one matches. It names MONGODB_USERNAME / MONGODB_PASSWORD too, because their values are inside the URI.

## How to fix
Put placeholders back in `.env.example` (real values live only in the gitignored `.env` and in Netlify's environment settings):

```
MONGODB_URI=mongodb+srv://replace-user:replace-password@replace-cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=aws_io_vn
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
JWT_SECRET=generate-with-openssl-rand-base64-48
ALLOWED_ORIGINS=
```

Once a password has been pushed, it is exposed for good: rotate the Atlas database user's password and update `.env` and Netlify. Don't silence the scan with SECRETS_SCAN_OMIT_PATHS for `.env.example`.
