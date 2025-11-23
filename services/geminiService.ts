import { GoogleGenAI } from "@google/genai";

export const generateSmartFilename = async (
  imageBlob: Blob,
  apiKey: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Convert blob to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: imageBlob.type,
              data: base64Data
            }
          },
          {
            text: "Analyze this image (which is the first page of a PDF). Generate a very short, concise, snake_case filename for this document based on its title or content. Return ONLY the filename string, no extension, no markdown."
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought
      }
    });

    return response.text.trim().replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50);

  } catch (error) {
    console.error("Gemini renaming failed:", error);
    return ""; // Fallback
  }
};
