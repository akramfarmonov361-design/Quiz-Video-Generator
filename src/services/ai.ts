import { Question } from "../types";

export async function generateQuizAI(topic: string, language: 'uz' | 'en' | 'ru' = 'uz'): Promise<Question[] | null> {
  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("AI API error:", error);
      return null;
    }

    const data = await response.json();
    return data.questions || null;
  } catch (error) {
    console.error("AI generation failed:", error);
    return null;
  }
}
