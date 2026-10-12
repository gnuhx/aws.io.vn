import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { z } from 'zod'
import type { PublicUser } from '../../../shared/schemas/auth.ts'
import { changePasswordSchema, PROFILE_LIMITS, profileUpdateSchema, type Profile } from '../../../shared/schemas/profile.ts'
import { ApiError } from '../../auth/api.ts'
import { useAuth } from '../../auth/authContext.ts'
import { useLogout } from '../../auth/useLogout.ts'
import { Avatar } from '../../components/Avatar/Avatar.tsx'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import { TagInput } from '../../components/TagInput/TagInput.tsx'
import { useToast } from '../../components/Toast/toastContext.ts'
import { profileApi } from '../../profile/api.ts'
import styles from './SettingsPage.module.css'

type FieldErrors = Record<string, string | undefined>
type ProfileForm = { name: string; hobbies: string[]; techStack: string[]; bio: string }

const TECH_SUGGESTIONS = ['AWS', 'TypeScript', 'React', 'Node.js', 'Python', 'Docker', 'Kubernetes', 'Terraform', 'MongoDB', 'PostgreSQL']
const HOBBY_SUGGESTIONS = ['Reading', 'Running', 'Gaming', 'Music', 'Photography', 'Travel', 'Chess', 'Cooking']

const firstErrors = (fields: Record<string, string[] | undefined>): FieldErrors =>
  Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0]]))

const toForm = (user: PublicUser, profile: Profile): ProfileForm =>
  ({ name: user.name ?? '', hobbies: profile.hobbies, techStack: profile.techStack, bio: profile.bio })

const sameForm = (a: ProfileForm, b: ProfileForm) => JSON.stringify(a) === JSON.stringify(b)

function useFailure() {
  const { markSignedOut } = useAuth()
  const toast = useToast()
  return useCallback((cause: unknown, fallback: string): FieldErrors => {
    if (cause instanceof ApiError && cause.status === 401) {
      markSignedOut()
      toast.error('Your session expired. Sign in again.')
      return {}
    }
    toast.error(cause instanceof ApiError ? cause.message : fallback)
    return cause instanceof ApiError ? firstErrors(cause.fields) : {}
  }, [markSignedOut, toast])
}

