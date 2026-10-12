import { OAuth2Client } from 'google-auth-library'

export type GoogleIdentity = { sub: string; email: string; emailVerified: boolean; name: string | null; picture: string | null }

export class InvalidGoogleTokenError extends Error {}

const client = new OAuth2Client()

/**
 * Verifies a Google Identity Services ID token (signature, expiry, issuer and audience)
 * and returns only claims taken from the verified token.
 */
export async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<GoogleIdentity> {
  let payload
  try {
    const ticket = await client.verifyIdToken({ idToken, audience: clientId })
    payload = ticket.getPayload()
  } catch {
    throw new InvalidGoogleTokenError()
  }
  if (!payload?.sub || !payload.email) throw new InvalidGoogleTokenError()
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name ?? null,
    // Only https URLs are kept: the avatar is rendered as an <img src> on our pages.
    picture: payload.picture?.startsWith('https://') ? payload.picture : null,
  }
}
