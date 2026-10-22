import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Volume2,
  ArrowRight,
  BookOpen,
  Home,
  MessageSquare,
  Sparkles,
  Target,
} from 'lucide-react';
import { QuizResult, QuizQuestion, AppView } from '../types';
import { sound } from '../utils/audio';
import {
  formatSeconds,
  generateWhatsAppMessage,
  createWhatsAppShareUrl,
} from '../utils/quizGenerator';

interface ResultScreenProps {
  result: QuizResult;
  onRetake: () => void;
  onStartRemedial?: (wrongQuestions: QuizQuestion[]) => void;
  onNextChapter?: () => void;
  onNavigate: (view: AppView) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRetake,
  onStartRemedial,
  onNextChapter,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [showWaPreview, setShowWaPreview] = useState(false);

  const wrongQuestions = result.questions.filter(
    (q, idx) => result.userAnswers[idx] !== q.correctIndex
  );

  // Trigger confetti if passed
  useEffect(() => {
    if (result.isPassed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#f59e0b', '#10b981', '#3b82f6'],
        });
      } catch {}
    }
  }, [result.isPassed]);

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppMessage(result);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      sound.playOptionSelect();
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleShareWhatsApp = () => {
    sound.playOptionSelect();
    const url = createWhatsAppShareUrl(result);
    window.open(url, '_blank');
  };

  const filteredQuestions = result.questions.filter((q, idx) => {
    const isCorrect = result.userAnswers[idx] === q.correctIndex;
    if (reviewFilter === 'wrong') return !isCorrect;
    if (reviewFilter === 'correct') return isCorrect;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      {/* Hero Score Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 shadow-md shadow-stone-200/60 border border-stone-200 text-center relative overflow-hidden">
        {/* Top Accent Gradient */}
        <div
          className={`absolute top-0 left-0 right-0 h-2 ${
            result.isPassed
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
              : 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600'
          }`}
        />

        {/* Badge status */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 bg-stone-100 text-stone-800 border border-stone-200">
          <span>{result.chapterModeTitle}</span>
        </div>

        {/* Status Title */}
        <h1
          className={`text-2xl sm:text-3xl font-extrabold font-jp tracking-tight ${
            result.isPassed ? 'text-emerald-700' : 'text-rose-700'
          }`}
        >
          {result.isPassed ? 'LULUS (合格) 🎉' : 'BELUM LULUS (不合格) 💪'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Peserta: <strong className="text-stone-800">{result.participantName}</strong> • Diselesaikan{' '}
          {result.completedAt}
        </p>

        {/* Circular / Score Display */}
        <div className="my-6">
          <div className="inline-block p-5 rounded-3xl bg-stone-50 border border-stone-200 shadow-inner">
            <div className="text-5xl sm:text-6xl font-black text-stone-900 font-mono tracking-tight">
              {result.score}
              <span className="text-2xl sm:text-3xl font-normal text-stone-400">/100</span>
            </div>
            <div className="text-xs font-bold text-stone-500 mt-1">
              Standar Kelulusan: Nilai Minimal 75
            </div>
          </div>
        </div>

        {/* Breakdown Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl mx-auto mb-6">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950">
            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Benar</span>
            </div>
            <div className="text-xl font-extrabold">{result.correctCount}</div>
            <div className="text-[10px] text-emerald-700">dari {result.totalQuestions} Soal</div>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 text-rose-950">
            <div className="flex items-center justify-center gap-1 text-rose-600 text-xs font-bold mb-0.5">
              <XCircle className="w-3.5 h-3.5" />
              <span>Salah</span>
            </div>
            <div className="text-xl font-extrabold">{result.wrongCount}</div>
            <div className="text-[10px] text-rose-700">Perlu Diulang</div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900">
            <div className="flex items-center justify-center gap-1 text-stone-500 text-xs font-bold mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pengerjaan</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono">
              {formatSeconds(result.timeSpentSeconds)}
            </div>
            <div className="text-[10px] text-stone-500">Waktu Diambil</div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-900">
            <div className="flex items-center justify-center gap-1 text-stone-500 text-xs font-bold mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sisa Waktu</span>
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono">
              {formatSeconds(result.timeRemainingSeconds)}
            </div>
            <div className="text-[10px] text-stone-500">Dari Timer</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {wrongQuestions.length > 0 && onStartRemedial && (
            <button
              type="button"
              onClick={() => onStartRemedial(wrongQuestions)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
            >
              <Target className="w-4 h-4" />
              <span>Latih {wrongQuestions.length} Soal Salah (Remedial)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-800 font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Kuis</span>
          </button>

          {onNextChapter && (
            <button
              type="button"
              onClick={onNextChapter}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span>Bab Berikutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 font-semibold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Pilih Bab Lain</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Score Report Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-stone-900">
              Kirim Laporan Nilai ke WhatsApp
            </h3>
            <p className="text-xs text-stone-500">
              Bagikan hasil kuis resmi Anda ke grup WhatsApp kelas atau simpan salinannya.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 mt-4">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Kirim Hasil ke Grup WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-50 active:scale-[0.99] text-stone-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Teks Laporan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowWaPreview(!showWaPreview)}
            className="w-full sm:w-auto py-3 px-3 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showWaPreview ? 'Sembunyikan' : 'Lihat'} Teks</span>
            {showWaPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* WhatsApp Preview */}
        {showWaPreview && (
          <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-mono text-stone-700 whitespace-pre-wrap leading-relaxed select-all">
            {generateWhatsAppMessage(result)}
          </div>
        )}
      </div>

      {/* Pembahasan / Review Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
          <div>
            <h3 className="text-base font-extrabold text-stone-900">
              Evaluasi & Pembahasan Soal
            </h3>
            <p className="text-xs text-stone-500">
              Pelajari kembali arti kosakata dan dengarkan pelafalannya.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reviewFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Semua ({result.totalQuestions})
            </button>
            <button
              onClick={() => setReviewFilter('wrong')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reviewFilter === 'wrong'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-rose-600'
              }`}
            >
              Salah ({result.wrongCount})
            </button>
            <button
              onClick={() => setReviewFilter('correct')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                reviewFilter === 'correct'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-500 hover:text-emerald-600'
              }`}
            >
              Benar ({result.correctCount})
            </button>
          </div>
        </div>

        {/* Questions Review List */}
        {reviewFilter === 'wrong' && wrongQuestions.length > 0 && onStartRemedial && (
          <div className="mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-rose-900 text-xs">
              <Target className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Fokus perbaiki <strong>{wrongQuestions.length} kosakata</strong> yang belum tepat dengan mode remedial.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onStartRemedial(wrongQuestions)}
              className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-all shrink-0"
            >
              Mulai Remedial ({wrongQuestions.length})
            </button>
          </div>
        )}

        <div className="divide-y divide-stone-100 mt-2">
          {filteredQuestions.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              Tidak ada soal dalam kategori ini.
            </div>
          ) : (
            filteredQuestions.map((q, reviewIdx) => {
              const originalIndex = result.questions.findIndex((item) => item.id === q.id);
              const userAnswerIndex = result.userAnswers[originalIndex];
              const isCorrect = userAnswerIndex === q.correctIndex;

              return (
                <div key={q.id} className="py-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {originalIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-stone-500">{q.category}</span>
                    </div>

                    <button
                      onClick={() => sound.speakJapanese(q.hiragana || q.japanese)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Audio</span>
                    </button>
                  </div>

                  {/* Japanese Word */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-black text-stone-900 font-jp">
                      {q.kanji || q.hiragana}
                    </span>
                    {q.kanji && q.kanji !== q.hiragana && (
                      <span className="text-xs font-medium text-stone-500 font-jp">
                        ({q.hiragana})
                      </span>
                    )}
                  </div>

                  {/* Answer Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          : 'bg-rose-50/50 border-rose-200 text-rose-950'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                        Jawaban Anda:
                      </span>
                      <div className="font-semibold mt-0.5">
                        {userAnswerIndex !== undefined
                          ? q.options[userAnswerIndex]
                          : 'Tidak Dijawab'}
                      </div>
                    </div>

                    {!isCorrect && (
                      <div className="p-2.5 rounded-xl border bg-emerald-50/60 border-emerald-200 text-emerald-950">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">
                          Jawaban Benar:
                        </span>
                        <div className="font-semibold mt-0.5">{q.options[q.correctIndex]}</div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-stone-500 italic">{q.explanation}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
