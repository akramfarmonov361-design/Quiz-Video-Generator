import { Sparkles, Loader2 } from "lucide-react";
import { t } from "../i18n";
import { Language } from "../i18n";

interface AIGeneratorProps {
  aiTopic: string;
  setAiTopic: (topic: string) => void;
  isGeneratingAI: boolean;
  generatingAudioId: string | null;
  onGenerate: () => void;
  lang: Language;
}

export function AIGenerator({
  aiTopic,
  setAiTopic,
  isGeneratingAI,
  generatingAudioId,
  onGenerate,
  lang,
}: AIGeneratorProps) {
  return (
    <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400">
          <Sparkles size={24} />
        </div>
        <h2 className="text-xl font-semibold text-indigo-100">{t('aiTitle', lang)}</h2>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          placeholder={t('aiPlaceholder', lang)}
          className="flex-1 bg-black/40 border border-indigo-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-400 transition-all placeholder:text-indigo-200/30"
          onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
        />
        <button
          onClick={onGenerate}
          disabled={isGeneratingAI || !aiTopic}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg shadow-indigo-900/20"
        >
          {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
          {isGeneratingAI ? (generatingAudioId ? t('aiGeneratingAudio', lang) : t('aiGeneratingQuestions', lang)) : t('aiButton', lang)}
        </button>
      </div>
    </div>
  );
}
