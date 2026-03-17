import { useState } from "react";
import { Quiz, Question } from "../types";
import {
  Plus,
  Trash2,
  Play,
  Image as ImageIcon,
  Volume2,
  Loader2,
  Sparkles,
  Download,
  Smartphone,
  MonitorPlay,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { generateTTS } from "../services/tts";
import { generateQuizAI } from "../services/ai";
import { QuizRenderer } from "../services/renderer";

interface EditorProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  onPlay: () => void;
}

export function Editor({ quiz, setQuiz, onPlay }: EditorProps) {
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(
    null,
  );
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateQuestion = (index: number, updated: Question) => {
    const newQs = [...quiz.questions];
    newQs[index] = updated;
    setQuiz({ ...quiz, questions: newQs });
  };

  const addQuestion = () => {
    setQuiz({
      ...quiz,
      questions: [
        ...quiz.questions,
        {
          id: Math.random().toString(36).substr(2, 9),
          text: "Yangi savol?",
          options: ["Variant A", "Variant B", "Variant C"],
          correctOptionIndex: 0,
          backgroundImage:
            "https://images.unsplash.com/photo-1505506874110-6a7a48e14c49?q=80&w=1000&auto=format&fit=crop",
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    const newQs = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQs });
  };

  const handleGenerateAudio = async (qIndex: number, q: Question) => {
    setGeneratingAudioId(q.id);
    const lang = quiz.language || 'uz';
    let textToRead = `${q.text} Variantlar: ${q.options.join(", ")}.`;
    if (lang === 'en') {
      textToRead = `${q.text} Options: ${q.options.join(", ")}.`;
    } else if (lang === 'ru') {
      textToRead = `${q.text} Варианты: ${q.options.join(", ")}.`;
    }
    const audioBase64 = await generateTTS(textToRead, lang);
    if (audioBase64) {
      updateQuestion(qIndex, { ...q, audioBase64 });
    } else {
      alert("Ovoz yaratishda xatolik yuz berdi.");
    }
    setGeneratingAudioId(null);
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setIsGeneratingAI(true);
    
    try {
      const lang = quiz.language || 'uz';
      const newQuestions = await generateQuizAI(aiTopic, lang);
      if (newQuestions && newQuestions.length > 0) {
        // Avval savollarni ekranga chiqaramiz
        setQuiz({ ...quiz, title: aiTopic, questions: newQuestions });
        
        // Keyin har bir savol uchun avtomatik ovoz yaratamiz
        let updatedQuestions = [...newQuestions];
        for (let i = 0; i < updatedQuestions.length; i++) {
          const q = updatedQuestions[i];
          setGeneratingAudioId(q.id);
          let textToRead = `${q.text} Variantlar: ${q.options.join(", ")}.`;
          if (lang === 'en') {
            textToRead = `${q.text} Options: ${q.options.join(", ")}.`;
          } else if (lang === 'ru') {
            textToRead = `${q.text} Варианты: ${q.options.join(", ")}.`;
          }
          const audioBase64 = await generateTTS(textToRead, lang);
          if (audioBase64) {
            updatedQuestions[i] = { ...updatedQuestions[i], audioBase64 };
            setQuiz({ ...quiz, title: aiTopic, questions: [...updatedQuestions] });
          }
        }
        setGeneratingAudioId(null);
        setAiTopic('');
      } else {
        alert("AI yordamida savollar yaratishda xatolik yuz berdi.");
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik yuz berdi.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const renderer = new QuizRenderer(quiz);
      renderer.onProgress = (p) => setExportProgress(p);
      renderer.onComplete = (url, extension) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${quiz.title || 'quiz'}.${extension}`;
        a.click();
        setIsExporting(false);
      };
      await renderer.start();
    } catch (err) {
      console.error(err);
      alert("Video yaratishda xatolik yuz berdi.");
      setIsExporting(false);
    }
  };

  const getTranslation = (key: string) => {
    const lang = quiz.language || 'uz';
    const dict: Record<string, Record<string, string>> = {
      aiTitle: {
        uz: "AI yordamida test yaratish",
        en: "Generate Quiz with AI",
        ru: "Создать тест с помощью ИИ"
      },
      aiPlaceholder: {
        uz: "Mavzuni kiriting (masalan: Tarix, Matematika, Mantiq...)",
        en: "Enter topic (e.g., History, Math, Logic...)",
        ru: "Введите тему (например: История, Математика, Логика...)"
      },
      aiButton: {
        uz: "Yaratish",
        en: "Generate",
        ru: "Создать"
      },
      aiGeneratingAudio: {
        uz: "Ovozlar yaratilmoqda...",
        en: "Generating audio...",
        ru: "Генерация аудио..."
      },
      aiGeneratingQuestions: {
        uz: "Savollar tuzilmoqda...",
        en: "Generating questions...",
        ru: "Создание вопросов..."
      },
      addQuestion: {
        uz: "Yangi savol qo'shish",
        en: "Add new question",
        ru: "Добавить новый вопрос"
      },
      question: {
        uz: "Savol",
        en: "Question",
        ru: "Вопрос"
      },
      questionText: {
        uz: "Savol matni",
        en: "Question text",
        ru: "Текст вопроса"
      },
      options: {
        uz: "Variantlar (To'g'ri javobni belgilang)",
        en: "Options (Select the correct answer)",
        ru: "Варианты (Выберите правильный ответ)"
      },
      bgImage: {
        uz: "Orqa fon rasmi/video (URL)",
        en: "Background image/video (URL)",
        ru: "Фоновое изображение/видео (URL)"
      },
      qImage: {
        uz: "Savolga oid rasm/video (Ixtiyoriy, URL)",
        en: "Question image/video (Optional, URL)",
        ru: "Изображение/видео вопроса (Необязательно, URL)"
      },
      updateAudio: {
        uz: "Ovozni yangilash",
        en: "Update audio",
        ru: "Обновить аудио"
      },
      generateAudio: {
        uz: "AI Ovoz yaratish",
        en: "Generate AI Audio",
        ru: "Создать ИИ аудио"
      },
      audioReady: {
        uz: "Ovoz tayyor",
        en: "Audio ready",
        ru: "Аудио готово"
      },
      globalSettings: {
        uz: "Umumiy Sozlamalar",
        en: "Global Settings",
        ru: "Общие настройки"
      },
      language: {
        uz: "Til (Language)",
        en: "Language",
        ru: "Язык"
      },
      bgmUrl: {
        uz: "Orqa fon musiqasi (BGM URL)",
        en: "Background Music (BGM URL)",
        ru: "Фоновая музыка (BGM URL)"
      },
      timerDuration: {
        uz: "Taymer vaqti (soniya)",
        en: "Timer duration (seconds)",
        ru: "Время таймера (секунды)"
      },
      downloadVideo: {
        uz: "Video Yuklab Olish",
        en: "Download Video",
        ru: "Скачать видео"
      },
      preview: {
        uz: "Ko'rish",
        en: "Preview",
        ru: "Предпросмотр"
      },
      preparing: {
        uz: "Tayyorlanmoqda...",
        en: "Preparing...",
        ru: "Подготовка..."
      },
      preparingVideo: {
        uz: "Video tayyorlanmoqda...",
        en: "Preparing video...",
        ru: "Подготовка видео..."
      },
      doNotClose: {
        uz: "Iltimos, sahifani yopmang yoki boshqa oynaga o'tmang! Aks holda videoda ovoz va tasvir mos kelmay qolishi mumkin.",
        en: "Please do not close this page or switch tabs! Otherwise, the audio and video may become out of sync.",
        ru: "Пожалуйста, не закрывайте эту страницу и не переключайте вкладки! Иначе звук и видео могут рассинхронизироваться."
      },
      titlePlaceholder: {
        uz: "Test sarlavhasi",
        en: "Quiz title",
        ru: "Название теста"
      },
      titleHeader: {
        uz: "Quiz Video Tayyorlash",
        en: "Quiz Video Creator",
        ru: "Создание видео-викторины"
      },
      titleSub: {
        uz: "TikTok, Instagram Reels va YouTube Shorts uchun",
        en: "For TikTok, Instagram Reels and YouTube Shorts",
        ru: "Для TikTok, Instagram Reels и YouTube Shorts"
      }
    };
    return dict[key][lang] || dict[key]['uz'];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {isExporting && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
          <Loader2 size={64} className="animate-spin text-emerald-500 mb-6" />
          <h2 className="text-3xl font-bold mb-4">{getTranslation('preparingVideo')}</h2>
          <p className="text-xl text-red-400 font-semibold max-w-lg mb-8 animate-pulse">
            {getTranslation('doNotClose')}
          </p>
          <div className="w-full max-w-md bg-neutral-800 rounded-full h-4 overflow-hidden border border-neutral-700">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${exportProgress * 100}%` }}
            />
          </div>
          <p className="mt-4 font-mono text-lg">{Math.round(exportProgress * 100)}%</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
          {getTranslation('titleHeader')}
        </h1>
        <p className="text-neutral-400 mt-2">
          {getTranslation('titleSub')}
        </p>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div className="flex-1">
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            className="text-4xl font-bold bg-transparent border-none outline-none text-white w-full placeholder:text-neutral-700"
            placeholder={getTranslation('titlePlaceholder')}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex bg-neutral-900 rounded-xl p-1 border border-neutral-800 mr-4">
            <button
              onClick={() => setQuiz({ ...quiz, aspectRatio: '9:16' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                quiz.aspectRatio !== '16:9' 
                  ? 'bg-neutral-800 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone size={18} />
              9:16
            </button>
            <button
              onClick={() => setQuiz({ ...quiz, aspectRatio: '16:9' })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                quiz.aspectRatio === '16:9' 
                  ? 'bg-neutral-800 text-white shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <MonitorPlay size={18} />
              16:9
            </button>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting || isGeneratingAI}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg relative overflow-hidden"
          >
            {isExporting ? (
              <>
                <div className="absolute inset-0 bg-emerald-600/20" style={{ width: `${exportProgress * 100}%` }} />
                <Loader2 size={20} className="animate-spin relative z-10" />
                <span className="relative z-10">{getTranslation('preparing')} {Math.round(exportProgress * 100)}%</span>
              </>
            ) : (
              <>
                <Download size={20} />
                {getTranslation('downloadVideo')}
              </>
            )}
          </button>
          <button
            onClick={onPlay}
            disabled={isExporting || isGeneratingAI}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Play size={20} fill="currentColor" />
            {getTranslation('preview')}
          </button>
        </div>
      </div>

      {/* Global Settings Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8 shadow-xl">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Volume2 size={20} className="text-emerald-400" />
          {getTranslation('globalSettings')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              {getTranslation('language')}
            </label>
            <select
              value={quiz.language || 'uz'}
              onChange={(e) => setQuiz({ ...quiz, language: e.target.value as 'uz' | 'en' | 'ru' })}
              className="w-full bg-black/40 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="uz">O'zbekcha</option>
              <option value="en">English</option>
              <option value="ru">Русский</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              {getTranslation('bgmUrl')}
            </label>
            <input
              type="text"
              value={quiz.bgmUrl || ""}
              onChange={(e) => setQuiz({ ...quiz, bgmUrl: e.target.value })}
              placeholder="https://example.com/music.mp3"
              className="w-full bg-black/40 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2">
              {getTranslation('timerDuration')}
            </label>
            <input
              type="number"
              min="3"
              max="30"
              value={quiz.timerDuration || 5}
              onChange={(e) => setQuiz({ ...quiz, timerDuration: parseInt(e.target.value) || 5 })}
              className="w-full bg-black/40 border border-neutral-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* AI Generation Section */}
      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
            <Sparkles size={24} />
          </div>
          <h2 className="text-xl font-semibold text-indigo-100">{getTranslation('aiTitle')}</h2>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder={getTranslation('aiPlaceholder')}
            className="flex-1 bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200/30"
            onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
          />
          <button
            onClick={handleAIGenerate}
            disabled={isGeneratingAI || !aiTopic}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-900/20"
          >
            {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
            {isGeneratingAI ? (generatingAudioId ? getTranslation('aiGeneratingAudio') : getTranslation('aiGeneratingQuestions')) : getTranslation('aiButton')}
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {quiz.questions.map((q, qIndex) => {
          const isExpanded = expandedQuestions[q.id] !== false; // Default to expanded
          
          return (
          <div
            key={q.id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl transition-all"
          >
            <div className="flex justify-between items-center mb-2">
              <div 
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={() => toggleExpand(q.id)}
              >
                <div className="bg-neutral-800 text-neutral-400 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
                  {qIndex + 1}
                </div>
                <h3 className="text-xl font-semibold truncate max-w-md">
                  {q.text || getTranslation('question')}
                </h3>
                <div className="text-neutral-500 hover:text-white transition-colors p-1">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeQuestion(qIndex); }}
                className="text-neutral-500 hover:text-red-400 transition-colors p-2 hover:bg-red-400/10 rounded-lg ml-4 shrink-0"
              >
                <Trash2 size={20} />
              </button>
            </div>

            {isExpanded && (
            <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  {getTranslation('questionText')}
                </label>
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) =>
                    updateQuestion(qIndex, { ...q, text: e.target.value })
                  }
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="Masalan: Amir Temur davlatiga qaysi yilda asos solingan?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-3">
                  {getTranslation('options')}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() =>
                            updateQuestion(qIndex, {
                              ...q,
                              correctOptionIndex: optIndex,
                            })
                          }
                          className="w-4 h-4 accent-emerald-500 cursor-pointer"
                        />
                      </div>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[optIndex] = e.target.value;
                          updateQuestion(qIndex, { ...q, options: newOpts });
                        }}
                        className={`w-full bg-neutral-950 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none transition-all ${
                          q.correctOptionIndex === optIndex
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-neutral-800 focus:border-neutral-600"
                        }`}
                        placeholder={`Variant ${optIndex + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  {getTranslation('bgImage')}
                </label>
                <div className="flex gap-4 items-start">
                  <div className="relative flex-1">
                    <ImageIcon
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={q.backgroundImage}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          ...q,
                          backgroundImage: e.target.value,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  {q.backgroundImage && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                      {q.backgroundImage.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={q.backgroundImage}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={q.backgroundImage}
                          alt="Background preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  {getTranslation('qImage')}
                </label>
                <div className="flex gap-4 items-start">
                  <div className="relative flex-1">
                    <ImageIcon
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={q.questionImage || ""}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          ...q,
                          questionImage: e.target.value,
                        })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  {q.questionImage && (
                    <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                      {q.questionImage.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video
                          src={q.questionImage}
                          className="max-w-full max-h-full object-contain"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img
                          src={q.questionImage}
                          alt="Question preview"
                          className="max-w-full max-h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-neutral-800/50">
                <button
                  onClick={() => handleGenerateAudio(qIndex, q)}
                  disabled={generatingAudioId === q.id}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors bg-emerald-400/10 hover:bg-emerald-400/20 px-4 py-2 rounded-lg"
                >
                  {generatingAudioId === q.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Volume2 size={16} />
                  )}
                  {q.audioBase64 ? getTranslation('updateAudio') : getTranslation('generateAudio')}
                </button>
                {q.audioBase64 && (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {getTranslation('audioReady')}
                  </span>
                )}
              </div>
            </div>
            )}
          </div>
        );
      })}

        <button
          onClick={addQuestion}
          className="w-full py-6 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={24} />
          {getTranslation('addQuestion')}
        </button>
      </div>
    </div>
  );
}
