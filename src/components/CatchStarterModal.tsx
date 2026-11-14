import React, { useState, useEffect } from 'react';
import { Trophy, Shield, ArrowRight, Zap, Star, Train, CreditCard, CheckCircle2, Sparkles, Coins } from 'lucide-react';
import { LetterData } from '../types';
import { ALEFBET_LETTERS } from '../data/alefbet';
import { soundManager } from '../utils/audio';
import { fireCelebrationConfetti } from '../utils/confetti';
import { AlefBallIcon } from './AlefBallIcon';

interface CatchStarterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimStarters: (starterIds: string[]) => void;
  letters: LetterData[];
}

type OnboardingStep = 'welcome_money' | 'rav_kav_machine' | 'pass_dispensed' | 'starters';

export const CatchStarterModal: React.FC<CatchStarterModalProps> = ({
  isOpen,
  onClose,
  onClaimStarters,
  letters,
}) => {
  const [step, setStep] = useState<OnboardingStep>('welcome_money');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [playerCash, setPlayerCash] = useState<number>(684);

  const [starters, setStarters] = useState<[LetterData, LetterData]>(() => {
    const core = letters && letters.length >= 2 ? letters : ALEFBET_LETTERS;
    return [core[0], core[1]];
  });

  useEffect(() => {
    if (isOpen) {
      setStep('welcome_money');
      setPlayerCash(684);
      setIsProcessingPayment(false);

      const core = letters && letters.length >= 2 ? letters : ALEFBET_LETTERS;
      const shuffled = [...core].sort(() => 0.5 - Math.random());
      const p1 = shuffled[0] || ALEFBET_LETTERS[0];
      const p2 = shuffled[1] || ALEFBET_LETTERS[1];
      setStarters([p1, p2]);

      const timer = setTimeout(() => {
        soundManager.unlockAudio();
        soundManager.playCoinClink();
        soundManager.speakEnglish(
          "Shalom! I am Cantor Yakov. To travel the train stations of Israel and battle wild letters, you need an unlimited train pass. Here is 684 shekels! Head to the Rav-Kav machine to buy your monthly pass.",
          0.95,
          0.7
        );
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, letters]);

  if (!isOpen) return null;

  const [starter1, starter2] = starters;

  // Transition from Cantor Yakov's greeting to Rav-Kav Machine
  const handleGoToRavKav = () => {
    soundManager.unlockAudio();
    soundManager.playPop();
    setStep('rav_kav_machine');

    setTimeout(() => {
      soundManager.speakEnglish(
        "Rav-Kav ticket machine. Please insert 684 shekels to purchase the All-Israel monthly train pass.",
        0.95,
        0.9
      );
    }, 200);
  };

  // Process purchase on the Rav-Kav Machine
  const handleBuyMonthlyPass = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    soundManager.unlockAudio();
    soundManager.playCoinClink();

    setTimeout(() => {
      setPlayerCash(0);
      setIsProcessingPayment(false);
      setStep('pass_dispensed');
      soundManager.playSparkle();
      soundManager.playFanfare();
      fireCelebrationConfetti(0.6, 0.4);

      soundManager.speakEnglish(
        "Purchase successful! Your unlimited Rav-Kav monthly pass is loaded and ready for Israel Railways.",
        0.95,
        0.8
      );
    }, 1200);
  };

  // Return to Cantor Yakov for the two starters
  const handleReturnToYakov = () => {
    soundManager.unlockAudio();
    soundManager.playPop();
    setStep('starters');

    setTimeout(() => {
      soundManager.speakEnglish(
        `Baruch Hashem! Now that you have your Rav-Kav pass, here is your starter pair of Hebrew letters:`,
        0.95,
        0.7,
        () => {
          soundManager.speakLetter(starter1.letter, 0.9, 0.7, () => {
            soundManager.speakEnglish('and', 0.95, 0.7, () => {
              soundManager.speakLetter(starter2.letter, 0.9, 0.7, () => {
                soundManager.speakEnglish('Master their power and catch them all!', 0.95, 0.7);
              });
            });
          });
        }
      );
      soundManager.playFanfare();
      fireCelebrationConfetti(0.7, 0.4);
    }, 200);
  };

  // Claim starters and start playing
  const handleClaim = () => {
    soundManager.unlockAudio();
    soundManager.playPop();
    soundManager.playFanfare();
    fireCelebrationConfetti(0.8, 0.5);

    const starterIds = [starter1.id, starter2.id];
    onClaimStarters(starterIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-pop-burst select-none">
      <div className="bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-1 shadow-2xl max-w-lg w-full text-white border-2 border-amber-300 relative overflow-hidden">
        {/* Inner Card Container */}
        <div className="bg-slate-900/95 rounded-[22px] p-4 sm:p-6 space-y-5 text-center border border-amber-400/40 relative z-10">
          
          {/* Header Title */}
          <div className="flex flex-col items-center justify-center space-y-1.5">
            <div className="relative inline-flex items-center justify-center p-2.5 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl shadow-md">
              {step === 'rav_kav_machine' || step === 'pass_dispensed' ? (
                <Train className="w-10 h-10 text-slate-950 filter drop-shadow-md animate-bounce" />
              ) : (
                <AlefBallIcon className="w-10 h-10 text-white filter drop-shadow-md animate-bounce-wiggle" />
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              {step === 'welcome_money' && 'Welcome to CATCH AND TRAIN!'}
              {step === 'rav_kav_machine' && 'מכונת כרטיסים רב-קו • Rav-Kav Machine'}
              {step === 'pass_dispensed' && 'Rav-Kav Monthly Pass Loaded! 🎉'}
              {step === 'starters' && 'Your Starting Pair Arrives!'}
            </h2>

            {/* Station / Stage Sub-badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-amber-400/40 text-[11px] font-bold text-amber-200">
              <span>🚆 רכבת ישראל • Israel Railways</span>
              <span>•</span>
              <span className="text-emerald-400">Step {step === 'welcome_money' ? '1/3' : step === 'starters' ? '3/3' : '2/3'}</span>
            </div>
          </div>

          {/* STEP 1: Cantor Yakov Gives the Player ₪684 */}
          {step === 'welcome_money' && (
            <div className="space-y-4 animate-pop-burst">
              {/* Cantor Yakov Avatar & Dialogue */}
              <div className="flex items-start gap-3 bg-amber-950/70 border border-amber-400/40 p-3.5 rounded-2xl text-left relative">
                <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-2xl bg-slate-950/90 border-2 border-amber-400 p-1 shrink-0 overflow-hidden shadow-md flex items-center justify-center">
                  <img
                    src="/images/yakov.png"
                    alt="Cantor Yakov"
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div className="space-y-1 text-slate-100 text-xs sm:text-sm font-semibold leading-relaxed">
                  <div className="text-amber-300 font-bold text-xs flex items-center gap-1">
                    <span>Cantor Yakov</span>
                    <span className="text-[10px] text-amber-200/80">• Guide</span>
                  </div>
                  <p className="text-amber-50/95 font-medium text-[12px] sm:text-xs">
                    "Shalom! I am <strong className="text-amber-300 font-bold">Cantor Yakov</strong>. To explore all 70+ train stations across Israel and battle wild letters, you need an unlimited train pass.
                  </p>
                  <p className="text-emerald-300 font-bold text-[12px] sm:text-xs">
                    I am giving you ₪684! Go to the station's Rav-Kav machine and buy an All-Israel monthly train pass!"
                  </p>
                </div>
              </div>

              {/* ₪684 Cash Gift Box */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-400 rounded-2xl text-center space-y-1.5 shadow-inner">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>Cash Granted by Cantor Yakov</span>
                  <Coins className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl sm:text-4xl font-bold text-amber-300 tracking-tight drop-shadow-md">
                    ₪684
                  </span>
                  <span className="text-xs sm:text-sm text-emerald-200 font-bold">
                    (ש״ח / Shekels)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium">
                  Exact cost for the <span className="text-amber-300 font-bold">חופשי-חודשי ארצי</span> (All-Israel Monthly Unlimited Train Pass).
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoToRavKav}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 active:scale-98 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg border border-emerald-200 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <span>Take ₪684 & Go to Rav-Kav Machine 🚆</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 2A: The Rav-Kav Ticket Machine Interface */}
          {step === 'rav_kav_machine' && (
            <div className="space-y-4 animate-pop-burst">
              {/* Machine Screen Terminal */}
              <div className="bg-slate-950 border-3 border-emerald-500 rounded-2xl p-3.5 text-left space-y-3 shadow-xl relative overflow-hidden">
                {/* Screen Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] font-bold">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Train className="w-3.5 h-3.5" />
                    <span>רכבת ישראל • Israel Railways</span>
                  </div>
                  <div className="text-amber-300 font-bold flex items-center gap-1">
                    <span>Cash in Hand:</span>
                    <span className="bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/40">₪{playerCash}</span>
                  </div>
                </div>

                {/* Available Pass Product Card */}
                <div className="bg-slate-900 border-2 border-emerald-400/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-emerald-300 font-bold text-xs sm:text-sm">
                        חופשי-חודשי ארצי (All-Israel Monthly Pass)
                      </div>
                      <div className="text-[11px] text-slate-300 font-medium">
                        Unlimited Train Travel • רכבת ישראל
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-bold text-amber-300">
                        ₪684
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        100% Covered
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 pt-1 border-t border-slate-800 font-semibold">
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>70+ Train Stations</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Unlimited Station Battling</span>
                    </div>
                  </div>
                </div>

                {/* Prompt instructions */}
                <p className="text-[11px] text-slate-300 text-center font-medium">
                  Insert your <strong className="text-amber-300">₪684</strong> into the ticket kiosk to issue your official green Rav-Kav pass.
                </p>
              </div>

              {/* Action Button: Insert ₪684 and Buy */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleBuyMonthlyPass}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 active:scale-98 disabled:opacity-60 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-xl border border-emerald-200 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                {isProcessingPayment ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Dispensing Rav-Kav Pass...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Insert ₪684 & Dispense Rav-Kav Pass</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2B: Pass Dispensed Display */}
          {step === 'pass_dispensed' && (
            <div className="space-y-4 animate-pop-burst">
              {/* Green Rav-Kav Card Visual */}
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-4 border-2 border-emerald-300 shadow-2xl text-left space-y-3 relative overflow-hidden">
                {/* Chip & Logo Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 rounded-md bg-amber-300/90 border border-amber-200 flex items-center justify-center text-[9px] font-bold text-amber-950 shadow-xs">
                      CHIP
                    </div>
                    <div className="text-white font-bold text-base sm:text-lg tracking-wide">
                      רב-קו • Rav-Kav
                    </div>
                  </div>
                  <div className="px-2.5 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-300 text-[10px] font-bold text-emerald-200">
                    PASS ACTIVE ✅
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-0.5">
                  <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
                    Transit Contract • חוזה נסיעה
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white">
                    חופשי-חודשי ארצי (All-Israel Monthly Unlimited)
                  </div>
                  <div className="text-[11px] text-emerald-100 font-medium">
                    Valid on Israel Railways (רכבת ישראל) — All 70+ Stations
                  </div>
                </div>

                {/* Footer Balance */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-500/60 text-[11px] font-bold">
                  <span className="text-emerald-100">Paid: ₪684 (Paid in Full)</span>
                  <span className="text-amber-200">Authorized Passenger</span>
                </div>
              </div>

              {/* Cantor Yakov feedback */}
              <div className="p-3 bg-amber-950/70 border border-amber-400/40 rounded-xl text-left text-xs font-semibold text-amber-100 flex items-center gap-3">
                <img
                  src="/images/yakov.png"
                  alt="Cantor Yakov"
                  className="w-10 h-12 object-contain shrink-0 rounded-lg bg-slate-900 border border-amber-400 p-0.5"
                />
                <p>
                  "Kol HaKavod! Your Rav-Kav is activated. Return to me now so I can give you your <strong>starter Hebrew letters</strong>!"
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnToYakov}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 active:scale-98 text-amber-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg border border-yellow-200 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <span>Return to Cantor Yakov for Starters 📜</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* STEP 3: Cantor Yakov Gives the Two Starters */}
          {step === 'starters' && (
            <div className="space-y-4 animate-pop-burst">
              {/* Cantor Yakov Message */}
              <div className="flex items-start gap-3 bg-amber-950/70 border border-amber-400/40 p-3 rounded-2xl text-left relative">
                <img
                  src="/images/yakov.png"
                  alt="Cantor Yakov"
                  className="w-14 h-18 object-contain shrink-0 rounded-xl bg-slate-950 border border-amber-400 p-0.5"
                />
                <div className="space-y-1 text-slate-100 text-xs font-semibold leading-relaxed">
                  <div className="text-amber-300 font-bold text-xs flex items-center gap-1">
                    <span>Cantor Yakov</span>
                    <span className="text-[10px] text-amber-200/80">• Starters Grant</span>
                  </div>
                  <p className="text-amber-50/95 font-medium text-[11px] sm:text-xs">
                    "Baruch Hashem! Now that your Rav-Kav is loaded, you can freely ride the trains across Israel. Here is your starter pair of Hebrew letters to begin your quest!"
                  </p>
                </div>
              </div>

              {/* Starter Pair Cards Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto">
                {/* Starter 1 */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-amber-500/20 to-amber-900/40 border-2 border-amber-400/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md relative overflow-hidden group">
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-spin" />
                  </div>
                  <span
                    className="text-5xl sm:text-6xl font-bold font-hebrew text-amber-300 filter drop-shadow-md inline-block py-1"
                    style={{ 
                      fontFamily: "'Akoderf', sans-serif",
                      animation: 'letterSquashStretch1 2.7s ease-in-out infinite, letterBounce1 3.4s ease-in-out infinite',
                      animationDelay: '-0.3s, -1.8s',
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {starter1.letter}
                  </span>
                </div>

                {/* Starter 2 */}
                <div className="p-4 sm:p-5 bg-gradient-to-b from-sky-500/20 to-sky-900/40 border-2 border-sky-400/80 rounded-2xl flex flex-col items-center justify-center space-y-1 shadow-md relative overflow-hidden group">
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-sky-300 fill-sky-300 animate-spin" />
                  </div>
                  <span
                    className="text-5xl sm:text-6xl font-bold font-hebrew text-sky-300 filter drop-shadow-md inline-block py-1"
                    style={{ 
                      fontFamily: "'Akoderf', sans-serif",
                      animation: 'letterWiggleWobble1 3.2s ease-in-out infinite, letterDynamicSpinBounce 4.1s ease-in-out infinite',
                      animationDelay: '-2.1s, -0.7s',
                      transformOrigin: 'bottom center'
                    }}
                  >
                    {starter2.letter}
                  </span>
                </div>
              </div>

              {/* Final Claim Button */}
              <button
                type="button"
                onClick={handleClaim}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 hover:from-emerald-300 hover:to-teal-300 active:scale-98 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-xl border border-emerald-200 cursor-pointer flex items-center justify-center gap-2 transition-all animate-pulse"
              >
                <span>Claim Starters & Start Battling in Train Stations! 🚆🚀</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
