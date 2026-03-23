export type Language = 'uz' | 'en' | 'ru';

const translations: Record<string, Record<Language, string>> = {
  // Editor - AI Section
  aiTitle: {
    uz: "AI yordamida test yaratish",
    en: "Generate Quiz with AI",
    ru: "Создать тест с помощью ИИ",
  },
  aiPlaceholder: {
    uz: "Mavzuni kiriting (masalan: Tarix, Matematika, Mantiq...)",
    en: "Enter topic (e.g., History, Math, Logic...)",
    ru: "Введите тему (например: История, Математика, Логика...)",
  },
  aiButton: {
    uz: "Yaratish",
    en: "Generate",
    ru: "Создать",
  },
  aiGeneratingAudio: {
    uz: "Ovozlar yaratilmoqda...",
    en: "Generating audio...",
    ru: "Генерация аудио...",
  },
  aiGeneratingQuestions: {
    uz: "Savollar tuzilmoqda...",
    en: "Generating questions...",
    ru: "Создание вопросов...",
  },

  // Editor - Questions
  addQuestion: {
    uz: "Yangi savol qo'shish",
    en: "Add new question",
    ru: "Добавить новый вопрос",
  },
  question: {
    uz: "Savol",
    en: "Question",
    ru: "Вопрос",
  },
  questionText: {
    uz: "Savol matni",
    en: "Question text",
    ru: "Текст вопроса",
  },
  options: {
    uz: "Variantlar (To'g'ri javobni belgilang)",
    en: "Options (Select the correct answer)",
    ru: "Варианты (Выберите правильный ответ)",
  },
  bgImage: {
    uz: "Orqa fon rasmi/video (URL)",
    en: "Background image/video (URL)",
    ru: "Фоновое изображение/видео (URL)",
  },
  qImage: {
    uz: "Savolga oid rasm/video (Ixtiyoriy, URL)",
    en: "Question image/video (Optional, URL)",
    ru: "Изображение/видео вопроса (Необязательно, URL)",
  },
  updateAudio: {
    uz: "Ovozni yangilash",
    en: "Update audio",
    ru: "Обновить аудио",
  },
  generateAudio: {
    uz: "AI Ovoz yaratish",
    en: "Generate AI Audio",
    ru: "Создать ИИ аудио",
  },
  audioReady: {
    uz: "Ovoz tayyor",
    en: "Audio ready",
    ru: "Аудио готово",
  },

  // Editor - Global Settings
  globalSettings: {
    uz: "Umumiy Sozlamalar",
    en: "Global Settings",
    ru: "Общие настройки",
  },
  language: {
    uz: "Til (Language)",
    en: "Language",
    ru: "Язык",
  },
  bgmUrl: {
    uz: "Orqa fon musiqasi (BGM URL)",
    en: "Background Music (BGM URL)",
    ru: "Фоновая музыка (BGM URL)",
  },
  timerDuration: {
    uz: "Taymer vaqti (soniya)",
    en: "Timer duration (seconds)",
    ru: "Время таймера (секунды)",
  },

  // Editor - Actions
  downloadVideo: {
    uz: "Video Yuklab Olish",
    en: "Download Video",
    ru: "Скачать видео",
  },
  preview: {
    uz: "Ko'rish",
    en: "Preview",
    ru: "Предпросмотр",
  },
  preparing: {
    uz: "Tayyorlanmoqda...",
    en: "Preparing...",
    ru: "Подготовка...",
  },
  preparingVideo: {
    uz: "Video tayyorlanmoqda...",
    en: "Preparing video...",
    ru: "Подготовка видео...",
  },
  doNotClose: {
    uz: "Iltimos, sahifani yopmang yoki boshqa oynaga o'tmang! Aks holda videoda ovoz va tasvir mos kelmay qolishi mumkin.",
    en: "Please do not close this page or switch tabs! Otherwise, the audio and video may become out of sync.",
    ru: "Пожалуйста, не закрывайте эту страницу и не переключайте вкладки! Иначе звук и видео могут рассинхронизироваться.",
  },
  titlePlaceholder: {
    uz: "Test sarlavhasi",
    en: "Quiz title",
    ru: "Название теста",
  },
  titleHeader: {
    uz: "Quiz Video Tayyorlash",
    en: "Quiz Video Creator",
    ru: "Создание видео-викторины",
  },
  titleSub: {
    uz: "TikTok, Instagram Reels va YouTube Shorts uchun",
    en: "For TikTok, Instagram Reels and YouTube Shorts",
    ru: "Для TikTok, Instagram Reels и YouTube Shorts",
  },
  downloadTemplate: {
    uz: "Shablonni yuklab olish (.json)",
    en: "Download template (.json)",
    ru: "Скачать шаблон (.json)",
  },
  importJson: {
    uz: "JSON yuklash",
    en: "Import JSON",
    ru: "Загрузить JSON",
  },

  // Editor - Error Messages
  audioError: {
    uz: "Ovoz yaratishda xatolik yuz berdi.",
    en: "Failed to generate audio.",
    ru: "Ошибка при создании аудио.",
  },
  aiError: {
    uz: "AI yordamida savollar yaratishda xatolik yuz berdi.",
    en: "Failed to generate questions with AI.",
    ru: "Ошибка при создании вопросов с помощью ИИ.",
  },
  genericError: {
    uz: "Xatolik yuz berdi.",
    en: "An error occurred.",
    ru: "Произошла ошибка.",
  },
  videoError: {
    uz: "Video yaratishda xatolik yuz berdi.",
    en: "Failed to create video.",
    ru: "Ошибка при создании видео.",
  },
  invalidJson: {
    uz: "JSON formati noto'g'ri. Iltimos, shablondan foydalaning.",
    en: "Invalid JSON format. Please use the provided template.",
    ru: "Неверный формат JSON. Используйте предоставленный шаблон.",
  },
  jsonParseError: {
    uz: "JSON faylni o'qishda xatolik.",
    en: "Error parsing JSON file.",
    ru: "Ошибка чтения JSON файла.",
  },

  // Player
  completed: {
    uz: "Test yakunlandi!",
    en: "Quiz completed!",
    ru: "Тест завершен!",
  },
  allShown: {
    uz: "Barcha savollar namoyish etildi.",
    en: "All questions have been shown.",
    ru: "Все вопросы были показаны.",
  },
  restart: {
    uz: "Qayta boshlash",
    en: "Restart",
    ru: "Начать заново",
  },
  back: {
    uz: "Tahrirlashga qaytish",
    en: "Back to editor",
    ru: "Вернуться к редактированию",
  },
};

export function t(key: string, lang: Language = 'uz'): string {
  return translations[key]?.[lang] || translations[key]?.['uz'] || key;
}
