import React, { useState, useEffect } from 'react';
import { Volume2, Star, BookOpen, Scroll, Users, Sparkles, Feather } from 'lucide-react';
import { TORAH_BOOKS_DATA, NEVIIM_BOOKS_DATA, KETUVIM_BOOKS_DATA } from '../../data/jewishStudiesData';
import { TorahBook, ParashaItem } from '../../types';
import { soundManager } from '../../utils/audio';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { stripNiqqud } from '../../utils/hebrew';
import { PARASHA_HERO_LINKS, slugify } from '../../utils/router';

interface TorahModuleProps {
  activeParashaSlug?: string;
  onSelectParashaSlug?: (slug: string) => void;
  onNavigateToHero?: (heroId: string) => void;
}

export const TorahModule: React.FC<TorahModuleProps> = ({
  activeParashaSlug,
  onSelectParashaSlug,
  onNavigateToHero,
}) => {
  const [activeSection, setActiveSection] = useState<'torah' | 'neviim' | 'ketuvim'>('torah');

  // Torah state
  const [activeBook, setActiveBook] = useState<TorahBook>(TORAH_BOOKS_DATA[0]);
  const [activeParashaIndex, setActiveParashaIndex] = useState<number>(0);
  const [exploredParashot, setExploredParashot] = useState<Set<string>>(new Set());

  // Nevi'im state
  const [activeNeviimIndex, setActiveNeviimIndex] = useState<number>(0);

  // Ketuvim state
  const [activeKetuvimIndex, setActiveKetuvimIndex] = useState<number>(0);

  // Sync activeParashaSlug prop to book, index, and switch to Torah section
  useEffect(() => {
    if (!activeParashaSlug) return;
    const targetSlug = slugify(activeParashaSlug);
    for (const book of TORAH_BOOKS_DATA) {
      const idx = book.parashot.findIndex(
        (p) => slugify(p.nameEn) === targetSlug || slugify(p.transliteration) === targetSlug
      );
      if (idx !== -1) {
        setActiveSection('torah');
        setActiveBook(book);
        setActiveParashaIndex(idx);
        break;
      }
    }
  }, [activeParashaSlug]);

  const currentParasha = activeBook.parashot[activeParashaIndex % activeBook.parashot.length];
  const currentNeviimBook = NEVIIM_BOOKS_DATA[activeNeviimIndex % NEVIIM_BOOKS_DATA.length];
  const currentKetuvimBook = KETUVIM_BOOKS_DATA[activeKetuvimIndex % KETUVIM_BOOKS_DATA.length];

  const handleSelectParasha = (book: TorahBook, index: number, parasha: ParashaItem) => {
    setActiveBook(book);
    setActiveParashaIndex(index);
    const slug = slugify(parasha.nameEn);
    if (onSelectParashaSlug) {
      onSelectParashaSlug(slug);
    }
  };

  const handleSpeakText = (hebrewText: string) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(hebrewText, 0.85, 1.0);
  };

  const handleExploreParasha = (parashaKey: string) => {
    soundManager.unlockAudio();
    soundManager.playSparkle();
    if (!exploredParashot.has(parashaKey)) {
      setExploredParashot((prev) => new Set([...prev, parashaKey]));
      fireCelebrationConfetti(0.5, 0.4);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Centered 3-Way Animated Sliding Pill Switcher: Torah, Nevi’im, Ketuvim */}
      <div className="relative flex items-center justify-center gap-1 bg-amber-100/70 p-1.5 rounded-2xl border border-amber-200/90 w-full sm:w-auto mx-auto max-w-lg select-none">
        {/* Sliding Pill */}
        <div
          className={`absolute top-1.5 bottom-1.5 transition-all duration-300 ease-out rounded-xl shadow-xs z-0 ${
            activeSection === 'torah'
              ? 'left-1.5 w-[calc(33.333%-4px)] bg-amber-500'
              : activeSection === 'neviim'
              ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)] bg-sky-600'
              : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)] bg-purple-600'
          }`}
        />

        <button
          type="button"
          onClick={() => {
            setActiveSection('torah');
            soundManager.playPop();
          }}
          className={`relative z-10 flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'torah' ? 'text-white' : 'text-amber-950 hover:text-amber-800'
          }`}
        >
          <Scroll className="w-4 h-4 shrink-0" />
          <span>Torah (5)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('neviim');
            soundManager.playPop();
          }}
          className={`relative z-10 flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'neviim' ? 'text-white' : 'text-sky-950 hover:text-sky-800'
          }`}
        >
          <span className="shrink-0">🎺</span>
          <span>Nevi’im (19)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSection('ketuvim');
            soundManager.playPop();
          }}
          className={`relative z-10 flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSection === 'ketuvim' ? 'text-white' : 'text-purple-950 hover:text-purple-800'
          }`}
        >
          <span className="shrink-0">💎</span>
          <span>Ketuvim (11)</span>
        </button>
      </div>

      {/* ================= SECTION 1: TORAH (5 BOOKS & 54 PARASHOT) ================= */}
      {activeSection === 'torah' && (
        <div className="space-y-6">
          {/* 5 Books Selector Tabs */}
          <div
            dir="ltr"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 px-1 w-full"
          >
            {TORAH_BOOKS_DATA.map((book) => {
              const isActive = activeBook.id === book.id;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    setActiveBook(book);
                    setActiveParashaIndex(0);
                    soundManager.playPop();
                    soundManager.speakHebrew(book.nameHe);
                  }}
                  className={`p-2.5 rounded-2xl border-2 flex items-center transition-all cursor-pointer active:scale-95 text-left w-full ${
                    isActive
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                      : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full overflow-hidden">
                    <span className="text-xl shrink-0 leading-none">{book.emoji}</span>
                    <span className="text-xs sm:text-sm font-bold tracking-tight truncate flex-1 text-left select-none">
                      {book.nameEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Book Unrolling Scroll Stage */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-amber-300/80 shadow-md space-y-6">
            {/* Book Title Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{activeBook.emoji}</span>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">
                    {activeBook.nameEn}
                  </h3>
                  <div
                    className="text-base font-bold text-amber-800 font-hebrew"
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {stripNiqqud(activeBook.nameHe)} ({activeBook.transliteration})
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
                📖 Contains {activeBook.parashotCount} Parashot
              </div>
            </div>

            {/* Book Overview Summary */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-amber-50/60 p-3.5 rounded-2xl border border-amber-100">
              {activeBook.summary}
            </p>

            {/* Parashot Selector Buttons for Active Book */}
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>Select a Parasha in {activeBook.nameEn.split(' ')[0]} ({activeBook.parashot.length}):</span>
                </h4>

                {/* Parasha Selector Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeBook.parashot.map((p, idx) => (
                    <button
                      key={p.nameEn}
                      type="button"
                      onClick={() => {
                        handleSelectParasha(activeBook, idx, p);
                        soundManager.playPop();
                        handleSpeakText(p.nameHe);
                      }}
                      className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeParashaIndex === idx
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-105'
                          : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/70 shadow-2xs'
                      }`}
                    >
                      <span>{p.transliteration}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Parasha Unrolled Card */}
              {currentParasha && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-amber-50 via-amber-50/40 to-white border-2 border-amber-300 shadow-xs space-y-4 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{currentParasha.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-950 font-bold text-[10px]">
                            Parasha #{currentParasha.globalNumber}
                          </span>
                          <h5
                            className="text-2xl font-bold text-slate-900 font-hebrew"
                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                          >
                            {stripNiqqud(currentParasha.nameHe)} ({currentParasha.nameEn})
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleSpeakText(currentParasha.nameHe)}
                            className="p-1.5 rounded-xl bg-amber-500 text-white shadow-2xs hover:bg-amber-600 transition-transform active:scale-95 cursor-pointer"
                            title="Hear Parasha Name"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm font-bold text-slate-700 mt-0.5">
                          Story: {currentParasha.storyTitle}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Featured Figures / Hero Links */}
                  {PARASHA_HERO_LINKS[slugify(currentParasha.nameEn)] && (
                    <div className="p-3 bg-amber-100/80 rounded-2xl border border-amber-200 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-800">
                      <span className="text-amber-900 font-bold flex items-center gap-1 shrink-0">
                        <Users className="w-4 h-4 text-amber-700" />
                        <span>People in this Parasha:</span>
                      </span>
                      {PARASHA_HERO_LINKS[slugify(currentParasha.nameEn)].map((heroLink) => (
                        <button
                          key={heroLink.id}
                          type="button"
                          onClick={() => {
                            if (onNavigateToHero) onNavigateToHero(heroLink.id);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs transition-all shadow-2xs hover:scale-105 cursor-pointer flex items-center gap-1"
                        >
                          <span>{heroLink.emoji}</span>
                          <span>{heroLink.nameEn}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Story Summary & Key Takeaway */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-white border border-amber-200/80 shadow-2xs space-y-1">
                      <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                        📖 Story Summary:
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {currentParasha.kidSummary}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-100/70 border border-amber-200/80 shadow-2xs space-y-1">
                      <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                        <span>Key Mitzvah / Lesson:</span>
                      </div>
                      <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
                        {currentParasha.keyTakeaway}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: NEVI'IM (8 BOOKS OF PROPHETS) ================= */}
      {activeSection === 'neviim' && (
        <div className="space-y-6">
          {/* 19 Books Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 px-1">
            {NEVIIM_BOOKS_DATA.map((book, idx) => {
              const isSelected = activeNeviimIndex === idx;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    setActiveNeviimIndex(idx);
                    soundManager.playPop();
                    handleSpeakText(book.nameHe);
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 text-left flex items-center gap-2.5 shadow-2xs ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs font-semibold scale-[1.02]'
                      : 'bg-sky-50/70 hover:bg-sky-100 text-slate-700 hover:text-slate-900 border-sky-200/80 font-bold'
                  }`}
                >
                  <span className="text-2xl shrink-0">{book.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold truncate">{book.nameEn}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Nevi'im Book Card Showcase */}
          {currentNeviimBook && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-sky-300 shadow-md space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-900 flex items-center justify-center text-3xl shadow-2xs">
                    {currentNeviimBook.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {currentNeviimBook.nameEn}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeakText(currentNeviimBook.nameHe)}
                        className="p-1.5 rounded-xl bg-sky-500 text-white shadow-2xs hover:bg-sky-600 transition-transform active:scale-95 cursor-pointer"
                        title="Hear Book Name"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      className="text-base font-bold text-sky-800 font-hebrew"
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {stripNiqqud(currentNeviimBook.nameHe)} ({currentNeviimBook.transliteration})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-xl bg-sky-100 text-sky-900 font-bold text-xs">
                    {currentNeviimBook.categoryEn}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-sky-50 text-sky-800 font-bold text-xs border border-sky-200">
                    📜 {currentNeviimBook.chaptersCount} Chapters
                  </span>
                </div>
              </div>

              {/* Book Summary */}
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 space-y-1">
                <div className="text-[11px] font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-600" />
                  <span>Overview & Story of the Book:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentNeviimBook.summary}
                </p>
              </div>

              {/* Famous Stories */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Famous Stories in {currentNeviimBook.nameEn}:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentNeviimBook.famousStories.map((story, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs flex items-start gap-2 text-xs font-semibold text-slate-700"
                    >
                      <span className="text-sky-500 font-bold shrink-0">#{i + 1}</span>
                      <span>{story}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Lesson & Famous Verse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Key Lesson */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                    <span>Inspirational Lesson for Kids:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
                    {currentNeviimBook.keyLesson}
                  </p>
                </div>

                {/* Famous Verse */}
                <div className="p-4 rounded-2xl bg-sky-100/70 border border-sky-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1">
                      <Feather className="w-3.5 h-3.5 text-sky-700" />
                      <span>Famous Verse ({currentNeviimBook.famousVerse.source}):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakText(currentNeviimBook.famousVerse.he)}
                      className="p-1 rounded-lg bg-sky-600 text-white hover:bg-sky-700 cursor-pointer shadow-2xs"
                      title="Hear Verse in Hebrew"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    className="text-sm font-bold text-sky-950 font-hebrew"
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {currentNeviimBook.famousVerse.he}
                  </div>
                  <p className="text-xs text-sky-900 font-medium italic">
                    “{currentNeviimBook.famousVerse.en}”
                  </p>
                </div>
              </div>

              {/* Linked People / Heroes */}
              {currentNeviimBook.heroLinks && currentNeviimBook.heroLinks.length > 0 && (
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-sky-900 font-bold flex items-center gap-1 shrink-0">
                    <Users className="w-4 h-4 text-sky-700" />
                    <span>People in this Book:</span>
                  </span>
                  {currentNeviimBook.heroLinks.map((hero) => (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => {
                        if (onNavigateToHero) onNavigateToHero(hero.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-sky-100 text-sky-950 border border-sky-300 font-bold text-xs transition-all shadow-2xs hover:scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <span>{hero.emoji}</span>
                      <span>{hero.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= SECTION 3: KETUVIM (11 BOOKS OF WRITINGS) ================= */}
      {activeSection === 'ketuvim' && (
        <div className="space-y-6">
          {/* 11 Books Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 px-1">
            {KETUVIM_BOOKS_DATA.map((book, idx) => {
              const isSelected = activeKetuvimIndex === idx;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => {
                    setActiveKetuvimIndex(idx);
                    soundManager.playPop();
                    handleSpeakText(book.nameHe);
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer active:scale-95 text-left flex items-center gap-2.5 shadow-2xs ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs font-semibold scale-[1.02]'
                      : 'bg-purple-50/70 hover:bg-purple-100 text-slate-700 hover:text-slate-900 border-purple-200/80 font-bold'
                  }`}
                >
                  <span className="text-2xl shrink-0">{book.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold truncate">{book.nameEn}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Ketuvim Book Card Showcase */}
          {currentKetuvimBook && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-purple-300 shadow-md space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-purple-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center text-3xl shadow-2xs">
                    {currentKetuvimBook.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {currentKetuvimBook.nameEn}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeakText(currentKetuvimBook.nameHe)}
                        className="p-1.5 rounded-xl bg-purple-500 text-white shadow-2xs hover:bg-purple-600 transition-transform active:scale-95 cursor-pointer"
                        title="Hear Book Name"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div
                      className="text-base font-bold text-purple-800 font-hebrew"
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {stripNiqqud(currentKetuvimBook.nameHe)} ({currentKetuvimBook.transliteration})
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {currentKetuvimBook.holidayConnection && (
                    <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                      🎉 {currentKetuvimBook.holidayConnection}
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-xl bg-purple-100 text-purple-900 font-bold text-xs">
                    {currentKetuvimBook.categoryEn}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-800 font-bold text-xs border border-purple-200">
                    📜 {currentKetuvimBook.chaptersCount} Chapters
                  </span>
                </div>
              </div>

              {/* Book Summary */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-1">
                <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Overview & Story of the Book:</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  {currentKetuvimBook.summary}
                </p>
              </div>

              {/* Famous Stories */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Famous Stories in {currentKetuvimBook.nameEn}:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentKetuvimBook.famousStories.map((story, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-2xl bg-white border border-purple-200/80 shadow-2xs flex items-start gap-2 text-xs font-semibold text-slate-700"
                    >
                      <span className="text-purple-500 font-bold shrink-0">#{i + 1}</span>
                      <span>{story}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Lesson & Famous Verse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Key Lesson */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-400" />
                    <span>Inspirational Lesson for Kids:</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-950 font-bold leading-relaxed">
                    {currentKetuvimBook.keyLesson}
                  </p>
                </div>

                {/* Famous Verse */}
                <div className="p-4 rounded-2xl bg-purple-100/70 border border-purple-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1">
                      <Feather className="w-3.5 h-3.5 text-purple-700" />
                      <span>Famous Verse ({currentKetuvimBook.famousVerse.source}):</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSpeakText(currentKetuvimBook.famousVerse.he)}
                      className="p-1 rounded-lg bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-2xs"
                      title="Hear Verse in Hebrew"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    className="text-sm font-bold text-purple-950 font-hebrew"
                    style={{ fontFamily: "'Akoderf', sans-serif" }}
                  >
                    {currentKetuvimBook.famousVerse.he}
                  </div>
                  <p className="text-xs text-purple-900 font-medium italic">
                    “{currentKetuvimBook.famousVerse.en}”
                  </p>
                </div>
              </div>

              {/* Linked People / Heroes */}
              {currentKetuvimBook.heroLinks && currentKetuvimBook.heroLinks.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-purple-900 font-bold flex items-center gap-1 shrink-0">
                    <Users className="w-4 h-4 text-purple-700" />
                    <span>People in this Book:</span>
                  </span>
                  {currentKetuvimBook.heroLinks.map((hero) => (
                    <button
                      key={hero.id}
                      type="button"
                      onClick={() => {
                        if (onNavigateToHero) onNavigateToHero(hero.id);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-white hover:bg-purple-100 text-purple-950 border border-purple-300 font-bold text-xs transition-all shadow-2xs hover:scale-105 cursor-pointer flex items-center gap-1"
                    >
                      <span>{hero.emoji}</span>
                      <span>{hero.nameEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
