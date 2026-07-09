"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import WordPopup from "@/components/reader/WordPopup";
import GermanNarrator from "@/components/reader/GermanNarrator";
import { api } from "@/lib/api";
import styles from "./page.module.css";

export default function StoryPage() {
  const { id } = useParams();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEn, setShowEn] = useState(false);
  const [popup, setPopup] = useState(null); // { wordData, position }
  const [savedWords, setSavedWords] = useState(new Set());
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.stories.getOne(id);
      setStory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // When user clicks a vocab word (from story.vocabulary)
  const handleVocabClick = useCallback(async (vocabItem, e) => {
    e.stopPropagation();
    setClickCount((c) => c + 1);
    setPopup({
      wordData: vocabItem,
      position: { x: e.clientX, y: e.clientY },
    });
  }, []);

  // When user clicks any non-vocab word — look it up via API
  const handleGenericClick = useCallback(async (word, e) => {
    e.stopPropagation();
    setClickCount((c) => c + 1);
    // Show popup immediately with loading state
    setPopup({
      wordData: { word, translation: "...looking up..." },
      position: { x: e.clientX, y: e.clientY },
    });
    try {
      const data = await api.words.translate(word);
      setPopup((prev) =>
        prev
          ? {
              ...prev,
              wordData: {
                word,
                translation: data.translation,
                type: data.type,
                gender: data.gender,
              },
            }
          : null,
      );
    } catch {
      setPopup((prev) =>
        prev
          ? {
              ...prev,
              wordData: { word, translation: "Translation unavailable" },
            }
          : null,
      );
    }
  }, []);

  const handleSaved = (wordId) => {
    setSavedWords((prev) => new Set([...prev, wordId]));
  };

  // Build vocab lookup map for fast word matching
  const vocabMap = {};
  story?.vocabulary?.forEach((v) => {
    vocabMap[v.word.toLowerCase()] = v;
  });

  // Tokenize paragraph text — highlight known vocab words
  const renderParagraph = (text) => {
    const tokens = text.split(/(\s+|[.,!?;:–"„"—])/);
    return tokens.map((token, i) => {
      const clean = token.replace(/[.,!?;:–"„"—]/g, "").toLowerCase();
      if (!clean || !/[a-zäöüß]/i.test(clean)) return token;

      const vocab = vocabMap[clean];
      if (vocab) {
        return (
          <span
            key={i}
            className={`${styles.vocabWord} ${savedWords.has(vocab.id) ? styles.saved : ""}`}
            onClick={(e) => handleVocabClick(vocab, e)}
          >
            {token}
          </span>
        );
      }

      return (
        <span
          key={i}
          className={styles.word}
          onClick={(e) => handleGenericClick(token.trim(), e)}
        >
          {token}
        </span>
      );
    });
  };

  if (loading)
    return (
      <>
        <Navbar />
        <div className={styles.loadingWrap}>
          <div className={styles.loadingPulse}>Loading story...</div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Navbar />
        <div className={styles.errorWrap}>
          <p>⚠️ {error}</p>
          <Link href="/stories">← Back to stories</Link>
        </div>
      </>
    );

  return (
    <>
      <Navbar />

      <div className={styles.page} onClick={() => setPopup(null)}>
        <div className={styles.inner}>
          {/* Story header */}
          <div className={`${styles.storyHeader} animate-fade-up`}>
            <Link href="/stories" className={styles.back}>
              ← All Stories
            </Link>
            <div className={styles.meta}>
              <span className={`badge badge-${story.level.toLowerCase()}`}>
                {story.level}
              </span>
              <span className={styles.topic}>{story.topic}</span>
              <span className={styles.wordCount}>
                {story.vocabulary?.length || 0} vocab words
              </span>
            </div>
            <h1 className={styles.title}>{story.title}</h1>

            {/* Controls */}
            <div className={styles.controls}>
              <button
                className={`${styles.toggleBtn} ${showEn ? styles.on : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEn((v) => !v);
                }}
              >
                {showEn ? "Hide" : "Show"} English translation
              </button>
              <span className={styles.clickHint}>
                💡 Click any word for translation
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              style={{ width: `${Math.min(100, (clickCount / 15) * 100)}%` }}
            />
          </div>
          <div  className={styles.contentWrapper}>

         
         
          {/* Story content */}
          <div className={`${styles.content} animate-fade-up`}>
            {story.paragraphs?.map((p, i) => (
              <div key={p.id} className={styles.paragraph}>
                <p className={styles.germanText}>
                  {renderParagraph(p.germanText)}
                </p>
                {showEn && (
                  <p className={`${styles.englishText} animate-fade-in`}>
                    {p.englishText}
                  </p>
                )}
              </div>
            ))}
          </div>
  <GermanNarrator
            paragraphs={story.paragraphs}
            storyTitle={story.title}
          />
 </div>
          {/* Vocabulary glossary at bottom */}
          {story.vocabulary?.length > 0 && (
            <div className={`${styles.glossary} animate-fade-up`}>
              <h3 className={styles.glossaryTitle}>
                Story Vocabulary ({story.vocabulary.length} words)
              </h3>
              <div className={styles.glossaryGrid}>
                {story.vocabulary.map((v) => (
                  <div
                    key={v.id}
                    className={`${styles.glossaryItem} ${savedWords.has(v.id) ? styles.glossarySaved : ""}`}
                    onClick={(e) => handleVocabClick(v, e)}
                  >
                    <div className={styles.glossaryWord}>{v.word}</div>
                    <div className={styles.glossaryTrans}>{v.translation}</div>
                    {v.gender && (
                      <div className={styles.glossaryGender}>{v.gender}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
       
      </div>

      {/* Word popup */}
      {popup && (
        <WordPopup
          wordData={popup.wordData}
          position={popup.position}
          onClose={() => setPopup(null)}
          onSaved={handleSaved}
          savedWords={savedWords}
        />
      )}
    </>
  );
}
