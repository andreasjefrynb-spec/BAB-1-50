import React, { useState, useMemo } from 'react';
import {
  Search,
  Volume2,
  Bookmark,
  Edit3,
  HelpCircle,
  Layers,
  Check,
  Star,
  BookOpen,
  Filter,
} from 'lucide-react';
import { VocabItem, ChapterMeta, AppView } from '../types';
import { sound } from '../utils/audio';
import { StorageManager } from '../utils/storage';

interface DictionaryScreenProps {
  vocabList: VocabItem[];
  chaptersMeta: Record<number, ChapterMeta>;
  onNavigate: (view: AppView) => void;
  onEditItemInEditor: (item: VocabItem) => void;
}

export const DictionaryScreen: React.FC<DictionaryScreenProps> = ({
  vocabList,
  chaptersMeta,
  onNavigate,
  onEditItemInEditor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBab, setSelectedBab] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | 'N5' | 'N4'>('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<string[]>(() =>
    StorageManager.getBookmarks()
  );

  const toggleBookmark = (key: string) => {
    sound.playOptionSelect();
    StorageManager.toggleBookmark(key);
    setBookmarkedKeys(StorageManager.getBookmarks());
  };

  const filteredList = useMemo(() => {
    return vocabList.filter((item) => {
      const key = `${item.chapter}-${item.no}`;

      // Bookmark filter
      if (onlyBookmarked && !bookmarkedKeys.includes(key)) {
        return false;
      }

      // Level filter
      if (levelFilter === 'N5' && item.chapter > 25) return false;
      if (levelFilter === 'N4' && item.chapter <= 25) return false;

      // Bab filter
      if (selectedBab !== 'all' && item.chapter !== Number(selectedBab)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inJp = item.japanese.toLowerCase().includes(q);
        const inKanji = item.kanji && item.kanji.toLowerCase().includes(q);
        const inId = item.indonesian.toLowerCase().includes(q);
        return inJp || inKanji || inId;
      }

      return true;
    });
  }, [vocabList, searchQuery, selectedBab, levelFilter, onlyBookmarked, bookmarkedKeys]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-9 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5 text-rose-600" />
              <span>Kamus & Daftar Kosakata</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jp">
              Kamus Lengkap Minna no Nihongo (Bab 1–50)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Jelajahi seluruh 2,910 kosakata resmi, dengarkan audio pelafalan, beri bintang favorit,
              dan pelajari artinya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 cursor-pointer transition-all"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Mulai Kuis</span>
            </button>
            <button
              onClick={() => onNavigate('flashcards')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold cursor-pointer transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Flashcard</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4 border-t border-stone-100">
          {/* Search bar */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Kanji, Hiragana, atau Arti..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 hover:bg-white"
            />
          </div>

          {/* Bab selector */}
          <div className="sm:col-span-3">
            <select
              value={selectedBab}
              onChange={(e) => {
                setSelectedBab(e.target.value);
                sound.playOptionSelect();
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">Semua Bab (Bab 1–50)</option>
              {Array.from({ length: 50 }).map((_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  Bab {i + 1}: {chaptersMeta[i + 1]?.title || `Bab ${i + 1}`}
                </option>
              ))}
            </select>
          </div>

          {/* Level filter */}
          <div className="sm:col-span-2">
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value as 'all' | 'N5' | 'N4');
                sound.playOptionSelect();
              }}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">Semua Level</option>
              <option value="N5">Level N5 (Bab 1–25)</option>
              <option value="N4">Level N4 (Bab 26–50)</option>
            </select>
          </div>

          {/* Starred Only Toggle */}
          <div className="sm:col-span-2">
            <button
              onClick={() => {
                setOnlyBookmarked(!onlyBookmarked);
                sound.playOptionSelect();
              }}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                onlyBookmarked
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  onlyBookmarked ? 'fill-amber-500 text-amber-500' : 'text-stone-400'
                }`}
              />
              <span>Bintang ({bookmarkedKeys.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs font-bold text-stone-500 px-1">
        <span>Menampilkan {filteredList.length} kosakata</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-rose-600 hover:underline cursor-pointer"
          >
            Hapus Pencarian
          </button>
        )}
      </div>

      {/* Vocabulary List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredList.slice(0, 150).map((item) => {
          const key = `${item.chapter}-${item.no}`;
          const isStarred = bookmarkedKeys.includes(key);
          const chapterData = chaptersMeta[item.chapter];

          return (
            <div
              key={key}
              className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200 flex flex-col justify-between gap-3 hover:border-stone-300 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Star Toggle */}
                  <button
                    onClick={() => toggleBookmark(key)}
                    className="p-1 rounded-lg text-stone-300 hover:text-amber-500 cursor-pointer transition-colors shrink-0 mt-0.5"
                    title={isStarred ? 'Hapus Bintang' : 'Tandai Bintang'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isStarred ? 'fill-amber-400 text-amber-500' : 'text-stone-300'
                      }`}
                    />
                  </button>

                  <div>
                    {/* Chapter & No. */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                        Bab {item.chapter} • No. {item.no}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 truncate max-w-[150px]">
                        {chapterData?.title}
                      </span>
                    </div>

                    {/* Japanese Word */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-stone-900 font-jp">
                        {item.kanji || item.japanese}
                      </span>
                      {item.kanji && item.kanji !== item.japanese && (
                        <span className="text-xs font-semibold text-rose-600 font-jp">
                          ({item.japanese})
                        </span>
                      )}
                    </div>

                    {/* Meaning */}
                    <p className="text-xs sm:text-sm font-semibold text-stone-700 mt-1">
                      {item.indonesian}
                    </p>

                    {item.notes && (
                      <p className="text-[11px] text-stone-400 italic mt-0.5">{item.notes}</p>
                    )}
                  </div>
                </div>

                {/* Pronounce Audio Button */}
                <button
                  onClick={() => sound.speakJapanese(item.japanese)}
                  className="p-2 rounded-xl bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-600 border border-stone-200 transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Dengarkan pengucapan"
                >
                  <Volume2 className="w-4 h-4 text-rose-600" />
                </button>
              </div>

              {/* Card Footer: Quick Edit action */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-[11px]">
                <button
                  onClick={() => onEditItemInEditor(item)}
                  className="inline-flex items-center gap-1 text-stone-400 hover:text-amber-700 font-semibold cursor-pointer"
                >
                  <Edit3 className="w-3 h-3 text-amber-600" />
                  <span>Edit Kata Ini</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length > 150 && (
        <div className="text-center py-4 text-xs font-semibold text-stone-500">
          Menampilkan 150 kata pertama. Gunakan filter Bab atau pencarian untuk melihat kata
          spesifik lainnya.
        </div>
      )}
    </div>
  );
};
