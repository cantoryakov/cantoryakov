import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, Star, Trophy, Heart, ShieldAlert, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { BIBLE_HEROES_DATA } from '../../data/jewishStudiesData';
import { BibleHero } from '../../types';
import { soundManager } from '../../utils/audio';
import { stripNiqqud } from '../../utils/hebrew';
import { HERO_PARASHA_LINKS } from '../../utils/router';

interface HeroesModuleProps {
  activeHeroId?: string;
  onSelectHeroId?: (heroId: string) => void;
  onNavigateToParasha?: (parashaSlug: string) => void;
}

export const HeroesModule: React.FC<HeroesModuleProps> = ({
  activeHeroId,
  onSelectHeroId,
  onNavigateToParasha,
}) => {
  const [alignmentTab, setAlignmentTab] = useState<'hero' | 'villain'>('hero');
  const heroesList = useMemo(() => BIBLE_HEROES_DATA.filter((h) => h.alignment !== 'villain'), []);
  const villainsList = useMemo(() => BIBLE_HEROES_DATA.filter((h) => h.alignment === 'villain'), []);

  const activeList = alignmentTab === 'hero' ? heroesList : villainsList;
  const [selectedHero, setSelectedHero] = useState<BibleHero>(heroesList[0] || BIBLE_HEROES_DATA[0]);

  // Sync activeHeroId prop to selectedHero and alignmentTab
  useEffect(() => {
    if (!activeHeroId) return;
    const hero = BIBLE_HEROES_DATA.find((h) => h.id === activeHeroId);
    if (hero) {
      if (hero.alignment === 'villain') {
        setAlignmentTab('villain');
      } else {
        setAlignmentTab('hero');
      }
      setSelectedHero(hero);
    }
  }, [activeHeroId]);

  const handleSelectHero = (hero: BibleHero) => {
    setSelectedHero(hero);
    if (onSelectHeroId) {
      onSelectHeroId(hero.id);
    }
  };

  const handleSwitchAlignment = (tab: 'hero' | 'villain') => {
    soundManager.playPop();
    setAlignmentTab(tab);
    const newList = tab === 'hero' ? heroesList : villainsList;
    if (newList.length > 0) {
      setSelectedHero(newList[0]);
    }
  };

  const handleSpeakHeroName = (hero: BibleHero) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(hero.spokenHe || hero.nameHe, 0.85, 1.0);
  };

  const handleSpeakQuote = (hero: BibleHero) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(hero.quoteOrMotto.he, 0.85, 1.0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6">
      {/* Heroes vs Villains Category Switcher */}
      <div className="relative flex items-center justify-center gap-3 bg-amber-100/70 p-1.5 rounded-2xl border border-amber-200/90 w-full sm:w-auto mx-auto max-w-md select-none">
        {/* Sliding Pill */}
        <div
          className={`absolute top-1.5 bottom-1.5 transition-all duration-300 ease-out rounded-xl shadow-xs z-0 ${
            alignmentTab === 'hero'
              ? 'left-1.5 w-[calc(50%-9px)] bg-amber-500'
              : 'left-[calc(50%+3px)] w-[calc(50%-9px)] bg-rose-600'
          }`}
        />

            <button
              type="button"
              onClick={() => handleSwitchAlignment('hero')}
              className={`relative z-10 flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                alignmentTab === 'hero' ? 'text-white' : 'text-amber-950 hover:text-amber-800'
              }`}
            >
              <span>🦸‍♂️ Heroes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-300 ${
                alignmentTab === 'hero' ? 'bg-amber-700/40 text-white' : 'bg-amber-200 text-amber-900'
              }`}>
                {heroesList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchAlignment('villain')}
              className={`relative z-10 flex-1 py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                alignmentTab === 'villain' ? 'text-white' : 'text-rose-950 hover:text-rose-800'
              }`}
            >
              <span>😡 Villains</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-300 ${
                alignmentTab === 'villain' ? 'bg-rose-800/40 text-white' : 'bg-rose-200 text-rose-900'
              }`}>
                {villainsList.length}
              </span>
            </button>
          </div>

          <div key={alignmentTab} className="space-y-6 animate-curriculum-transition">
            {/* Grid of Bible People in Active Category */}
            <div
              dir="ltr"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 px-1 w-full"
            >
              {activeList.map((hero) => {
                const isActive = selectedHero.id === hero.id;
                const isVillain = hero.alignment === 'villain';
                return (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => {
                      handleSelectHero(hero);
                      soundManager.playPop();
                      handleSpeakHeroName(hero);
                    }}
                    className={`p-2.5 rounded-2xl border-2 flex items-center transition-all cursor-pointer active:scale-95 text-left w-full ${
                      isActive
                        ? isVillain
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs scale-[1.02] z-10'
                          : 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02] z-10'
                        : 'bg-white text-slate-700 border-amber-200/80 hover:bg-amber-50/80 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 w-full overflow-hidden">
                      <span className="text-xl shrink-0 leading-none">{hero.emoji}</span>
                      <span className="text-xs sm:text-sm font-bold tracking-tight truncate flex-1 text-left select-none">
                        {hero.nameEn}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Hero/Villain Showcase Card */}
            <div className={`bg-white rounded-3xl p-5 sm:p-7 border-3 shadow-md space-y-6 ${
              selectedHero.alignment === 'villain' ? 'border-rose-300' : 'border-amber-200/80'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl text-4xl sm:text-5xl flex items-center justify-center shadow-sm border-2 border-white"
                    style={{ backgroundColor: `${selectedHero.color}20` }}
                  >
                    {selectedHero.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        {selectedHero.nameEn}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeakHeroName(selectedHero)}
                        className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                        title="Hear Hebrew Name"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      className="text-lg font-bold text-amber-800 font-hebrew"
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {stripNiqqud(selectedHero.nameHe)} ({selectedHero.transliteration})
                    </div>
                    <span className={`inline-flex items-center gap-1 mt-1 px-3 py-0.5 rounded-full font-bold text-xs border ${
                      selectedHero.alignment === 'villain'
                        ? 'bg-rose-100 text-rose-900 border-rose-200'
                        : 'bg-amber-100 text-amber-950 border-amber-200'
                    }`}>
                      {selectedHero.alignment === 'villain' ? (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>😡 {selectedHero.title}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>⭐ {selectedHero.title}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Special Character Trait Badge */}
                <div className={`p-3.5 rounded-2xl border-2 shadow-2xs text-left ${
                  selectedHero.alignment === 'villain' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                    {selectedHero.alignment === 'villain' ? 'Known For:' : 'Special Super Power / Trait:'}
                  </div>
                  <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    {selectedHero.alignment === 'villain' ? (
                      <Zap className="w-4 h-4 text-rose-600 fill-rose-600" />
                    ) : (
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    )}
                    <span>{selectedHero.keyTrait}</span>
                  </div>
                </div>
              </div>

            {/* Famous Story & Famous Quote */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 sm:p-5 rounded-2xl border shadow-2xs space-y-2 ${
                selectedHero.alignment === 'villain' ? 'bg-rose-50/50 border-rose-200/80' : 'bg-amber-50/70 border-amber-200/80'
              }`}>
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Famous Story Highlight</span>
                </h4>
                <p className="whitespace-pre-line text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {selectedHero.famousStory}
                </p>
              </div>

              <div
                onClick={() => handleSpeakQuote(selectedHero)}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-white to-amber-50/80 border-2 border-amber-300 shadow-2xs space-y-2 cursor-pointer hover:scale-101 transition-transform"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Famous Words / Line:
                  </h4>
                  <div className="p-1 rounded-lg bg-amber-500 text-white">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div
                  className="text-base font-bold text-slate-900 font-hebrew"
                  style={{ fontFamily: "'Akoderf', sans-serif" }}
                >
                  "{stripNiqqud(selectedHero.quoteOrMotto.he)}"
                </div>
                <div className="text-xs font-bold text-slate-700">
                  "{selectedHero.quoteOrMotto.en}"
                </div>
              </div>
            </div>

            {/* Did You Know Fact */}
            <div className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-2.5 ${
              selectedHero.alignment === 'villain'
                ? 'bg-rose-100/70 border-rose-200 text-rose-950'
                : 'bg-amber-100/70 border-amber-200 text-amber-950'
            }`}>
              <span className="text-2xl shrink-0">💡</span>
              <div>
                <span className="font-bold">Did You Know? </span>
                <span>{selectedHero.didYouKnow}</span>
              </div>
            </div>

            {/* Parasha Permalink Navigation Links */}
            {HERO_PARASHA_LINKS[selectedHero.id] && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>Featured in Parasha:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {HERO_PARASHA_LINKS[selectedHero.id].map((link) => (
                    <button
                      key={link.slug}
                      type="button"
                      onClick={() => {
                        if (onNavigateToParasha) onNavigateToParasha(link.slug);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs hover:scale-105 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>📖 Parashat {link.nameEn}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
