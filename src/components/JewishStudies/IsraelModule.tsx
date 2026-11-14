import React, { useState } from 'react';
import { Volume2, CheckCircle2, Compass, X, Sparkles } from 'lucide-react';
import { soundManager } from '../../utils/audio';
import { stripNiqqud } from '../../utils/hebrew';
import { ZoomableSvgFrame } from '../ZoomableSvgFrame';

export interface IsraelLandmark {
  id: string;
  nameEn: string;
  nameHe: string;
  spokenHe: string;
  transliteration: string;
  emoji: string;
  badge: string;
  color: string;
  bgLight: string;
  facts: string[];
  x: string;
  y: string;
}

export const ISRAEL_LANDMARKS: IsraelLandmark[] = [
  {
    id: 'rosh-hanikra',
    nameEn: 'Rosh HaNikra',
    nameHe: 'ראש הנקרה',
    spokenHe: 'ראש הנקרה',
    transliteration: 'Rosh HaNikra',
    emoji: '🌊',
    badge: 'Sea Caves & Cable Car',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    x: '59.3%',
    y: '9.6%',
    facts: [
      'Famous for magical sea caves called grottos carved out by crashing waves!',
      'You can ride a bright red cable car all the way down the white chalk cliffs!',
      'Located at the very northwest tip of Israel right on the Mediterranean Sea!'
    ]
  },
  {
    id: 'hermon',
    nameEn: 'Mt. Hermon',
    nameHe: 'הר חרמון',
    spokenHe: 'הר חרמון',
    transliteration: 'Har Hermon',
    emoji: '🏔️',
    badge: 'Snowy Peak',
    color: '#4f46e5',
    bgLight: '#eef2ff',
    x: '80.3%',
    y: '4.4%',
    facts: [
      'The highest mountain in Israel, located way up in the snowy northern tip!',
      'The only place in Israel where you can ski and build snowmen in the winter.',
      'Its melting snow flows down to feed the Jordan River and Lake Kinneret.'
    ]
  },
  {
    id: 'safed',
    nameEn: 'Safed (Tzfat)',
    nameHe: 'צפת',
    spokenHe: 'צפת',
    transliteration: 'Tzfat',
    emoji: '🎨',
    badge: 'Mountain City of Artists',
    color: '#8b5cf6',
    bgLight: '#f5f3ff',
    x: '71.9%',
    y: '12.6%',
    facts: [
      'A windy, cobblestone city perched high up in the cool mountains of the Galilee!',
      'Famous for cozy stone alleyways, painters, candle makers, and historic synagogues!',
      'Known for doors painted sky blue to bring peace and blessings!'
    ]
  },
  {
    id: 'haifa',
    nameEn: 'Haifa',
    nameHe: 'חיפה',
    spokenHe: 'חיפה',
    transliteration: 'Haifa',
    emoji: '🛳️',
    badge: 'Port City on Mount Carmel',
    color: '#0d9488',
    bgLight: '#f0fdfa',
    x: '55.1%',
    y: '16.0%',
    facts: [
      'A big, beautiful port city built right on the slopes of Mount Carmel!',
      'Home to the famous golden-domed Bahá\'í Gardens cascading down the hillside like a giant green staircase!',
      'You can ride the Carmelit, Israel\'s special underground funicular railway!'
    ]
  },
  {
    id: 'tiberias',
    nameEn: 'Tiberias',
    nameHe: 'טבריה',
    spokenHe: 'טבריה',
    transliteration: 'Tverya',
    emoji: '⛵',
    badge: 'Historic Lakeside City',
    color: '#0891b2',
    bgLight: '#ecfeff',
    x: '73.1%',
    y: '16.7%',
    facts: [
      'A beautiful historic city located right on the western shore of the Sea of Galilee (Yam Kinneret)!',
      'Famous for its relaxing hot springs, lakeside promenade, and ancient history.',
      'Surrounded by peaceful Galilee hills and bustling boat marinas.'
    ]
  },
  {
    id: 'caesarea',
    nameEn: 'Caesarea',
    nameHe: 'קיסריה',
    spokenHe: 'קיסריה',
    transliteration: 'Caesarea',
    emoji: '🏛️',
    badge: 'Roman Port',
    color: '#7c3aed',
    bgLight: '#f5f3ff',
    x: '52.7%',
    y: '23.4%',
    facts: [
      'An ancient Roman harbor city built by King Herod right on the Mediterranean shore.',
      'Features a stunning ancient amphitheater where concerts and plays are still performed today.',
      'Full of underwater ruins, ancient hippodromes, and crusader fortress walls.'
    ]
  },
  {
    id: 'netanya',
    nameEn: 'Netanya',
    nameHe: 'נתניה',
    spokenHe: 'נתניה',
    transliteration: 'Netanya',
    emoji: '🏖️',
    badge: 'Sunny Coastal Resort',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    x: '51.2%',
    y: '27.8%',
    facts: [
      'Known as the "City of Diamonds" with gorgeous golden sandy beaches!',
      'High seaside cliffs offer a long boardwalk where you can watch the waves crash!',
      'Famous for sweet citrus groves and warm Mediterranean sunshine!'
    ]
  },
  {
    id: 'tel-aviv',
    nameEn: 'Tel Aviv',
    nameHe: 'תל אביב',
    spokenHe: 'תל אביב',
    transliteration: 'Tel Aviv',
    emoji: '🏖️',
    badge: 'Seaside City',
    color: '#0284c7',
    bgLight: '#f0f9ff',
    x: '48.3%',
    y: '33.7%',
    facts: [
      'A vibrant, modern seaside city on the Mediterranean coast with golden sandy beaches!',
      'Famous for its sunny boardwalk, bicycle paths, and bustling outdoor cafes.',
      'Founded in 1909 as the first modern Hebrew-speaking city.'
    ]
  },
  {
    id: 'ashdod',
    nameEn: 'Ashdod',
    nameHe: 'אשדוד',
    spokenHe: 'אשדוד',
    transliteration: 'Ashdod',
    emoji: '⚓',
    badge: 'Busy Blue Port',
    color: '#2563eb',
    bgLight: '#eff6ff',
    x: '44.5%',
    y: '40.5%',
    facts: [
      'Israel\'s largest seaport where giant cargo ships arrive with toys, food, and cars!',
      'Has warm, breezy beaches with a pirate-themed park right along the dunes!',
      'One of the oldest cities in the region, bustling with modern neighborhoods today!'
    ]
  },
  {
    id: 'jerusalem',
    nameEn: 'Jerusalem',
    nameHe: 'ירושלים',
    spokenHe: 'ירושלים',
    transliteration: 'Yerushalayim',
    emoji: '🏰',
    badge: 'Capital City',
    color: '#d97706',
    bgLight: '#fffbeb',
    x: '62.5%',
    y: '41.0%',
    facts: [
      'The golden and ancient capital city of Israel and the Jewish people for over 3,000 years!',
      'Home of the Kotel (Western Wall) where people place handwritten notes with prayers.',
      'Built on the rolling hills of Judea with ancient stone walls and golden rooftops.'
    ]
  },
  {
    id: 'sderot',
    nameEn: 'Sderot',
    nameHe: 'שדרות',
    spokenHe: 'שדרות',
    transliteration: 'Sderot',
    emoji: '🌻',
    badge: 'Western Negev Town',
    color: '#16a34a',
    bgLight: '#f0fdf4',
    x: '42.8%',
    y: '47.0%',
    facts: [
      'A resilient, spirited town in the rolling hills of the western Negev!',
      'Famous for its incredible castle-themed playgrounds!',
      'Known for rich community music, lively parks, and blooming winter anemone flowers!'
    ]
  },
  {
    id: 'ein-gedi',
    nameEn: 'Ein Gedi',
    nameHe: 'עין גדי',
    spokenHe: 'עין גדי',
    transliteration: 'Ein Gedi',
    emoji: '🐐',
    badge: 'Desert Water Oasis',
    color: '#059669',
    bgLight: '#ecfdf5',
    x: '68.3%',
    y: '48.8%',
    facts: [
      'A magical hidden water oasis nestled between desert canyons right beside the Dead Sea!',
      'Cool fresh waterfalls where wild ibex goats leap playfully across the rocky cliffs!',
      'Rock hyraxes peek out from boulders while desert birds sing!'
    ]
  },
  {
    id: 'masada',
    nameEn: 'Masada',
    nameHe: 'מצדה',
    spokenHe: 'מצדה',
    transliteration: 'Metzada',
    emoji: '🦅',
    badge: 'Desert Fortress',
    color: '#ea580c',
    bgLight: '#fff7ed',
    x: '67.2%',
    y: '52.0%',
    facts: [
      'A magnificent ancient fortress perched high on a desert cliff overlooking the Dead Sea.',
      'Built by King Herod as a safe royal desert palace with water cisterns and baths.',
      'Famous for its breathtaking sunrise views seen from the top of the snake path.'
    ]
  },
  {
    id: 'beer-sheva',
    nameEn: 'Beer Sheva',
    nameHe: 'באר שבע',
    spokenHe: 'באר שבע',
    transliteration: 'Beer Sheva',
    emoji: '🐪',
    badge: 'Capital of the Negev',
    color: '#d97706',
    bgLight: '#fef3c7',
    x: '50.3%',
    y: '53.6%',
    facts: [
      'The vibrant, historic hub city right in the heart of the southern desert!',
      'Where Abraham made a famous treaty and dug historic water wells thousands of years ago!',
      'Home to an amazing science park, a big zoo, and playful water fountains!'
    ]
  },
  {
    id: 'arad',
    nameEn: 'Arad',
    nameHe: 'ערד',
    spokenHe: 'עֲרָד',
    transliteration: 'Arad',
    emoji: '🏜️',
    badge: 'Clean Mountain Air',
    color: '#c2410c',
    bgLight: '#fff7ed',
    x: '62.7%',
    y: '53.4%',
    facts: [
      'A quiet, sunny desert city perched high on a plateau overlooking the Dead Sea!',
      'Famous for the cleanest, crispest mountain air in Israel!',
      'The launchpad for desert trail hikers, camel paths, and starry night skies!'
    ]
  },
  {
    id: 'mitzpe-ramon',
    nameEn: 'Mitzpe Ramon',
    nameHe: 'מצפה רמון',
    spokenHe: 'מצפה רמון',
    transliteration: 'Mitzpe Ramon',
    emoji: '🔭',
    badge: 'The Giant Crater',
    color: '#4338ca',
    bgLight: '#e0e7ff',
    x: '49.3%',
    y: '68.9%',
    facts: [
      'Sits right on the edge of the world\'s largest natural erosion crater, the Ramon Crater!',
      'Wild desert ibex wander right along the streets and cliffside lookouts!',
      'Famous for dark desert nights with a giant telescope observatory to see millions of sparkling stars!'
    ]
  },
  {
    id: 'eilat',
    nameEn: 'Eilat',
    nameHe: 'אילת',
    spokenHe: 'אילת',
    transliteration: 'Eilat',
    emoji: '☀️',
    badge: 'Red Sea Gateway',
    color: '#e11d48',
    bgLight: '#fff1f2',
    x: '54.1%',
    y: '94.1%',
    facts: [
      'Israel\'s sunny southern gateway on the Red Sea with year-round warm sunshine!',
      'Famous for colorful coral reefs full of tropical fish, dolphins, and submarines.',
      'Surrounded by majestic pink and red desert mountains.'
    ]
  }
];

