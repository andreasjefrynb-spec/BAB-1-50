import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Volume2,
  Clock,
  ArrowLeft,
  ArrowRight,
  Flag,
  Bookmark,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Menu,
  X,
  Send,
  HelpCircle,
  Check,
  Eye,
  EyeOff,
  VolumeX,
  Zap,
} from 'lucide-react';
import { QuizQuestion, QuizResult } from '../types';
import { sound } from '../utils/audio';
import { formatSeconds } from '../utils/quizGenerator';
import { StorageManager } from '../utils/storage';

interface QuizScreenProps {
  participantName: string;
  chapterModeTitle: string;
  questions: QuizQuestion[];
  timeLimitSeconds: number;
  instantFeedback: boolean;
  showHiraganaForKanji?: boolean;
  autoPlayAudio?: boolean;
  autoAdvance?: boolean;
  onFinishQuiz: (result: QuizResult) => void;
  onExitQuiz: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  participantName,
  chapterModeTitle,
  questions,
  timeLimitSeconds,
  instantFeedback,
  showHiraganaForKanji,
  autoPlayAudio,
  autoAdvance,
  onFinishQuiz,
  onExitQuiz,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(timeLimitSeconds);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // Settings: Hiragana toggle, Auto-play Audio, and Auto-Advance
  const [showHiragana, setShowHiragana] = useState<boolean>(() =>
    showHiraganaForKanji !== undefined ? showHiraganaForKanji : StorageManager.getShowHiragana()
  );
  const [autoPlay, setAutoPlay] = useState<boolean>(() =>
    autoPlayAudio !== undefined ? autoPlayAudio : StorageManager.getAutoPlayAudio()
  );
  const [isAutoAdvance, setIsAutoAdvance] = useState<boolean>(() =>
    autoAdvance !== undefined ? autoAdvance : StorageManager.getAutoAdvance()
  );
  const [peekReading, setPeekReading] = useState(false);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const currentAnswer = userAnswers[currentIndex];
  const isAnswered = currentAnswer !== undefined;

  // Reset peek reading on next question
  useEffect(() => {
    setPeekReading(false);
  }, [currentIndex]);

  // Audio playback on question change: ONLY when autoPlay is enabled and not in id_to_jp mode
  useEffect(() => {
    if (autoPlay && currentQ && currentQ.questionType !== 'id_to_jp') {
      sound.speakJapanese(currentQ.hiragana || currentQ.japanese);
    }
  }, [currentIndex, currentQ, autoPlay]);

  // Finish quiz handler
  const handleComplete = useCallback(() => {
    let correctCount = 0;
    const wrongIndices: number[] = [];

    questions.forEach((q, idx) => {
      const selected = userAnswers[idx];
      if (selected === q.correctIndex) {
        correctCount++;
      } else {
        wrongIndices.push(idx + 1);
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const timeSpent = timeLimitSeconds - secondsRemaining;
    const isPassed = score >= 75;

    if (isPassed) {
      sound.playPassChime();
    } else {
      sound.playTryAgain();
    }

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(now);

    const result: QuizResult = {
      id: `${Date.now()}`,
      participantName,
      chapterMode: chapterModeTitle,
      chapterModeTitle,
      totalQuestions,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      score,
      isPassed,
      timeSpentSeconds: timeSpent,
      timeRemainingSeconds: secondsRemaining,
      wrongQuestionIndices: wrongIndices,
      questions,
      userAnswers,
      completedAt: formattedDate,
    };

    onFinishQuiz(result);
  }, [
    questions,
    userAnswers,
    totalQuestions,
    timeLimitSeconds,
    secondsRemaining,
    participantName,
    chapterModeTitle,
    onFinishQuiz,
  ]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleComplete();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, handleComplete]);

  // Handle Option Select
  const handleSelectOption = (optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));

    if (instantFeedback) {
      if (optionIndex === currentQ.correctIndex) {
        sound.playCorrect();
      } else {
        sound.playIncorrect();
      }
    } else {
      sound.playOptionSelect();
    }

    // Auto-advance logic: smoothly move to next question or open submit modal if last
    if (isAutoAdvance) {
      const delay = instantFeedback ? 550 : 220;
      setTimeout(() => {
        if (currentIndex < totalQuestions - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setIsSubmitModalOpen(true);
        }
      }, delay);
    }
  };

  // Keyboard shortcut (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmitModalOpen || isExitModalOpen || isNavDrawerOpen) return;
      const key = e.key.toUpperCase();
      if (key === '1' || key === 'A') handleSelectOption(0);
      else if (key === '2' || key === 'B') handleSelectOption(1);
      else if (key === '3' || key === 'C') handleSelectOption(2);
      else if (key === '4' || key === 'D') handleSelectOption(3);
      else if (e.key === 'ArrowRight' && currentIndex < totalQuestions - 1) {
        setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex((i) => i - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, totalQuestions, isSubmitModalOpen, isExitModalOpen, isNavDrawerOpen]);

