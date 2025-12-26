"use server";

import OpenAI from "openai";
import type {
  AnalysisResult,
  Keyword,
  PrimaryColor,
  PersonalityType,
  MonthlyReport,
} from "@features/report/types";
import { checkRateLimit, incrementRateLimit } from "@shared/lib/rateLimit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AnalysisResultKey = keyof Omit<AnalysisResult, "id">;

/**
 * File을 base64로 변환하는 헬퍼 함수
 */
async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return base64;
}

/**
 * JSON 응답 파싱 및 검증 헬퍼 함수
 */
function parseJsonResponse<T>(content: string, errorContext: string): T | null {
  if (!content || typeof content !== "string") {
    console.error(`${errorContext}: 응답이 비어있거나 유효하지 않습니다.`);
    return null;
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // JSON 시작 부분 찾기
    const jsonStart = cleanedContent.indexOf("{");
    const jsonEnd = cleanedContent.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
      console.error(`${errorContext}: JSON 형식을 찾을 수 없습니다.`, {
        contentLength: content.length,
        cleanedLength: cleanedContent.length,
        preview: cleanedContent.substring(0, 100),
      });
      return null;
    }

    const jsonContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonContent) as T;
    return parsed;
  } catch (error) {
    console.error(`${errorContext} JSON 파싱 실패:`, error);
    console.error("원본 응답 (처음 500자):", content.substring(0, 500));
    return null;
  }
}

/**
 * OpenAI API 호출 헬퍼 함수
 */
async function callOpenAI(
  prompt: string,
  images: string[],
  maxTokens: number = 500
) {
  const imageContents = images.map((base64) => ({
    type: "image_url" as const,
    image_url: {
      url: `data:image/jpeg;base64,${base64}`,
    },
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }, ...imageContents],
      },
    ],
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content;
}

/**
 * 분석 결과 필수 필드 검증 헬퍼
 */
function validateAnalysisResult(
  analysis: Partial<AnalysisResult>
): asserts analysis is AnalysisResult {
  // AnalysisResult의 모든 필수 키 목록
  const requiredKeys: AnalysisResultKey[] = [
    "keywords",
    "yearSentence",
    "primaryColor",
    "personality",
    "favoriteThings",
    "personalityType",
    "advice",
    "luckyItem",
    "avoidItem",
    "monthlyReports",
  ];

  // 각 필수 키가 존재하고 유효한지 검증
  for (const key of requiredKeys) {
    const value = analysis[key];

    // 키가 존재하지 않는 경우
    if (value === undefined || value === null) {
      throw new Error(`${key}가 분석되지 않았습니다.`);
    }

    // 타입별 유효성 검증
    switch (key) {
      case "keywords":
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("키워드가 분석되지 않았습니다.");
        }
        break;

      case "yearSentence":
      case "personality":
      case "advice":
      case "luckyItem":
      case "avoidItem":
        if (typeof value !== "string" || !value.trim()) {
          throw new Error(`${key}가 분석되지 않았습니다.`);
        }
        break;

      case "primaryColor":
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("올해의 컬러가 분석되지 않았습니다.");
        }
        break;

      case "favoriteThings":
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("좋아하는 것들이 분석되지 않았습니다.");
        }
        // Keyword 타입 검증
        for (const item of value) {
          if (
            typeof item !== "object" ||
            !item ||
            typeof (item as Keyword).text !== "string" ||
            typeof (item as Keyword).emoji !== "string"
          ) {
            throw new Error("좋아하는 것들의 형식이 올바르지 않습니다.");
          }
        }
        break;

      case "personalityType": {
        const personalityType = value as PersonalityType;
        if (
          typeof personalityType !== "object" ||
          !personalityType ||
          !personalityType.type ||
          !personalityType.description ||
          !Array.isArray(personalityType.traits) ||
          personalityType.traits.length === 0
        ) {
          throw new Error("심리 타입이 분석되지 않았습니다.");
        }
        // traits가 Keyword 타입인지 검증
        for (const trait of personalityType.traits) {
          if (
            typeof trait !== "object" ||
            !trait ||
            typeof (trait as Keyword).text !== "string" ||
            typeof (trait as Keyword).emoji !== "string"
          ) {
            throw new Error("심리 타입의 특성 형식이 올바르지 않습니다.");
          }
        }
        break;
      }

      case "monthlyReports": {
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error("월별 분석 결과가 없습니다.");
        }
        // 각 monthlyReport의 mood가 Keyword 타입인지 검증
        const reports = value as MonthlyReport[];
        for (const report of reports) {
          if (
            typeof report !== "object" ||
            !report ||
            typeof report.month !== "string" ||
            typeof report.summary !== "string" ||
            !report.mood ||
            typeof report.mood !== "object" ||
            typeof report.mood.text !== "string" ||
            typeof report.mood.emoji !== "string"
          ) {
            throw new Error("월별 리포트의 형식이 올바르지 않습니다.");
          }
        }
        break;
      }
    }
  }
}

