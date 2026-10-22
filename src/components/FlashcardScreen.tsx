import React, { useState, useEffect, useMemo } from 'react';
import {
  Volume2,
  RotateCw,
  Check,
  X,
  Shuffle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  HelpCircle,
  Eye,
  EyeOff,
  VolumeX,
} from 'lucide-react';
import { VocabItem, ChapterMeta, AppView } from '../types';
import { sound } from '../utils/audio';
import { shuffleArray } from '../utils/quizGenerator';
import { StorageManager } from '../utils/storage';

interface FlashcardScreenProps {
  vocabList: VocabItem[];
  chaptersMeta: Record<number, ChapterMeta>;
  onNavigate: (view: AppView) => void;
}

export const FlashcardScreen: React.FC<FlashcardScreenProps> = ({
  vocabList,
  chaptersMeta,
  onNavigate,
}) => {
  const [selectedBab, setSelectedBab] = useState<string>('1');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [cards, setCards] = useState<VocabItem[]>([]);
  const [showHiragana, setShowHiragana] = useState<boolean>(() => StorageManager.getShowHiragana());
  const [autoPlay, setAutoPlay] = useState<boolean>(() => StorageManager.getAutoPlayAudio());
  const [peekReading, setPeekReading] = useState(false);

  // Build card deck based on selected chapter
  useEffect(() => {
    let pool: VocabItem[] = [];
    if (selectedBab === 'all') {
      pool = vocabList;
    } else if (selectedBab === 'shokyuu1') {
      pool = vocabList.filter((v) => v.chapter <= 25);
    } else if (selectedBab === 'shokyuu2') {
      pool = vocabList.filter((v) => v.chapter >= 26);
    } else {
      const bNum = Number(selectedBab) || 1;
      pool = vocabList.filter((v) => v.chapter === bNum);
    }

    setCards(pool);
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setReviewCount(0);
    setPeekReading(false);
  }, [selectedBab, vocabList]);

  const currentCard = cards[currentIndex];

  // Reset peek reading when moving to another card
  useEffect(() => {
    setPeekReading(false);
  }, [currentIndex]);

  // Auto-speak Japanese when card changes (only if autoPlay is ON)
  useEffect(() => {
    if (autoPlay && currentCard && !isFlipped) {
      sound.speakJapanese(currentCard.japanese);
    }
  }, [currentIndex, currentCard, autoPlay, isFlipped]);

  // Flip card
  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
    sound.playOptionSelect();
  };

  // Mark as Known
  const handleMarkKnown = () => {
    sound.playCorrect();
    setKnownCount((k) => k + 1);
    nextCard();
  };

  // Mark for Review
  const handleMarkReview = () => {
    sound.playIncorrect();
    setReviewCount((r) => r + 1);
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const prevCard = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  const handleShuffle = () => {
    sound.playOptionSelect();
    setCards((prev) => shuffleArray(prev));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        handleMarkKnown();
      } else if (e.key === 'ArrowLeft') {
        handleMarkReview();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, cards.length]);

  const chapterMeta = currentCard ? chaptersMeta[currentCard.chapter] : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-9 space-y-6">
      {/* Header controls */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-stone-700">Pilih Materi:</label>
          <select
            value={selectedBab}
            onChange={(e) => setSelectedBab(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                Bab {i + 1}: {chaptersMeta[i + 1]?.title || `Bab ${i + 1}`}
              </option>
            ))}
            <option value="shokyuu1">Shokyuu 1 (N5: Bab 1–25)</option>
            <option value="shokyuu2">Shokyuu 2 (N4: Bab 26–50)</option>
            <option value="all">Semua Bab (Bab 1–50)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Hiragana toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !showHiragana;
              setShowHiragana(next);
              StorageManager.setShowHiragana(next);
              sound.playOptionSelect();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              showHiragana
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:text-stone-900'
            }`}
            title="Aktif/Nonaktifkan Hiragana untuk kata ber-Kanji"
          >
            {showHiragana ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Hiragana: {showHiragana ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto Audio toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !autoPlay;
              setAutoPlay(next);
              StorageManager.setAutoPlayAudio(next);
              sound.playOptionSelect();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              autoPlay
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-stone-100 text-stone-600 border-stone-200 hover:text-stone-900'
            }`}
            title="Aktif/Nonaktifkan putar audio otomatis saat buka kartu"
          >
            {autoPlay ? <Volume2 className="w-3.5 h-3.5 text-rose-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
            <span>Auto-Audio: {autoPlay ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold cursor-pointer"
            title="Acak Urutan Kartu"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Acak</span>
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Tes Kuis</span>
          </button>
        </div>
      </div>

      {/* Progress & Stat Pill */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 px-1">
        <span>
          Kartu {cards.length > 0 ? currentIndex + 1 : 0} dari {cards.length}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-emerald-700 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Hafal: {knownCount}
          </span>
          <span className="text-rose-700 flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Ulangi: {reviewCount}
          </span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      {currentCard ? (
        <div
          onClick={handleFlip}
          className="w-full min-h-[320px] sm:min-h-[380px] bg-white rounded-3xl p-8 sm:p-12 shadow-lg shadow-stone-200/80 border border-stone-200 flex flex-col justify-between items-center text-center cursor-pointer select-none transition-all hover:border-rose-300 relative group"
        >
          {/* Card Top Category Tag */}
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
              Bab {currentCard.chapter} • No. {currentCard.no}
            </span>
            <span className="text-xs text-stone-400 group-hover:text-stone-700 transition-colors flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Ketuk untuk balik kartu</span>
            </span>
          </div>

          {/* Card Center Content */}
          <div className="my-auto py-6">
            {!isFlipped ? (
              /* Front: Japanese */
              <div className="space-y-3">
                {currentCard.kanji && currentCard.kanji !== currentCard.japanese && (
                  showHiragana || peekReading ? (
                    <div className="text-base sm:text-lg font-bold text-stone-500 font-jp animate-in fade-in">
                      {currentCard.japanese}
                    </div>
                  ) : (
                    <div className="mb-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPeekReading(true);
                          sound.playOptionSelect();
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-[11px] font-semibold border border-dashed border-stone-300 transition-colors cursor-pointer"
                        title="Klik untuk intip cara baca hiragana untuk kartu ini"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Intip Cara Baca (Hiragana)</span>
                      </button>
                    </div>
                  )
                )}
                <div className="text-4xl sm:text-6xl font-black text-stone-900 font-jp tracking-wide">
                  {currentCard.kanji || currentCard.japanese}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.speakJapanese(currentCard.japanese);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-rose-600" />
                    <span>Dengar Suara Jepang</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Back: Indonesian Meaning */
              <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  Arti Bahasa Indonesia
                </span>
                <div className="text-2xl sm:text-4xl font-extrabold text-stone-900 leading-snug">
                  {currentCard.indonesian}
                </div>
                <div className="text-sm font-semibold text-stone-500 font-jp pt-2">
                  「{currentCard.kanji || currentCard.japanese}」= {currentCard.japanese}
                </div>
                {currentCard.notes && (
                  <p className="text-xs text-stone-400 italic max-w-sm mx-auto">
                    {currentCard.notes}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card Bottom Hint */}
          <div className="text-[11px] font-semibold text-stone-400">
            Keyboard: Spasi = Balik | ⬅ Panah Kiri = Belum | ➡ Panah Kanan = Hafal
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
          Tidak ada kartu pada Bab ini.
        </div>
      )}

      {/* Action Buttons: Belum Hafal vs Sudah Hafal */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleMarkReview}
          className="py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 active:scale-[0.99] text-rose-700 font-bold text-xs sm:text-sm border border-rose-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <X className="w-4 h-4 text-rose-600" />
          <span>Belum Hafal (Ulangi)</span>
        </button>

        <button
          type="button"
          onClick={handleMarkKnown}
          className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
        >
          <Check className="w-4 h-4" />
          <span>Sudah Hafal</span>
        </button>
      </div>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={prevCard}
          className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <button
          type="button"
          disabled={currentIndex === cards.length - 1}
          onClick={nextCard}
          className="flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-stone-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Berikutnya</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
