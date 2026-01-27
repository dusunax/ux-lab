export type { LLMProvider, LLMGenerateOptions, ImagePart, LLMProviderType } from "./types";
export { GeminiProvider, createGeminiProvider } from "./gemini";

import type { LLMProvider, LLMProviderType } from "./types";
import { createGeminiProvider } from "./gemini";

/**
 * Create an LLM provider based on type
 * To add new providers (OpenAI, Claude, etc.):
 * 1. Add the type to LLMProviderType in types.ts
 * 2. Create the provider implementation (e.g., openai.ts)
 * 3. Add the case here
 */
export function createLLMProvider(
  type: LLMProviderType = "gemini"
): LLMProvider {
  switch (type) {
    case "gemini":
      return createGeminiProvider();
  }
}

/**
 * Default provider instance (Gemini)
 */
let defaultProvider: LLMProvider | null = null;

export function getDefaultProvider(): LLMProvider {
  if (!defaultProvider) {
    defaultProvider = createLLMProvider("gemini");
  }
  return defaultProvider;
}
