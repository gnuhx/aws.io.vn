import { SignIn, SignUp } from '@clerk/react'
import { Link } from 'react-router'
import styles from './SignInPage.module.css'

const clerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

export function SignInPage({ mode = 'sign-in' }: { mode?: 'sign-in' | 'sign-up' }) {
  if (!clerkConfigured) {
    return (
      <main className={styles.page}>
        <section className={styles.notice}>
          <Link to="/" className={styles.backLink}>← Back to learning paths</Link>
          <h1>Account sign-in isn’t configured yet</h1>
          <p>Add the Clerk publishable key and enable username/email + password and Google in the Clerk dashboard. The roadmaps remain available to read without an account.</p>
        </section>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <Link to="/" className={styles.backLink}>← Back to learning paths</Link>
        <h1>{mode === 'sign-in' ? 'Sign in to save your progress' : 'Create your learning account'}</h1>
        <p>Use your username or email and password, or continue with Google.</p>
      </div>
      <div className={styles.form}>
        {mode === 'sign-in'
          ? <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
          : <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/" />}
      </div>
    </main>
  )
}
