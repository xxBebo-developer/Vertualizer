
import { GoogleGenAI, Type } from "@google/genai";
import type { ColorPalette } from '../types';

// Per coding guidelines, API key is assumed to be available in process.env.API_KEY.
// The '!' tells TypeScript to trust that this value is non-null.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const colorPaletteSchema = {
    type: Type.OBJECT,
    properties: {
        backgroundColor: {
            type: Type.STRING,
            description: "A dark, moody background color in hex format (e.g., #1A1A2E) suitable for a visualizer app.",
        },
        primaryColor: {
            type: Type.STRING,
            description: "A vibrant, contrasting primary color for the visualizer elements in hex format (e.g., #E040FB).",
        },
    },
    required: ["backgroundColor", "primaryColor"],
};

export const generateColorPalette = async (prompt: string): Promise<ColorPalette> => {
    try {
        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate a color palette for an audio visualizer based on this theme: "${prompt}". Provide a dark background color and a vibrant primary color.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: colorPaletteSchema,
            },
        });
        
        const text = result.text;
        if (!text) {
          throw new Error("API returned an empty response.");
        }
        
        // Sometimes the response might be wrapped in markdown, so we clean it.
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (parsed.backgroundColor && parsed.primaryColor) {
            return {
                backgroundColor: parsed.backgroundColor,
                primaryColor: parsed.primaryColor,
            };
        } else {
            throw new Error("Invalid palette format received from API.");
        }
    } catch (error) {
        console.error("Error generating color palette:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
};