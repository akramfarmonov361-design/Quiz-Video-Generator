import { useState, ChangeEvent } from "react";
import { Quiz, Question } from "../types";
import { Plus } from "lucide-react";
import { generateTTS } from "../services/tts";
import { generateQuizAI } from "../services/ai";
import { QuizRenderer } from "../services/renderer";
import { t } from "../i18n";
import { ExportOverlay } from "./ExportOverlay";
import { EditorHeader } from "./EditorHeader";
import { GlobalSettings } from "./GlobalSettings";
import { AIGenerator } from "./AIGenerator";
import { QuestionCard } from "./QuestionCard";
import { ToastContainer } from "./Toast";
import { useToast } from "../hooks/useToast";

interface EditorProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  onPlay: () => void;
}

export function Editor({ quiz, setQuiz, onPlay }: EditorProps) {
  const [generatingAudioId, setGeneratingAudioId] = useState<string | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const { toasts, showToast, removeToast } = useToast();

  const lang = quiz.language || 'uz';

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
      showToast(t('audioError', lang), 'error');
    }
    setGeneratingAudioId(null);
  };

  const handleAIGenerate = async () => {
    if (!aiTopic) return;
    setIsGeneratingAI(true);
    
    try {
      const newQuestions = await generateQuizAI(aiTopic, lang);
      if (newQuestions && newQuestions.length > 0) {
        setQuiz({ ...quiz, title: aiTopic, questions: newQuestions });
        
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
        showToast(t('aiError', lang), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(t('genericError', lang), 'error');
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
      showToast(t('videoError', lang), 'error');
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template: Quiz = {
      title: "My Custom Quiz",
      aspectRatio: "9:16",
      bgmUrl: "",
      timerDuration: 5,
      language: "uz",
      questions: [
        {
          id: "1",
          text: "Sample Question?",
          options: ["Option A", "Option B", "Option C"],
          correctOptionIndex: 0,
          backgroundImage: "https://images.unsplash.com/photo-1541359927273-d76820fc43f9?q=80&w=1000&auto=format&fit=crop",
          questionImage: ""
        }
      ]
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "quiz_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.questions && Array.isArray(json.questions)) {
          const processedQuestions = json.questions.map((q: any) => ({
            ...q,
            id: q.id || Math.random().toString(36).substring(7)
          }));
          setQuiz({ ...json, questions: processedQuestions });
        } else {
          showToast(t('invalidJson', lang), 'error');
        }
      } catch (err) {
        showToast(t('jsonParseError', lang), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {isExporting && (
        <ExportOverlay exportProgress={exportProgress} lang={lang} />
      )}

      <EditorHeader
        quiz={quiz}
        setQuiz={setQuiz}
        onPlay={onPlay}
        onExport={handleExport}
        isExporting={isExporting}
        isGeneratingAI={isGeneratingAI}
        exportProgress={exportProgress}
        onImportJSON={handleImportJSON}
        onDownloadTemplate={handleDownloadTemplate}
        lang={lang}
      />

      <GlobalSettings quiz={quiz} setQuiz={setQuiz} lang={lang} />

      <AIGenerator
        aiTopic={aiTopic}
        setAiTopic={setAiTopic}
        isGeneratingAI={isGeneratingAI}
        generatingAudioId={generatingAudioId}
        onGenerate={handleAIGenerate}
        lang={lang}
      />

      <div className="space-y-8">
        {quiz.questions.map((q, qIndex) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={qIndex}
            isExpanded={expandedQuestions[q.id] !== false}
            isGeneratingAudio={generatingAudioId === q.id}
            onToggleExpand={() => setExpandedQuestions(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
            onUpdate={(updated) => updateQuestion(qIndex, updated)}
            onRemove={() => removeQuestion(qIndex)}
            onGenerateAudio={() => handleGenerateAudio(qIndex, q)}
            lang={lang}
          />
        ))}

        <button
          onClick={addQuestion}
          className="w-full py-6 border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:border-neutral-600 hover:bg-neutral-900/50 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus size={24} />
          {t('addQuestion', lang)}
        </button>
      </div>
    </div>
  );
}
