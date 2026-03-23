import { Quiz } from "../types";
import { Volume2 } from "lucide-react";
import { t } from "../i18n";
import { Language } from "../i18n";

interface GlobalSettingsProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
  lang: Language;
}

export function GlobalSettings({ quiz, setQuiz, lang }: GlobalSettingsProps) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Volume2 size={20} className="text-emerald-400" />
        {t('globalSettings', lang)}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-400 mb-2">
            {t('language', lang)}
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
            {t('bgmUrl', lang)}
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
            {t('timerDuration', lang)}
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
  );
}
