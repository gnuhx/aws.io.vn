# Sign-in and roadmap progress setup

The site uses Clerk for website accounts and MongoDB Atlas for roadmap progress. Public roadmap browsing stays available without an account.

## Sign-in methods

In the Clerk Dashboard, configure the application to support:

- Email and password.
- Username and password, with both username and email enabled as sign-in identifiers.
- Google as a social sign-in provider.

The hosted `<SignIn />` and `<SignUp />` components display the methods enabled in that Clerk application. Google OAuth also needs the provider credentials and redirect URLs configured in Clerk/Google. Configure development, production, and any Netlify deploy-preview origins separately.

## Environment

Copy `.env.example` to `.env` for local development and replace the placeholders. Keep `.env` out of Git. Set the same values as server-side environment variables in Netlify, with the correct environment-specific Clerk keys and `CLERK_AUTHORIZED_PARTIES` allowlist. `VITE_CLERK_PUBLISHABLE_KEY` is intentionally public; `CLERK_SECRET_KEY` and `MONGODB_URI` must never use a `VITE_` prefix.

For each deploy preview, add its exact HTTPS origin to `CLERK_AUTHORIZED_PARTIES` for that deploy context. The server checks the Clerk session token's authorized party against this list.

Run the site and functions locally with the Netlify CLI (`npx netlify-cli dev`). The frontend-only `npm run dev` remains available, but progress API calls need the function runtime.

## Atlas

The function creates a `roadmap_progress` collection and the unique index on first use. The Atlas database user needs read/write access to the selected database, and Atlas network access must permit the Netlify runtime. Use a restricted network policy where the deployment plan supports fixed egress; do not add a broad public allowlist for production.

The records contain only `userId` (Clerk's verified subject), `roadmapId`, `itemId`, `status`, `createdAt`, and `updatedAt`. The API never accepts a user ID from the browser.

**Credential housekeeping:** the previous Atlas password was reported exposed. Rotate that database user's password in Atlas before putting a replacement into `.env` or Netlify. This repository setup does not read or reuse the ignored `atlas-credentials.env` file.

## Roadmap IDs

`src/shared/roadmapProgress.ts` is the checked-in progress manifest. IDs are assigned once by roadmap source order and are independent of checkbox wording and headings. When adding or removing a checklist item, update the manifest entry and its `sourceLine` lookup while preserving IDs for existing items.
