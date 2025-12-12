import { GoogleGenAI, Type } from "@google/genai";
import { AIParsedNote, LLMConfig } from "../types";

const DEFAULT_PROMPT = `Analyze the following user input for a todo list item. Extract the core task content, any specific event time mentioned, the location, and a suggested urgency status.
User Input: "{{INPUT}}"
If no specific time is mentioned, leave eventTime null.
If no location is mentioned, leave location null.
Status should be one of: PENDING, URGENT, DONE. Default to PENDING.`;

const DEFAULT_SCHEMA = {
  type: "OBJECT",
  properties: {
    content: { type: "STRING", description: "The cleaned up task description" },
    eventTime: { type: "STRING", description: "ISO 8601 formatted date string if a time is detected, else null" },
    location: { type: "STRING", description: "The location if detected, else null" },
    status: { type: "STRING", description: "PENDING, URGENT, or DONE" }
  },
  required: ["content"]
};

const parseNoteWithAI = async (rawText: string, config?: LLMConfig): Promise<AIParsedNote | null> => {
  
  const provider = config?.provider || 'gemini';
  const apiKey = config?.apiKey || process.env.API_KEY;
  const model = config?.model || 'gemini-2.5-flash';
  const userPromptTemplate = config?.customPrompt || DEFAULT_PROMPT;
  
  if (!apiKey && provider !== 'gemini') {
    // OpenAI/Deepseek/Custom usually require an explicit key in client config
    console.error("API Key missing");
    // We might continue if it's gemini and env var is set, but here we depend on passed config mainly
  }

  const prompt = userPromptTemplate.replace('{{INPUT}}', rawText);

  try {
    if (provider === 'gemini') {
      // Allow fallback to process.env.API_KEY if not in config
      const finalKey = apiKey || process.env.API_KEY;
      if (!finalKey) return null;

      const ai = new GoogleGenAI({ apiKey: finalKey });
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          // @ts-ignore - Schema typing compatibility
          responseSchema: DEFAULT_SCHEMA
        }
      });
      if (response.text) return JSON.parse(response.text) as AIParsedNote;
    } 
    else if (provider === 'openai' || provider === 'deepseek' || provider === 'custom') {
      let baseUrl = config?.baseUrl;
      
      if (!baseUrl) {
          if (provider === 'deepseek') baseUrl = 'https://api.deepseek.com/v1';
          else if (provider === 'openai') baseUrl = 'https://api.openai.com/v1';
      }

      if (!baseUrl) {
          console.error("Base URL missing for custom provider");
          return null;
      }
      
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a helpful assistant that outputs JSON." },
            { role: "user", content: prompt + "\nRespond strictly in JSON format matching the schema: { content: string, eventTime: string|null, location: string|null, status: string }." }
          ],
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        return JSON.parse(data.choices[0].message.content) as AIParsedNote;
      }
    }
  } catch (error) {
    console.error("Error parsing note with AI:", error);
    return null;
  }
  return null;
};

export { parseNoteWithAI };