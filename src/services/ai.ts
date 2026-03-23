import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export async function generateQuizAI(topic: string, language: 'uz' | 'en' | 'ru' = 'uz'): Promise<Question[] | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let prompt = `Mavzu: ${topic}. Shu mavzuda 5 ta qiziqarli test savolini o'zbek tilida tuzing. Har bir savol 3 ta variantdan iborat bo'lsin. To'g'ri javob indeksini (0, 1 yoki 2) ko'rsating. Orqa fon uchun mos unsplash rasm URL manzilini bering (masalan: https://images.unsplash.com/photo-...). Rasm URL manzillari haqiqiy va mavzuga mos bo'lishi kerak.`;
    
    if (language === 'en') {
      prompt = `Topic: ${topic}. Generate 5 interesting quiz questions on this topic in English. Each question should have 3 options. Indicate the correct option index (0, 1, or 2). Provide a relevant Unsplash image URL for the background (e.g., https://images.unsplash.com/photo-...). Image URLs must be real and relevant to the topic.`;
    } else if (language === 'ru') {
      prompt = `Тема: ${topic}. Создайте 5 интересных вопросов для викторины на эту тему на русском языке. В каждом вопросе должно быть 3 варианта ответа. Укажите индекс правильного ответа (0, 1 или 2). Укажите подходящий URL-адрес изображения Unsplash для фона (например, https://images.unsplash.com/photo-...). URL-адреса изображений должны быть реальными и соответствовать теме.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "Savol matni" },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 ta variant" },
              correctOptionIndex: { type: Type.INTEGER, description: "To'g'ri javob indeksi (0, 1 yoki 2)" },
              backgroundImage: { type: Type.STRING, description: "Unsplash rasm URL manzili" }
            },
            required: ["text", "options", "correctOptionIndex", "backgroundImage"]
          }
        }
      }
    });
    
    const data = JSON.parse(response.text || "[]");
    return data.map((q: any) => ({
      ...q,
      id: Math.random().toString(36).substr(2, 9)
    }));
  } catch (error) {
    console.error("AI generation failed:", error);
    return null;
  }
}