function ProfileSection({ user, initial, onSaved }: { user: PublicUser; initial: ProfileForm; onSaved: (user: PublicUser, profile: Profile) => void }) {
  const toast = useToast()
  const failed = useFailure()
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const dirty = !sameForm(form, initial)
  const set = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    // Same schema as the API: invalid input never leaves the browser.
    const parsed = profileUpdateSchema.safeParse(form)
    if (!parsed.success) {
      setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors))
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const saved = await profileApi.update(parsed.data)
      onSaved(saved.user, saved.profile)
      toast.success('Profile saved.')
    } catch (cause) {
      setErrors(failed(cause, 'Could not save your profile. Try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="profile" className={styles.card} aria-labelledby="profile-heading">
      <header className={styles.cardHeader}>
        <h2 id="profile-heading">Public profile</h2>
        <p>How you appear around the site.</p>
      </header>
      <form className={styles.form} onSubmit={(event) => { void submit(event) }} noValidate>
        <div className={styles.avatarRow}>
          <Avatar src={user.avatarUrl} name={form.name || user.name} email={user.email} size={72} />
          <div>
            <p className={styles.avatarTitle}>Profile picture</p>
            <p className={styles.hint}>
              {user.avatarUrl
                ? 'From your Google account. Change it in Google, then sign in with Google again.'
                : 'Sign in with Google to use your Google photo. Until then we show your initials.'}
            </p>
          </div>
        </div>

        <label htmlFor="settings-name">Display name</label>
        <input
          id="settings-name"
          value={form.name}
          maxLength={PROFILE_LIMITS.name}
          autoComplete="name"
          placeholder="e.g. Ada Lovelace"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'settings-name-error' : undefined}
          onChange={(event) => set('name', event.currentTarget.value)}
        />
        {errors.name && <p id="settings-name-error" className={styles.fieldError}>{errors.name}</p>}

        <label htmlFor="settings-email">Email</label>
        <input id="settings-email" value={user.email} readOnly aria-describedby="settings-email-hint" className={styles.readOnly} />
        <p id="settings-email-hint" className={styles.hint}>Your sign-in email. It can’t be changed yet.</p>

        <label htmlFor="settings-tech">Tech stack</label>
        <TagInput
          id="settings-tech"
          label="Tech stack"
          tags={form.techStack}
          onChange={(tags) => set('techStack', tags)}
          max={PROFILE_LIMITS.techStack}
          maxLength={PROFILE_LIMITS.tag}
          placeholder="Type a technology and press Enter"
          suggestions={TECH_SUGGESTIONS}
          describedBy={errors.techStack ? 'settings-tech-error' : 'settings-tech-hint'}
          invalid={Boolean(errors.techStack)}
        />
        {errors.techStack
          ? <p id="settings-tech-error" className={styles.fieldError}>{errors.techStack}</p>
          : <p id="settings-tech-hint" className={styles.hint}>{form.techStack.length}/{PROFILE_LIMITS.techStack} · tools and languages you work with.</p>}

        <label htmlFor="settings-hobbies">Hobbies</label>
        <TagInput
          id="settings-hobbies"
          label="Hobbies"
          tags={form.hobbies}
          onChange={(tags) => set('hobbies', tags)}
          max={PROFILE_LIMITS.hobbies}
          maxLength={PROFILE_LIMITS.tag}
          placeholder="Type a hobby and press Enter"
          suggestions={HOBBY_SUGGESTIONS}
          describedBy={errors.hobbies ? 'settings-hobbies-error' : 'settings-hobbies-hint'}
          invalid={Boolean(errors.hobbies)}
        />
        {errors.hobbies
          ? <p id="settings-hobbies-error" className={styles.fieldError}>{errors.hobbies}</p>
          : <p id="settings-hobbies-hint" className={styles.hint}>{form.hobbies.length}/{PROFILE_LIMITS.hobbies}</p>}

        <label htmlFor="settings-bio">Introduce yourself</label>
        <textarea
          id="settings-bio"
          rows={5}
          value={form.bio}
          maxLength={PROFILE_LIMITS.bio}
          placeholder="What are you learning, and why?"
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? 'settings-bio-error' : 'settings-bio-count'}
          onChange={(event) => set('bio', event.currentTarget.value)}
        />
        {errors.bio
          ? <p id="settings-bio-error" className={styles.fieldError}>{errors.bio}</p>
          : <p id="settings-bio-count" className={styles.hint}>{form.bio.length}/{PROFILE_LIMITS.bio} characters</p>}

        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={!dirty || saving} aria-busy={saving}>
            {saving && <Spinner />}{saving ? 'Saving…' : 'Save profile'}
          </button>
          {dirty && !saving && <button className={styles.secondary} type="button" onClick={() => { setForm(initial); setErrors({}) }}>Discard changes</button>}
        </div>
      </form>
    </section>
  )
}

