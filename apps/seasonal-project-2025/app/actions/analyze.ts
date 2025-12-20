"use server";

import OpenAI from "openai";
import type { AfterglowReport, AnalysisResult } from "@/types/report";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzePhotosParams {
  photoBase64s: string[];
  reports: Omit<AfterglowReport, "keywords" | "yearSentence">[];
}

/**
 * OpenAI Vision API를 사용하여 사진들을 분석하고
 * 키워드와 올해의 한 문장을 생성합니다.
 */
export async function analyzePhotos(
  params: AnalyzePhotosParams
): Promise<AnalysisResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const { photoBase64s, reports } = params;

  try {
    // 각 월별 리포트의 대표 사진 선택 (첫 번째 사진)
    const representativePhotos = reports.map((report) => {
      const photoIndex = reports
        .slice(0, reports.indexOf(report))
        .reduce((sum, r) => sum + r.photos.length, 0);
      return photoBase64s[photoIndex] || photoBase64s[0];
    });

    // Vision API 호출을 위한 이미지 URL 배열 생성
    const imageContents = representativePhotos.map((base64) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
      },
    }));

    // 전체 분석 프롬프트
    const prompt = `당신은 연말 회고를 위한 사진 분석 전문가이자 심리 분석가입니다. 
사용자가 올해 찍은 대표 사진들을 분석하여 다음을 제공해주세요:

1. 전체 사진들을 관통하는 5가지 핵심 키워드와 각 키워드에 어울리는 이모지 (예: {"text": "성장", "emoji": "🌱"}, {"text": "여행", "emoji": "✈️"})
2. 올해를 한 문장으로 요약하는 문장 (예: "새로운 도전과 따뜻한 만남이 어우러진 한 해였다")
3. 올해의 주요 컬러 (2-3개의 HEX 코드와 각 컬러가 차지하는 비율, 예: [{"hexCode": "#8B7355", "percentage": 0.4}, {"hexCode": "#A8967F", "percentage": 0.35}, {"hexCode": "#C9BFB0", "percentage": 0.25}] - 사진들의 전체적인 색감을 분석하여 그라데이션을 만들 수 있는 색상들, percentage의 합은 1.0이 되어야 함)
4. 성향 (사진에서 드러나는 사용자의 성향을 한 문장으로, 예: "자연을 사랑하고 모험을 즐기는 낭만주의자")
5. 당신이 좋아하는 것들 (3-5개, 예: ["카페", "일출", "산책", "책"])
6. 심리 타입 (MBTI 스타일의 4글자 타입과 설명, 예: "ENFP - 열정적인 모험가")
7. 내년 당신에게 하는 조언 (올해의 경험을 바탕으로 내년을 위한 따뜻하고 격려하는 조언, 2-3문장)
8. 내년의 행운의 아이템 (사진과 성향을 바탕으로 내년에 행운을 가져다줄 아이템, 예: "초록색 식물", "일기장", "카메라" 등)
9. 내년에 피해야할 것 (올해의 경험과 패턴을 바탕으로 내년에 피해야 할 것, 예: "과도한 완벽주의", "무리한 약속", "밤늦은 시간" 등)

응답은 다음 JSON 형식으로 제공해주세요:
{
  "keywords": [
    {"text": "키워드1", "emoji": "이모지1"},
    {"text": "키워드2", "emoji": "이모지2"},
    {"text": "키워드3", "emoji": "이모지3"},
    {"text": "키워드4", "emoji": "이모지4"},
    {"text": "키워드5", "emoji": "이모지5"}
  ],
  "yearSentence": "올해의 한 문장",
  "primaryColor": [
    {"hexCode": "#HEX코드1", "percentage": 0.4},
    {"hexCode": "#HEX코드2", "percentage": 0.35},
    {"hexCode": "#HEX코드3", "percentage": 0.25}
  ],
  "personality": "성향 설명",
  "favoriteThings": ["항목1", "항목2", "항목3"],
  "personalityType": {
    "type": "4글자타입",
    "description": "타입 설명",
    "traits": ["특성1", "특성2", "특성3"]
  },
  "advice": "내년 당신에게 하는 조언",
  "luckyItem": "내년의 행운의 아이템",
  "avoidItem": "내년에 피해야할 것"
}

한국어로 응답해주세요.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI 응답이 비어있습니다.");
    }

    const analysis = JSON.parse(content) as {
      keywords: { text: string; emoji: string }[];
      yearSentence: string;
      primaryColor: { hexCode: string; percentage: number }[];
      personality: string;
      favoriteThings: string[];
      personalityType: {
        type: string;
        description: string;
        traits: string[];
      };
      advice: string;
      luckyItem: string;
      avoidItem: string;
    };

    // 각 월별 리포트에 대해 개별 분석
    const analyzedReports = await Promise.all(
      reports.map(async (report, index) => {
        const monthPhoto = representativePhotos[index];
        if (!monthPhoto) return report;

        const monthPrompt = `이 사진은 ${report.month}에 찍은 사진입니다.
이 달의 감정과 분위기를 한 단어로 표현하고, 이 달을 요약하는 짧은 문장을 작성해주세요.

응답 형식:
{
  "mood": "감정 단어 (예: nostalgic, warm, serene, cozy)",
  "summary": "이 달을 요약하는 짧은 문장"
}

한국어로 응답해주세요.`;

        try {
          const monthResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: monthPrompt },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:image/jpeg;base64,${monthPhoto}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 200,
            response_format: { type: "json_object" },
          });

          const monthContent = monthResponse.choices[0]?.message?.content;
          if (monthContent) {
            const monthAnalysis = JSON.parse(monthContent) as {
              mood: string;
              summary: string;
            };
            return {
              ...report,
              mood: monthAnalysis.mood,
              summary: monthAnalysis.summary,
            };
          }
        } catch (error) {
          console.error(`월별 분석 실패 (${report.month}):`, error);
        }

        return report;
      })
    );

    // 기본값 설정
    const defaultColors = [
      { hexCode: "#8B7355", percentage: 0.4 },
      { hexCode: "#A8967F", percentage: 0.35 },
      { hexCode: "#C9BFB0", percentage: 0.25 },
    ];

    return {
      keywords: analysis.keywords && analysis.keywords.length > 0
        ? analysis.keywords
        : [
            { text: "성장", emoji: "🌱" },
            { text: "여행", emoji: "✈️" },
            { text: "가족", emoji: "👨‍👩‍👧‍👦" },
            { text: "도전", emoji: "🚀" },
            { text: "평화", emoji: "☮️" },
          ],
      yearSentence: analysis.yearSentence,
      primaryColor: analysis.primaryColor && analysis.primaryColor.length > 0
        ? analysis.primaryColor
        : defaultColors,
      personality: analysis.personality,
      favoriteThings: analysis.favoriteThings,
      personalityType: analysis.personalityType,
      advice: analysis.advice,
      luckyItem: analysis.luckyItem || "행운의 아이템",
      avoidItem: analysis.avoidItem || "피해야할 것",
      reports: analyzedReports.map((report) => ({
        ...report,
        keywords: analysis.keywords.map((k) => k.text),
        yearSentence: analysis.yearSentence,
      })),
    };
  } catch (error) {
    console.error("사진 분석 실패:", error);
    throw new Error("사진 분석 중 오류가 발생했습니다.");
  }
}