/**
 * OpenAI Vision API를 사용하여 사진들을 분석하고
 * 키워드와 올해의 한 문장을 생성합니다.
 */
export async function analyzePhotos(
  formData: FormData
): Promise<{ result: AnalysisResult }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  // IP 기반 일일 요청 제한 체크
  const rateLimitResult = await checkRateLimit();
  if (!rateLimitResult.allowed) {
    throw new Error(
      `하루 최대 5회까지만 요청할 수 있습니다. 내일 다시 시도해주세요.`
    );
  }

  // FormData에서 파일과 reports 추출
  const files: File[] = [];
  const fileEntries = Array.from(formData.entries()).filter(([key]) =>
    key.startsWith("photo_")
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
  if (!reportsJson) {
    throw new Error("reports 데이터가 전달되지 않았습니다.");
  }
  let reports: Array<{ month: string; photoCount: number }>;
  try {
    reports = JSON.parse(reportsJson);
  } catch (error) {
    console.error("reports JSON 파싱 실패:", reportsJson);
    throw new Error("reports 데이터 파싱에 실패했습니다.");
  }

  // 위치 데이터 파싱 (있는 경우만)
  const locationsJson = formData.get("locations") as string | null;
  let locations: Array<{
    index: number;
    location: { latitude: number; longitude: number; address?: string };
  }> = [];
  if (locationsJson) {
    try {
      locations = JSON.parse(locationsJson);
    } catch (error) {
      console.warn("locations JSON 파싱 실패:", error);
      // 위치 데이터 파싱 실패는 치명적이지 않으므로 경고만
    }
  }

  // 파일 검증
  if (files.length === 0) {
    throw new Error("업로드된 파일이 없습니다.");
  }

  // 파일을 base64로 변환 (서버에서 처리)
  const photoBase64s = await Promise.all(files.map(fileToBase64));

  if (photoBase64s.length === 0) {
    throw new Error("파일을 base64로 변환하는데 실패했습니다.");
  }

  try {
    // 각 월별 리포트의 대표 사진 선택 (첫 번째 사진)
    const representativePhotos = reports.map((report, index) => {
      const photoIndex = reports
        .slice(0, index)
        .reduce((sum, r) => sum + r.photoCount, 0);
      const photo = photoBase64s[photoIndex];
      return photo || photoBase64s[0] || "";
    });

    // 월별 정보를 프롬프트에 포함
    const monthList = reports.map((r) => r.month).join(", ");
    const monthDetails = reports
      .map((r, index) => {
        const photoIndex = reports
          .slice(0, index)
          .reduce((sum, r) => sum + r.photoCount, 0);
        return `${r.month} (사진 ${photoIndex + 1}번째부터 ${
          photoIndex + r.photoCount
        }번째까지)`;
      })
      .join("\n");

    // 위치 정보를 프롬프트에 포함 (있는 경우만)
    let locationInfo = "";
    if (locations.length > 0) {
      const locationDetails = locations
        .map((loc) => {
          const { latitude, longitude } = loc.location;
          return `사진 ${loc.index + 1}번: 위도 ${latitude.toFixed(
            6
          )}, 경도 ${longitude.toFixed(6)}`;
        })
        .join("\n");
      locationInfo = `\n\n다음 사진들에는 촬영 위치 정보(GPS 좌표)가 포함되어 있습니다:\n${locationDetails}\n\n위치 정보가 있는 사진들을 분석할 때는 해당 위치를 고려하여 분석해주세요. 예를 들어, 특정 지역이나 장소에서 촬영된 사진이라면 그 지역의 특성이나 의미를 반영하여 분석해주세요.`;
    }

    console.log(reports);

    // 전체 분석 프롬프트
    const totalMonths = reports.length;
    const overallPrompt = `당신은 연말 회고를 위한 사진 분석 전문가이자 심리 분석가입니다. 
사용자가 올해 찍은 대표 사진들을 분석하여 다음을 제공해주세요:

**중요: 월별 리포트는 정확히 ${totalMonths}개만 생성해야 합니다. 입력받은 월 개수와 정확히 일치해야 합니다.**

사진은 다음과 같이 월별로 구분되어 있습니다 (총 ${totalMonths}개월):
${monthDetails}${locationInfo}

1. 전체 사진들을 관통하는 5가지 핵심 키워드와 각 키워드에 어울리는 이모지 (예: {"text": "성장", "emoji": "🌱"}, {"text": "여행", "emoji": "✈️"})
2. 올해를 한 문장으로 요약하는 문장 (예: "새로운 도전과 따뜻한 만남이 어우러진 한 해였다")
3. 올해의 주요 컬러 (2-3개의 HEX 코드와 각 컬러가 차지하는 비율, 예: [{"hexCode": "#8B7355", "percentage": 0.4}, {"hexCode": "#A8967F", "percentage": 0.35}, {"hexCode": "#C9BFB0", "percentage": 0.25}] - 사진들의 전체적인 색감을 분석하여 그라데이션을 만들 수 있는 색상들, percentage의 합은 1.0이 되어야 함)
4. 성향 (사진에서 드러나는 사용자의 성향을 한 문장으로, 예: "자연을 사랑하고 모험을 즐기는 낭만주의자")
5. 당신이 좋아하는 것들 (3-5개, 각 항목에 어울리는 이모지 포함, 예: [{"text": "카페", "emoji": "☕"}, {"text": "일출", "emoji": "🌅"}, {"text": "산책", "emoji": "🚶"}])
6. 심리 타입 (MBTI 스타일의 4글자 타입과 설명, 그리고 특성들에 각각 어울리는 이모지 포함, 예: "ENFP - 열정적인 모험가", traits: [{"text": "사교적", "emoji": "👥"}, {"text": "창의적", "emoji": "🎨"}])
7. 내년 당신에게 하는 조언 (올해의 경험을 바탕으로 내년을 위한 따뜻하고 격려하는 조언, 2-3문장)
8. 내년의 행운의 아이템 (사진과 성향을 바탕으로 내년에 행운을 가져다줄 아이템, 예: "초록색 식물", "일기장", "카메라" 등)
9. 내년에 피해야할 것 (올해의 경험과 패턴을 바탕으로 내년에 피해야 할 것, 예: "과도한 완벽주의", "무리한 약속", "밤늦은 시간" 등)
10. 각 월별 사진들에 대한 상세 분석 (각 월의 사진들을 분석하여 각 월마다 mood와 summary를 제공. summary는 해당되는 월별 사진들의 객체를 분석하여 객체의 위치, 갯수, 색상을 설명한다. 다만 사진에 없는 요소는 추측하지 않는다. mood는 그 달의 감정과 분위기를 한 단어로 표현하고 어울리는 이모지를 포함한 객체 형태로 제공하며, summary는 총 2문단의 9-10줄의 상세한 설명으로 Timeline에 표시될 내용이며, 그 달의 감정, 경험, 의미를 담아야 함. summary는 1번째 문단을 2-3줄, 2번째 문단을 7-8줄로 한다.)

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
  "favoriteThings": [
    {"text": "항목1", "emoji": "이모지1"},
    {"text": "항목2", "emoji": "이모지2"},
    {"text": "항목3", "emoji": "이모지3"}
  ],
  "personalityType": {
    "type": "4글자타입",
    "description": "타입 설명",
    "traits": [
      {"text": "특성1", "emoji": "이모지1"},
      {"text": "특성2", "emoji": "이모지2"},
      {"text": "특성3", "emoji": "이모지3"}
    ]
  },
  "advice": "내년 당신에게 하는 조언",
  "luckyItem": "내년의 행운의 아이템",
  "avoidItem": "내년에 피해야할 것",
  "monthlyReports": [
    ${reports
      .map(
        (r, index) => `{
      "month": "${r.month}",
      "mood": {"text": "감정 단어 (예: 추억, 따뜻함, 평화로움, 활기참)", "emoji": "이모지"},
      "summary": "이 달의 사진들을 분석한 상세한 설명 (총 2문단의 9-10줄, Timeline에 표시될 내용이며, 그 달의 감정, 경험, 의미를 담아야 함. summary는 1번째 문단을 2-3줄, 2번째 문단을 7-8줄로 한다.)"
    }`
      )
      .join(",\n    ")}
  ]
}

**중요: monthlyReports 배열에는 정확히 ${totalMonths}개의 객체만 포함되어야 합니다. 위에 나열된 ${totalMonths}개월에 대해서만 분석해주세요.**

한국어로 응답해주세요. JSON 형식으로 응답해주세요:`;

    // 전체 분석 API 호출 (월별 분석 포함)
    const overallContent = await callOpenAI(
      overallPrompt,
      representativePhotos.filter((p) => p !== ""),
      2000 // 월별 분석이 추가되므로 토큰 수 증가
    );

    if (!overallContent) {
      throw new Error("전체 분석 응답이 비어있습니다.");
    }

    const analysis = parseJsonResponse<{
      keywords: Keyword[];
      yearSentence: string;
      primaryColor: PrimaryColor[];
      personality: string;
      favoriteThings: Keyword[];
      personalityType: PersonalityType;
      advice: string;
      luckyItem: string;
      avoidItem: string;
      monthlyReports: {
        month: string;
        mood: Keyword;
        summary: string;
      }[];
    }>(overallContent, "전체 분석");

    if (!analysis) {
      throw new Error("전체 분석 JSON 파싱에 실패했습니다.");
    }

    // 월별 리포트 검증 및 매핑
    if (!analysis.monthlyReports || analysis.monthlyReports.length === 0) {
      throw new Error("월별 분석 결과가 없습니다.");
    }

    // 월별 리포트 개수 검증 (디버깅 정보 포함)
    if (analysis.monthlyReports.length !== reports.length) {
      console.error("월별 리포트 개수 불일치:", {
        expected: reports.length,
        actual: analysis.monthlyReports.length,
        expectedMonths: reports.map((r) => r.month),
        actualMonths: analysis.monthlyReports.map((r) => r.month),
        monthDetails,
      });
      throw new Error(
        `월별 분석 결과 개수가 일치하지 않습니다. 예상: ${
          reports.length
        }개월 (${reports.map((r) => r.month).join(", ")}), 실제: ${
          analysis.monthlyReports.length
        }개월 (${analysis.monthlyReports.map((r) => r.month).join(", ")})`
      );
    }

    // 월별 리포트를 reports 순서에 맞게 매핑
    // 인덱스 기반으로 매핑 (순서가 동일하다고 가정)
    // 원본 report.month를 항상 사용하여 실제 달을 반영
    const analyzedReports = reports.map((report, index) => {
      // 인덱스로 매핑 (순서가 동일하다고 가정)
      const monthlyReport = analysis.monthlyReports[index];

      if (!monthlyReport) {
        throw new Error(
          `월별 분석 결과를 찾을 수 없습니다: ${report.month} (인덱스: ${index})`
        );
      }

      if (
        !monthlyReport.mood ||
        typeof monthlyReport.mood !== "object" ||
        !monthlyReport.mood.text?.trim() ||
        !monthlyReport.mood.emoji?.trim() ||
        !monthlyReport.summary?.trim()
      ) {
        throw new Error(
          `월별 분석 결과가 비어있거나 유효하지 않습니다: ${report.month}`
        );
      }

      // 원본 report.month를 항상 사용하여 실제 달을 반영
      return {
        month: report.month,
        summary: monthlyReport.summary.trim(),
        mood: {
          text: monthlyReport.mood.text.trim(),
          emoji: monthlyReport.mood.emoji.trim(),
        },
        photos: [],
      };
    });

    // 필수 필드 검증
    const analysisForValidation: Partial<AnalysisResult> = {
      ...analysis,
      monthlyReports: analyzedReports,
    };
    validateAnalysisResult(analysisForValidation);

    // 분석 성공 시에만 rate limit 카운트 증가
    await incrementRateLimit();

    return {
      result: {
        keywords: analysis.keywords,
        yearSentence: analysis.yearSentence,
        primaryColor: analysis.primaryColor,
        personality: analysis.personality,
        favoriteThings: analysis.favoriteThings,
        personalityType: analysis.personalityType,
        advice: analysis.advice,
        luckyItem: analysis.luckyItem,
        avoidItem: analysis.avoidItem,
        monthlyReports: analyzedReports,
      },
    };
  } catch (error) {
    console.error("사진 분석 실패:", error);
    // 원본 에러 메시지를 포함하여 더 자세한 정보 제공
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("에러 상세:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      filesCount: files.length,
      reportsCount: reports.length,
    });
    throw new Error(`사진 분석 중 오류가 발생했습니다: ${errorMessage}`);
  }
}
