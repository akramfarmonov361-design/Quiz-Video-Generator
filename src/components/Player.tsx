import { useState, useEffect, useRef } from "react";
import { Quiz } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Maximize2, RotateCcw } from "lucide-react";
import { playPCMAsync, stopPCM } from "../services/tts";
import { playPop, playTick, playSuccess } from "../services/sfx";

interface PlayerProps {
  quiz: Quiz;
  onExit: () => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];
const OPTION_COLORS = [
  "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600",
  "from-pink-500 to-pink-600",
  "from-orange-500 to-orange-600"
];

export function Player({ quiz, onExit }: PlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<
    "init" | "question" | "options" | "timer" | "reveal" | "end"
  >("init");
  const [timeLeft, setTimeLeft] = useState(5);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (quiz.bgmUrl) {
      const audio = new Audio(quiz.bgmUrl);
      audio.loop = true;
      audio.volume = 0.15;
      audio.play().catch(e => console.error("BGM play failed:", e));
      bgmAudioRef.current = audio;
    }
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.src = '';
      }
    };
  }, [quiz.bgmUrl]);

  const question = quiz.questions[currentQuestionIndex];

  useEffect(() => {
    if (!question) return;

    let isCancelled = false;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const runSequence = async () => {
      setPhase("init");
      await sleep(500);
      if (isCancelled) return;

      setPhase("question");
      
      let audioPromise = Promise.resolve();
      if (question.audioBase64) {
        audioPromise = playPCMAsync(question.audioBase64);
      }

      // Wait 2 seconds for the user to read the question while audio starts
      await sleep(2000);
      if (isCancelled) return;

      setPhase("options");
      question.options.forEach((_, idx) => {
        setTimeout(() => {
          if (!isCancelled) playPop();
        }, idx * 150);
      });
      
      // Wait for options animation to finish
      await sleep(question.options.length * 150 + 500);
      if (isCancelled) return;

      // IMPORTANT: Wait for the audio to completely finish before starting the timer
      await audioPromise;
      if (isCancelled) return;

      // Small pause after audio finishes
      await sleep(500);
      if (isCancelled) return;

      setPhase("timer");
      const duration = quiz.timerDuration || 5;
      for (let i = duration; i > 0; i--) {
        if (isCancelled) return;
        setTimeLeft(i);
        playTick();
        await sleep(1000);
      }
      if (isCancelled) return;

      setPhase("reveal");
      playSuccess();
      await sleep(3000);
      if (isCancelled) return;

      setPhase("end");
      await sleep(500);
      if (isCancelled) return;

      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setCurrentQuestionIndex(quiz.questions.length); // End state
      }
    };

    runSequence();

    return () => {
      isCancelled = true;
      stopPCM();
    };
  }, [currentQuestionIndex, question, quiz.questions.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const getTranslation = (key: string) => {
    const lang = quiz.language || 'uz';
    const dict: Record<string, Record<string, string>> = {
      completed: {
        uz: "Test yakunlandi!",
        en: "Quiz completed!",
        ru: "Тест завершен!"
      },
      allShown: {
        uz: "Barcha savollar namoyish etildi.",
        en: "All questions have been shown.",
        ru: "Все вопросы были показаны."
      },
      restart: {
        uz: "Qayta boshlash",
        en: "Restart",
        ru: "Начать заново"
      },
      back: {
        uz: "Tahrirlashga qaytish",
        en: "Back to editor",
        ru: "Вернуться к редактированию"
      }
    };
    return dict[key][lang] || dict[key]['uz'];
  };

  if (currentQuestionIndex >= quiz.questions.length) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-neutral-900 p-8 rounded-3xl text-center max-w-md w-full border border-neutral-800 shadow-2xl"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCcw size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold mb-2">{getTranslation('completed')}</h2>
          <p className="text-neutral-400 mb-8">
            {getTranslation('allShown')}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setCurrentQuestionIndex(0)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
            >
              <RotateCcw size={20} /> {getTranslation('restart')}
            </button>
            <button
              onClick={onExit}
              className="w-full flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
            >
              <X size={20} /> {getTranslation('back')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blur effect */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl scale-110"
        style={{
          backgroundImage: `url(${question.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="absolute top-6 right-6 z-50 flex gap-3">
        <button
          onClick={toggleFullscreen}
          className="p-3 bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur rounded-full text-white transition-colors shadow-lg"
        >
          <Maximize2 size={20} />
        </button>
        <button
          onClick={onExit}
          className="p-3 bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur rounded-full text-white transition-colors shadow-lg"
        >
          <X size={20} />
        </button>
      </div>

      {/* 9:16 or 16:9 Video Container */}
      <div
        ref={containerRef}
        className={`relative w-full bg-neutral-900 rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 ${
          quiz.aspectRatio === '16:9' ? 'max-w-5xl aspect-video' : 'max-w-[420px] aspect-[9/16]'
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {question.backgroundImage ? (
            question.backgroundImage.match(/\.(mp4|webm|ogg)$/i) ? (
              <video 
                src={question.backgroundImage} 
                autoPlay loop muted playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={question.backgroundImage} 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
        </div>

        {/* Dark Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-0" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col p-6 z-10">
          
          {/* Progress Indicator */}
          <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-white font-black text-lg shadow-xl">
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>

          {/* Timer Area (Top Right for 16:9, Bottom for 9:16) */}
          <div className={quiz.aspectRatio === '16:9' ? 'absolute right-8 top-8' : 'absolute bottom-8 left-1/2 -translate-x-1/2'}>
            <AnimatePresence>
              {(phase === "timer" || phase === "reveal") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="relative flex items-center justify-center"
                >
                  {phase === "timer" ? (
                    <div className="w-24 h-24 rounded-full bg-black/50 backdrop-blur-md border-4 border-amber-400 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                      <span className="text-5xl font-black text-amber-400 drop-shadow-lg">
                        {timeLeft}
                      </span>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.8)]">
                      <span className="text-4xl font-black text-white drop-shadow-lg">
                        ✓
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Question Box (Top, Full Width) */}
          <div className={`w-full flex justify-center ${quiz.aspectRatio === '16:9' ? 'mt-4 mb-8 px-24' : 'mt-16 mb-6 px-4'}`}>
            <AnimatePresence>
              {(phase === "question" ||
                phase === "options" ||
                phase === "timer" ||
                phase === "reveal") && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="w-full text-center"
                >
                  <h2 
                    className={`${quiz.aspectRatio === '16:9' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} font-black text-white leading-tight drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]`}
                    style={{ WebkitTextStroke: '1px rgba(0,0,0,0.5)' }}
                  >
                    {question.text}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content Area (Image + Options) */}
          <div className={`flex-1 flex ${quiz.aspectRatio === '16:9' ? 'flex-row items-center justify-center gap-12 px-12' : 'flex-col items-center justify-start gap-6'}`}>
            
            {/* Side Image */}
            <AnimatePresence>
              {question.questionImage && (phase === "question" || phase === "options" || phase === "timer" || phase === "reveal") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: quiz.aspectRatio === '16:9' ? -50 : 0 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`${quiz.aspectRatio === '16:9' ? 'w-1/2 flex justify-end' : 'w-full max-w-xs'} `}
                >
                  {question.questionImage.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                      src={question.questionImage} 
                      autoPlay loop muted playsInline
                      className="w-full h-auto max-h-[50vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10 bg-black/20 backdrop-blur-sm"
                    />
                  ) : (
                    <img 
                      src={question.questionImage} 
                      alt="Question" 
                      className="w-full h-auto max-h-[50vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10 bg-black/20 backdrop-blur-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Options */}
            <div className={`w-full space-y-4 ${quiz.aspectRatio === '16:9' ? (question.questionImage ? 'w-1/2 max-w-xl' : 'max-w-3xl') : 'max-w-sm'}`}>
              <AnimatePresence>
                {(phase === "options" ||
                  phase === "timer" ||
                  phase === "reveal") &&
                  question.options.map((opt, idx) => {
                    const isReveal = phase === "reveal";
                    const isCorrect = idx === question.correctOptionIndex;

                    let bgClass = `bg-gradient-to-r ${OPTION_COLORS[idx % OPTION_COLORS.length]}`;
                    let opacityClass = "opacity-100";
                    let scaleClass = "scale-100";

                    if (isReveal) {
                      if (isCorrect) {
                        bgClass = "bg-gradient-to-r from-emerald-500 to-emerald-600 ring-4 ring-emerald-300 ring-offset-2 ring-offset-black";
                        scaleClass = "scale-105";
                      } else {
                        bgClass = "bg-neutral-800 grayscale";
                        opacityClass = "opacity-50";
                        scaleClass = "scale-95";
                      }
                    }

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: idx * 0.2,
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        className={`w-full rounded-2xl p-1 shadow-2xl transition-all duration-500 ${scaleClass} ${opacityClass}`}
                      >
                        <div className={`w-full h-full rounded-xl ${bgClass} p-4 flex items-center gap-4`}>
                          <div className="w-12 h-12 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white/30">
                            {OPTION_LABELS[idx]}
                          </div>
                          <div className="flex-1 text-left text-white font-bold text-xl sm:text-2xl leading-tight drop-shadow-md">
                            {opt}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
