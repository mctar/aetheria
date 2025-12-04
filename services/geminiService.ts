import { GoogleGenAI, Type } from "@google/genai";
import { ShapeType, CuratorInsight } from "../types";

const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const getArtisticInsight = async (
  shape: ShapeType,
  colorHex: string
): Promise<CuratorInsight> => {
  if (!ai) {
    return {
      title: "Offline Mode",
      scientificPrinciple: "Connection to the neural lattice has been severed.",
      poeticTruth: "The particles dance in the silence of the void."
    };
  }

  const prompt = `
    You are a hyper-intelligent AI entity observing a user manipulating a digital universe.
    The user has sculpted a form resembling: ${shape}
    The dominant spectral frequency is: ${colorHex}
    
    Analyze this creation.
    1. Give it a mysterious, short title.
    2. "Scientific Principle": A pseudo-scientific explanation involving quantum mechanics, astrophysics, or biology.
    3. "Poetic Truth": A philosophical interpretation of what this shape means for the human soul.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            scientificPrinciple: { type: Type.STRING },
            poeticTruth: { type: Type.STRING }
          },
          required: ['title', 'scientificPrinciple', 'poeticTruth']
        }
      }
    });

    const jsonText = response.text || '{}';
    return JSON.parse(jsonText) as CuratorInsight;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      title: "The Unobserved",
      scientificPrinciple: "Wave function collapse failed.",
      poeticTruth: "Beauty exists even when the interpreter is silent."
    };
  }
};