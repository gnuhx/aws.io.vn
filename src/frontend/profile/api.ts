import type { PublicUser } from '../../shared/schemas/auth.ts'
import type { ChangePasswordInput, PreferencesInput, Profile, ProfileUpdateInput } from '../../shared/schemas/profile.ts'
import { request } from '../auth/api.ts'

type ProfileResponse = { user: PublicUser; profile: Profile }

export const profileApi = {
  get: () => request<ProfileResponse>('/api/profile'),
  update: (input: ProfileUpdateInput) => request<ProfileResponse>('/api/profile', { method: 'PUT', body: JSON.stringify(input) }),
  changePassword: (input: ChangePasswordInput) =>
    request<{ ok: true }>('/api/profile/password', { method: 'POST', body: JSON.stringify(input) }),
  /** Turning resumeReading off also deletes every saved reading position on the server. */
  setPreferences: (input: PreferencesInput) =>
    request<{ user: PublicUser }>('/api/profile/preferences', { method: 'PUT', body: JSON.stringify(input) }).then((body) => body.user),
}