  // Toggle flag
  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
    sound.playOptionSelect();
  };

  const optionLabels = ['A', 'B', 'C', 'D'];
  const isTimeCritical = secondsRemaining <= 60;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 sm:py-7">
      {/* Quiz Top Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 mb-4 sm:mb-6">
        <div className="flex items-center justify-between gap-3">
          {/* Back/Exit & Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExitModalOpen(true)}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Keluar dari Kuis"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-stone-900 truncate max-w-[180px] sm:max-w-xs">
                {chapterModeTitle}
              </h2>
              <span className="text-[11px] font-semibold text-rose-600">
                Soal {currentIndex + 1} dari {totalQuestions}
              </span>
            </div>
          </div>

          {/* Right: Timer & Navigator Drawer Trigger */}
          <div className="flex items-center gap-2.5">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold border transition-all ${
                isTimeCritical
                  ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-600' : 'text-stone-500'}`} />
              <span>{formatSeconds(secondsRemaining)}</span>
            </div>

            <button
              onClick={() => setIsNavDrawerOpen(true)}
              className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Buka Daftar Soal"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Daftar Soal</span>
            </button>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-1.5 mt-3 overflow-hidden">
          <div
            className="bg-rose-600 h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-md shadow-stone-200/60 border border-stone-200 relative overflow-hidden">
        {/* Category & Tag & Quick Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
            {currentQ.category}
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* On/Off Hiragana reading toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !showHiragana;
                setShowHiragana(next);
                StorageManager.setShowHiragana(next);
                sound.playOptionSelect();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showHiragana
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
              }`}
              title="Aktifkan/Nonaktifkan cara baca Hiragana untuk kata ber-Kanji"
            >
              {showHiragana ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Hiragana: {showHiragana ? 'ON' : 'OFF'}</span>
            </button>

            {/* Audio Auto-play toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !autoPlay;
                setAutoPlay(next);
                StorageManager.setAutoPlayAudio(next);
                sound.playOptionSelect();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                autoPlay
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
              }`}
              title="Aktifkan/Nonaktifkan putar suara otomatis"
            >
              {autoPlay ? <Volume2 className="w-3.5 h-3.5 text-rose-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
              <span>Auto-Audio: {autoPlay ? 'ON' : 'OFF'}</span>
            </button>

            {/* Auto Advance toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isAutoAdvance;
                setIsAutoAdvance(next);
                StorageManager.setAutoAdvance(next);
                sound.playOptionSelect();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isAutoAdvance
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-stone-100 text-stone-600 border border-stone-200 hover:text-stone-900'
              }`}
              title="Aktifkan/Nonaktifkan lanjut otomatis ke soal berikutnya setelah memilih"
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoAdvance ? 'fill-rose-500 text-rose-600' : 'text-stone-500'}`} />
              <span>Auto-Lanjut: {isAutoAdvance ? 'ON' : 'OFF'}</span>
            </button>

            {/* Flag question */}
            <button
              type="button"
              onClick={toggleFlag}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                flaggedQuestions.has(currentIndex)
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
              }`}
              title="Tandai ragu-ragu"
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">
                {flaggedQuestions.has(currentIndex) ? 'Ditandai' : 'Ragu-ragu'}
              </span>
            </button>
          </div>
        </div>

        {/* Prompt */}
        <p className="text-xs sm:text-sm font-medium text-stone-500 mb-4">
          {currentQ.questionPrompt}
        </p>

        {/* Large Vocab Hero Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-stone-50 border border-stone-200/80 text-center mb-6 relative group">
          {currentQ.questionType === 'id_to_jp' ? (
            <div className="py-2 space-y-2">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                Arti Bahasa Indonesia
              </span>
              <div className="text-2xl sm:text-4xl font-extrabold text-stone-900 leading-snug">
                "{currentQ.meaning}"
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Pilih kosakata Jepang (Kanji / Hiragana) yang sesuai di bawah ini:
              </p>
            </div>
          ) : (
            <>
              {/* Furigana/Hiragana if kanji is different */}
              {currentQ.kanji && currentQ.kanji !== currentQ.hiragana && (
                showHiragana || peekReading ? (
                  <div className="text-sm sm:text-base font-bold text-stone-500 font-jp mb-1 animate-in fade-in">
                    {currentQ.hiragana}
                  </div>
                ) : (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPeekReading(true);
                        sound.playOptionSelect();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-[11px] font-semibold border border-dashed border-stone-300 transition-colors cursor-pointer"
                      title="Klik untuk intip cara baca hiragana untuk soal ini"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Intip Cara Baca (Hiragana)</span>
                    </button>
                  </div>
                )
              )}

              {/* Main Japanese Word */}
              <div className="text-3xl sm:text-5xl font-black text-stone-900 font-jp tracking-wide select-none">
                {currentQ.kanji || currentQ.hiragana}
              </div>

              {/* Sound button (Manual click) */}
              <button
                type="button"
                onClick={() => sound.speakJapanese(currentQ.hiragana || currentQ.japanese)}
                className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-600 border border-stone-200 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Dengarkan pengucapan bahasa Jepang"
              >
                <Volume2 className="w-4 h-4 text-rose-600" />
                <span>Dengarkan Suara</span>
              </button>
            </>
          )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentQ.options.map((option, optIdx) => {
            const isSelected = currentAnswer === optIdx;
            const isCorrect = optIdx === currentQ.correctIndex;

            let buttonStyle =
              'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-800';

            if (isSelected) {
              if (instantFeedback) {
                buttonStyle = isCorrect
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                  : 'border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20';
              } else {
                buttonStyle =
                  'border-rose-600 bg-rose-50/80 text-rose-950 font-semibold ring-2 ring-rose-500/20 shadow-xs';
              }
            } else if (instantFeedback && isAnswered && isCorrect) {
              // Highlight correct answer if user answered wrongly
              buttonStyle =
                'border-emerald-500 bg-emerald-50/60 text-emerald-900 border-dashed';
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`p-3.5 sm:p-4 rounded-xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${buttonStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? instantFeedback
                          ? isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                          : 'bg-rose-600 text-white'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {optionLabels[optIdx]}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold leading-snug">{option}</span>
                </div>

                {/* Status Indicator Icon */}
                {isSelected && (
                  <div>
                    {instantFeedback ? (
                      isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      )
                    ) : (
                      <Check className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Instant Feedback Explanation Box */}
        {instantFeedback && isAnswered && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-medium mb-6 ${
              currentAnswer === currentQ.correctIndex
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold mb-0.5">
              {currentAnswer === currentQ.correctIndex ? '✓ Jawaban Tepat!' : '✕ Jawaban Kurang Tepat'}
            </div>
            <div>{currentQ.explanation}</div>
          </div>
        )}

        {/* Question Footer Navigation Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => {
              setCurrentIndex((i) => Math.max(0, i - 1));
              sound.playOptionSelect();
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
              currentIndex === 0
                ? 'border-stone-200 text-stone-300 cursor-not-allowed bg-stone-50'
                : 'border-stone-200 text-stone-700 hover:bg-stone-100 active:scale-95'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {currentIndex === totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Selesai & Nilai</span>
              <Send className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1));
                sound.playOptionSelect();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-stone-900 hover:bg-stone-800 text-white active:scale-95 transition-all cursor-pointer"
            >
              <span>Berikutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Drawer Modal (jump to any question) */}
      {isNavDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-bold text-stone-900">Peta Navigasi Soal</h3>
              <button
                onClick={() => setIsNavDrawerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 flex items-center gap-3 text-[11px] font-semibold text-stone-500 border-b border-stone-100">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-rose-600" /> Terjawab ({answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-stone-100 border border-stone-300" /> Belum
                ({totalQuestions - answeredCount})
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-md bg-amber-400" /> Ragu ({flaggedQuestions.size})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-5 sm:grid-cols-8 gap-2">
              {questions.map((_, idx) => {
                const isCur = idx === currentIndex;
                const answered = userAnswers[idx] !== undefined;
                const isFlagged = flaggedQuestions.has(idx);

                let bg = 'bg-stone-100 text-stone-600 hover:bg-stone-200';
                if (answered) bg = 'bg-rose-600 text-white hover:bg-rose-700';
                if (isFlagged) bg = 'bg-amber-400 text-amber-950 hover:bg-amber-500';

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsNavDrawerOpen(false);
                      sound.playOptionSelect();
                    }}
                    className={`h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${bg} ${
                      isCur ? 'ring-2 ring-stone-900 font-extrabold scale-105' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsNavDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold cursor-pointer"
            >
              Tutup Navigasi
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">
              Kirim & Selesaikan Kuis?
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Anda telah menjawab <strong>{answeredCount}</strong> dari{' '}
              <strong>{totalQuestions}</strong> soal.
              {answeredCount < totalQuestions && (
                <span className="block text-amber-600 font-bold mt-1">
                  Peringatan: Masih ada {totalQuestions - answeredCount} soal yang belum Anda isi!
                </span>
              )}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleComplete}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-1">Batalkan Kuis Ini?</h3>
            <p className="text-xs text-stone-500 mb-4">
              Progres jawaban kuis yang sedang berjalan akan hilang dan tidak disimpan.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 cursor-pointer"
              >
                Lanjutkan Kuis
              </button>
              <button
                type="button"
                onClick={onExitQuiz}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
