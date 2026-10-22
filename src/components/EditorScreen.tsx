import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  Upload,
  Search,
  Volume2,
  Check,
  X,
  AlertTriangle,
  FileText,
  Filter,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { VocabItem, ChapterMeta } from '../types';
import { sound } from '../utils/audio';
import { StorageManager } from '../utils/storage';

interface EditorScreenProps {
  vocabList: VocabItem[];
  chaptersMeta: Record<number, ChapterMeta>;
  onVocabChange: (newList: VocabItem[]) => void;
  onChaptersChange: (newChapters: Record<number, ChapterMeta>) => void;
  onResetToDefault: () => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  vocabList,
  chaptersMeta,
  onVocabChange,
  onChaptersChange,
  onResetToDefault,
}) => {
  const [selectedBab, setSelectedBab] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<{
    item: VocabItem;
    originalChapter: number;
    originalNo: number;
  } | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemData, setNewItemData] = useState<Partial<VocabItem>>({
    chapter: selectedBab,
    japanese: '',
    kanji: '',
    indonesian: '',
    notes: '',
  });

  // Chapter editing
  const [isEditingChapterTitle, setIsEditingChapterTitle] = useState(false);
  const [customChapterTitle, setCustomChapterTitle] = useState('');

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentChapter = chaptersMeta[selectedBab] || {
    chapter: selectedBab,
    title: `Bab ${selectedBab}`,
    level: selectedBab <= 25 ? 'N5' : 'N4',
  };

  // Filtered vocabulary list
  const chapterVocab = useMemo(() => {
    return vocabList.filter((item) => item.chapter === selectedBab);
  }, [vocabList, selectedBab]);

  const displayList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return chapterVocab;
    return chapterVocab.filter(
      (item) =>
        item.japanese.toLowerCase().includes(q) ||
        (item.kanji && item.kanji.toLowerCase().includes(q)) ||
        item.indonesian.toLowerCase().includes(q)
    );
  }, [chapterVocab, searchQuery]);

  // Open Edit Modal
  const handleStartEdit = (item: VocabItem) => {
    setEditingItem({
      item: { ...item },
      originalChapter: item.chapter,
      originalNo: item.no,
    });
    sound.playOptionSelect();
  };

  // Save Edit Item
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editingItem.item.japanese.trim() || !editingItem.item.indonesian.trim()) {
      sound.playTryAgain();
      showToast('Harap isi Hiragana/Jepang dan Arti Bahasa Indonesia!');
      return;
    }

    const updatedList = StorageManager.updateVocabItem(
      editingItem.item,
      editingItem.originalChapter,
      editingItem.originalNo
    );
    onVocabChange(updatedList);
    setEditingItem(null);
    sound.playCorrect();
    showToast(`Kosakata No. ${editingItem.item.no} berhasil diperbarui!`);
  };

  // Open Add New
  const handleStartAdd = () => {
    const nextNo =
      chapterVocab.length > 0 ? Math.max(...chapterVocab.map((v) => v.no)) + 1 : 1;
    setNewItemData({
      chapter: selectedBab,
      no: nextNo,
      japanese: '',
      kanji: '',
      indonesian: '',
      notes: '',
    });
    setIsAddingNew(true);
    sound.playOptionSelect();
  };

  // Save Add New
  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.japanese?.trim() || !newItemData.indonesian?.trim()) {
      sound.playTryAgain();
      showToast('Harap isi Hiragana/Jepang dan Arti Bahasa Indonesia!');
      return;
    }

    const itemToAdd: VocabItem = {
      chapter: newItemData.chapter || selectedBab,
      no: newItemData.no || (chapterVocab.length + 1),
      japanese: newItemData.japanese.trim(),
      kanji: newItemData.kanji?.trim() || '',
      indonesian: newItemData.indonesian.trim(),
      notes: newItemData.notes?.trim() || '',
    };

    const updatedList = StorageManager.addVocabItem(itemToAdd);
    onVocabChange(updatedList);
    setIsAddingNew(false);
    sound.playCorrect();
    showToast(`Kosakata baru berhasil ditambahkan ke Bab ${itemToAdd.chapter}!`);
  };

  // Delete Item
  const handleDeleteItem = (item: VocabItem) => {
    if (
      window.confirm(
        `Yakin ingin menghapus kata「${item.kanji || item.japanese}」(${item.indonesian})?`
      )
    ) {
      const updatedList = StorageManager.deleteVocabItem(item.chapter, item.no);
      onVocabChange(updatedList);
      sound.playOptionSelect();
      showToast(`Kosakata berhasil dihapus.`);
    }
  };

  // Save Chapter Title
  const handleSaveChapterTitle = () => {
    if (!customChapterTitle.trim()) return;
    const updated = {
      ...chaptersMeta,
      [selectedBab]: {
        ...currentChapter,
        title: customChapterTitle.trim(),
      },
    };
    StorageManager.saveChapters(updated);
    onChaptersChange(updated);
    setIsEditingChapterTitle(false);
    sound.playCorrect();
    showToast(`Judul Bab ${selectedBab} berhasil diperbarui!`);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(vocabList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'minna_no_nihongo_bab_1_50_edited.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('File JSON kosakata berhasil diunduh!');
    sound.playOptionSelect();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content) as VocabItem[];
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].japanese) {
          StorageManager.saveVocabList(parsed);
          onVocabChange(parsed);
          sound.playCorrect();
          showToast(`Berhasil mengimpor ${parsed.length} kosakata!`);
        } else {
          sound.playTryAgain();
          showToast('Format JSON tidak valid atau bukan daftar kosakata!');
        }
      } catch (err) {
        sound.playTryAgain();
        showToast('Gagal membaca file JSON!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-9 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold mb-2">
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Editor Materi & Kosakata</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-jp">
              Kustomisasi & Edit Kotoba (Bab 1–50)
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              Ubah arti bahasa Indonesia, perbaiki Kanji/Hiragana, tambah kosakata baru, atau unduh
              seluruh materi kuis ke format JSON.
            </p>
          </div>

          {/* Action buttons: Export / Import / Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer"
              title="Unduh seluruh data kosakata ke file JSON"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Ekspor JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-stone-500" />
              <span>Impor JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={() => {
                if (
                  window.confirm(
                    'Kembalikan seluruh kosakata dan judul Bab ke standar Minna no Nihongo asli (2,910 kosakata)?'
                  )
                ) {
                  onResetToDefault();
                  showToast('Data berhasil dikembalikan ke standar asli Minna no Nihongo!');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar Asli</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Selection & Editor Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-stone-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs sm:text-sm font-bold text-stone-700 shrink-0">
              Pilih Bab:
            </label>
            <select
              value={selectedBab}
              onChange={(e) => {
                setSelectedBab(Number(e.target.value));
                sound.playOptionSelect();
              }}
              className="px-3.5 py-2 rounded-xl border border-stone-300 bg-stone-50 text-stone-900 font-bold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              {Array.from({ length: 50 }).map((_, i) => {
                const bNum = i + 1;
                const meta = chaptersMeta[bNum];
                const count = vocabList.filter((v) => v.chapter === bNum).length;
                return (
                  <option key={bNum} value={bNum}>
                    Bab {bNum}: {meta?.title || `Bab ${bNum}`} ({count} Kotoba)
                  </option>
                );
              })}
            </select>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
              {currentChapter.level}
            </span>
          </div>

          {/* Add New Word Button */}
          <button
            onClick={handleStartAdd}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kosakata di Bab {selectedBab}</span>
          </button>
        </div>

        {/* Chapter Title Edit Inline */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-500">Judul Bab {selectedBab}:</span>
            {!isEditingChapterTitle ? (
              <span className="text-sm font-extrabold text-stone-900">
                {currentChapter.title}
              </span>
            ) : (
              <input
                type="text"
                value={customChapterTitle}
                onChange={(e) => setCustomChapterTitle(e.target.value)}
                placeholder="Masukkan judul bab baru..."
                className="px-3 py-1 text-xs sm:text-sm rounded-lg border border-stone-300 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditingChapterTitle ? (
              <button
                onClick={() => {
                  setCustomChapterTitle(currentChapter.title);
                  setIsEditingChapterTitle(true);
                  sound.playOptionSelect();
                }}
                className="px-3 py-1 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
              >
                Ubah Judul Bab
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveChapterTitle}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  Simpan Judul
                </button>
                <button
                  onClick={() => setIsEditingChapterTitle(false)}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-stone-500 hover:bg-stone-200 cursor-pointer"
                >
                  Batal
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search within Chapter */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Cari kosakata di Bab ${selectedBab} (Kanji, Hiragana, atau Arti)...`}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 bg-stone-50/50 hover:bg-white"
          />
        </div>
      </div>

      {/* Vocabulary Items Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-600">
          <span>
            Daftar Kosakata Bab {selectedBab} ({displayList.length} Kata)
          </span>
          <span className="text-[11px] text-stone-400">
            Klik 'Edit' untuk mengubah tulisan atau arti
          </span>
        </div>

        {displayList.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            Tidak ada kosakata yang cocok dengan pencarian "{searchQuery}".
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {displayList.map((item) => (
              <div
                key={`${item.chapter}-${item.no}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors"
              >
                {/* Left: Number + Japanese + Kanji */}
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {item.no}
                  </span>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base sm:text-lg font-black text-stone-900 font-jp">
                        {item.kanji || item.japanese}
                      </span>
                      {item.kanji && item.kanji !== item.japanese && (
                        <span className="text-xs font-semibold text-rose-600 font-jp">
                          ({item.japanese})
                        </span>
                      )}
                      <button
                        onClick={() => sound.speakJapanese(item.japanese)}
                        className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
                        title="Dengarkan pengucapan"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs sm:text-sm font-medium text-stone-700 mt-0.5">
                      {item.indonesian}
                    </div>

                    {item.notes && (
                      <div className="text-[11px] text-stone-400 italic mt-0.5">{item.notes}</div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleStartEdit(item)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3 text-stone-500" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item)}
                    className="p-1.5 rounded-xl border border-stone-200 hover:bg-rose-50 text-stone-400 hover:text-rose-600 transition-all cursor-pointer"
                    title="Hapus kata ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Word Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Edit Kosakata No. {editingItem.item.no} (Bab {editingItem.item.chapter})
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Hiragana / Pelafalan Jepang <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingItem.item.japanese}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, japanese: e.target.value },
                      })
                    }
                    placeholder="Contoh: わたし, たべます"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 font-jp text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => sound.speakJapanese(editingItem.item.japanese)}
                    className="px-3 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-600 cursor-pointer"
                    title="Cek Suara"
                  >
                    <Volume2 className="w-4 h-4 text-rose-600" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kanji (Opsional jika ada)
                </label>
                <input
                  type="text"
                  value={editingItem.item.kanji || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, kanji: e.target.value },
                    })
                  }
                  placeholder="Contoh: 私, 食べます"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-jp text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Arti Bahasa Indonesia <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingItem.item.indonesian}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, indonesian: e.target.value },
                    })
                  }
                  placeholder="Contoh: Saya, Makan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Pindah ke Bab
                  </label>
                  <select
                    value={editingItem.item.chapter}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, chapter: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {Array.from({ length: 50 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Bab {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nomor Urut</label>
                  <input
                    type="number"
                    value={editingItem.item.no}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        item: { ...editingItem.item, no: Number(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={editingItem.item.notes || ''}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, notes: e.target.value },
                    })
                  }
                  placeholder="Contoh: kata kerja kelompok 1, bentuk formal"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Word Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Tambah Kosakata Baru ke Bab {selectedBab}
              </h3>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Hiragana / Tulisan Jepang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItemData.japanese || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, japanese: e.target.value })}
                  placeholder="Contoh: べんきょうします"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-jp text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Kanji (Opsional)
                </label>
                <input
                  type="text"
                  value={newItemData.kanji || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, kanji: e.target.value })}
                  placeholder="Contoh: 勉強します"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-jp text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Arti Bahasa Indonesia <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newItemData.indonesian || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, indonesian: e.target.value })}
                  placeholder="Contoh: Belajar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Bab</label>
                  <select
                    value={newItemData.chapter || selectedBab}
                    onChange={(e) =>
                      setNewItemData({ ...newItemData, chapter: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {Array.from({ length: 50 }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Bab {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Nomor Urut</label>
                  <input
                    type="number"
                    value={newItemData.no || 1}
                    onChange={(e) => setNewItemData({ ...newItemData, no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={newItemData.notes || ''}
                  onChange={(e) => setNewItemData({ ...newItemData, notes: e.target.value })}
                  placeholder="Contoh: Kata benda, kata sifat-na"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Tambahkan Kosakata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
