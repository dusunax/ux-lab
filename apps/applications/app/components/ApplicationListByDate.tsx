"use client";

import { useState } from "react";
import {
  Application,
  ApplicationStatus,
  ApplicationSource,
} from "../types/application";
import { Button } from "@ux-lab/ui";
import {
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ApplicationListByDateProps {
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (applicationId: string) => void;
  isFavorite: (applicationId: string) => boolean;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: "bg-soft-pink/30 text-purple-700 border border-soft-pink/40",
  applied: "bg-white/60 text-gray-700 border border-soft-teal/30",
  document_passed: "bg-soft-blue/30 text-blue-700 border border-soft-blue/40",
  interview: "bg-soft-teal/30 text-teal-700 border border-soft-teal/40",
  final_passed: "bg-soft-mint/40 text-green-700 border border-soft-mint/50",
  rejected: "bg-red-50/60 text-red-500 border border-red-200/40",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  draft: "작성 중",
  applied: "지원함",
  document_passed: "서류통과",
  interview: "면접",
  final_passed: "최종합격",
  rejected: "불합격",
};

const SOURCE_LABELS: Record<ApplicationSource, string> = {
  saramin: "사람인",
  wanted: "원티드",
  jumpit: "점핏",
  company: "자사",
  other: "기타",
};

export default function ApplicationListByDate({
  applications,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
}: ApplicationListByDateProps) {
  // 오늘 날짜 확인
  const today = new Date().toISOString().split("T")[0];

  // 날짜별로 그룹화
  const groupedByDate = applications.reduce((acc, app) => {
    const date = app.appliedDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  // 날짜별로 정렬 (최신순)
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // 아코디언 상태 관리 (오늘 날짜는 기본적으로 열림)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // 오늘 날짜가 있으면 기본적으로 열림
    const todayDate = new Date().toISOString().split("T")[0];
    const hasToday = applications.some((app) => app.appliedDate === todayDate);
    if (hasToday) {
      initial.add(todayDate);
    }
    return initial;
  });

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">아직 등록된 지원 현황이 없습니다.</p>
        <p className="text-sm mt-2">새로운 지원을 추가해보세요!</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const yesterdayOnly = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return "오늘";
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => {
        const apps = groupedByDate[date];
        const isToday = date === today;

        const isExpanded = expandedDates.has(date);

        return (
          <div key={date} className="space-y-3">
            {/* 날짜 헤더 */}
            <button
              onClick={() => toggleDate(date)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl backdrop-blur-sm transition-all hover:shadow-soft-lg ${
                isToday
                  ? "bg-gradient-to-r from-soft-pink/40 via-soft-blue/40 to-soft-teal/40 border-2 border-soft-pink/30 shadow-soft"
                  : "bg-white/60 border border-soft-pink/20 shadow-soft"
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar
                  className={`w-5 h-5 ${
                    isToday ? "text-soft-blue" : "text-gray-500"
                  }`}
                />
                <div className="text-left">
                  <h3
                    className={`font-semibold ${
                      isToday ? "text-gray-800" : "text-gray-800"
                    }`}
                  >
                    {formatDate(date)}
                  </h3>
                  {isToday && (
                    <p className="text-xs text-soft-blue mt-0.5">
                      오늘 {apps.length}개 지원
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isToday
                      ? "bg-white/60 text-soft-blue"
                      : "bg-white/40 text-gray-700"
                  }`}
                >
                  {apps.length}개
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            {/* 해당 날짜의 지원 목록 */}
            {isExpanded && (
              <div className="space-y-3 ml-2">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-soft-pink/20 p-4 hover:bg-white/90 hover:shadow-soft-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-base font-semibold text-gray-900">
                            {app.companyName}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              STATUS_COLORS[app.status]
                            }`}
                          >
                            {STATUS_LABELS[app.status]}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(app.id);
                            }}
                            className="p-1 hover:bg-soft-pink/10 rounded transition-colors ml-auto"
                            title={
                              isFavorite(app.id)
                                ? "즐겨찾기 제거"
                                : "즐겨찾기 추가"
                            }
                          >
                            <Star
                              className={`w-4 h-4 transition-colors ${
                                isFavorite(app.id)
                                  ? "fill-soft-pink text-soft-pink"
                                  : "text-gray-400 hover:text-soft-pink"
                              }`}
                            />
                          </button>
                        </div>
                        <p className="text-gray-600 mb-1">{app.position}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mb-1">
                          {app.source && (
                            <span>지원처: {SOURCE_LABELS[app.source]}</span>
                          )}
                        </div>
                        {app.link && (
                          <a
                            href={app.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mt-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            지원 링크
                          </a>
                        )}
                        {app.interviewNotes && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <h5 className="text-sm font-semibold text-yellow-900 mb-1">
                              면접 경험
                            </h5>
                            <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                              {app.interviewNotes}
                            </p>
                          </div>
                        )}
                        {app.assignmentNotes && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <h5 className="text-sm font-semibold text-blue-900 mb-1">
                              과제 경험
                            </h5>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap">
                              {app.assignmentNotes}
                            </p>
                          </div>
                        )}
                        {app.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {app.notes}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          onClick={() => onEdit(app)}
                          className="flex items-center gap-1 text-sm px-3 py-1.5"
                        >
                          <Edit className="w-4 h-4" />
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => onDelete(app.id)}
                          className="flex items-center gap-1 text-sm px-3 py-1.5 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
