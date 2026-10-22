import React, { useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  Layers,
  Volume2,
  VolumeX,
  Menu,
  X,
  RotateCcw,
} from 'lucide-react';
import { AppView } from '../types';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isCustomized: boolean;
  onResetData: () => void;
  totalVocabCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  isCustomized,
  onResetData,
  totalVocabCount,
}) => {
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playOptionSelect();
    }
  };

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { view: 'home', label: 'Kuis Bab', icon: <HelpCircle className="w-4 h-4" /> },
    { view: 'flashcards', label: 'Flashcard', icon: <Layers className="w-4 h-4" /> },
    {
      view: 'dictionary',
      label: 'Kamus Kotoba',
      icon: <BookOpen className="w-4 h-4" />,
      badge: `${totalVocabCount}`,
    },
  ];

  const handleNavClick = (view: AppView) => {
    sound.playOptionSelect();
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <span className="font-jp font-bold text-lg">日</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-stone-900 tracking-tight font-jp text-base sm:text-lg">
                  日本語クラス
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Bab 1–50
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => handleNavClick(item.view)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200/80'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider ${
                        active
                          ? 'bg-rose-200/70 text-rose-900'
                          : 'bg-stone-200/70 text-stone-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Audio Toggle & Reset indicator */}
          <div className="flex items-center gap-2">
            {isCustomized && (
              <button
                onClick={onResetData}
                title="Reset ke Kosakata Standar Minna no Nihongo"
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Asli</span>
              </button>
            )}

            <button
              onClick={toggleSound}
              title={isMuted ? 'Nyalakan Suara SFX' : 'Matikan Suara SFX'}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMuted
                  ? 'border-stone-200 bg-stone-100 text-stone-400 hover:text-stone-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 shadow-xs'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-stone-200 text-stone-600 md:hidden hover:bg-stone-100 cursor-pointer"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in fade-in duration-150">
          {navItems.map((item) => {
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold ${
                      active
                        ? 'bg-rose-200/80 text-rose-900'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {isCustomized && (
            <button
              onClick={() => {
                onResetData();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data ke Standar Minna no Nihongo Asli</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
