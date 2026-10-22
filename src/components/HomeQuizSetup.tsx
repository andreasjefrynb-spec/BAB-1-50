import React, { useState, useMemo } from 'react';
import {
  User,
  AlertCircle,
  Clock,
  Play,
  ArrowRight,
  Check,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { ChapterMeta, QuizConfig, VocabItem, AppView } from '../types';
import { sound } from '../utils/audio';
import { calculateTimeLimit } from '../utils/quizGenerator';
import { StorageManager } from '../utils/storage';

interface HomeQuizSetupProps {
  vocabList: VocabItem[];
  chaptersMeta: Record<number, ChapterMeta>;
  initialName: string;
  onStartQuiz: (config: QuizConfig) => void;
  onNavigate: (view: AppView) => void;
}

export const HomeQuizSetup: React.FC<HomeQuizSetupProps> = ({
  vocabList,
  chaptersMeta,
  initialName,
  onStartQuiz,
  onNavigate,
}) => {
  const [participantName, setParticipantName] = useState(initialName || '');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('bab1');
  const [activeTabRange, setActiveTabRange] = useState<number>(0); // 0: 1-10, 1: 11-20, 2: 21-30, 3: 31-40, 4: 41-50, 5: Preset
  const [questionLimit, setQuestionLimit] = useState<'all' | 10 | 20 | 30>('all');
  const [direction, setDirection] = useState<'jp_to_id' | 'id_to_jp' | 'mixed'>('jp_to_id');
  const [instantFeedback, setInstantFeedback] = useState<boolean>(false);
  const [showHiragana, setShowHiragana] = useState<boolean>(() => StorageManager.getShowHiragana());
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => StorageManager.getAutoPlayAudio());
  const [autoAdvance, setAutoAdvance] = useState<boolean>(() => StorageManager.getAutoAdvance());

  // Range tabs
  const rangeTabs = [
    { idx: 0, label: '1–10' },
    { idx: 1, label: '11–20' },
    { idx: 2, label: '21–30' },
    { idx: 3, label: '31–40' },
    { idx: 4, label: '41–50' },
    { idx: 5, label: 'Paket / Ujian' },
  ];

  // Active Bab Information
  const currentDetails = useMemo(() => {
    if (selectedMode === 'all') {
      return {
        label: 'Semua Bab (Bab 1–50)',
        questionCount:
          questionLimit === 'all' ? Math.min(vocabList.length, 50) : questionLimit,
        totalPoolCount: vocabList.length,
        babNum: '1–50',
        level: 'N5 & N4',
      };
    }
    if (selectedMode === 'shokyuu1') {
      const pool = vocabList.filter((v) => v.chapter <= 25);
      return {
        label: 'Shokyuu 1 (N5: Bab 1–25)',
        questionCount: questionLimit === 'all' ? Math.min(pool.length, 30) : questionLimit,
        totalPoolCount: pool.length,
        babNum: '1–25',
        level: 'N5',
      };
    }
    if (selectedMode === 'shokyuu2') {
      const pool = vocabList.filter((v) => v.chapter >= 26);
      return {
        label: 'Shokyuu 2 (N4: Bab 26–50)',
        questionCount: questionLimit === 'all' ? Math.min(pool.length, 30) : questionLimit,
        totalPoolCount: pool.length,
        babNum: '26–50',
        level: 'N4',
      };
    }

    const babNum = parseInt(selectedMode.replace('bab', ''), 10) || 1;
    const pool = vocabList.filter((v) => v.chapter === babNum);
    const meta = chaptersMeta[babNum];
    const totalCount = pool.length;
    const qCount =
      questionLimit === 'all'
        ? totalCount
        : Math.min(totalCount, questionLimit);

    return {
      label: `Bab ${babNum}: ${meta?.title || 'Minna no Nihongo'}`,
      questionCount: qCount,
      totalPoolCount: totalCount,
      babNum: `${babNum}`,
      level: meta?.level || (babNum <= 25 ? 'N5' : 'N4'),
    };
  }, [selectedMode, vocabList, chaptersMeta, questionLimit]);

  const timeLimitSeconds = useMemo(() => {
    return calculateTimeLimit(currentDetails.questionCount);
  }, [currentDetails.questionCount]);

  const timeLimitMin = Math.ceil(timeLimitSeconds / 60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    const trimmed = participantName.trim();
    if (!trimmed) {
      sound.playTryAgain();
      return;
    }
    sound.playOptionSelect();
    StorageManager.setShowHiragana(showHiragana);
    StorageManager.setAutoPlayAudio(autoPlayAudio);
    StorageManager.setAutoAdvance(autoAdvance);
    onStartQuiz({
      participantName: trimmed,
      mode: selectedMode,
      questionLimit,
      questionType: direction,
      instantFeedback,
      showHiraganaForKanji: showHiragana,
      autoPlayAudio,
      autoAdvance,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Header Info */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-jp">
          日本語クラス
        </h1>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-md shadow-stone-200/60 border border-stone-200 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500" />

        <form onSubmit={handleSubmit} className="p-4 sm:p-7 space-y-6">
          {/* 1. Participant Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="participantName"
                className="block text-xs sm:text-sm font-bold text-stone-800"
              >
                Nama Peserta <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="participantName"
                type="text"
                value={participantName}
                onChange={(e) => {
                  setParticipantName(e.target.value);
                  if (hasSubmitted && e.target.value.trim()) {
                    setHasSubmitted(false);
                  }
                }}
                placeholder="Masukkan nama lengkap peserta"
                className={`w-full pl-10 pr-3.5 py-3 rounded-xl border text-stone-900 placeholder:text-stone-400 text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                  hasSubmitted && !participantName.trim()
                    ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 focus:bg-white focus:border-stone-800 focus:ring-stone-200'
                }`}
                autoComplete="name"
              />
            </div>
            {hasSubmitted && !participantName.trim() && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Nama wajib diisi sebelum mulai kuis!</span>
              </div>
            )}
          </div>

          {/* 2. Chapter Range Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-bold text-stone-800">
                Pilih Bab Kuis (Bab 1–50)
              </label>
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                {currentDetails.babNum.includes('–')
                  ? `${currentDetails.label}`
                  : `Bab ${currentDetails.babNum}: ${currentDetails.questionCount} Soal`}
              </span>
            </div>

            {/* Range Pagination Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-stone-100 rounded-xl">
              {rangeTabs.map((tab) => (
                <button
                  key={tab.idx}
                  type="button"
                  onClick={() => {
                    setActiveTabRange(tab.idx);
                    sound.playOptionSelect();
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    activeTabRange === tab.idx
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Standard Bab Grids */}
            {activeTabRange < 5 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const babNumber = activeTabRange * 10 + (idx + 1);
                  if (babNumber > 50) return null;
                  const isSelected = selectedMode === `bab${babNumber}`;
                  const count = vocabList.filter((v) => v.chapter === babNumber).length;
                  const chapterData = chaptersMeta[babNumber];

                  return (
                    <button
                      key={babNumber}
                      type="button"
                      onClick={() => {
                        setSelectedMode(`bab${babNumber}`);
                        sound.playOptionSelect();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/90 text-rose-950 font-semibold ring-2 ring-rose-500/20 shadow-xs'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">Bab {babNumber}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                      </div>
                      <div className="text-[11px] font-bold text-rose-600 mt-0.5">
                        {count} Kotoba
                      </div>
                      <div
                        className="text-[10px] text-stone-400 truncate mt-0.5"
                        title={chapterData?.title}
                      >
                        {chapterData?.title || 'Minna no Nihongo'}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Preset Bundles (Shokyuu 1, Shokyuu 2, All Bab) */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'shokyuu1',
                    title: 'Shokyuu 1 (N5)',
                    sub: 'Bab 1 s/d Bab 25',
                    count: vocabList.filter((v) => v.chapter <= 25).length,
                  },
                  {
                    id: 'shokyuu2',
                    title: 'Shokyuu 2 (N4)',
                    sub: 'Bab 26 s/d Bab 50',
                    count: vocabList.filter((v) => v.chapter >= 26).length,
                  },
                  {
                    id: 'all',
                    title: 'Semua Bab (N5 & N4)',
                    sub: 'Bab 1 s/d 50 Lengkap',
                    count: vocabList.length,
                  },
                ].map((preset) => {
                  const isSelected = selectedMode === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedMode(preset.id);
                        sound.playOptionSelect();
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-rose-600 bg-rose-50/90 ring-2 ring-rose-500/20 shadow-xs text-rose-950'
                          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900">{preset.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-rose-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">{preset.sub}</p>
                      <span className="inline-block mt-2 text-[10px] font-bold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        {preset.count} Kosakata
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Quiz Options: Question Limit & Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Question Count */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Jumlah Soal Kuis</label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl">
                {[
                  { value: 'all', label: 'Semua' },
                  { value: 10, label: '10 Soal' },
                  { value: 20, label: '20 Soal' },
                  { value: 30, label: '30 Soal' },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      setQuestionLimit(opt.value as 'all' | 10 | 20 | 30);
                      sound.playOptionSelect();
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      questionLimit === opt.value
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Direction */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-700">Tipe Soal</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl">
                {[
                  { value: 'jp_to_id', label: '🇯🇵 ➔ 🇮🇩' },
                  { value: 'id_to_jp', label: '🇮🇩 ➔ 🇯🇵' },
                  { value: 'mixed', label: 'Mix Acak' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setDirection(opt.value as 'jp_to_id' | 'id_to_jp' | 'mixed');
                      sound.playOptionSelect();
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      direction === opt.value
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Settings Toggles */}
          <div className="space-y-2.5">
            {/* Hiragana toggle for Kanji */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-jp font-bold text-xs shrink-0">
                  あ/漢
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800">Tampilkan Hiragana (Cara Baca)</span>
                  <p className="text-[11px] text-stone-500">
                    {showHiragana
                      ? 'Aktif: Furigana/hiragana dimunculkan di atas Kanji'
                      : 'Nonaktif: Hanya Kanji yang ditampilkan (uji hafalan kanji)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !showHiragana;
                  setShowHiragana(next);
                  StorageManager.setShowHiragana(next);
                  sound.playOptionSelect();
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  showHiragana ? 'bg-rose-600' : 'bg-stone-300'
                }`}
                title="Aktifkan/Nonaktifkan Hiragana untuk kata ber-Kanji"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showHiragana ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio auto-play toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center shrink-0">
                  {autoPlayAudio ? <Volume2 className="w-4 h-4 text-rose-600" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800">Putar Audio Otomatis</span>
                  <p className="text-[11px] text-stone-500">
                    {autoPlayAudio
                      ? 'Aktif: Suara Jepang otomatis diputar saat membuka soal'
                      : 'Mati: Audio tidak berputar otomatis (tekan tombol suara manual)'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !autoPlayAudio;
                  setAutoPlayAudio(next);
                  StorageManager.setAutoPlayAudio(next);
                  sound.playOptionSelect();
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  autoPlayAudio ? 'bg-rose-600' : 'bg-stone-300'
                }`}
                title="Aktifkan/Nonaktifkan putar audio otomatis"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoPlayAudio ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto-Advance toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-800">Lanjut Otomatis (Auto-Advance)</span>
                  <p className="text-[11px] text-stone-500">
                    {autoAdvance
                      ? 'Aktif: Otomatis lanjut ke nomor berikutnya setelah memilih jawaban'
                      : 'Mati: Menekan tombol "Berikutnya" manual setelah memilih jawaban'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !autoAdvance;
                  setAutoAdvance(next);
                  StorageManager.setAutoAdvance(next);
                  sound.playOptionSelect();
                }}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  autoAdvance ? 'bg-rose-600' : 'bg-stone-300'
                }`}
                title="Aktifkan/Nonaktifkan lanjut otomatis ke soal berikutnya"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoAdvance ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 5. Test Rules Notice Box */}
          <div className="p-4 rounded-xl bg-stone-50/90 border border-stone-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Ketentuan & Informasi Tes:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-stone-600 pl-4 list-disc marker:text-rose-500">
              <li>
                <strong>{currentDetails.questionCount} Soal Pilihan Ganda</strong>: Menebak kosakata{' '}
                {currentDetails.label}.
              </li>
              <li>
                <strong>Durasi Waktu {timeLimitMin} Menit</strong> ({timeLimitSeconds} detik): Timer
                hitung mundur otomatis menyelesaikan kuis jika waktu habis.
              </li>
              <li>
                <strong>Standar Kelulusan:</strong> Nilai minimal 75% untuk memperoleh predikat{' '}
                <span className="text-emerald-700 font-bold">LULUS (合格)</span>.
              </li>
            </ul>
          </div>

          {/* 6. Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Kuis {currentDetails.label.split(':')[0]}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
