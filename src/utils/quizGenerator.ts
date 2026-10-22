import { VocabItem, ChapterMeta, QuizQuestion, QuizResult } from '../types';

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.floor(Math.max(0, totalSeconds) % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export function calculateTimeLimit(questionCount: number): number {
  // Standard 20 seconds per question, minimum 600s (10 minutes)
  return Math.max(600, Math.ceil((questionCount * 20) / 60) * 60);
}

export function createQuizQuestions(
  mode: string,
  allVocab: VocabItem[],
  chaptersMeta: Record<number, ChapterMeta>,
  optionsCount: number = 4,
  questionLimit: 'all' | number = 'all',
  direction: 'jp_to_id' | 'id_to_jp' | 'mixed' = 'jp_to_id',
  customChapters?: number[]
): { questions: QuizQuestion[]; timeLimitSeconds: number; chapterTitle: string } {
  let targetPool: VocabItem[] = [];
  let distractorPool: VocabItem[] = allVocab;
  let chapterTitle = 'Minna no Nihongo';

  if (mode === 'all') {
    targetPool = shuffleArray(allVocab);
    chapterTitle = 'Semua Bab (Bab 1–50)';
  } else if (mode === 'shokyuu1') {
    targetPool = shuffleArray(allVocab.filter((v) => v.chapter <= 25));
    distractorPool = allVocab.filter((v) => v.chapter <= 25);
    chapterTitle = 'Shokyuu 1 (N5: Bab 1–25)';
  } else if (mode === 'shokyuu2') {
    targetPool = shuffleArray(allVocab.filter((v) => v.chapter >= 26));
    distractorPool = allVocab.filter((v) => v.chapter >= 26);
    chapterTitle = 'Shokyuu 2 (N4: Bab 26–50)';
  } else if (mode === 'custom' && customChapters && customChapters.length > 0) {
    targetPool = shuffleArray(allVocab.filter((v) => customChapters.includes(v.chapter)));
    chapterTitle = `Bab Pilihan (${customChapters.join(', ')})`;
  } else {
    const babNum = parseInt(mode.replace('bab', ''), 10) || 1;
    targetPool = allVocab.filter((v) => v.chapter === babNum);
    const meta = chaptersMeta[babNum];
    chapterTitle = `Bab ${babNum}: ${meta?.title || 'Minna no Nihongo'}`;
  }

  // Shuffle targets
  let selected = shuffleArray(targetPool);
  if (questionLimit !== 'all' && typeof questionLimit === 'number' && questionLimit > 0) {
    selected = selected.slice(0, questionLimit);
  }

  // Build QuizQuestion objects
  const questions: QuizQuestion[] = selected.map((item, index) => {
    const qType: 'jp_to_id' | 'id_to_jp' =
      direction === 'mixed' ? (Math.random() > 0.5 ? 'jp_to_id' : 'id_to_jp') : direction;

    const displayJapanese =
      item.kanji && item.kanji !== item.japanese
        ? `${item.japanese} (${item.kanji})`
        : item.japanese;

    if (qType === 'jp_to_id') {
      const correctText = item.indonesian.trim();
      const lowerCorrect = correctText.toLowerCase();

      // Find distractors
      const sameChapterDistractors = distractorPool.filter(
        (v) =>
          v.chapter === item.chapter &&
          v.indonesian.trim().toLowerCase() !== lowerCorrect &&
          v.japanese !== item.japanese
      );
      const otherDistractors = distractorPool.filter(
        (v) =>
          v.chapter !== item.chapter &&
          v.indonesian.trim().toLowerCase() !== lowerCorrect &&
          v.japanese !== item.japanese
      );

      const combined = [...shuffleArray(sameChapterDistractors), ...shuffleArray(otherDistractors)];
      const distractors: string[] = [];
      const seen = new Set<string>([lowerCorrect]);

      for (const d of combined) {
        const text = d.indonesian.trim();
        const lower = text.toLowerCase();
        if (!seen.has(lower)) {
          seen.add(lower);
          distractors.push(text);
        }
        if (distractors.length >= optionsCount - 1) break;
      }

      const options = shuffleArray([correctText, ...distractors]);
      const correctIndex = options.indexOf(correctText);

      return {
        id: index + 1,
        chapter: item.chapter,
        chapterLabel: `Bab ${item.chapter}`,
        japanese: displayJapanese,
        kanji: item.kanji,
        hiragana: item.japanese,
        meaning: correctText,
        questionPrompt: 'Pilihlah arti bahasa Indonesia yang tepat untuk kosakata berikut:',
        options,
        correctIndex,
        explanation: `「${displayJapanese}」berarti "${correctText}" (Minna no Nihongo Bab ${item.chapter}, No. ${item.no}).`,
        category: `Bab ${item.chapter} No. ${item.no}`,
        questionType: 'jp_to_id',
      };
    } else {
      // id_to_jp
      const correctText = displayJapanese;

      // Find distractors
      const sameChapterDistractors = distractorPool.filter(
        (v) =>
          v.chapter === item.chapter &&
          v.japanese !== item.japanese &&
          v.indonesian.trim().toLowerCase() !== item.indonesian.trim().toLowerCase()
      );
      const otherDistractors = distractorPool.filter(
        (v) =>
          v.chapter !== item.chapter &&
          v.japanese !== item.japanese &&
          v.indonesian.trim().toLowerCase() !== item.indonesian.trim().toLowerCase()
      );

      const combined = [...shuffleArray(sameChapterDistractors), ...shuffleArray(otherDistractors)];
      const distractors: string[] = [];
      const seen = new Set<string>([correctText]);

      for (const d of combined) {
        const dText =
          d.kanji && d.kanji !== d.japanese ? `${d.japanese} (${d.kanji})` : d.japanese;
        if (!seen.has(dText)) {
          seen.add(dText);
          distractors.push(dText);
        }
        if (distractors.length >= optionsCount - 1) break;
      }

      const options = shuffleArray([correctText, ...distractors]);
      const correctIndex = options.indexOf(correctText);

      return {
        id: index + 1,
        chapter: item.chapter,
        chapterLabel: `Bab ${item.chapter}`,
        japanese: displayJapanese,
        kanji: item.kanji,
        hiragana: item.japanese,
        meaning: item.indonesian.trim(),
        questionPrompt: `Pilihlah kosakata bahasa Jepang yang tepat untuk arti "${item.indonesian.trim()}":`,
        options,
        correctIndex,
        explanation: `Arti "${item.indonesian.trim()}" dalam bahasa Jepang adalah 「${displayJapanese}」 (Bab ${item.chapter}, No. ${item.no}).`,
        category: `Bab ${item.chapter} No. ${item.no}`,
        questionType: 'id_to_jp',
      };
    }
  });

  const timeLimitSeconds = calculateTimeLimit(questions.length);

  return {
    questions,
    timeLimitSeconds,
    chapterTitle,
  };
}

export function generateWhatsAppMessage(result: QuizResult): string {
  const statusEmoji = result.isPassed ? '✅' : '❌';
  const statusText = result.isPassed ? 'LULUS (合格)' : 'BELUM LULUS (不合格)';
  const wrongQuestionsText =
    result.wrongQuestionIndices.length > 0
      ? `No. ${result.wrongQuestionIndices.join(', ')}`
      : 'Tidak ada (Sempurna 100%! 🎉)';

  const remainingFormatted = formatSeconds(result.timeRemainingSeconds);
  const spentFormatted = formatSeconds(result.timeSpentSeconds);

  return [
    `📊 *LAPORAN HASIL KUIS BAHASA JEPANG* 🇯🇵`,
    `*Program:* 日本語クラス (${result.chapterModeTitle})`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Nama Peserta:* ${result.participantName}`,
    `🎯 *Jumlah Benar:* ${result.correctCount} / ${result.totalQuestions} Benar`,
    `⭐ *Nilai Akhir:* ${result.score} / 100`,
    `⏱️ *Sisa Waktu:* ${remainingFormatted} (Waktu Pengerjaan: ${spentFormatted})`,
    `🎖️ *Status:* ${statusEmoji} ${statusText}`,
    `❌ *Soal Salah:* ${wrongQuestionsText}`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📅 *Tanggal:* ${result.completedAt}`,
    `_Dikirim otomatis dari Sistem Kuis 日本語クラス_`,
  ].join('\n');
}

export function createWhatsAppShareUrl(result: QuizResult): string {
  const message = generateWhatsAppMessage(result);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
