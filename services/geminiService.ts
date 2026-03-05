import { GoogleGenAI, Type } from "@google/genai";
import { FlowerResult } from "../types";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeSelfiForFlower = async (
  imageBase64: string
): Promise<FlowerResult> => {
  if (!ai) {
    return getRandomFallback();
  }

  const prompt = `You are "Flower Power", a fun and whimsical app that tells people what flower they are based on their selfie.

Look at this person's selfie. Based on their vibe, expression, style, and energy, decide what flower they are.

Pick from a wide variety of real flowers (roses, sunflowers, orchids, daisies, lavender, cherry blossoms, tulips, lotuses, wildflowers, peonies, dahlias, marigolds, jasmine, etc.) — be creative and specific!

Respond with:
- flowerName: The specific flower name
- emoji: A single flower/nature emoji that best matches
- description: A warm, fun 1-2 sentence explanation of why they are this flower (speak directly to them using "you")
- trait: Their defining trait in 2-3 words (e.g. "Quietly Radiant", "Bold & Bright")
- funFact: A short fun fact about this flower
- color: A hex color that matches the flower (used for UI theming)`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flowerName: { type: Type.STRING },
            emoji: { type: Type.STRING },
            description: { type: Type.STRING },
            trait: { type: Type.STRING },
            funFact: { type: Type.STRING },
            color: { type: Type.STRING },
          },
          required: ['flowerName', 'emoji', 'description', 'trait', 'funFact', 'color'],
        },
      },
    });

    const jsonText = response.text || '{}';
    return JSON.parse(jsonText) as FlowerResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    return getRandomFallback();
  }
};

const FALLBACKS: FlowerResult[] = [
  {
    flowerName: "Sunflower",
    emoji: "🌻",
    description: "You radiate warmth and positivity — people can't help but turn toward your light!",
    trait: "Bold & Bright",
    funFact: "Sunflowers can grow up to 12 feet tall and always face the sun.",
    color: "#F4A623",
  },
  {
    flowerName: "Cherry Blossom",
    emoji: "🌸",
    description: "You have a quiet, fleeting beauty that reminds everyone to appreciate the moment.",
    trait: "Gracefully Present",
    funFact: "Cherry blossoms bloom for only about two weeks each year in Japan.",
    color: "#FFB7C5",
  },
  {
    flowerName: "Wildflower",
    emoji: "🌼",
    description: "You're free-spirited and unique — you bloom wherever life plants you!",
    trait: "Untamed Spirit",
    funFact: "Wildflowers support 90% of pollinating insects worldwide.",
    color: "#7B68EE",
  },
];

function getRandomFallback(): FlowerResult {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}
