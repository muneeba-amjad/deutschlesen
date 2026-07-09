'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './GermanNarrator.module.css'

// ─────────────────────────────────────────────────────────────────
// GermanNarrator — Web Speech API narrator with German accent
// Props:
//   paragraphs: [{ id, germanText, order }]
//   storyTitle: string
// ─────────────────────────────────────────────────────────────────

export default function GermanNarrator({ paragraphs = [], storyTitle = '' }) {
  const [isPlaying,      setIsPlaying]      = useState(false)
  const [isPaused,       setIsPaused]       = useState(false)
  const [currentParaIdx, setCurrentParaIdx] = useState(0)
  const [currentWord,    setCurrentWord]    = useState(null)
  const [speed,          setSpeed]          = useState(0.85)
  const [pitch,          setPitch]          = useState(1.0)
  const [voices,         setVoices]         = useState([])
  const [selectedVoice,  setSelectedVoice]  = useState(null)
  const [isSupported,    setIsSupported]    = useState(true)
  const [showSettings,   setShowSettings]   = useState(false)
  const [progress,       setProgress]       = useState(0)

  const utteranceRef = useRef(null)
  const synthRef     = useRef(null)

  // ── Load voices ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.speechSynthesis) { setIsSupported(false); return }

    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      const all     = window.speechSynthesis.getVoices()
      // Prefer German voices, fall back to any voice
      const german  = all.filter(v => v.lang.startsWith('de'))
      const english = all.filter(v => v.lang.startsWith('en'))
      const list    = german.length > 0 ? german : english

      setVoices(list)

      // Auto-select best German voice
      const preferred = (
        all.find(v => v.name.includes('Google Deutsch'))    ||
        all.find(v => v.name.includes('Microsoft Hedda'))   ||
        all.find(v => v.name.includes('Microsoft Stefan'))  ||
        all.find(v => v.lang === 'de-DE')                   ||
        all.find(v => v.lang.startsWith('de'))              ||
        list[0]
      )
      if (preferred) setSelectedVoice(preferred)
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => { window.speechSynthesis.cancel() }
  }, [])

  // ── Track progress ────────────────────────────────────────────
  useEffect(() => {
    if (paragraphs.length === 0) return
    setProgress(Math.round((currentParaIdx / paragraphs.length) * 100))
  }, [currentParaIdx, paragraphs.length])

  // ── Speak a single paragraph ──────────────────────────────────
  const speakParagraph = useCallback((idx) => {
    if (!synthRef.current || idx >= paragraphs.length) {
      setIsPlaying(false)
      setCurrentParaIdx(0)
      setCurrentWord(null)
      setProgress(100)
      return
    }

    const text = paragraphs[idx].germanText
    const utterance = new SpeechSynthesisUtterance(text)

    if (selectedVoice) utterance.voice = selectedVoice
    utterance.lang  = 'de-DE'
    utterance.rate  = speed
    utterance.pitch = pitch

    // Highlight word as it's spoken
    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        const word = text.substring(e.charIndex, e.charIndex + e.charLength)
        setCurrentWord({ word, paraIdx: idx })
      }
    }

    utterance.onend = () => {
      setCurrentWord(null)
      setCurrentParaIdx(idx + 1)
      // Auto-advance to next paragraph
      setTimeout(() => speakParagraph(idx + 1), 500)
    }

    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        console.error('Speech error:', e.error)
        setIsPlaying(false)
      }
    }

    utteranceRef.current = utterance
    synthRef.current.speak(utterance)
  }, [paragraphs, selectedVoice, speed, pitch])

  // ── Controls ──────────────────────────────────────────────────
  const play = () => {
    if (!synthRef.current) return
    if (isPaused) {
      synthRef.current.resume()
      setIsPaused(false)
      setIsPlaying(true)
      return
    }
    synthRef.current.cancel()
    setIsPlaying(true)
    setIsPaused(false)
    speakParagraph(currentParaIdx)
  }

  const pause = () => {
    if (!synthRef.current) return
    synthRef.current.pause()
    setIsPaused(true)
    setIsPlaying(false)
  }

  const stop = () => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentParaIdx(0)
    setCurrentWord(null)
    setProgress(0)
  }

  const skipBack = () => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const newIdx = Math.max(0, currentParaIdx - 1)
    setCurrentParaIdx(newIdx)
    setCurrentWord(null)
    if (isPlaying) setTimeout(() => speakParagraph(newIdx), 100)
  }

  const skipForward = () => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const newIdx = Math.min(paragraphs.length - 1, currentParaIdx + 1)
    setCurrentParaIdx(newIdx)
    setCurrentWord(null)
    if (isPlaying) setTimeout(() => speakParagraph(newIdx), 100)
  }

  const jumpToParagraph = (idx) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    setCurrentParaIdx(idx)
    setCurrentWord(null)
    setIsPlaying(true)
    setIsPaused(false)
    setTimeout(() => speakParagraph(idx), 100)
  }

  // Restart with new settings
  const applySettings = () => {
    if (!synthRef.current) return
    if (isPlaying || isPaused) {
      synthRef.current.cancel()
      setIsPaused(false)
      setTimeout(() => speakParagraph(currentParaIdx), 100)
    }
    setShowSettings(false)
  }

  if (!isSupported) {
    return (
      <div className={styles.unsupported}>
        🔇 Your browser doesn&apos;t support speech synthesis. Try Chrome or Edge.
      </div>
    )
  }

  const germanVoices = voices.filter(v => v.lang.startsWith('de'))
  const hasGermanVoice = germanVoices.length > 0

  return (
    <div className={styles.narrator}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.micIcon}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div>
            <div className={styles.narratorLabel}>German Narrator</div>
            {!hasGermanVoice && (
              <div className={styles.noGermanWarning}>
                No German voice found — using default voice
              </div>
            )}
            {hasGermanVoice && selectedVoice && (
              <div className={styles.voiceName}>{selectedVoice.name}</div>
            )}
          </div>
        </div>
        <button
          className={`${styles.settingsBtn} ${showSettings ? styles.active : ''}`}
          onClick={() => setShowSettings(v => !v)}
          title="Narrator settings"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className={styles.progressWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <div className={styles.progressLabel}>
          {isPlaying ? `Paragraph ${currentParaIdx + 1} of ${paragraphs.length}` :
           progress === 100 ? 'Story complete ✓' :
           isPaused ? 'Paused' : 'Ready to read'}
        </div>
      </div>

      {/* ── Main controls ── */}
      <div className={styles.controls}>
        <button onClick={skipBack} className={styles.controlBtn} disabled={currentParaIdx === 0} title="Previous paragraph">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="19 20 9 12 19 4 19 20"/>
            <line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>

        {isPlaying ? (
          <button onClick={pause} className={styles.playBtn} title="Pause">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          </button>
        ) : (
          <button onClick={play} className={styles.playBtn} title={isPaused ? "Resume" : "Play"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>
        )}

        <button onClick={stop} className={styles.controlBtn} disabled={!isPlaying && !isPaused} title="Stop">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
        </button>

        <button onClick={skipForward} className={styles.controlBtn} disabled={currentParaIdx >= paragraphs.length - 1} title="Next paragraph">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 4 15 12 5 20 5 4"/>
            <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* ── Settings panel ── */}
      {showSettings && (
        <div className={styles.settings}>
          {/* Voice selector */}
          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>Voice</label>
            <select
              className={styles.select}
              value={selectedVoice?.name || ''}
              onChange={e => {
                const v = voices.find(v => v.name === e.target.value)
                setSelectedVoice(v)
              }}
            >
              {germanVoices.length > 0 && (
                <optgroup label="🇩🇪 German voices">
                  {germanVoices.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Other voices">
                {voices.filter(v => !v.lang.startsWith('de')).map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Speed */}
          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>
              Speed <span className={styles.settingValue}>{speed}x</span>
            </label>
            <input
              type="range" min="0.5" max="1.5" step="0.05"
              value={speed}
              className={styles.slider}
              onChange={e => setSpeed(parseFloat(e.target.value))}
            />
            <div className={styles.sliderLabels}>
              <span>Slow</span><span>Normal</span><span>Fast</span>
            </div>
          </div>

          {/* Pitch */}
          <div className={styles.settingRow}>
            <label className={styles.settingLabel}>
              Pitch <span className={styles.settingValue}>{pitch}x</span>
            </label>
            <input
              type="range" min="0.7" max="1.3" step="0.05"
              value={pitch}
              className={styles.slider}
              onChange={e => setPitch(parseFloat(e.target.value))}
            />
            <div className={styles.sliderLabels}>
              <span>Low</span><span>Normal</span><span>High</span>
            </div>
          </div>

          <button onClick={applySettings} className={styles.applyBtn}>
            Apply & Continue
          </button>
        </div>
      )}

      {/* ── Paragraph selector ── */}
      <div className={styles.paraList}>
        {paragraphs.map((p, i) => (
          <button
            key={p.id}
            className={`${styles.paraBtn} ${i === currentParaIdx ? styles.paraCurrent : ''} ${i < currentParaIdx ? styles.paraDone : ''}`}
            onClick={() => jumpToParagraph(i)}
            title={`Jump to paragraph ${i + 1}`}
          >
            <span className={styles.paraBtnNum}>{i + 1}</span>
            <span className={styles.paraBtnPreview}>
              {p.germanText.substring(0, 40)}...
            </span>
            {i < currentParaIdx && (
              <span className={styles.paraDoneCheck}>✓</span>
            )}
            {i === currentParaIdx && isPlaying && (
              <span className={styles.paraPlaying}>
                <span /><span /><span />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Word pronunciation tip ── */}
      {currentWord && (
        <div className={styles.currentWord}>
          🔊 <strong>{currentWord.word}</strong>
        </div>
      )}
    </div>
  )
}
