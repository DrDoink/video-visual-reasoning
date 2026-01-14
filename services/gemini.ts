import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a video summary using Gemini 2.0 Flash.
 * We use 2.0 Flash as it is optimized for multimodal input and speed.
 */
export const summarizeVideo = async (
  base64Data: string,
  mimeType: string,
  onProgress?: (status: string) => void
): Promise<string> => {
  try {
    if (onProgress) onProgress('Initializing Gemini model...');

    // Using gemini-2.0-flash-exp for robust multimodal understanding
    const modelId = 'gemini-2.0-flash-exp';

    const prompt = `
      You are an advanced video analysis AI. Your task is to generate a comprehensive and structured summary of the provided video, deeply analyzing both the visual and audio components.
      
      CRITICAL: You must explicitly identify distinct speakers (e.g., "Speaker 1", "Interviewer", "Narrator"). 
      For each segment, clearly separate the speaker identity, their sentiment, and the specific dialogue/content they delivered.

      Please output the analysis in the following Markdown format:

      ## 🎬 Executive Summary
      A concise paragraph summarizing the video's core topic, purpose, and overall tone.

      ## ⏱️ Detailed Chronological Analysis
      Break down the video into key segments. For each segment, provide:

      ### 🔹 [MM:SS] - [Topic/Event Title]
      *   **🗣️ Speaker**: [Identify the speaker/s]
      *   **🎭 Sentiment**: [Positive / Neutral / Negative] - [Brief context]
      *   **💬 Dialogue**: [Key quotes, arguments, or detailed summary of what was said]
      *   **👁️ Visual Context**: Describe the visual scene, text on screen, actions, or environment that accompanies the audio.

      ## 🗝️ Key Takeaways
      *   [Key Point 1]
      *   [Key Point 2]
      *   [Key Point 3]
    `;

    if (onProgress) onProgress('Sending video to Gemini (this may take a moment)...');

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            text: prompt
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {
        temperature: 0.4, // Lower temperature for more factual observation
        maxOutputTokens: 4096, // Increased for detailed breakdowns
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("No text response received from the model.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate summary");
  }
};