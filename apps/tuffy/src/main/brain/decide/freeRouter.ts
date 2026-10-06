/**
 * 무료 OpenRouter 모델만 쓰는 호출기 (openrouter-proxy POST /api/chat 경유).
 * - `:free` 모델과 무료 라우터 `openrouter/free`만 호출한다 (실수로 유료 과금 방지)
 * - 호출당 요청은 1번이다. 모델 폴백은 proxy가 한다(#82 404 폴백, #83 openrouter/free 최종 폴백) —
 *   여기서도 여러 모델을 돌면 proxy 폴백과 곱해져 무료 한도를 몇 배로 쓴다
 * - 실패한 모델은 쉬게 해서 다음 호출은 목록의 다음 모델로 보낸다
 * - 호출마다 하루 예산을 하나씩 쓴다 (무료 등급은 하루 요청 수가 제한된다)
 */

/** OpenRouter가 그때 쓸 수 있는 무료 모델을 골라 주는 라우터 (2026-10-05 실측 cost 0) */
export const FREE_ROUTER = 'openrouter/free';
export const isFreeModel = (model: string) => model.endsWith(':free') || model === FREE_ROUTER;

const BENCH_MS = { gone: 6 * 60 * 60_000, busy: 10 * 60_000 } as const;
const MAX_ATTEMPTS = 1;
/**
 * 무료 라우터는 아무 모델이나 고른다. JSON 모드가 없는 모델은 사고 과정을 본문에 늘어놓다 토큰을 다 쓴다
 * (실측: nemotron-3.5-lightning, effort low를 무시하고 4000토큰 중 3970이 추론, finish=length).
 * JSON 모드를 요구하고 그 파라미터를 지원하는 모델만 고르게 하면 8초 안에 끝까지 나온다(실측 finish=stop).
 * OpenRouter 파라미터는 proxy가 그대로 넘긴다
 */
const JSON_MODE = {
  response_format: { type: 'json_object' },
  provider: { require_parameters: true },
  reasoning: { effort: 'low' },
} as const;

/** 시간 제한 + 바깥 취소(말소리가 시작되면 생각을 멈춘다)를 함께 건다 */
export const withAbort = (timeoutMs: number, signal?: AbortSignal) =>
  signal ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal]) : AbortSignal.timeout(timeoutMs);

export interface FreeRouterConfig {
  url: string;
  models: string[];
  timeoutMs: number;
}

export interface Budget {
  remaining: () => number;
  spend: () => void;
}

export class RouterError extends Error {
  constructor(readonly reason: 'no-model' | 'budget' | 'unreachable' | 'all-failed' | 'aborted', detail: string) {
    super(detail);
  }
}

type Message = { role: 'system' | 'user'; content: string };

export class FreeRouter {
  private readonly models: string[];
  private benchedUntil = new Map<string, number>();

  constructor(private readonly cfg: FreeRouterConfig, private readonly budget: Budget, private readonly now = () => Date.now()) {
    this.models = cfg.models.filter(isFreeModel);
  }

  get rejected(): string[] {
    return this.cfg.models.filter((m) => !isFreeModel(m));
  }

  /** 쉬지 않는 첫 모델로 한 번 요청한다 (폴백은 proxy 몫) */
  async chat(messages: Message[], maxTokens: number, opts: { json?: boolean; signal?: AbortSignal } = {}): Promise<{ content: string; model: string; tried: string[] }> {
    const ready = this.models.filter((m) => (this.benchedUntil.get(m) ?? 0) <= this.now());
    if (ready.length === 0) throw new RouterError('no-model', '쓸 수 있는 무료 모델 없음');
    const tried: string[] = [];
    const reasons: string[] = [];
    for (const model of ready.slice(0, MAX_ATTEMPTS)) {
      if (this.budget.remaining() <= 0) throw new RouterError('budget', '오늘 무료 호출 예산 소진');
      this.budget.spend();
      tried.push(model);
      let res: Response;
      try {
        res = await fetch(this.cfg.url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, ...(opts.json ? JSON_MODE : {}) }),
          signal: withAbort(this.cfg.timeoutMs, opts.signal),
        });
      } catch {
        if (opts.signal?.aborted) throw new RouterError('aborted', '중단됨');
        throw new RouterError('unreachable', 'proxy에 연결하지 못함');
      }
      if (res.status === 404 || res.status === 403) this.bench(model, 'gone');
      if (res.status === 429) this.bench(model, 'busy');
      if (!res.ok) {
        reasons.push(`${model} ${res.status}`);
        continue;
      }
      const data = (await res.json().catch(() => null)) as {
        model?: unknown; choices?: { finish_reason?: string; message?: { content?: unknown } }[];
      } | null;
      const choice = data?.choices?.[0];
      const content = choice?.message?.content;
      // 무료 라우터·proxy 폴백을 거치면 실제로 답한 모델은 요청한 것과 다르다
      const answered = typeof data?.model === 'string' ? data.model : model;
      if (typeof content === 'string' && content.trim()) return { content, model: answered, tried };
      reasons.push(`${answered} 빈 응답 (finish=${choice?.finish_reason ?? '?'})`);
    }
    throw new RouterError('all-failed', `무료 모델 응답 실패 · ${reasons.join(', ')}`);
  }

  private bench(model: string, why: keyof typeof BENCH_MS): void {
    this.benchedUntil.set(model, this.now() + BENCH_MS[why]);
  }
}
