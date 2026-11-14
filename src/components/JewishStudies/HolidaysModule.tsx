import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Volume2, Star, CheckCircle2, Shuffle } from 'lucide-react';
import { HOLIDAYS_DATA, HEBREW_MONTHS } from '../../data/jewishStudiesData';
import { HolidayItem, HebrewMonthItem } from '../../types';
import { soundManager } from '../../utils/audio';
import { stripNiqqud } from '../../utils/hebrew';
import { getNextHolidayOccurrence, getNextUpcomingHolidayId, getCurrentHebrewMonthId } from '../../utils/holidayCalendar';

export const HolidaysModule: React.FC = () => {
  const nextHolidayId = getNextUpcomingHolidayId();
  
  // Calculate current Hebrew month on initial load
  const initialMonthId = useMemo(() => getCurrentHebrewMonthId(), []);
  
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(initialMonthId);
  const [selectedCycle, setSelectedCycle] = useState<'shabbat' | 'rosh-chodesh' | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const spinTimerRef = useRef<number | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);
  
  // Initial selected holiday: first holiday in current month or next upcoming holiday or fallback
  const initialHoliday = useMemo(() => {
    const monthHolidays = HOLIDAYS_DATA.filter((h) => h.monthId === initialMonthId);
    if (monthHolidays.length > 0) return monthHolidays[0];
    if (nextHolidayId) {
      const foundNext = HOLIDAYS_DATA.find((h) => h.id === nextHolidayId);
      if (foundNext) return foundNext;
    }
    return HOLIDAYS_DATA[0];
  }, [initialMonthId, nextHolidayId]);

  const [selectedHoliday, setSelectedHoliday] = useState<HolidayItem>(initialHoliday);

  const selectedMonth = React.useMemo(() => {
    if (!selectedMonthId) return null;
    return HEBREW_MONTHS.find((m) => m.id === selectedMonthId) || null;
  }, [selectedMonthId]);

  // Holidays filtered by selected month
  const displayedMonthHolidays = React.useMemo(() => {
    if (!selectedMonthId) return [];
    return HOLIDAYS_DATA.filter((h) => h.monthId === selectedMonthId);
  }, [selectedMonthId]);

  const handleSelectMonth = (monthId: string) => {
    setSelectedMonthId(monthId);
    setSelectedCycle(null);
    soundManager.playPop();

    const monthObj = HEBREW_MONTHS.find((m) => m.id === monthId);
    if (monthObj) {
      soundManager.speakHebrew(monthObj.speakText || monthObj.ttsOverride || monthObj.nameHe, 0.85, 1.0);
    }

    const monthHolidays = HOLIDAYS_DATA.filter((h) => h.monthId === monthId);
    if (monthHolidays.length > 0) {
      if (!monthHolidays.some((h) => h.id === selectedHoliday.id)) {
        setSelectedHoliday(monthHolidays[0]);
      }
    }
  };

  const handleSelectCycle = (cycleId: 'shabbat' | 'rosh-chodesh') => {
    setSelectedCycle(cycleId);
    setSelectedMonthId(null);
    soundManager.playPop();

    const cycleHoliday = HOLIDAYS_DATA.find((h) => h.id === cycleId);
    if (cycleHoliday) {
      setSelectedHoliday(cycleHoliday);
      soundManager.speakHebrew(cycleHoliday.spokenHe || cycleHoliday.nameHe, 0.85, 1.0);
    }
  };

  const handleSpeakGreeting = (holiday: HolidayItem) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(holiday.greeting.he, 0.85, 1.0);
  };

  const handleSpeakName = (holiday: HolidayItem) => {
    soundManager.unlockAudio();
    soundManager.speakHebrew(holiday.spokenHe || holiday.nameHe, 0.85, 1.0);
  };

  const handleRandomSelection = () => {
    if (isSpinning) return;
    soundManager.unlockAudio();
    soundManager.playPop();
    setIsSpinning(true);

    // 14 items: 2 cycles ('shabbat', 'rosh-chodesh') + 12 months
    type CalendarOption = { type: 'cycle'; id: 'shabbat' | 'rosh-chodesh' } | { type: 'month'; id: string };
    const allOptions: CalendarOption[] = [
      { type: 'cycle', id: 'shabbat' },
      { type: 'cycle', id: 'rosh-chodesh' },
      ...HEBREW_MONTHS.map((m) => ({ type: 'month' as const, id: m.id }))
    ];

    const currentActiveId = selectedCycle || selectedMonthId;
    const candidates = allOptions.filter((opt) => opt.id !== currentActiveId);
    const finalTarget = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : allOptions[Math.floor(Math.random() * allOptions.length)];

    const totalSteps = 14;
    const stepOptions: CalendarOption[] = [];
    let prevId = currentActiveId;

    for (let i = 0; i < totalSteps - 1; i++) {
      const avail = allOptions.filter((opt) => opt.id !== prevId);
      const rand = avail[Math.floor(Math.random() * avail.length)] || allOptions[0];
      stepOptions.push(rand);
      prevId = rand.id;
    }
    stepOptions.push(finalTarget);

    let step = 0;
    const runStep = () => {
      const currentStepOpt = stepOptions[step];
      
      // Update UI active highlight during shuffle
      if (currentStepOpt.type === 'cycle') {
        setSelectedCycle(currentStepOpt.id);
        setSelectedMonthId(null);
      } else {
        setSelectedMonthId(currentStepOpt.id);
        setSelectedCycle(null);
      }

      // Play identical roulette beep sound from soundManager
      soundManager.playRouletteBeep(step);

      step++;
      if (step < totalSteps) {
        const progress = step / totalSteps;
        const delay = 50 + Math.pow(progress, 2.2) * 210;
        spinTimerRef.current = window.setTimeout(runStep, delay);
      } else {
        // Land on target
        spinTimerRef.current = window.setTimeout(() => {
          setIsSpinning(false);
          if (finalTarget.type === 'cycle') {
            handleSelectCycle(finalTarget.id);
          } else {
            handleSelectMonth(finalTarget.id);
          }
        }, 160);
      }
    };

    runStep();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-4 space-y-4">
      {/* HEBREW MONTHS & CYCLES CARD */}
      <div className="bg-white/90 rounded-2xl p-2.5 sm:p-3.5 border border-amber-200/80 shadow-xs space-y-3">
        {/* Centered Randomizer Button */}
        <div className="flex items-center justify-center my-0.5">
          <button
            type="button"
            onClick={handleRandomSelection}
            disabled={isSpinning}
            className={`h-6 sm:h-7 flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 bg-gradient-to-r from-amber-100 via-amber-100 to-amber-200 hover:from-amber-200 hover:to-amber-300 active:scale-95 text-amber-900 border border-amber-300 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-75 leading-none ${
              isSpinning ? 'scale-105 ring-2 ring-amber-400' : ''
            }`}
            title="Pick a random month or cycle"
            aria-label="Pick a random month or cycle"
          >
            <Shuffle className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-700 shrink-0 ${isSpinning ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm leading-none">🎲</span>
          </button>
        </div>

            {/* Shabbat & Rosh Chodesh Top Row */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => handleSelectCycle('shabbat')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center justify-center text-center gap-1.5 select-none ${
                  selectedCycle === 'shabbat'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                    : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
                }`}
              >
                <span className="text-sm leading-none">🕯️</span>
                <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight truncate">Shabbat</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectCycle('rosh-chodesh')}
                className={`py-2 px-1.5 sm:px-2 rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center justify-center text-center gap-1.5 select-none ${
                  selectedCycle === 'rosh-chodesh'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                    : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
                }`}
              >
                <span className="text-sm leading-none">🌙</span>
                <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight truncate">Rosh Chodesh</span>
              </button>
            </div>

            {/* Compact 4-Column x 3-Row Grid across all devices */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {HEBREW_MONTHS.map((month) => {
                const isActive = selectedMonthId === month.id && selectedCycle === null;

                return (
                  <button
                    key={month.id}
                    type="button"
                    onClick={() => handleSelectMonth(month.id)}
                    className={`py-2 px-1.5 sm:px-2 rounded-xl border-2 transition-all cursor-pointer active:scale-95 flex items-center justify-center text-center select-none ${
                      isActive
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                        : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 shadow-2xs font-bold'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight truncate">
                      {month.nameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECONDARY HOLIDAY NAVIGATION PILL BAR (ONLY RENDERED IF > 1 HOLIDAY IN MONTH) */}
          {selectedMonth && (
            displayedMonthHolidays.length > 1 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-1">
                {displayedMonthHolidays.map((holiday) => {
                  const isActive = selectedHoliday.id === holiday.id && selectedCycle === null;
                  const isNextHoliday = nextHolidayId === holiday.id;
                  return (
                    <button
                      key={holiday.id}
                      type="button"
                      onClick={() => {
                        setSelectedHoliday(holiday);
                        setSelectedCycle(null);
                        soundManager.playPop();
                        handleSpeakName(holiday);
                      }}
                      className={`px-3.5 py-2 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 ${
                        isActive
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-[1.02] z-10'
                          : 'bg-amber-50/70 hover:bg-amber-100 text-slate-700 hover:text-slate-900 border-amber-200/80 font-bold shadow-2xs'
                      }`}
                    >
                      {holiday.image ? (
                        <img
                          src={holiday.image}
                          alt={holiday.nameEn}
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 object-contain shrink-0"
                        />
                      ) : (
                        <span className="text-lg shrink-0 leading-none">{holiday.emoji}</span>
                      )}
                      <span className="text-xs sm:text-sm font-bold tracking-tight select-none">
                        {holiday.nameEn}
                      </span>
                      {isNextHoliday && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none select-none tracking-wider shrink-0 ${
                            isActive ? 'bg-white text-amber-600' : 'bg-amber-500 text-white animate-pulse'
                          }`}
                        >
                          NEXT
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : displayedMonthHolidays.length === 0 ? (
              <div className="py-6 flex items-center justify-center text-center">
                <span className="text-6xl sm:text-7xl select-none filter drop-shadow-xs">🥱</span>
              </div>
            ) : null
          )}

          {/* ACTIVE HOLIDAY SHOWCASE CARD */}
          {selectedHoliday && (displayedMonthHolidays.length > 0 || selectedCycle !== null) && (
            <div
              className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-amber-200/80 shadow-md space-y-6"
              style={{ backgroundColor: selectedHoliday.bgLight }}
            >
              {/* Top Holiday Header Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-200/60 pb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl text-4xl sm:text-5xl flex items-center justify-center shadow-sm border-2 border-white p-2 shrink-0"
                    style={{ backgroundColor: `${selectedHoliday.color}20` }}
                  >
                    {selectedHoliday.image ? (
                      <img
                        src={selectedHoliday.image}
                        alt={selectedHoliday.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                      />
                    ) : (
                      selectedHoliday.emoji
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-800">
                        {selectedHoliday.nameEn}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeakName(selectedHoliday)}
                        className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-amber-700 shadow-2xs transition-transform active:scale-95 cursor-pointer"
                        title="Hear Hebrew Name"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div
                      className="text-lg font-bold text-amber-800 font-hebrew"
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {stripNiqqud(selectedHoliday.nameHe)} ({selectedHoliday.transliteration})
                    </div>

                    {(() => {
                      const nextOccur = getNextHolidayOccurrence(selectedHoliday.id);
                      return (
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-white/85 text-slate-600 font-bold text-xs border border-amber-200">
                            🗓️ {selectedHoliday.season}
                          </span>
                          {nextHolidayId === selectedHoliday.id && (
                            <span className="inline-block px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-[10px] tracking-wider border border-amber-600 animate-pulse shadow-2xs">
                              ⭐ NEXT UPCOMING HOLIDAY!
                            </span>
                          )}
                          <span
                            className={`inline-block px-3 py-1 rounded-full font-bold text-xs border transition-all ${
                              nextOccur.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse shadow-sm'
                                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            }`}
                          >
                            {nextOccur.status === 'active' ? '🎉' : '📅'}{' '}
                            <span className="font-bold uppercase tracking-wide mr-1 text-[10px]">
                              {nextOccur.status === 'active' ? 'Happening Now:' : 'Next Secular Date:'}
                            </span>{' '}
                            {nextOccur.dateText}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Holiday Greeting Banner */}
                <div
                  onClick={() => handleSpeakGreeting(selectedHoliday)}
                  className="w-full sm:w-auto p-3.5 rounded-2xl bg-white border-2 border-amber-300/80 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:scale-102 transition-transform"
                >
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Holiday Greeting:
                    </div>
                    <div
                      className="text-base font-bold text-amber-900 font-hebrew"
                      style={{ fontFamily: "'Akoderf', sans-serif" }}
                    >
                      {stripNiqqud(selectedHoliday.greeting.he)}
                    </div>
                    <div className="text-xs font-bold text-slate-600">
                      {selectedHoliday.greeting.en}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 shadow-2xs">
                    <Volume2 className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Description & Key Customs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* About & Customs */}
                <div className="bg-white/90 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>How We Celebrate {selectedHoliday.nameEn}</span>
                  </h4>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedHoliday.description}
                  </p>

                  <div className="space-y-1.5 pt-2">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Customs & Traditions:
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {selectedHoliday.customs.map((custom, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{custom}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Foods & Symbols Grid */}
                <div className="bg-white/90 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-3">
                      <span>Key Symbols & Tasty Treats</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-2.5">
                      {selectedHoliday.keyFoodsOrSymbols.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center gap-2.5 shadow-2xs"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.nameEn}
                              referrerPolicy="no-referrer"
                              className="w-7 h-7 object-contain shrink-0"
                            />
                          ) : (
                            <span className="text-2xl shrink-0">{item.emoji}</span>
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-800">{item.nameEn}</div>
                            <div
                              className="text-[11px] font-bold text-amber-800 font-hebrew"
                              style={{ fontFamily: "'Akoderf', sans-serif" }}
                            >
                              {stripNiqqud(item.nameHe)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fun Fact Callout */}
                  <div className="mt-3 p-3 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-950 text-xs font-medium flex items-start gap-2">
                    <span className="text-base shrink-0">💡</span>
                    <div>
                      <span className="font-bold">Fun Fact: </span>
                      <span>{selectedHoliday.funFact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export const CalendarModule = HolidaysModule;
