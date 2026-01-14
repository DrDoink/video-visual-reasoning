import { GoogleGenAI, Modality } from "@google/genai";

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

/**
 * Generates a thumbnail image based on a text description using Gemini 2.5 Flash Image.
 */
export const generateThumbnail = async (description: string): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image for image generation
    const modelId = 'gemini-2.5-flash-image';
    
    // Construct a prompt optimized for thumbnail generation
    const prompt = `Generate a cinematic, high-quality, photorealistic keyframe image that represents this scene: ${description}`;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9" // Standard video aspect ratio
        }
      }
    });

    // Extract the base64 image data from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    
    return null;
  } catch (error) {
    console.warn("Failed to generate thumbnail:", error);
    return null;
  }
};

/**
 * Generates a creative, fun audio review of the analysis.
 * 1. Generates text using gemini-3-flash-preview.
 * 2. Generates audio using gemini-2.5-flash-preview-tts.
 */
export const generateAudioReview = async (originalSummary: string): Promise<{ text: string; audioData: string }> => {
  try {
    // Step 1: Generate the creative text
    const textModel = 'gemini-3-flash-preview';
    const textPrompt = `
      Based on the following video analysis, write a short, creative, and slightly pretentious audio script.
      
      Persona: You are an avant-garde cultural critic or media studies professor hosting a niche podcast about "The Semiotics of the Everyday." You find profound, almost absurd philosophical meaning in the mundane details of the footage.

      Instructions:
      1. Focus intensely on specific visual minutiae (e.g., a flickering light, the texture of a wall, a background glance, the specific grain of the image) rather than the main plot.
      2. Use academic or critical theory buzzwords playfully and liberally (e.g., "liminality", "verisimilitude", "diegetic dissonance", "the male gaze", "simulacrum", "hauntology").
      3. Be enthusiastic, hyper-observant, and weirdly specific. Treat the video as a piece of high art, even if it isn't.
      4. Keep it conversational and spoken-word style.
      5. Maximum 150 words.
      
      Original Analysis:
      ${originalSummary}
    `;

    const textResponse = await ai.models.generateContent({
      model: textModel,
      contents: { parts: [{ text: textPrompt }] },
    });

    const creativeText = textResponse.text;
    if (!creativeText) throw new Error("Failed to generate creative text");

    // Step 2: Generate the audio
    const ttsModel = 'gemini-2.5-flash-preview-tts';
    const audioResponse = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text: creativeText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            // Puck is a good voice for "fun and weirdly detailed", maybe Kore for "pretentious professor" but keeping Puck for the "enthusiastic" vibe.
            prebuiltVoiceConfig: { voiceName: 'Puck' } 
          },
        },
      },
    });

    const audioPart = audioResponse.candidates?.[0]?.content?.parts?.[0];
    if (audioPart?.inlineData?.data) {
      return {
        text: creativeText,
        audioData: audioPart.inlineData.data
      };
    } else {
      throw new Error("No audio data received from TTS model");
    }

  } catch (error: any) {
    console.error("Audio Generation Error:", error);
    throw new Error("Failed to generate audio review");
  }
};