'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { useAuth } from '@/lib/AuthContext'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const router       = useRouter()
  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      await register(form.name, form.email, form.password)
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
            <h1 className={styles.title}>Start Learning German</h1>
            <p className={styles.subtitle}>Free account — daily stories from A1 to C1</p>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Your Name</label>
              <input
                type="text" required
                className={styles.input}
                placeholder="Muneeba"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
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
                placeholder="At least 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account? <Link href="/login" className={styles.switchLink}>Log in</Link>
          </p>
        </div>
      </div>
    </>
  )
}
