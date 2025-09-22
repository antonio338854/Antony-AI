
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using mock data.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateWorldName = async (): Promise<string> => {
  if (!API_KEY) {
    return new Promise(resolve => setTimeout(() => resolve("Crystal Canyons"), 1000));
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a cool, two-word fantasy name for a block-based video game world. For example: 'Emerald Peaks', 'Obsidian Depths', 'Sunstone Valley'. Only return the name, nothing else.",
      config: {
        temperature: 1,
        maxOutputTokens: 10,
        // FIX: Added thinkingConfig as it is required when maxOutputTokens is set for the gemini-2.5-flash model.
        thinkingConfig: { thinkingBudget: 5 },
      }
    });

    const name = response.text.trim().replace(/["'*]/g, '');
    return name || "The Forgotten Realm";
  } catch (error) {
    console.error("Error generating world name:", error);
    return "The Glitched Frontier";
  }
};
