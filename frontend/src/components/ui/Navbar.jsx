'use client'
import Link from 'next/link'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Deutsch<span>Lesen</span>
        </Link>

        <div className={styles.links}>
          <Link href="/stories" className={styles.link}>Stories</Link>
          {user && <Link href="/write" className={styles.link}>✏️ Write</Link>}
          {user && <Link href="/vocab"   className={styles.link}>Vocabulary</Link>}
          {user && <Link href="/profile" className={styles.link}>Profile</Link>}
        </div>

        <div className={styles.auth}>
          {user ? (
            <>
              <span className={styles.greeting}>Hallo, {user.name.split(' ')[0]}!</span>
              <button onClick={handleLogout} className={styles.btnOutline}>Logout</button>
            </>
          ) : (
            <>
              <Link href="/login"    className={styles.btnOutline}>Login</Link>
              <Link href="/register" className={styles.btnFill}>Start Learning</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
