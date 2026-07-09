'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import { api } from '@/lib/api'
import styles from './page.module.css'

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1']

export default function StoriesPage() {
  const searchParams = useSearchParams()
  const [stories,  setStories]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [level,    setLevel]    = useState(searchParams.get('level') || 'All')
  const [today,    setToday]    = useState(null)

  useEffect(() => {
    loadStories()
    loadToday()
  }, [level])

  const loadToday = async () => {
    try {
      const data = await api.stories.getToday()
      setToday(data)
    } catch { /* no today story yet */ }
  }

  const loadStories = async () => {
    setLoading(true); setError(null)
    try {
      const params = level !== 'All' ? `?level=${level}` : ''
      const data   = await api.stories.getAll(params)
      setStories(data.stories || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">

          {/* Today's story banner */}
          {today && (
            <Link href={`/stories/${today.id}`} className={styles.todayBanner}>
              <div className={styles.todayLeft}>
                <span className={styles.todayLabel}>📖 Today's Story</span>
                <h2 className={styles.todayTitle}>{today.title}</h2>
              </div>
              <div className={styles.todayRight}>
                <span className={`badge badge-${today.level.toLowerCase()}`}>{today.level}</span>
                <span className={styles.readNow}>Read now →</span>
              </div>
            </Link>
          )}

          {/* Level filter */}
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>All Stories</h1>
            <div className={styles.filters}>
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`${styles.filterBtn} ${level === l ? styles.active : ''}`}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Stories grid */}
          {loading && (
            <div className={styles.loadingGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          )}

          {error && (
            <div className={styles.error}>
              ⚠️ Could not load stories. Is your backend running on localhost:3000?
            </div>
          )}

          {!loading && !error && (
            <div className={`${styles.grid} stagger`}>
              {stories.map(s => (
                <Link key={s.id} href={`/stories/${s.id}`} className={`${styles.card} animate-fade-up`}>
                  <div className={styles.cardTop}>
                    <span className={`badge badge-${s.level.toLowerCase()}`}>{s.level}</span>
                    <span className={styles.source}>
                      {s.source === 'AI_GENERATED' ? '✨ AI' : '📰 News'}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{s.title}</h3>
                  <p className={styles.cardMeta}>{s.topic}</p>
                  <div className={styles.cardFooter}>
                    <span>{s._count?.paragraphs || 0} paragraphs</span>
                    <span>{s._count?.vocabulary || 0} vocab words</span>
                  </div>
                </Link>
              ))}

              {stories.length === 0 && (
                <div className={styles.empty}>
                  No stories for this level yet. Check back tomorrow!
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
