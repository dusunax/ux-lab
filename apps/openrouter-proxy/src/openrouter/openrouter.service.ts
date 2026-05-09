import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatBody, MessageDto } from '../chat/chat.dto';

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

  async callRaw(body: ChatBody): Promise<Response> {
    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });
  }
}
