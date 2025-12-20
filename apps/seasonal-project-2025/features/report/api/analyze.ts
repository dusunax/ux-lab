"use server";

import OpenAI from "openai";
import type { AfterglowReport, AnalysisResult } from "@features/report/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AnalyzePhotosParams {
  reports: Array<{
    month: string;
    photoCount: number; // 해당 월의 사진 개수
  }>;
}

/**
 * File을 base64로 변환하는 헬퍼 함수
 */
async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}

/**
 * OpenAI Vision API를 사용하여 사진들을 분석하고
 * 키워드와 올해의 한 문장을 생성합니다.
 */
export async function analyzePhotos(
  formData: FormData
): Promise<{ result: AnalysisResult; photoBase64s: string[] }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  // FormData에서 파일과 reports 추출
  const files: File[] = [];
  const fileEntries = Array.from(formData.entries()).filter(
    ([key]) => key.startsWith("photo_")
  );
  
  // 파일 순서대로 정렬
  fileEntries
    .sort(([a], [b]) => {
      const indexA = parseInt(a.split("_")[1]);
      const indexB = parseInt(b.split("_")[1]);
      return indexA - indexB;
    })
    .forEach(([, value]) => {
      if (value instanceof File) {
        files.push(value);
      }
    });

  // reports JSON 파싱
  const reportsJson = formData.get("reports") as string;
  const reports: Array<{ month: string; photoCount: number }> = JSON.parse(
    reportsJson
  );

  // 파일을 base64로 변환 (서버에서 처리)
  const photoBase64s = await Promise.all(files.map(fileToBase64));

  try {
    // 각 월별 리포트의 대표 사진 선택 (첫 번째 사진)
    const representativePhotos = reports.map((report, index) => {
      const photoIndex = reports
        .slice(0, index)
        .reduce((sum, r) => sum + r.photoCount, 0);
      const photo = photoBase64s[photoIndex];
      if (!photo) {
        console.warn(
          `월별 사진을 찾을 수 없음: ${report.month}, photoIndex: ${photoIndex}, totalPhotos: ${photoBase64s.length}`
        );
      }
      return photo || photoBase64s[0] || "";
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
10. 각 월별 사진들에 대한 상세 분석 (각 월의 사진들을 분석하여 3-4줄의 상세한 설명을 제공. Timeline에 표시될 내용으로, 그 달의 감정, 경험, 의미를 담아야 함)

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
          content: [{ type: "text", text: prompt }, ...imageContents],
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
        if (!monthPhoto) {
          console.warn(`월별 사진이 없어 분석을 건너뜁니다: ${report.month}`);
          return {
            month: report.month,
            summary: `${report.month}의 특별한 순간들`,
            mood: "기억",
            photos: [], // 클라이언트에서 채워짐
          };
        }

        const monthPrompt = `이 사진은 ${report.month}에 찍은 사진입니다.
이 달의 감정과 분위기를 한 단어로 표현하고, 이 달의 사진들을 상세히 분석하여 3-4줄의 상세한 설명을 작성해주세요.
상세 분석은 그 달의 감정, 경험, 의미를 담아 Timeline에 표시될 내용으로 작성해주세요.

응답 형식:
{
  "mood": "감정 단어 (예: nostalgic, warm, serene, cozy)",
  "summary": "이 달의 사진들을 분석한 상세한 설명 (3-4줄, Timeline에 표시될 내용)"
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
            max_tokens: 300,
            response_format: { type: "json_object" },
          });

          const monthContent = monthResponse.choices[0]?.message?.content;
          if (monthContent) {
            try {
              const monthAnalysis = JSON.parse(monthContent) as {
                mood: string;
                summary: string;
              };

              // 값이 비어있는지 확인
              if (!monthAnalysis.mood || !monthAnalysis.summary) {
                console.warn(
                  `월별 분석 결과가 비어있음: ${report.month}`,
                  monthAnalysis
                );
                return {
                  month: report.month,
                  summary:
                    monthAnalysis.summary || `${report.month}의 특별한 순간들`,
                  mood: monthAnalysis.mood || "기억",
                  photos: [], // 클라이언트에서 채워짐
                };
              }

              return {
                month: report.month,
                summary: monthAnalysis.summary,
                mood: monthAnalysis.mood,
                photos: [], // 클라이언트에서 채워짐
              };
            } catch (parseError) {
              console.error(
                `월별 분석 JSON 파싱 실패 (${report.month}):`,
                parseError,
                monthContent
              );
            }
          } else {
            console.warn(`월별 분석 응답이 비어있음: ${report.month}`);
          }
        } catch (error) {
          console.error(`월별 분석 실패 (${report.month}):`, error);
          if (error instanceof Error) {
            console.error(`에러 상세: ${error.message}`, error.stack);
          }
        }

        // 기본값 반환
        return {
          month: report.month,
          summary: `${report.month}의 특별한 순간들`,
          mood: "기억",
          photos: [], // 클라이언트에서 채워짐
        };
      })
    );

    // 기본값 설정
    const defaultColors = [
      { hexCode: "#8B7355", percentage: 0.4 },
      { hexCode: "#A8967F", percentage: 0.35 },
      { hexCode: "#C9BFB0", percentage: 0.25 },
    ];

    return {
      result: {
        keywords:
          analysis.keywords && analysis.keywords.length > 0
            ? analysis.keywords
            : [
                { text: "성장", emoji: "🌱" },
                { text: "여행", emoji: "✈️" },
                { text: "가족", emoji: "👨‍👩‍👧‍👦" },
                { text: "도전", emoji: "🚀" },
                { text: "평화", emoji: "☮️" },
              ],
        yearSentence: analysis.yearSentence,
        primaryColor:
          analysis.primaryColor && analysis.primaryColor.length > 0
            ? analysis.primaryColor
            : defaultColors,
        personality: analysis.personality,
        favoriteThings: analysis.favoriteThings,
        personalityType: analysis.personalityType,
        advice: analysis.advice,
        luckyItem: analysis.luckyItem || "행운의 아이템",
        avoidItem: analysis.avoidItem || "피해야할 것",
        reports: analyzedReports.map((analyzedReport) => ({
          month: analyzedReport.month,
          summary: analyzedReport.summary,
          mood: analyzedReport.mood,
          photos: [], // 클라이언트에서 복원됨
          keywords: analysis.keywords.map((k) => k.text),
          yearSentence: analysis.yearSentence,
        })),
      },
      photoBase64s,
    };
  } catch (error) {
    console.error("사진 분석 실패:", error);
    throw new Error("사진 분석 중 오류가 발생했습니다.");
  }
}


