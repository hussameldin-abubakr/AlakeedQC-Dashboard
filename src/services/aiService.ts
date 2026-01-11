import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Report } from "./api";
import { compilePrompt } from "../utils/qcPrompt";
import { type AISettings } from "../types/settings";

export async function analyzeReportWithAI(report: Report, settings: AISettings, promptTemplate: string): Promise<string> {
  const prompt = compilePrompt(promptTemplate, report);

  // Prioritize .env keys as requested by the user, fallback to DB settings
  const activeGeminiKey = import.meta.env.VITE_GEMINI_API_KEY || settings.geminiKey;
  const activeCerebrasKey = import.meta.env.VITE_CEREBRAS_API_KEY || settings.cerebrasKey;

  if (settings.provider === 'google') {
    if (!activeGeminiKey) {
      throw new Error("Gemini API Key Missing. Please add your API Key in the AI Configuration settings.");
    }

    try {
      const genAI = new GoogleGenerativeAI(activeGeminiKey);
      const model = genAI.getGenerativeModel({ model: settings.model });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(`Gemini Error: ${error?.message || "Unknown error"}`);
    }
  }

  if (settings.provider === 'cerebras') {
    if (!activeCerebrasKey) {
      throw new Error("Cerebras API Key Missing. Please add your API Key in the AI Configuration settings.");
    }

    try {
      const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${activeCerebrasKey}`
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: "system", content: "You are an expert Medical Laboratory QC Specialist." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || "Cerebras API error");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      console.error("Cerebras Error:", error);
      throw new Error(`Cerebras Error: ${error?.message || "Unknown error"}`);
    }
  }

  throw new Error("Unknown AI Provider selected.");
}
