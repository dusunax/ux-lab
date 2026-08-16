import { NextRequest, NextResponse } from 'next/server';

/**
 * Tally 웹훅 핸들러
 * POST /api/webhooks/tally
 *
 * 폼 응답을 실시간으로 수신합니다
 */

interface TallyResponse {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    formId: string;
    formName: string;
    respondentId: string;
    submittedAt: string;
    fields: Array<{
      key: string;
      label: string;
      value: string | string[];
      type: string;
    }>;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 웹훅 서명 검증 (선택)
    const signature = request.headers.get('x-tally-signature');
    if (!signature) {
      console.warn('Tally 웹훅: 서명 없음');
    }

    // 요청 본문 파싱
    const payload: TallyResponse = await request.json();

    console.log('📋 Tally 폼 응답 수신:', {
      formId: payload.data.formId,
      formName: payload.data.formName,
      respondentId: payload.data.respondentId,
      fieldsCount: payload.data.fields.length,
      submittedAt: payload.data.submittedAt,
    });

    // Step 1: 폼 데이터 처리
    const formData = payload.data.fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.key]: field.value,
      }),
      {} as Record<string, string | string[]>
    );

    console.log('✅ 처리된 데이터:', formData);

    // Step 2: DB에 저장 (선택)
    // await db.tallyResponses.create({
    //   formId: payload.data.formId,
    //   respondentId: payload.data.respondentId,
    //   data: formData,
    //   submittedAt: new Date(payload.data.submittedAt),
    // });

    // Step 3: 외부 서비스에 전달 (선택)
    // await notifySlack(formData);
    // await sendEmail(formData);

    return NextResponse.json(
      {
        success: true,
        message: 'Tally 응답이 수신되었습니다',
        respondentId: payload.data.respondentId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Tally 웹훅 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 웹훅 테스트용 GET 요청
export async function GET() {
  return NextResponse.json({
    status: 'Tally 웹훅 엔드포인트가 정상 작동 중입니다',
    endpoint: '/api/webhooks/tally',
    method: 'POST',
  });
}
