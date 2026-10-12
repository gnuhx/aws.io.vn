import { Link } from 'react-router'
import { useAuth } from '../../auth/authContext.ts'
import { useLogout } from '../../auth/useLogout.ts'
import { Spinner } from '../../components/Spinner/Spinner.tsx'
import styles from './AccountPage.module.css'

export function AccountPage() {
  const { user } = useAuth()
  const { signOut, signingOut } = useLogout()

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link to="/" className={styles.backLink}>← Back to learning paths</Link>
        <h1>Your account</h1>
        <dl>
          {user?.name && <><dt>Name</dt><dd>{user.name}</dd></>}
          <dt>Email</dt><dd>{user?.email}</dd>
        </dl>
        <button type="button" className={styles.signOut} disabled={signingOut} aria-busy={signingOut} onClick={() => { void signOut() }}>
          {signingOut && <Spinner />}{signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </section>
    </main>
  )
}
