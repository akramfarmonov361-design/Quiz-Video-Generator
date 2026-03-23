import { Question } from "../types";
import {
  Trash2,
  Image as ImageIcon,
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { t } from "../i18n";
import { Language } from "../i18n";

interface QuestionCardProps {
  question: Question;
  index: number;
  isExpanded: boolean;
  isGeneratingAudio: boolean;
  onToggleExpand: () => void;
  onUpdate: (updated: Question) => void;
  onRemove: () => void;
  onGenerateAudio: () => void;
  lang: Language;
}

export function QuestionCard({
  question: q,
  index: qIndex,
  isExpanded,
  isGeneratingAudio,
  onToggleExpand,
  onUpdate,
  onRemove,
  onGenerateAudio,
  lang,
}: QuestionCardProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl transition-all">
      <div className="flex justify-between items-center mb-2">
        <div 
          className="flex items-center gap-3 cursor-pointer flex-1"
          onClick={onToggleExpand}
        >
          <div className="bg-neutral-800 text-neutral-400 w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0">
            {qIndex + 1}
          </div>
          <h3 className="text-xl font-semibold truncate max-w-md">
            {q.text || t('question', lang)}
          </h3>
          <div className="text-neutral-500 hover:text-white transition-colors p-1">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-neutral-500 hover:text-red-400 transition-colors p-2 hover:bg-red-400/10 rounded-lg ml-4 shrink-0"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {isExpanded && (
      <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            {t('questionText', lang)}
          </label>
          <input
            type="text"
            value={q.text}
            onChange={(e) => onUpdate({ ...q, text: e.target.value })}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            placeholder="Masalan: Amir Temur davlatiga qaysi yilda asos solingan?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-3">
            {t('options', lang)}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {q.options.map((opt, optIndex) => (
              <div key={optIndex} className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctOptionIndex === optIndex}
                    onChange={() => onUpdate({ ...q, correctOptionIndex: optIndex })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...q.options];
                    newOpts[optIndex] = e.target.value;
                    onUpdate({ ...q, options: newOpts });
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
            {t('bgImage', lang)}
          </label>
          <div className="flex gap-4 items-start">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                value={q.backgroundImage}
                onChange={(e) => onUpdate({ ...q, backgroundImage: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="https://..."
              />
            </div>
            {q.backgroundImage && (
              <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800">
                {q.backgroundImage.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={q.backgroundImage} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                ) : (
                  <img src={q.backgroundImage} alt="Background preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            {t('qImage', lang)}
          </label>
          <div className="flex gap-4 items-start">
            <div className="relative flex-1">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <input
                type="text"
                value={q.questionImage || ""}
                onChange={(e) => onUpdate({ ...q, questionImage: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-all"
                placeholder="https://..."
              />
            </div>
            {q.questionImage && (
              <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900 flex items-center justify-center">
                {q.questionImage.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={q.questionImage} className="max-w-full max-h-full object-contain" muted loop autoPlay playsInline />
                ) : (
                  <img src={q.questionImage} alt="Question preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-neutral-800/50">
          <button
            onClick={onGenerateAudio}
            disabled={isGeneratingAudio}
            className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors bg-emerald-400/10 hover:bg-emerald-400/20 px-4 py-2 rounded-lg"
          >
            {isGeneratingAudio ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Volume2 size={16} />
            )}
            {q.audioBase64 ? t('updateAudio', lang) : t('generateAudio', lang)}
          </button>
          {q.audioBase64 && (
            <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('audioReady', lang)}
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
