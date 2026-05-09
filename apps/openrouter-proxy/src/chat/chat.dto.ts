import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageContentDto {
  @ApiProperty({ example: 'text', enum: ['text', 'image_url'] })
  type!: string;

  @ApiPropertyOptional({ example: { url: 'https://...' } })
  image_url?: { url: string };

  @ApiPropertyOptional({ example: '안녕하세요' })
  text?: string;
}

export class MessageDto {
  @ApiProperty({ example: 'user', enum: ['system', 'user', 'assistant'] })
  role!: string;

  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'object' } }],
    example: '대한민국의 수도는?',
  })
  content!: string | MessageContentDto[];
}

export class ChatBody {
  @ApiProperty({ example: 'openai/gpt-oss-120b:free' })
  model!: string;

  @ApiProperty({ type: [MessageDto] })
  messages!: MessageDto[];

  @ApiPropertyOptional({ example: 512 })
  max_tokens?: number;

  @ApiPropertyOptional({ example: false })
  stream?: boolean;

  [key: string]: unknown;
}
