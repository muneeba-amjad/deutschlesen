'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/ui/Navbar'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import styles from './page.module.css'

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

// ── Inline API calls for writing (add to your lib/api.js too) ──
const writingApi = {
  check:    (body)          => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/writing/check`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(typeof window !== 'undefined' && localStorage.getItem('dl_token') ? { Authorization: `Bearer ${localStorage.getItem('dl_token')}` } : {}) }, body: JSON.stringify(body) }).then(r => r.json()),
  daily:    (level)         => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/writing/daily?level=${level}`).then(r => r.json()),
  practice: (level, count)  => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/writing/practice?level=${level}&count=${count}`).then(r => r.json()),
  history:  ()              => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/writing/history`, { headers: { Authorization: `Bearer ${localStorage.getItem('dl_token')}` } }).then(r => r.json()),
  delete:   (id)            => fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/writing/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('dl_token')}` } }).then(r => r.json()),
}

// ── Feedback result component ─────────────────────────────────
function FeedbackPanel({ feedback, onClose }) {
  if (!feedback) return null
  const scoreColor = feedback.score >= 80 ? '#1a6b4a' : feedback.score >= 60 ? '#c17d2a' : '#c0392b'

  return (
    <div className={styles.feedbackPanel}>
      <div className={styles.feedbackHeader}>
        <div className={styles.scoreWrap}>
          <div className={styles.scoreCircle} style={{ borderColor: scoreColor, color: scoreColor }}>
            {feedback.score}
          </div>
          <div>
            <div className={styles.scoreLabel}>Your Score</div>
            <div className={styles.encouragement}>{feedback.encouragement}</div>
          </div>
        </div>
        <button onClick={onClose} className={styles.closeBtn}>✕</button>
      </div>

      {/* Corrected text */}
      {feedback.correctedText && (
        <div className={styles.correctedBox}>
          <div className={styles.sectionLabel}>✅ Corrected Version</div>
          <div className={styles.correctedText}>{feedback.correctedText}</div>
        </div>
      )}

      {/* Errors */}
      {feedback.errors?.length > 0 && (
        <div className={styles.errorsSection}>
          <div className={styles.sectionLabel}>🔍 Mistakes Found ({feedback.errors.length})</div>
          <div className={styles.errorsList}>
            {feedback.errors.map((err, i) => (
              <div key={i} className={styles.errorItem}>
                <div className={styles.errorTop}>
                  <span className={styles.errorOriginal}>❌ {err.original}</span>
                  <span className={styles.errorArrow}>→</span>
                  <span className={styles.errorCorrection}>✓ {err.correction}</span>
                  <span className={`${styles.errorType} ${styles[`type_${err.type?.replace('-','_')}`]}`}>{err.type}</span>
                </div>
                <div className={styles.errorExplanation}>{err.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {feedback.tips?.length > 0 && (
        <div className={styles.tipsSection}>
          <div className={styles.sectionLabel}>💡 Tips</div>
          {feedback.tips.map((tip, i) => (
            <div key={i} className={styles.tip}>{tip}</div>
          ))}
        </div>
      )}

      {feedback.errors?.length === 0 && (
        <div className={styles.perfectBadge}>🎉 Perfect! Keine Fehler gefunden!</div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────
export default function WritingPage() {
  const { user } = useAuth()

  const [mode,          setMode]          = useState('free')      // 'free' | 'translate' | 'practice'
  const [level,         setLevel]         = useState('A2')
  const [userText,      setUserText]      = useState('')
  const [checking,      setChecking]      = useState(false)
  const [feedback,      setFeedback]      = useState(null)
  const [dailyPrompt,   setDailyPrompt]   = useState(null)
  const [practiceSets,  setPracticeSets]  = useState([])
  const [currentPrac,   setCurrentPrac]   = useState(0)
  const [pracText,      setPracText]      = useState('')
  const [pracFeedback,  setPracFeedback]  = useState(null)
  const [pracChecking,  setPracChecking]  = useState(false)
  const [history,       setHistory]       = useState([])
  const [showHistory,   setShowHistory]   = useState(false)
  const [loadingPrompt, setLoadingPrompt] = useState(false)
  const [showHints,     setShowHints]     = useState(false)
  const [showAnswer,    setShowAnswer]    = useState(false)
  const [charCount,     setCharCount]     = useState(0)

  // Load daily prompt when translate mode selected
  useEffect(() => {
    if (mode === 'translate') loadDailyPrompt()
    if (mode === 'practice')  loadPractice()
  }, [mode, level])

  // Load history when panel opens
  useEffect(() => {
    if (showHistory && user) loadHistory()
  }, [showHistory, user])

  const loadDailyPrompt = async () => {
    setLoadingPrompt(true)
    setFeedback(null); setUserText(''); setShowHints(false); setShowAnswer(false)
    try {
      const data = await writingApi.daily(level)
      setDailyPrompt(data)
    } catch (err) { console.error(err) }
    finally { setLoadingPrompt(false) }
  }

  const loadPractice = async () => {
    setLoadingPrompt(true)
    setPracticeSets([]); setCurrentPrac(0); setPracText(''); setPracFeedback(null)
    try {
      const data = await writingApi.practice(level, 5)
      setPracticeSets(data.sentences || [])
    } catch (err) { console.error(err) }
    finally { setLoadingPrompt(false) }
  }

  const loadHistory = async () => {
    try {
      const data = await writingApi.history()
      setHistory(data.entries || [])
    } catch (err) { console.error(err) }
  }

  // ── Check free writing or translate ──
  const handleCheck = async () => {
    if (!userText.trim()) return
    setChecking(true); setFeedback(null)
    try {
      const data = await writingApi.check({
        text:       userText,
        mode,
        level,
        promptText: dailyPrompt?.englishText || null,
      })
      setFeedback(data.feedback)
    } catch (err) { console.error(err) }
    finally { setChecking(false) }
  }

  // ── Check practice sentence ──
  const handlePracCheck = async () => {
    if (!pracText.trim()) return
    setPracChecking(true); setPracFeedback(null)
    const current = practiceSets[currentPrac]
    try {
      const data = await writingApi.check({
        text:       pracText,
        mode:       current.type === 'translate' ? 'translate' : 'free',
        level,
        promptText: current.type === 'translate' ? current.english : null,
      })
      setPracFeedback(data.feedback)
    } catch (err) { console.error(err) }
    finally { setPracChecking(false) }
  }

  const nextPractice = () => {
    setCurrentPrac(i => i + 1)
    setPracText('')
    setPracFeedback(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    await writingApi.delete(id)
    setHistory(h => h.filter(e => e.id !== id))
  }

  const currentSentence = practiceSets[currentPrac]

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.inner}>

          {/* ── Page header ── */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.title}>Writing Practice</h1>
              <p className={styles.subtitle}>Write in German — AI checks your grammar, spelling & style instantly</p>
            </div>
            {user && (
              <button className={styles.historyBtn} onClick={() => setShowHistory(v => !v)}>
                {showHistory ? 'Hide History' : `📓 My Writing`}
              </button>
            )}
          </div>

          {/* ── History panel ── */}
          {showHistory && user && (
            <div className={styles.historyPanel}>
              <h3 className={styles.historyTitle}>Your Writing History</h3>
              {history.length === 0 && <p className={styles.historyEmpty}>No saved entries yet. Start writing!</p>}
              {history.map(entry => {
                const fb = entry.feedback
                return (
                  <div key={entry.id} className={styles.historyItem}>
                    <div className={styles.historyTop}>
                      <div className={styles.historyMeta}>
                        <span className={`badge badge-${entry.level.toLowerCase()}`}>{entry.level}</span>
                        <span className={styles.historyMode}>{entry.mode}</span>
                        <span className={styles.historyDate}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className={styles.historyRight}>
                        {fb?.score && (
                          <span className={styles.historyScore} style={{ color: fb.score >= 80 ? '#1a6b4a' : fb.score >= 60 ? '#c17d2a' : '#c0392b' }}>
                            {fb.score}/100
                          </span>
                        )}
                        <button onClick={() => handleDelete(entry.id)} className={styles.deleteBtn}>🗑</button>
                      </div>
                    </div>
                    <div className={styles.historyText}>{entry.userText}</div>
                    {entry.correctedText && entry.correctedText !== entry.userText && (
                      <div className={styles.historyCorrected}>✅ {entry.correctedText}</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Mode + Level selector ── */}
          <div className={styles.controls}>
            <div className={styles.modeTabs}>
              {[
                { key: 'free',      label: '✏️ Free Writing' },
                { key: 'translate', label: '🔄 Daily Challenge' },
                { key: 'practice',  label: '⚡ Quick Practice' },
              ].map(m => (
                <button
                  key={m.key}
                  className={`${styles.modeTab} ${mode === m.key ? styles.modeActive : ''}`}
                  onClick={() => { setMode(m.key); setFeedback(null); setUserText('') }}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className={styles.levelPicker}>
              {LEVELS.map(l => (
                <button
                  key={l}
                  className={`${styles.levelBtn} ${level === l ? styles.levelActive : ''}`}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════ */}
          {/* ── FREE WRITING MODE ──────────────────────────── */}
          {/* ══════════════════════════════════════════════════ */}
          {mode === 'free' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Free Writing</h2>
                <p className={styles.cardSub}>Write anything in German — a sentence, paragraph, or short story. AI will check everything.</p>
              </div>
              <textarea
                className={styles.textarea}
                placeholder="Schreib hier auf Deutsch... (Write here in German...)"
                value={userText}
                onChange={e => { setUserText(e.target.value); setCharCount(e.target.value.length) }}
                rows={6}
              />
              <div className={styles.textareaFooter}>
                <span className={styles.charCount}>{charCount} characters</span>
                <div className={styles.actions}>
                  <button onClick={() => { setUserText(''); setFeedback(null); setCharCount(0) }} className={styles.clearBtn}>Clear</button>
                  <button onClick={handleCheck} disabled={!userText.trim() || checking} className={styles.checkBtn}>
                    {checking ? '⏳ Checking...' : '🔍 Check my German'}
                  </button>
                </div>
              </div>
              {!user && <div className={styles.loginNote}>💡 <a href="/login">Log in</a> to save your writing history</div>}
              <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* ── DAILY CHALLENGE MODE ───────────────────────── */}
          {/* ══════════════════════════════════════════════════ */}
          {mode === 'translate' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h2 className={styles.cardTitle}>Daily Translation Challenge</h2>
                    <p className={styles.cardSub}>Translate today's sentence from English into German</p>
                  </div>
                  <button onClick={loadDailyPrompt} className={styles.refreshBtn} title="New prompt">↻</button>
                </div>
              </div>

              {loadingPrompt ? (
                <div className={styles.loadingPrompt}>Generating today's challenge...</div>
              ) : dailyPrompt ? (
                <>
                  <div className={styles.promptBox}>
                    <div className={styles.promptLabel}>🇬🇧 Translate this into German:</div>
                    <div className={styles.promptText}>{dailyPrompt.englishText}</div>
                  </div>

                  <div className={styles.promptActions}>
                    <button className={styles.hintBtn} onClick={() => setShowHints(v => !v)}>
                      {showHints ? 'Hide hints' : '💡 Show hints'}
                    </button>
                    <button className={styles.hintBtn} onClick={() => setShowAnswer(v => !v)}>
                      {showAnswer ? 'Hide answer' : '👁 Show sample answer'}
                    </button>
                  </div>

                  {showHints && dailyPrompt.hints && (
                    <div className={styles.hintsBox}>
                      {dailyPrompt.hints.map((h, i) => (
                        <div key={i} className={styles.hint}>💡 {h}</div>
                      ))}
                    </div>
                  )}

                  {showAnswer && dailyPrompt.sampleAnswer && (
                    <div className={styles.answerBox}>
                      <div className={styles.answerLabel}>Sample answer:</div>
                      <div className={styles.answerText}>{dailyPrompt.sampleAnswer}</div>
                    </div>
                  )}

                  <textarea
                    className={styles.textarea}
                    placeholder="Deine Übersetzung... (Your German translation...)"
                    value={userText}
                    onChange={e => { setUserText(e.target.value); setCharCount(e.target.value.length) }}
                    rows={4}
                  />
                  <div className={styles.textareaFooter}>
                    <span className={styles.charCount}>{charCount} characters</span>
                    <button onClick={handleCheck} disabled={!userText.trim() || checking} className={styles.checkBtn}>
                      {checking ? '⏳ Checking...' : '🔍 Check Translation'}
                    </button>
                  </div>
                  <FeedbackPanel feedback={feedback} onClose={() => setFeedback(null)} />
                </>
              ) : (
                <div className={styles.loadingPrompt}>Could not load prompt. Try again.</div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════ */}
          {/* ── QUICK PRACTICE MODE ────────────────────────── */}
          {/* ══════════════════════════════════════════════════ */}
          {mode === 'practice' && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderRow}>
                  <div>
                    <h2 className={styles.cardTitle}>Quick Practice</h2>
                    <p className={styles.cardSub}>5 quick sentences — no saving, just fast practice</p>
                  </div>
                  <button onClick={loadPractice} className={styles.refreshBtn} title="New set">↻</button>
                </div>
              </div>

              {loadingPrompt ? (
                <div className={styles.loadingPrompt}>Generating practice sentences...</div>
              ) : practiceSets.length === 0 ? (
                <div className={styles.loadingPrompt}>Could not load. Try again.</div>
              ) : currentPrac >= practiceSets.length ? (
                <div className={styles.allDone}>
                  <div className={styles.allDoneIcon}>🎉</div>
                  <h3>All done! Sehr gut!</h3>
                  <p>You completed all 5 practice sentences.</p>
                  <button onClick={loadPractice} className={styles.checkBtn}>Try 5 more →</button>
                </div>
              ) : (
                <>
                  {/* Progress dots */}
                  <div className={styles.pracProgress}>
                    {practiceSets.map((_, i) => (
                      <div key={i} className={`${styles.pracDot} ${i < currentPrac ? styles.pracDone : i === currentPrac ? styles.pracCurrent : ''}`} />
                    ))}
                  </div>

                  <div className={styles.pracCard}>
                    <div className={styles.pracType}>
                      {currentSentence.type === 'translate' ? '🔄 Translate into German' : '✏️ Correct this German sentence'}
                    </div>

                    <div className={styles.promptBox}>
                      <div className={styles.promptText}>
                        {currentSentence.type === 'translate' ? currentSentence.english : currentSentence.broken}
                      </div>
                    </div>

                    {currentSentence.hint && (
                      <div className={styles.inlineHint}>💡 Hint: {currentSentence.hint}</div>
                    )}

                    <textarea
                      className={styles.textarea}
                      placeholder={currentSentence.type === 'translate' ? 'Deine Übersetzung...' : 'Korrigiere den Satz...'}
                      value={pracText}
                      onChange={e => setPracText(e.target.value)}
                      rows={3}
                    />

                    <div className={styles.textareaFooter}>
                      <span />
                      <div className={styles.actions}>
                        {pracFeedback && (
                          <button onClick={nextPractice} className={styles.nextBtn}>
                            {currentPrac < practiceSets.length - 1 ? 'Next →' : 'Finish ✓'}
                          </button>
                        )}
                        <button onClick={handlePracCheck} disabled={!pracText.trim() || pracChecking} className={styles.checkBtn}>
                          {pracChecking ? '⏳ Checking...' : '🔍 Check'}
                        </button>
                      </div>
                    </div>

                    {pracFeedback && (
                      <FeedbackPanel feedback={pracFeedback} onClose={() => setPracFeedback(null)} />
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
