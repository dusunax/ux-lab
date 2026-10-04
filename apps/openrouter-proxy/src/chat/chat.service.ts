import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { OpenrouterService } from '../openrouter/openrouter.service';
import { ChatBody } from './chat.dto';
import * as fallbackModels from './fallback-models.json';

// 목록 전체가 실패하면 OpenRouter가 그 시점에 쓸 수 있는 무료 모델을 골라 주는 라우터로 마지막 시도
const LAST_RESORT = 'openrouter/free';

const FALLBACKS: Record<'image' | 'text', string[]> = {
  image: [...fallbackModels.image, LAST_RESORT],
  text: [...fallbackModels.text, LAST_RESORT],
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
