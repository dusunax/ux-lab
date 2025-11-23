export type ApplicationStatus =
  | "draft" // 작성 중
  | "applied" // 지원함
  | "document_passed" // 서류통과
  | "interview" // 면접
  | "final_passed" // 최종합격
  | "rejected"; // 불합격

export type ApplicationSource =
  | "saramin" // 사람인
  | "wanted" // 원티드
  | "jumpit" // 점핏
  | "company" // 자사
  | "other"; // 기타

export interface Application {
  id: string;
  companyName: string;
  position: string;
  appliedDate: string;
  status: ApplicationStatus;
  source?: ApplicationSource;
  notes?: string;
  interviewNotes?: string;
  assignmentNotes?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}
