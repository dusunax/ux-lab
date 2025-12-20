import type { AfterglowReport } from "@features/report/types";

export const mockReports: AfterglowReport[] = [
  {
    month: "2025-01",
    summary: "한 해의 시작, 겨울 햇살 속에서 다짐을 적어 내려간 순간들.",
    mood: "nostalgic",
    photos: ["/mock/jan-1.jpg", "/mock/jan-2.jpg"],
  },
  {
    month: "2025-04",
    summary: "벚꽃과 함께한 짧은 여행, 따뜻한 공기와 웃음이 남은 계절.",
    mood: "warm",
    photos: ["/mock/apr-1.jpg", "/mock/apr-2.jpg", "/mock/apr-3.jpg"],
  },
  {
    month: "2025-08",
    summary: "여름밤 바다의 파도 소리, 오래된 친구들과 나눈 대화.",
    mood: "serene",
    photos: ["/mock/aug-1.jpg"],
  },
  {
    month: "2025-12",
    summary: "연말의 불빛과 집 안의 온기, 조용한 회고가 어울리는 시간.",
    mood: "cozy",
    photos: ["/mock/dec-1.jpg", "/mock/dec-2.jpg", "/mock/dec-3.jpg"],
  },
];

