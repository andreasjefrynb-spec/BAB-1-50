import React, { useState } from 'react';
import {
  Award,
  Trash2,
  Share2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { QuizResult, AppView } from '../types';
import { sound } from '../utils/audio';
import { StorageManager } from '../utils/storage';
import { createWhatsAppShareUrl } from '../utils/quizGenerator';

interface HistoryScreenProps {
  onSelectResult: (result: QuizResult) => void;
  onNavigate: (view: AppView) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  onSelectResult,
  onNavigate,
}) => {
  const [history, setHistory] = useState<QuizResult[]>(() =>
    StorageManager.getQuizHistory()
  );

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat hasil kuis?')) {
      StorageManager.clearHistory();
      setHistory([]);
      sound.playOptionSelect();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-9 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-rose-600" />
            <span>Rekam Jejak Kuis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jp">
            Riwayat Nilai Peserta
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Daftar hasil pengerjaan kuis Minna no Nihongo yang telah diselesaikan di perangkat ini.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-500 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Belum Ada Riwayat Kuis</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Anda belum pernah menyelesaikan kuis. Mulai kuis pertama Anda sekarang untuk mencatat
            nilai!
          </p>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Mulai Kuis Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-stone-300 transition-all"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase ${
                      item.isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {item.isPassed ? 'LULUS (合格)' : 'BELUM LULUS'}
                  </span>
                  <span className="text-xs font-bold text-stone-900">{item.chapterModeTitle}</span>
                </div>

                <div className="text-xs text-stone-600">
                  Peserta: <strong className="text-stone-900">{item.participantName}</strong> •{' '}
                  <span className="text-stone-400">{item.completedAt}</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-semibold text-stone-500 pt-1">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.correctCount} Benar</span>
                  </span>
                  <span className="flex items-center gap-1 text-rose-600">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{item.wrongCount} Salah</span>
                  </span>
                  <span className="flex items-center gap-1 text-stone-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{item.totalQuestions} Soal</span>
                  </span>
                </div>
              </div>

              {/* Right Side: Score & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono">
                    {item.score}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const url = createWhatsAppShareUrl(item);
                      window.open(url, '_blank');
                    }}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors cursor-pointer"
                    title="Kirim ke WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onSelectResult(item)}
                    className="px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Buka Pembahasan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
