import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedNote } from "../types";

const parseNoteWithAI = async (rawText: string): Promise<AIParsedNote | null> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following user input for a todo list item. Extract the core task content, any specific event time mentioned, the location, and a suggested urgency status.
      
      User Input: "${rawText}"
      
      If no specific time is mentioned, leave eventTime null.
      If no location is mentioned, leave location null.
      Status should be one of: PENDING, URGENT, DONE. Default to PENDING.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "The cleaned up task description" },
            eventTime: { type: Type.STRING, description: "ISO 8601 formatted date string if a time is detected, else null" },
            location: { type: Type.STRING, description: "The location if detected, else null" },
            status: { type: Type.STRING, description: "PENDING, URGENT, or DONE" }
          },
          required: ["content"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIParsedNote;
    }
    return null;

  } catch (error) {
    console.error("Error parsing note with AI:", error);
    return null;
  }
};

export { parseNoteWithAI };
