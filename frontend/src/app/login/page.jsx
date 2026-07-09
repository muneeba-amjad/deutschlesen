'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { useAuth } from '@/lib/AuthContext'
import styles from '../auth.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const router    = useRouter()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await login(form.email, form.password)
      router.push('/stories')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className={`${styles.card} animate-fade-up`}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Willkommen zurück</h1>
            <p className={styles.subtitle}>Log in to continue your German journey</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                type="email" required
                className={styles.input}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input
                type="password" required
                className={styles.input}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <p className={styles.switchText}>
            No account? <Link href="/register" className={styles.switchLink}>Create one free</Link>
          </p>
        </div>
      </div>
    </>
  )
}
