import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, language = 'uz' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    let promptText = text;
    if (language === 'uz') {
      promptText = `O'zbek tilida o'qing: ${text}`;
    } else if (language === 'ru') {
      promptText = `Прочитайте на русском: ${text}`;
    } else if (language === 'en') {
      promptText = `Read in English: ${text}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (base64Audio) {
      return res.status(200).json({ audio: base64Audio });
    }

    return res.status(500).json({ error: 'No audio data returned' });
  } catch (error: any) {
    console.error("TTS generation failed:", error);
    return res.status(500).json({ error: error?.message || 'TTS generation failed' });
  }
}
