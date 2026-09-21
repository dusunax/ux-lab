import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBody, MessageDto } from '../chat/chat.dto';

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';
const DECISIONS_TIMEOUT_MS = 20_000;

@Injectable()
export class OpenrouterService {
  private readonly apiKey: string;
  private readonly port: number;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('OPENROUTER_KEY');
    this.port = this.config.get<number>('PORT') ?? 3035;
  }

  hasImage(messages: MessageDto[] = []): boolean {
    return messages.some(
      (m) =>
        Array.isArray(m.content) &&
        (m.content as unknown as { type: string }[]).some((c) => c.type === 'image_url'),
    );
  }

  private buildHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': `http://localhost:${this.port}`,
    };
  }

  async call(body: ChatBody): Promise<{ status: number; data: unknown }> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
    return { status: res.status, data: await res.json() };
  }

  async callDecisions(body: {
    model: string;
    state: Record<string, unknown>;
    questions: Record<string, unknown>;
  }): Promise<{ status: number; data: unknown }> {
    const res = await fetch(DECISIONS_URL, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(DECISIONS_TIMEOUT_MS),
    });
    return { status: res.status, data: await res.json() };
  }

  async callRaw(body: ChatBody): Promise<Response> {
    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
  }
}
