import Link from 'next/link'
import Navbar from '@/components/ui/Navbar'
import styles from './page.module.css'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* ── Hero ── */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={`${styles.heroText} stagger`}>
              <div className={`${styles.tag} animate-fade-up`}>
                🇩🇪 A1 → C1 · Daily Stories · Click-to-Learn
              </div>
              <h1 className={`${styles.h1} animate-fade-up`}>
                Learn German the<br />
                <em>way readers do</em>
              </h1>
              <p className={`${styles.sub} animate-fade-up`}>
                Read real German stories every day. Click any word for instant translation,
                grammar, and gender. Go from beginner to C1 — one story at a time.
              </p>
              <div className={`${styles.heroCta} animate-fade-up`}>
                <Link href="/stories"  className={styles.btnPrimary}>Read Today's Story</Link>
                <Link href="/register" className={styles.btnSecondary}>Create Free Account</Link>
              </div>
            </div>

            <div className={`${styles.heroCard} animate-fade-up`}>
              <div className={styles.cardInner}>
                <div className={styles.cardLevel}>
                  <span className="badge badge-b1">B1</span>
                  <span className={styles.cardTime}>3 min read</span>
                </div>
                <h3 className={styles.cardTitle}>Die Jobsuche in Hamburg</h3>
                <p className={styles.cardPreview}>
                  Seit drei Monaten sucht{' '}
                  <span className={styles.wordDemo}>Leila</span>{' '}
                  eine neue{' '}
                  <span className={styles.wordDemoGreen}>Stelle</span>{' '}
                  als{' '}
                  <span className={styles.wordDemo}>Ingenieurin</span>.
                  Sie schickt täglich Bewerbungen ab...
                </p>
                <div className={styles.cardPopup}>
                  <div className={styles.popupWord}>Stelle</div>
                  <div className={styles.popupTrans}>job position / post</div>
                  <div className={styles.popupRow}>
                    <span className={styles.popupTag}>Noun · die (fem.)</span>
                    <span className={styles.popupTag}>B1</span>
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span>✓ Click any word</span>
                  <span>✓ Save to vocabulary</span>
                  <span>✓ Track streak</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Levels ── */}
        <section className={styles.levels}>
          <div className="container">
            <h2 className={styles.sectionTitle}>Stories for every level</h2>
            <div className={styles.levelsGrid}>
              {[
                { l:'A1', label:'Beginner', desc:'Simple sentences, everyday topics, basic vocabulary', color:'#1a6b4a' },
                { l:'A2', label:'Elementary', desc:'Short stories, daily life, common expressions', color:'#1a6b55' },
                { l:'B1', label:'Intermediate', desc:'Longer texts, nuanced topics, varied grammar', color:'#2053a0' },
                { l:'B2', label:'Upper-Int.', desc:'Complex articles, abstract ideas, rich vocabulary', color:'#5040b0' },
                { l:'C1', label:'Advanced', desc:'Authentic texts, academic language, full fluency', color:'#c17d2a' },
              ].map(item => (
                <Link key={item.l} href={`/stories?level=${item.l}`} className={styles.levelCard}>
                  <div className={styles.levelBadge} style={{ background: item.color }}>{item.l}</div>
                  <div className={styles.levelLabel}>{item.label}</div>
                  <div className={styles.levelDesc}>{item.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
