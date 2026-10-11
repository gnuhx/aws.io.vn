// Public by design: a Google OAuth client ID identifies the app and is safe to ship in the bundle.
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
