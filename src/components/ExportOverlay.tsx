import { Loader2 } from "lucide-react";
import { t } from "../i18n";
import { Language } from "../i18n";

interface ExportOverlayProps {
  exportProgress: number;
  lang: Language;
}

export function ExportOverlay({ exportProgress, lang }: ExportOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center">
      <Loader2 size={64} className="animate-spin text-emerald-500 mb-6" />
      <h2 className="text-3xl font-bold mb-4">{t('preparingVideo', lang)}</h2>
      <p className="text-xl text-red-400 font-semibold max-w-lg mb-8 animate-pulse">
        {t('doNotClose', lang)}
      </p>
      <div className="w-full max-w-md bg-neutral-800 rounded-full h-4 overflow-hidden border border-neutral-700">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
          style={{ width: `${exportProgress * 100}%` }}
        />
      </div>
      <p className="mt-4 font-mono text-lg">{Math.round(exportProgress * 100)}%</p>
    </div>
  );
}
