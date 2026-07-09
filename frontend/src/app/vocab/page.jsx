'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/ui/Navbar'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function VocabPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [words,   setWords]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('All')

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
    if (user) loadWords()
  }, [user, authLoading])

  const loadWords = async () => {
    try {
      const data = await api.words.getSaved()
      setWords(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const levels  = ['All', ...new Set(words.map(w => w.vocabulary?.level).filter(Boolean))]
  const filtered = filter === 'All' ? words : words.filter(w => w.vocabulary?.level === filter)

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Vocabulary</h1>
              <p className={styles.sub}>{words.length} words saved</p>
            </div>
            <div className={styles.filters}>
              {levels.map(l => (
                <button
                  key={l}
                  className={`${styles.filterBtn} ${filter === l ? styles.active : ''}`}
                  onClick={() => setFilter(l)}
                >{l}</button>
              ))}
            </div>
          </div>

          {loading && <div className={styles.loading}>Loading your words...</div>}

          {!loading && filtered.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>📚</div>
              <h3>No saved words yet</h3>
              <p>Click any underlined word while reading a story to save it here.</p>
            </div>
          )}

          {!loading && (
            <div className={`${styles.grid} stagger`}>
              {filtered.map(sw => {
                const v = sw.vocabulary
                if (!v) return null
                return (
                  <div key={sw.id} className={`${styles.card} animate-fade-up`}>
                    <div className={styles.cardTop}>
                      <div className={styles.word}>{v.word}</div>
                      {v.level && <span className={`badge badge-${v.level.toLowerCase()}`}>{v.level}</span>}
                    </div>
                    {v.gender && <div className={styles.gender}>{v.gender}</div>}
                    <div className={styles.translation}>{v.translation}</div>
                    {v.type && <div className={styles.type}>{v.type}</div>}
                    {v.example && (
                      <div className={styles.example}>{v.example}</div>
                    )}
                    <div className={styles.savedDate}>
                      Saved {new Date(sw.savedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
