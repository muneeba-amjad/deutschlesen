'use client'
import { useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import styles from './WordPopup.module.css'

export default function WordPopup({ wordData, position, onClose, onSaved, savedWords }) {
  const { user } = useAuth()
  const ref = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  if (!wordData) return null

  const isSaved = savedWords?.has(wordData.id || wordData.word)

  const handleSave = async () => {
    if (!user) return alert('Please log in to save words!')
    if (!wordData.id) return // can't save generic lookups without a vocabulary ID
    try {
      await api.words.save(wordData.id)
      onSaved?.(wordData.id || wordData.word)
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  // Smart popup positioning — never go off-screen
  const style = {
    position: 'fixed',
    left: Math.min(position.x + 12, window.innerWidth  - 290),
    top:  Math.min(position.y + 12, window.innerHeight - 300),
    zIndex: 1000,
  }

  return (
    <div ref={ref} className={`${styles.popup} animate-pop-in`} style={style}>
      {/* Word + pronunciation */}
      <div className={styles.header}>
        <div className={styles.word}>{wordData.word}</div>
        {wordData.gender && (
          <div className={styles.gender}>{wordData.gender}</div>
        )}
      </div>

      {wordData.pronunciation && (
        <div className={styles.pronun}>{wordData.pronunciation}</div>
      )}

      <hr className={styles.divider} />

      {/* Translation */}
      <div className={styles.translation}>{wordData.translation}</div>

      {/* Grammar info */}
      <div className={styles.meta}>
        {wordData.type && (
          <span className={styles.chip}>{wordData.type}</span>
        )}
        {wordData.level && (
          <span className={`${styles.chip} ${styles.chipLevel}`}>{wordData.level}</span>
        )}
      </div>

      {/* Example sentence */}
      {wordData.example && (
        <div className={styles.example}>
          <div className={styles.exampleLabel}>Example</div>
          <div className={styles.exampleText}>{wordData.example}</div>
        </div>
      )}

      {/* Save button */}
      {wordData.id && (
        <button
          onClick={handleSave}
          disabled={isSaved}
          className={`${styles.saveBtn} ${isSaved ? styles.saved : ''}`}
        >
          {isSaved ? '✓ Saved to vocabulary' : '+ Save word'}
        </button>
      )}
    </div>
  )
}
