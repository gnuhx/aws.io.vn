import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { z } from 'zod'
import { loginSchema, registerSchema } from '../../../shared/schemas/auth.ts'
import { ApiError } from '../../auth/api.ts'
import { useAuth } from '../../auth/authContext.ts'
import { GoogleButton } from '../../auth/GoogleButton.tsx'
import { googleClientId } from '../../auth/config.ts'
import { safeRedirect } from '../../auth/redirect.ts'
import styles from './AuthPage.module.css'

type FieldErrors = Partial<Record<'email' | 'password', string>>

const copy = {
  login: {
    title: 'Sign in to save your progress',
    submit: 'Sign in',
    busy: 'Signing in…',
    switchText: 'New here?',
    switchLink: 'Create an account',
  },
  register: {
    title: 'Create your learning account',
    submit: 'Create account',
    busy: 'Creating account…',
    switchText: 'Already have an account?',
    switchLink: 'Sign in',
  },
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { status, login, register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = safeRedirect(searchParams.get('redirect'))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const text = copy[mode]
  const otherPath = mode === 'login' ? '/register' : '/login'
  const switchTo = searchParams.has('redirect') ? `${otherPath}?redirect=${encodeURIComponent(redirect)}` : otherPath

  if (status === 'signed-in' && !busy) return <Navigate to={redirect} replace />

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setFormError('')
    try {
      await action()
      navigate(redirect, { replace: true })
    } catch (cause) {
      if (cause instanceof ApiError) {
        setFieldErrors({ email: cause.fields.email?.[0], password: cause.fields.password?.[0] })
        setFormError(cause.message)
      } else {
        setFormError('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const input = { email: form.get('email'), password: form.get('password') }
    // Same schema as the API: invalid input never leaves the browser.
    const parsed = (mode === 'login' ? loginSchema : registerSchema).safeParse(input)
    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error)
      setFieldErrors({ email: errors.email?.[0], password: errors.password?.[0] })
      return
    }
    setFieldErrors({})
    void run(() => (mode === 'login' ? login(parsed.data) : register(parsed.data)))
  }

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <Link to="/" className={styles.backLink}>← Back to learning paths</Link>
        <h1>{text.title}</h1>
        <p>Use your email and password{googleClientId ? ', or continue with Google' : ''}.</p>
      </div>
      <section className={styles.card}>
        {googleClientId && (
          <>
            <div className={styles.google}>
              <GoogleButton
                onCredential={(credential) => { void run(() => loginWithGoogle(credential)) }}
                onError={() => setFormError('Google sign-in was cancelled or failed. Try again.')}
              />
            </div>
            <p className={styles.divider}><span>or</span></p>
          </>
        )}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
          />
          {fieldErrors.email && <p id="auth-email-error" className={styles.fieldError}>{fieldErrors.email}</p>}

          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby={fieldErrors.password ? 'auth-password-error' : mode === 'register' ? 'auth-password-hint' : undefined}
          />
          {fieldErrors.password
            ? <p id="auth-password-error" className={styles.fieldError}>{fieldErrors.password}</p>
            : mode === 'register' && <p id="auth-password-hint" className={styles.hint}>8–72 characters.</p>}

          {formError && <p className={styles.formError} role="alert">{formError}</p>}
          <button className={styles.submit} type="submit" disabled={busy}>{busy ? text.busy : text.submit}</button>
        </form>
        <p className={styles.switch}>{text.switchText} <Link to={switchTo}>{text.switchLink}</Link></p>
      </section>
    </main>
  )
}
