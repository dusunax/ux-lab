"use client";

import { useState, FormEvent } from "react";
import {
  Application,
  ApplicationStatus,
  ApplicationSource,
} from "../types/application";
import { Button } from "@ux-lab/ui";
import DatePicker from "./DatePicker";

interface ApplicationFormProps {
  application?: Application;
  onSubmit: (data: Omit<Application, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  applications?: Array<{ appliedDate: string }>;
}

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "draft", label: "작성 중" },
  { value: "applied", label: "지원함" },
  { value: "document_passed", label: "서류통과" },
  { value: "interview", label: "면접" },
  { value: "final_passed", label: "최종합격" },
  { value: "rejected", label: "불합격" },
];

const SOURCE_OPTIONS: { value: ApplicationSource; label: string }[] = [
  { value: "saramin", label: "사람인" },
  { value: "wanted", label: "원티드" },
  { value: "jumpit", label: "점핏" },
  { value: "company", label: "자사" },
  { value: "other", label: "기타" },
];

export default function ApplicationForm({
  application,
  onSubmit,
  onCancel,
  applications = [],
}: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    companyName: application?.companyName || "",
    position: application?.position || "",
    appliedDate:
      application?.appliedDate || new Date().toISOString().split("T")[0],
    status: application?.status || "draft",
    source: application?.source || "other",
    notes: application?.notes || "",
    interviewNotes: application?.interviewNotes || "",
    assignmentNotes: application?.assignmentNotes || "",
    link: application?.link || "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 왼쪽: 기본 정보 */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              회사명 *
            </label>
            <input
              type="text"
              id="companyName"
              required
              autoComplete="off"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              포지션 *
            </label>
            <input
              type="text"
              id="position"
              required
              autoComplete="off"
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
            />
          </div>

          <div>
            <label
              htmlFor="appliedDate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              지원일 *
            </label>
            <DatePicker
              value={formData.appliedDate}
              onChange={(date) =>
                setFormData({ ...formData, appliedDate: date })
              }
              required
              applications={applications}
            />
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              상태 *
            </label>
            <select
              id="status"
              required
              autoComplete="off"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as ApplicationStatus,
                })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="source"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              지원처
            </label>
            <select
              id="source"
              autoComplete="off"
              value={formData.source}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  source: e.target.value as ApplicationSource,
                })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="link"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              지원 링크
            </label>
            <input
              type="url"
              id="link"
              autoComplete="off"
              value={formData.link}
              onChange={(e) =>
                setFormData({ ...formData, link: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* 오른쪽: 텍스트 영역 */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="interviewNotes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              면접 경험
            </label>
            <textarea
              id="interviewNotes"
              rows={5}
              autoComplete="off"
              value={formData.interviewNotes}
              onChange={(e) =>
                setFormData({ ...formData, interviewNotes: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
              placeholder="면접 질문, 답변, 느낀 점 등을 기록하세요..."
            />
          </div>

          <div>
            <label
              htmlFor="assignmentNotes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              과제 경험
            </label>
            <textarea
              id="assignmentNotes"
              rows={5}
              autoComplete="off"
              value={formData.assignmentNotes}
              onChange={(e) =>
                setFormData({ ...formData, assignmentNotes: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
              placeholder="과제 내용, 해결 과정, 배운 점 등을 기록하세요..."
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              기타 메모
            </label>
            <textarea
              id="notes"
              rows={5}
              autoComplete="off"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 bg-white/80 backdrop-blur-sm"
              placeholder="추가 정보나 메모를 입력하세요..."
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          onClick={onCancel}
          variant="ghost"
          className="hover:bg-soft-pink/20 rounded-lg"
        >
          취소
        </Button>
        <Button
          type="submit"
          className="bg-gradient-to-r from-soft-pink to-soft-blue text-white hover:from-soft-pink/90 hover:to-soft-blue/90 shadow-soft rounded-lg"
        >
          {application ? "수정" : "추가"}
        </Button>
      </div>
    </form>
  );
}
