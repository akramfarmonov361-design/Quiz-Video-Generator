export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  backgroundImage: string;
  questionImage?: string;
  audioBase64?: string;
}

export interface Quiz {
  title: string;
  questions: Question[];
  aspectRatio?: '9:16' | '16:9';
  bgmUrl?: string;
  timerDuration?: number;
  language?: 'uz' | 'en' | 'ru';
}
