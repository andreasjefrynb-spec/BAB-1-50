import defaultVocabData from '../vocab_data.json';
import defaultChaptersData from '../chapters.json';
import { VocabItem, ChapterMeta, QuizResult } from '../types';

const STORAGE_KEYS = {
  VOCAB: 'nihongo_vocab_items_v1',
  CHAPTERS: 'nihongo_chapters_v1',
  BOOKMARKS: 'nihongo_bookmarked_ids',
  HISTORY: 'nihongo_quiz_history_v1',
  LAST_NAME: 'nihongo_last_participant_name',
  IS_CUSTOMIZED: 'nihongo_data_customized',
  SHOW_HIRAGANA: 'nihongo_show_hiragana_reading',
  AUTO_PLAY_AUDIO: 'nihongo_auto_play_audio',
  AUTO_ADVANCE: 'nihongo_auto_advance_questions',
};

export class StorageManager {
  // Load all vocabularies
  public static getVocabList(): VocabItem[] {
    if (typeof window === 'undefined') return defaultVocabData as VocabItem[];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOCAB);
      if (stored) {
        return JSON.parse(stored) as VocabItem[];
      }
    } catch {
      // Fallback
    }
    // First time initialization
    return defaultVocabData as VocabItem[];
  }

  // Save all vocabularies
  public static saveVocabList(items: VocabItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(items));
      localStorage.setItem(STORAGE_KEYS.IS_CUSTOMIZED, 'true');
    } catch (e) {
      console.error('Failed to save vocabulary to localStorage:', e);
    }
  }

  // Load chapters metadata
  public static getChapters(): Record<number, ChapterMeta> {
    if (typeof window === 'undefined') return defaultChaptersData as Record<number, ChapterMeta>;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CHAPTERS);
      if (stored) {
        return JSON.parse(stored) as Record<number, ChapterMeta>;
      }
    } catch {}
    return defaultChaptersData as Record<number, ChapterMeta>;
  }

  // Save chapters metadata
  public static saveChapters(chapters: Record<number, ChapterMeta>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(chapters));
      localStorage.setItem(STORAGE_KEYS.IS_CUSTOMIZED, 'true');
    } catch (e) {
      console.error('Failed to save chapters:', e);
    }
  }

  // Check if user has modified vocabulary
  public static isCustomized(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.IS_CUSTOMIZED) === 'true';
  }

  // Reset to original Minna no Nihongo 1-50 dataset
  public static resetToDefault(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.VOCAB);
    localStorage.removeItem(STORAGE_KEYS.CHAPTERS);
    localStorage.removeItem(STORAGE_KEYS.IS_CUSTOMIZED);
  }

  // Update a single vocab item
  public static updateVocabItem(updated: VocabItem, originalChapter: number, originalNo: number): VocabItem[] {
    const list = this.getVocabList();
    const idx = list.findIndex(
      (item) => item.chapter === originalChapter && item.no === originalNo
    );
    if (idx !== -1) {
      list[idx] = updated;
    } else {
      list.push(updated);
    }
    this.saveVocabList(list);
    return list;
  }

  // Add a new vocab item
  public static addVocabItem(newItem: VocabItem): VocabItem[] {
    const list = this.getVocabList();
    list.push(newItem);
    this.saveVocabList(list);
    return list;
  }

  // Delete a vocab item
  public static deleteVocabItem(chapter: number, no: number): VocabItem[] {
    const list = this.getVocabList();
    const filtered = list.filter((item) => !(item.chapter === chapter && item.no === no));
    this.saveVocabList(filtered);
    return filtered;
  }

  // Bookmarks
  public static getBookmarks(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public static toggleBookmark(key: string): boolean {
    const bookmarks = this.getBookmarks();
    const idx = bookmarks.indexOf(key);
    let isBookmarked = false;
    if (idx !== -1) {
      bookmarks.splice(idx, 1);
    } else {
      bookmarks.push(key);
      isBookmarked = true;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch {}
    return isBookmarked;
  }

  // History
  public static getQuizHistory(): QuizResult[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public static saveQuizResult(result: QuizResult): void {
    if (typeof window === 'undefined') return;
    try {
      const history = this.getQuizHistory();
      // Keep most recent 50 results
      const updated = [result, ...history].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save quiz result:', e);
    }
  }

  public static clearHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  // Last participant name
  public static getLastName(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.LAST_NAME) || '';
  }

  public static setLastName(name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.LAST_NAME, name);
  }

  // Hiragana reading display toggle (default: true)
  public static getShowHiragana(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(STORAGE_KEYS.SHOW_HIRAGANA);
    return val === null ? true : val === 'true';
  }

  public static setShowHiragana(show: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SHOW_HIRAGANA, String(show));
  }

  // Auto-play audio on question load toggle (default: false as requested)
  public static getAutoPlayAudio(): boolean {
    if (typeof window === 'undefined') return false;
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_PLAY_AUDIO);
    return val === null ? false : val === 'true';
  }

  public static setAutoPlayAudio(autoPlay: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_PLAY_AUDIO, String(autoPlay));
  }

  // Auto-advance to next question upon selecting an option (default: true)
  public static getAutoAdvance(): boolean {
    if (typeof window === 'undefined') return true;
    const val = localStorage.getItem(STORAGE_KEYS.AUTO_ADVANCE);
    return val === null ? true : val === 'true';
  }

  public static setAutoAdvance(advance: boolean): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTO_ADVANCE, String(advance));
  }
}