function PasswordSection({ email, hasPassword, onPasswordSet }: { email: string; hasPassword: boolean; onPasswordSet: () => void }) {
  const toast = useToast()
  const failed = useFailure()
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const data = new FormData(formElement)
    const newPassword = String(data.get('newPassword') ?? '')
    if (newPassword !== String(data.get('confirmPassword') ?? '')) {
      setErrors({ confirmPassword: 'Passwords don’t match' })
      return
    }
    const parsed = changePasswordSchema.safeParse({
      newPassword,
      ...(hasPassword ? { currentPassword: String(data.get('currentPassword') ?? '') } : {}),
    })
    if (!parsed.success) {
      setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors))
      return
    }
    setErrors({})
    setSaving(true)
    try {
      await profileApi.changePassword(parsed.data)
      formElement.reset()
      toast.success(hasPassword ? 'Password changed.' : 'Password set. You can now also sign in with email.')
      onPasswordSet()
    } catch (cause) {
      setErrors(failed(cause, 'Could not change your password. Try again.'))
    } finally {
      setSaving(false)
    }
  }

  const field = (name: string, label: string, autoComplete: string, hint?: string) => (
    <>
      <label htmlFor={`settings-${name}`}>{label}</label>
      <input
        id={`settings-${name}`}
        name={name}
        type="password"
        autoComplete={autoComplete}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `settings-${name}-error` : hint ? `settings-${name}-hint` : undefined}
      />
      {errors[name]
        ? <p id={`settings-${name}-error`} className={styles.fieldError}>{errors[name]}</p>
        : hint && <p id={`settings-${name}-hint`} className={styles.hint}>{hint}</p>}
    </>
  )

  return (
    <section id="password" className={styles.card} aria-labelledby="password-heading">
      <header className={styles.cardHeader}>
        <h2 id="password-heading">{hasPassword ? 'Change password' : 'Set a password'}</h2>
        <p>{hasPassword ? 'Use a password you don’t use anywhere else.' : 'You sign in with Google. Add a password to also sign in with your email.'}</p>
      </header>
      <form className={styles.form} onSubmit={(event) => { void submit(event) }} noValidate>
        {/* Lets password managers attach the new password to the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        {hasPassword && field('currentPassword', 'Current password', 'current-password')}
        {field('newPassword', 'New password', 'new-password', '8–72 characters.')}
        {field('confirmPassword', 'Confirm new password', 'new-password')}
        <div className={styles.actions}>
          <button className={styles.primary} type="submit" disabled={saving} aria-busy={saving}>
            {saving && <Spinner />}{saving ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          </button>
        </div>
      </form>
    </section>
  )
}

export function SettingsPage() {
  const { updateUser } = useAuth()
  const { signOut, signingOut } = useLogout()
  const failed = useFailure()
  const [data, setData] = useState<{ user: PublicUser; profile: Profile } | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    let active = true
    profileApi.get()
      .then((result) => { if (active) { setData(result); setLoadError(false) } })
      .catch((cause: unknown) => {
        if (!active) return
        failed(cause, 'Could not load your settings.')
        setLoadError(true)
      })
    return () => { active = false }
  }, [reloads, failed])

  const saved = (user: PublicUser, profile: Profile) => {
    setData({ user, profile })
    updateUser(user)
  }

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Link to="/" className={styles.backLink}>← Back to learning paths</Link>
          {data && (
            <div className={styles.identity}>
              <Avatar src={data.user.avatarUrl} name={data.user.name} email={data.user.email} size={44} />
              <div>
                <strong>{data.user.name ?? data.user.email.split('@')[0]}</strong>
                <span>{data.user.email}</span>
              </div>
            </div>
          )}
          <nav aria-label="Settings sections">
            <a href="#profile">Public profile</a>
            <a href="#password">Password</a>
            <a href="#session">Session</a>
          </nav>
        </aside>

        <div className={styles.content}>
          <h1>Settings</h1>
          {!data && !loadError && <p className={styles.loading} role="status"><Spinner /> Loading your settings…</p>}
          {loadError && (
            <p className={styles.loadError} role="alert">
              Could not load your settings.
              <button type="button" onClick={() => { setLoadError(false); setReloads((count) => count + 1) }}>Retry</button>
            </p>
          )}
          {data && (
            <>
              {/* Keyed by the saved profile, so a save resets the form's "unsaved changes" baseline. */}
              <ProfileSection key={JSON.stringify(toForm(data.user, data.profile))} user={data.user} initial={toForm(data.user, data.profile)} onSaved={saved} />
              <PasswordSection
                email={data.user.email}
                hasPassword={data.user.hasPassword}
                onPasswordSet={() => saved({ ...data.user, hasPassword: true }, data.profile)}
              />
              <section id="session" className={styles.card} aria-labelledby="session-heading">
                <header className={styles.cardHeader}>
                  <h2 id="session-heading">Session</h2>
                  <p>Sign out of aws.io.vn on this device.</p>
                </header>
                <button type="button" className={styles.secondary} disabled={signingOut} aria-busy={signingOut} onClick={() => { void signOut() }}>
                  {signingOut && <Spinner />}{signingOut ? 'Signing out…' : 'Sign out'}
                </button>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
