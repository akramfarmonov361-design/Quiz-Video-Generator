import { ChangeEvent } from "react";
import { Quiz } from "../types";
import {
  Play,
  Loader2,
  Download,
  Smartphone,
  MonitorPlay,
  FileJson,
  Upload,
} from "lucide-react";
import { t } from "../i18n";
import { Language } from "../i18n";

interface EditorHeaderProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  onPlay: () => void;
  onExport: () => void;
  isExporting: boolean;
  isGeneratingAI: boolean;
  exportProgress: number;
  onImportJSON: (e: ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  lang: Language;
}

export function EditorHeader({
  quiz,
  setQuiz,
  onPlay,
  onExport,
  isExporting,
  isGeneratingAI,
  exportProgress,
  onImportJSON,
  onDownloadTemplate,
  lang,
}: EditorHeaderProps) {
  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            {t('titleHeader', lang)}
          </h1>
          <p className="text-neutral-400 mt-2">
            {t('titleSub', lang)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onDownloadTemplate}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            <FileJson size={16} />
            {t('downloadTemplate', lang)}
          </button>
          <label className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm cursor-pointer">
            <Upload size={16} />
            {t('importJson', lang)}
            <input type="file" accept=".json" className="hidden" onChange={onImportJSON} />
          </label>
        </div>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div className="flex-1">
          <input
            type="text"
            value={quiz.title}
            onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
            className="text-4xl font-bold bg-transparent border-none outline-none text-white w-full placeholder:text-neutral-700"
            placeholder={t('titlePlaceholder', lang)}
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
            onClick={onExport}
            disabled={isExporting || isGeneratingAI}
            className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg relative overflow-hidden"
          >
            {isExporting ? (
              <>
                <div className="absolute inset-0 bg-emerald-600/20" style={{ width: `${exportProgress * 100}%` }} />
                <Loader2 size={20} className="animate-spin relative z-10" />
                <span className="relative z-10">{t('preparing', lang)} {Math.round(exportProgress * 100)}%</span>
              </>
            ) : (
              <>
                <Download size={20} />
                {t('downloadVideo', lang)}
              </>
            )}
          </button>
          <button
            onClick={onPlay}
            disabled={isExporting || isGeneratingAI}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Play size={20} fill="currentColor" />
            {t('preview', lang)}
          </button>
        </div>
      </div>
    </>
  );
}
