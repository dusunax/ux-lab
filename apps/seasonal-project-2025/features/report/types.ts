export interface PhotoWithMetadata {
  file: File;
  preview: string;
  createdAt?: Date;
  month?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface PersonalityType {
  type: string;
  description: string;
  traits: Keyword[];
}

export interface Keyword {
  text: string;
  emoji: string;
}

export interface PrimaryColor {
  hexCode: string;
  percentage: number;
}

/**
 * 월별 리포트 데이터
 */
export interface MonthlyReport {
  month: string;
  summary: string;
  mood: Keyword;
  photos: string[];
}

/**
 * 통합된 분석 결과 타입
 * AnalysisResult와 AfterglowReport를 하나로 통합
 */
export interface AnalysisResult {
  id?: number; // 분석 결과 ID
  // 전체 분석 결과
  keywords: Keyword[];
  yearSentence: string;
  primaryColor: PrimaryColor[];
  personality: string; // 성향 설명
  favoriteThings: Keyword[]; // 좋아하는 것들
  personalityType: PersonalityType; // MBTI 유사 타입
  advice: string; // 내년 당신에게 하는 조언
  luckyItem: string; // 내년의 행운의 아이템
  avoidItem: string; // 내년에 피해야할 것
  // 월별 리포트 데이터
  monthlyReports: MonthlyReport[];
}

/**
 * @deprecated AfterglowReport는 AnalysisResult로 통합되었습니다. MonthlyReport를 사용하세요.
 */
export type AfterglowReport = MonthlyReport;

