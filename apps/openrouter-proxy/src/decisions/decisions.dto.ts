import { ApiProperty } from '@nestjs/swagger';

export const DECISIONS_MODEL = '~typesafe/jev-latest';

export class DecisionsBody {
  @ApiProperty({
    description: 'jev가 참고할 상태(상황, 캐릭터 정보 등). 임의의 JSON 객체',
    example: { situation: '초인종이 울렸다' },
  })
  state!: Record<string, unknown>;

  @ApiProperty({
    description: '질문 맵. type: choice | noul | score',
    example: {
      action: {
        type: 'choice',
        instructions: '다음 행동을 고른다',
        criteria: { hide: '숨는다', ignore: '무시한다' },
      },
    },
  })
  questions!: Record<string, unknown>;
}
