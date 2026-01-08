
import { GoogleGenAI, Type } from "@google/genai";
import { SceneAnalysis, ShotType } from "../types";

// Always initialize GoogleGenAI with the API key from process.env.API_KEY
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeImages = async (base64Images: string[]): Promise<SceneAnalysis> => {
  const ai = getAIClient();
  const imageParts = base64Images.map(img => ({
    inlineData: {
      mimeType: "image/png",
      data: img.split(',')[1] || img
    }
  }));

  const prompt = `
    Analyze these reference images. Describe the core scene, subject, character details (clothing, features), lighting environment, and artistic style. 
    Provide a cohesive description that can be used as a base for a storyboard. 
    You must provide the output in a JSON format with two keys: "descriptionEN" and "descriptionCN".
  `;

  // Use gemini-3-flash-preview for multimodal scene analysis tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [...imageParts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          descriptionEN: { type: Type.STRING },
          descriptionCN: { type: Type.STRING }
        },
        required: ["descriptionEN", "descriptionCN"]
      }
    }
  });

  try {
    // Access the .text property directly (do not call as a function)
    return JSON.parse(response.text || "{}") as SceneAnalysis;
  } catch (e) {
    throw new Error("Failed to parse AI response for scene analysis.");
  }
};

export const generateShots = async (
  sceneAnalysis: SceneAnalysis, 
  shotTypes: ShotType[]
): Promise<{ shotsEN: string[], shotsCN: string[] }> => {
  const ai = getAIClient();
  
  const prompt = `
    Base scene description: ${sceneAnalysis.descriptionEN}
    
    You are a professional cinematographer. Generate 9 specific camera shot descriptions for a 3x3 grid storyboard. 
    The 9 camera types are: ${shotTypes.join(", ")}.
    
    Ensure strict consistency in character, clothing, environment, and lighting across all 9 shots.
    Provide the output as a JSON object with two arrays: "shotsEN" (9 strings) and "shotsCN" (9 strings).
    Each description should be concise but visual.
  `;

  // Use gemini-3-pro-preview for complex reasoning and creative logic tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          shotsEN: { type: Type.ARRAY, items: { type: Type.STRING } },
          shotsCN: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["shotsEN", "shotsCN"]
      }
    }
  });

  try {
    // Access the .text property directly (do not call as a function)
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to parse AI response for shots generation.");
  }
};
