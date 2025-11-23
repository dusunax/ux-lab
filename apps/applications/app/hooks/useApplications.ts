"use client";

import { useState, useEffect } from "react";
import {
  Application,
  ApplicationStatus,
  ApplicationSource,
} from "../types/application";

const STORAGE_KEY = "job_applications";

export function useApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 데이터 로드
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setApplications(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to load applications:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const saveToStorage = (apps: Application[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    setApplications(apps);
  };

  const addApplication = (
    application: Omit<Application, "id" | "createdAt" | "updatedAt">
  ) => {
    const newApp: Application = {
      ...application,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...applications, newApp];
    saveToStorage(updated);
    return newApp;
  };

  const updateApplication = (id: string, updates: Partial<Application>) => {
    const updated = applications.map((app) =>
      app.id === id
        ? { ...app, ...updates, updatedAt: new Date().toISOString() }
        : app
    );
    saveToStorage(updated);
  };

  const deleteApplication = (id: string) => {
    const updated = applications.filter((app) => app.id !== id);
    saveToStorage(updated);
  };

  const generateDummyData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const companies = [
      "네이버",
      "카카오",
      "라인",
      "쿠팡",
      "배달의민족",
      "당근마켓",
      "토스",
      "스타트업A",
      "스타트업B",
      "대기업C",
      "중견기업D",
      "테크스타트업",
      "핀테크회사",
      "이커머스회사",
      "게임회사",
      "헬스케어스타트업",
      "에듀테크회사",
      "프로덕트회사",
      "AI스타트업",
    ];

    const positions = [
      "프론트엔드 개발자",
      "백엔드 개발자",
      "풀스택 개발자",
      "프로덕트 매니저",
      "UX 디자이너",
      "UI 디자이너",
      "데이터 분석가",
      "데이터 엔지니어",
      "DevOps 엔지니어",
      "모바일 개발자",
      "시스템 엔지니어",
      "QA 엔지니어",
    ];

    const sources: ApplicationSource[] = [
      "saramin",
      "wanted",
      "jumpit",
      "company",
      "other",
    ];
    const statuses: ApplicationStatus[] = [
      "applied",
      "document_passed",
      "interview",
      "final_passed",
      "rejected",
    ];

    const dummyApps: Application[] = [];
    let idCounter = Date.now();

    // 이번 달의 각 날짜에 1-3개의 지원 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split("T")[0];

      // 오늘 이후 날짜는 제외
      if (date > now) continue;

      // 각 날짜마다 1-3개의 지원 생성
      const count = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < count; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const position =
          positions[Math.floor(Math.random() * positions.length)];
        const source = sources[Math.floor(Math.random() * sources.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        dummyApps.push({
          id: (idCounter++).toString(),
          companyName: company,
          position: position,
          appliedDate: dateString,
          status: status,
          source: source,
          link: `https://example.com/job/${idCounter}`,
          notes: Math.random() > 0.7 ? "관심 있는 포지션입니다." : undefined,
          interviewNotes:
            status === "interview" || status === "final_passed"
              ? "면접에서 기술 스택과 협업 경험에 대해 질문받았습니다."
              : undefined,
          assignmentNotes:
            status === "document_passed" || status === "interview"
              ? "과제로 간단한 프로젝트를 구현했습니다."
              : undefined,
          createdAt: new Date(date.getTime() + i * 1000).toISOString(),
          updatedAt: new Date(date.getTime() + i * 1000).toISOString(),
        });
      }
    }

    // 기존 데이터와 합치기
    const updated = [...applications, ...dummyApps];
    saveToStorage(updated);
  };

  return {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
    generateDummyData,
  };
}
