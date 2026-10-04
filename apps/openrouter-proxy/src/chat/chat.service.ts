import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { OpenrouterService } from '../openrouter/openrouter.service';
import { ChatBody } from './chat.dto';

const FALLBACKS: Record<'image' | 'text', string[]> = {
  image: [
    'google/gemma-4-31b-it:free',
    'qwen/qwen3.8-27b:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  ],
  text: [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'qwen/qwen3.8-27b:free',
    'google/gemma-4-31b-it:free',
    'nvidia/nemotron-3.5-lightning:free',
    'inclusionai/ling-3.0-flash-sante:free',
  ],
};

// 429: rate limit, 404: 무료 제공 종료 등으로 모델이 사라진 경우
const FALLBACK_STATUSES = new Set([404, 429]);

@Injectable()
export class ChatService {
  constructor(private readonly openrouter: OpenrouterService) {}

  async dispatch(body: ChatBody): Promise<{ status: number; data: unknown }> {
    const requestedModel = body.model;
    const group = this.openrouter.hasImage(body.messages) ? 'image' : 'text';
    const isAuto = requestedModel === 'auto';
    const candidates = isAuto
      ? FALLBACKS[group]
      : [requestedModel, ...FALLBACKS[group].filter((m) => m !== requestedModel)];

    for (const model of candidates) {
      const { status, data } = await this.openrouter.call({ ...body, model });

      if (FALLBACK_STATUSES.has(status)) {
        const retryAfter =
          (data as { error?: { metadata?: { retry_after_seconds?: number } } })
            ?.error?.metadata?.retry_after_seconds ?? '?';
        console.warn(`[폴백] ${model} → ${status} (retry_after: ${retryAfter}s)`);
        continue;
      }

      if (isAuto) {
        console.log(`[auto] ${group} → ${model}`);
      } else if (model !== requestedModel) {
        console.log(`[폴백 성공] ${requestedModel} → ${model}`);
      }
      return { status, data };
    }

    return {
      status: 429,
      data: {
        error: `모든 폴백 모델(${candidates.length}개)이 rate limit에 걸렸거나 사용할 수 없습니다.`,
        tried: candidates,
      },
    };
  }

  async dispatchStream(body: ChatBody, res: Response): Promise<void> {
    const requestedModel = body.model;
    const group = this.openrouter.hasImage(body.messages) ? 'image' : 'text';
    const isAuto = requestedModel === 'auto';
    const candidates = isAuto
      ? FALLBACKS[group]
      : [requestedModel, ...FALLBACKS[group].filter((m) => m !== requestedModel)];

    for (const model of candidates) {
      const fetchRes = await this.openrouter.callRaw({ ...body, model });

      if (FALLBACK_STATUSES.has(fetchRes.status)) {
        console.warn(`[폴백] ${model} → ${fetchRes.status}`);
        continue;
      }

      if (isAuto) {
        console.log(`[auto stream] ${group} → ${model}`);
      } else if (model !== requestedModel) {
        console.log(`[폴백 성공] ${requestedModel} → ${model}`);
      }

      res.writeHead(fetchRes.status, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });

      const reader = fetchRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } finally {
        res.end();
      }
      return;
    }

    res.status(429).json({
      error: `모든 폴백 모델(${candidates.length}개)이 rate limit에 걸렸거나 사용할 수 없습니다.`,
      tried: candidates,
    });
  }
}