export const IsraelModule: React.FC = () => {
  const [selectedLandmark, setSelectedLandmark] = useState<IsraelLandmark | null>(null);
  const [exploredSet, setExploredSet] = useState<Set<string>>(new Set());

  const handleSpeakLandmark = (landmark: IsraelLandmark) => {
    soundManager.unlockAudio();
    soundManager.playPop();
    soundManager.speakHebrew(landmark.spokenHe, 0.85, 1.0);
  };

  const handleSelectLandmark = (landmark: IsraelLandmark) => {
    soundManager.unlockAudio();
    soundManager.playPop();
    setSelectedLandmark(landmark);
    handleSpeakLandmark(landmark);
    if (!exploredSet.has(landmark.id)) {
      setExploredSet((prev) => new Set([...prev, landmark.id]));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-5">
      {/* Quick-Select Landmark Pills Row Above Map */}
      <div 
        dir="ltr"
        className="flex flex-wrap items-center justify-center gap-2.5 w-full px-1 py-1"
      >
            {ISRAEL_LANDMARKS.map((landmark) => {
              const isSelected = selectedLandmark?.id === landmark.id;
              return (
                <button
                  key={landmark.id}
                  type="button"
                  onClick={() => handleSelectLandmark(landmark)}
                  className={`px-4 py-2.5 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer active:scale-95 shadow-xs ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold scale-105 ring-2 ring-amber-300'
                      : 'bg-amber-50/70 text-slate-700 hover:bg-amber-100 hover:text-slate-900 border-amber-200/80 font-bold shadow-2xs'
                  }`}
                >
                  <span className="text-xl leading-none">{landmark.emoji}</span>
                  <span className="text-xs sm:text-sm font-bold tracking-tight">{landmark.nameEn}</span>
                </button>
              );
            })}
          </div>

          {/* Main Layout: Map on left, Explorer Station on right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Side: Interactive Map container */}
            <div className="lg:col-span-7 bg-white rounded-none p-2 sm:p-3 border-3 border-amber-300/80 shadow-md relative flex items-center justify-center">
              <div className="relative w-full max-w-md mx-auto">
                <ZoomableSvgFrame
                  src="/mappy.svg"
                  alt="Interactive Map of Israel"
                  framed={false}
                >
                  {/* Interactive click targets for all landmarks */}
                  {ISRAEL_LANDMARKS.map((landmark) => (
                    <button
                      key={landmark.id}
                      type="button"
                      aria-label={landmark.nameEn}
                      onClick={() => handleSelectLandmark(landmark)}
                      style={{
                        position: 'absolute',
                        left: landmark.x,
                        top: landmark.y,
                        transform: 'translate(-50%, -50%)',
                        width: 'calc(44px * var(--svg-zoom, 1))',
                        height: 'calc(44px * var(--svg-zoom, 1))',
                        borderRadius: '9999px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 10,
                        padding: 0
                      }}
                    />
                  ))}

                  {/* Active landmark pin indicator */}
                  {selectedLandmark && (
                    <div
                      className="landmark-pin-indicator"
                      style={{
                        position: 'absolute',
                        left: selectedLandmark.x,
                        top: selectedLandmark.y,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 20
                      }}
                    >
                      {/* Clean open highlight ring */}
                      <div
                        style={{
                          width: 'calc(36px * var(--svg-zoom, 1))',
                          height: 'calc(36px * var(--svg-zoom, 1))',
                          borderWidth: 'calc(3px * var(--svg-zoom, 1))',
                        }}
                        className="rounded-full border-solid border-orange-500 bg-orange-500/15 shadow-sm animate-pulse"
                      />
                    </div>
                  )}
                </ZoomableSvgFrame>
              </div>
            </div>

            {/* Right Side: Explorer Station Panel */}
            <div className="lg:col-span-5 h-full">
              {selectedLandmark ? (
                <div 
                  className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-amber-300 shadow-md space-y-5 h-full flex flex-col justify-between animate-fade-in"
                  style={{ backgroundColor: selectedLandmark.bgLight }}
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 border-b border-amber-200/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-3xl sm:text-4xl flex items-center justify-center shadow-xs border-2 border-white shrink-0"
                          style={{ backgroundColor: `${selectedLandmark.color}20` }}
                        >
                          {selectedLandmark.emoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                              {selectedLandmark.nameEn}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleSpeakLandmark(selectedLandmark)}
                              className="p-1.5 rounded-xl bg-white hover:bg-amber-50 text-amber-900 shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                              title="Hear Hebrew Pronunciation"
                            >
                              <Volume2 className="w-5 h-5 text-amber-700" />
                              <span className="text-xs font-bold text-amber-800">Listen</span>
                            </button>
                          </div>
                          <div 
                            className="text-base sm:text-lg font-bold text-amber-800 font-hebrew mt-0.5"
                            style={{ fontFamily: "'Akoderf', sans-serif" }}
                          >
                            {selectedLandmark.nameHe} ({selectedLandmark.transliteration})
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLandmark(null)}
                        className="p-1.5 rounded-full hover:bg-amber-200/50 text-amber-900 transition-colors cursor-pointer shrink-0"
                        title="Close Explorer Card"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Badge */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span 
                        className="px-3 py-1 rounded-full text-white font-bold text-xs shadow-2xs inline-flex items-center gap-1"
                        style={{ backgroundColor: selectedLandmark.color }}
                      >
                        <span>📍 {selectedLandmark.badge}</span>
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-950 font-bold text-xs">
                        Eretz Yisrael 🇮🇱
                      </span>
                    </div>

                    {/* Facts */}
                    <div className="space-y-2.5 pt-1">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-600" />
                        <span>Explorer Facts</span>
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-700 font-medium">
                        {selectedLandmark.facts.map((fact, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 bg-white/85 p-3 rounded-xl border border-amber-200/70 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Footer prompt */}
                  <div className="pt-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLandmark(null);
                        soundManager.playPop();
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer"
                    >
                      🗺️ Explore Another Landmark
                    </button>
                  </div>
                </div>
              ) : (
                /* Explorer Notebook Welcome View */
                <div className="bg-gradient-to-br from-amber-50 via-amber-100/60 to-yellow-100 rounded-3xl p-6 sm:p-8 border-3 border-amber-300 shadow-md flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[380px]">
                  <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center text-4xl shadow-md">
                    🤠
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-950 font-bold text-xs uppercase tracking-wider inline-block">
                      🧭 Explorer's Station
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                      Tap Any Landmark to Explore!
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto font-medium leading-relaxed">
                      Choose a city, lake, or mountain from the map or quick-select buttons above to discover fun facts and hear Hebrew names!
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2 text-amber-800 text-xs font-bold bg-white/90 px-4 py-2.5 rounded-2xl border border-amber-200 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Tap a marker on the map!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
    </div>
  );
};
