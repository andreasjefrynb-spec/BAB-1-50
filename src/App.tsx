/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppView, QuizConfig, QuizQuestion, QuizResult, VocabItem, ChapterMeta } from './types';
import { StorageManager } from './utils/storage';
import { createQuizQuestions } from './utils/quizGenerator';
import { Navbar } from './components/Navbar';
import { HomeQuizSetup } from './components/HomeQuizSetup';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { DictionaryScreen } from './components/DictionaryScreen';
import { FlashcardScreen } from './components/FlashcardScreen';
import { EditorScreen } from './components/EditorScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { sound } from './utils/audio';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => StorageManager.getVocabList());
  const [chaptersMeta, setChaptersMeta] = useState<Record<number, ChapterMeta>>(() =>
    StorageManager.getChapters()
  );
  const [isCustomized, setIsCustomized] = useState<boolean>(() => StorageManager.isCustomized());
  const [participantName, setParticipantName] = useState<string>(() =>
    StorageManager.getLastName()
  );

  // Active quiz runtime states
  const [activeConfig, setActiveConfig] = useState<QuizConfig | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(600);
  const [activeChapterTitle, setActiveChapterTitle] = useState<string>('');
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);

  // Start Quiz
  const handleStartQuiz = (config: QuizConfig) => {
    StorageManager.setLastName(config.participantName);
    setParticipantName(config.participantName);
    setActiveConfig(config);

    const generated = createQuizQuestions(
      config.mode,
      vocabList,
      chaptersMeta,
      4,
      config.questionLimit,
      config.questionType,
      config.selectedChapters
    );

    setQuizQuestions(generated.questions);
    setQuizTimeLimit(generated.timeLimitSeconds);
    setActiveChapterTitle(generated.chapterTitle);
    setCurrentView('quiz');
  };

  // Finish Quiz
  const handleFinishQuiz = (result: QuizResult) => {
    StorageManager.saveQuizResult(result);
    setCurrentResult(result);
    setCurrentView('result');
  };

  // Retake Quiz
  const handleRetakeQuiz = () => {
    if (!activeConfig) {
      setCurrentView('home');
      return;
    }
    sound.playOptionSelect();
    handleStartQuiz(activeConfig);
  };

  // Next Chapter
  const handleNextChapter = () => {
    if (!activeConfig) return;
    if (activeConfig.mode.startsWith('bab')) {
      const currentBab = parseInt(activeConfig.mode.replace('bab', ''), 10) || 1;
      if (currentBab < 50) {
        const nextBab = currentBab + 1;
        const nextConfig: QuizConfig = {
          ...activeConfig,
          mode: `bab${nextBab}`,
        };
        sound.playOptionSelect();
        handleStartQuiz(nextConfig);
        return;
      }
    }
    setCurrentView('home');
  };

  // Start Remedial Quiz for wrong questions
  const handleStartRemedial = (wrongQuestions: QuizQuestion[]) => {
    if (!wrongQuestions || wrongQuestions.length === 0) return;
    const timeLimit = Math.max(120, wrongQuestions.length * 25);
    const chapterName = activeChapterTitle.split(':')[0] || 'Kuis';
    const remedialTitle = `Remedial (${chapterName}) • ${wrongQuestions.length} Soal Salah`;
    const reindexedQuestions = wrongQuestions.map((q, idx) => ({
      ...q,
      id: idx + 1,
    }));
    setQuizQuestions(reindexedQuestions);
    setQuizTimeLimit(timeLimit);
    setActiveChapterTitle(remedialTitle);
    setCurrentView('quiz');
    sound.playOptionSelect();
  };

  // Update vocabulary from Editor
  const handleVocabChange = (newList: VocabItem[]) => {
    setVocabList(newList);
    setIsCustomized(true);
  };

  // Update chapters from Editor
  const handleChaptersChange = (newChapters: Record<number, ChapterMeta>) => {
    setChaptersMeta(newChapters);
    setIsCustomized(true);
  };

  // Reset to default Minna no Nihongo data
  const handleResetToDefault = () => {
    StorageManager.resetToDefault();
    setVocabList(StorageManager.getVocabList());
    setChaptersMeta(StorageManager.getChapters());
    setIsCustomized(false);
    sound.playCorrect();
  };

  // Jump from dictionary to editor for a specific item
  const handleEditItemInEditor = (item: VocabItem) => {
    sound.playOptionSelect();
    setCurrentView('editor');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 font-sans selection:bg-rose-500 selection:text-white">
      {/* Navbar (hidden during active quiz for maximum focus, or minimalist) */}
      {currentView !== 'quiz' && (
        <Navbar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          isCustomized={isCustomized}
          onResetData={handleResetToDefault}
          totalVocabCount={vocabList.length}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {currentView === 'home' && (
          <HomeQuizSetup
            vocabList={vocabList}
            chaptersMeta={chaptersMeta}
            initialName={participantName}
            onStartQuiz={handleStartQuiz}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'quiz' && (
          <QuizScreen
            participantName={participantName}
            chapterModeTitle={activeChapterTitle}
            questions={quizQuestions}
            timeLimitSeconds={quizTimeLimit}
            instantFeedback={activeConfig?.instantFeedback ?? false}
            showHiraganaForKanji={activeConfig?.showHiraganaForKanji ?? true}
            autoPlayAudio={activeConfig?.autoPlayAudio ?? false}
            autoAdvance={activeConfig?.autoAdvance ?? StorageManager.getAutoAdvance()}
            onFinishQuiz={handleFinishQuiz}
            onExitQuiz={() => setCurrentView('home')}
          />
        )}

        {currentView === 'result' && currentResult && (
          <ResultScreen
            result={currentResult}
            onRetake={handleRetakeQuiz}
            onStartRemedial={handleStartRemedial}
            onNextChapter={
              activeConfig?.mode.startsWith('bab') &&
              parseInt(activeConfig.mode.replace('bab', ''), 10) < 50
                ? handleNextChapter
                : undefined
            }
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'dictionary' && (
          <DictionaryScreen
            vocabList={vocabList}
            chaptersMeta={chaptersMeta}
            onNavigate={(view) => setCurrentView(view)}
            onEditItemInEditor={handleEditItemInEditor}
          />
        )}

        {currentView === 'flashcards' && (
          <FlashcardScreen
            vocabList={vocabList}
            chaptersMeta={chaptersMeta}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}

        {currentView === 'editor' && (
          <EditorScreen
            vocabList={vocabList}
            chaptersMeta={chaptersMeta}
            onVocabChange={handleVocabChange}
            onChaptersChange={handleChaptersChange}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {currentView === 'history' && (
          <HistoryScreen
            onSelectResult={(selected) => {
              setCurrentResult(selected);
              setCurrentView('result');
            }}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}
      </main>
    </div>
  );
}
