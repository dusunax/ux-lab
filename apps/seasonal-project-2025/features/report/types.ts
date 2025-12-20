export interface AfterglowReport {
  month: string;
  summary: string;
  mood: string;
  photos: string[];
  keywords?: string[];
  yearSentence?: string;
}

export interface PhotoWithMetadata {
  file: File;
  preview: string;
  dateTaken?: Date;
  month?: string;
}

export interface PersonalityType {
  type: string;
  description: string;
  traits: string[];
}

export interface Keyword {
  text: string;
  emoji: string;
}

export interface PrimaryColor {
  hexCode: string;
  percentage: number;
}

export interface AnalysisResult {
  keywords: Keyword[];
  yearSentence: string;
  primaryColor: PrimaryColor[];
  personality: string; // 성향 설명
  favoriteThings: string[]; // 좋아하는 것들
  personalityType: PersonalityType; // MBTI 유사 타입
  advice: string; // 내년 당신에게 하는 조언
  luckyItem: string; // 내년의 행운의 아이템
  avoidItem: string; // 내년에 피해야할 것
  reports: AfterglowReport[];
}

