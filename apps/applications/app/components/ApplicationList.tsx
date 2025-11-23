"use client";

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
  Star,
  CheckSquare,
  Square,
} from "lucide-react";

interface ApplicationListProps {
  applications: Application[];
  onEdit: (application: Application) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (applicationId: string) => void;
  isFavorite: (applicationId: string) => boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
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

export default function ApplicationList({
  applications,
  onEdit,
  onDelete,
  onToggleFavorite,
  isFavorite,
  selectedIds = new Set(),
  onToggleSelect,
}: ApplicationListProps) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">아직 등록된 지원 현황이 없습니다.</p>
        <p className="text-sm mt-2">새로운 지원을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:bg-white/90 hover:shadow-soft-lg transition-all ${
            selectedIds.has(app.id)
              ? "border-soft-pink/50 ring-2 ring-soft-pink/30"
              : "border-soft-pink/20"
          }`}
        >
          <div className="flex items-start justify-between">
            {onToggleSelect && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(app.id);
                }}
                className="mr-3 mt-1 p-1 hover:bg-soft-pink/10 rounded transition-colors"
              >
                {selectedIds.has(app.id) ? (
                  <CheckSquare className="w-5 h-5 text-soft-pink" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {app.companyName}
                </h3>
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
                  className="p-1 hover:bg-soft-pink/10 rounded transition-colors"
                  title={isFavorite(app.id) ? "즐겨찾기 제거" : "즐겨찾기 추가"}
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
                <span>
                  지원일:{" "}
                  {new Date(app.appliedDate).toLocaleDateString("ko-KR")}
                </span>
                {app.source && <span className="text-gray-400">•</span>}
                {app.source && <span>지원처: {SOURCE_LABELS[app.source]}</span>}
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
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    면접 경험
                  </h4>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {app.interviewNotes}
                  </p>
                </div>
              )}
              {app.assignmentNotes && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    과제 경험
                  </h4>
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
            <div className="flex ml-4">
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
        </div>
      ))}
    </div>
  );
}
