'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import styles from './page.module.css'

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth()
  const router  = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user) loadProfile()
  }, [user, authLoading])

  const loadProfile = async () => {
    try {
      const data = await api.user.profile()
      setProfile(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (loading || authLoading) return (
    <>
      <Navbar />
      <div className={styles.loading}>Loading profile...</div>
    </>
  )

  const streak = profile?.streaks

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={`${styles.profileCard} animate-fade-up`}>

            {/* Avatar */}
            <div className={styles.avatar}>
              {profile?.name?.[0]?.toUpperCase()}
            </div>
            <h1 className={styles.name}>{profile?.name}</h1>
            <p className={styles.email}>{profile?.email}</p>
            <p className={styles.joined}>
              Member since {new Date(profile?.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <div className={styles.statNum}>{streak?.currentDays || 0}</div>
                <div className={styles.statLabel}>Day streak 🔥</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{streak?.longestDays || 0}</div>
                <div className={styles.statLabel}>Longest streak</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{profile?._count?.readStories || 0}</div>
                <div className={styles.statLabel}>Stories read</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statNum}>{profile?._count?.savedWords || 0}</div>
                <div className={styles.statLabel}>Words saved</div>
              </div>
            </div>

            {/* Progress toward C1 */}
            <div className={styles.goalCard}>
              <div className={styles.goalHeader}>
                <span className={styles.goalTitle}>Your Goal: German C1</span>
                <span className={styles.goalEmoji}>🇩🇪</span>
              </div>
              <div className={styles.goalSub}>
                Keep reading daily stories. You can do it!!!
              </div>
              <div className={styles.levelPath}>
                {['A1','A2','B1','B2','C1'].map((l, i) => (
                  <div key={l} className={styles.levelStep}>
                    <div className={`${styles.levelDot} ${i < 2 ? styles.done : i === 2 ? styles.current : ''}`}>
                      {i < 2 ? '✓' : l}
                    </div>
                    {i < 4 && <div className={`${styles.levelLine} ${i < 1 ? styles.done : ''}`} />}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <Link href="/stories" className={styles.readBtn}>📖 Read today's story</Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Log out</button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
