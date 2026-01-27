/**
 * LLM Provider Interface
 * Abstraction for different LLM providers (Gemini, OpenAI, Claude, etc.)
 */

export interface ImagePart {
  base64: string;
  mimeType: string;
}

export interface LLMGenerateOptions {
  prompt: string;
  images?: ImagePart[];
  maxTokens?: number;
  responseFormat?: "json" | "text";
}

export interface LLMProvider {
  /**
   * Generate content using the LLM
   */
  generate(options: LLMGenerateOptions): Promise<string>;

  /**
   * Provider name for logging/debugging
   */
  readonly name: string;
}

export type LLMProviderType = "gemini";
