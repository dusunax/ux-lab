import { BadRequestException, Injectable } from '@nestjs/common';
import { OpenrouterService } from '../openrouter/openrouter.service';
import { DECISIONS_MODEL, DecisionsBody } from './decisions.dto';

const MAX_QUESTIONS = 8;
const MAX_STATE_CHARS = 8_000;
const GATEWAY_TIMEOUT = 504;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

@Injectable()
export class DecisionsService {
  constructor(private readonly openrouter: OpenrouterService) {}

  async dispatch(body: DecisionsBody): Promise<{ status: number; data: unknown }> {
    this.validate(body);
    try {
      return await this.openrouter.callDecisions({
        model: DECISIONS_MODEL,
        state: body.state,
        questions: body.questions,
      });
    } catch (error) {
      // 알파 엔드포인트는 간헐적으로 응답이 지연되므로 타임아웃을 별도 상태로 구분
      console.error('[decisions] 호출 실패:', error);
      return { status: GATEWAY_TIMEOUT, data: { error: '결정 모델 응답 시간 초과' } };
    }
  }

  // 클라이언트가 모델/엔드포인트를 바꾸지 못하도록 state·questions 형태와 크기만 허용
  private validate(body: DecisionsBody): void {
    if (!isPlainObject(body?.state) || !isPlainObject(body?.questions)) {
      throw new BadRequestException('state와 questions는 객체여야 합니다.');
    }
    const questionCount = Object.keys(body.questions).length;
    if (questionCount === 0 || questionCount > MAX_QUESTIONS) {
      throw new BadRequestException(`questions는 1~${MAX_QUESTIONS}개여야 합니다.`);
    }
    if (JSON.stringify(body.state).length > MAX_STATE_CHARS) {
      throw new BadRequestException('state가 너무 큽니다.');
    }
  }
}
