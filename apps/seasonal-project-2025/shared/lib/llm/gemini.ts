import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LLMProvider, LLMGenerateOptions } from "./types";

const DEFAULT_MODEL = "gemini-2.0-flash-lite";

export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName: string = DEFAULT_MODEL) {
    const key = apiKey || process.env.GEMINI_API_Key;
    if (!key) {
      throw new Error("GEMINI_API_Key가 설정되지 않았습니다.");
    }
    this.genAI = new GoogleGenerativeAI(key);
    this.modelName = modelName;
  }

  async generate(options: LLMGenerateOptions): Promise<string> {
    const { prompt, images = [], maxTokens = 500, responseFormat } = options;

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(responseFormat === "json" && {
          responseMimeType: "application/json",
        }),
      },
    });

    const imageParts = images.map((img) => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64,
      },
    }));

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini API 응답이 비어있습니다.");
    }

    return text;
  }
}

/**
 * Create a Gemini provider instance
 */
export function createGeminiProvider(
  apiKey?: string,
  modelName?: string
): LLMProvider {
  return new GeminiProvider(apiKey, modelName);
}
