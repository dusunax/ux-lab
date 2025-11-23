"use client";

import { useState } from "react";
import { useApplications } from "../hooks/useApplications";
import { useFavoriteApplications } from "../hooks/useFavoriteApplications";
import { Application, ApplicationStatus } from "../types/application";
import ApplicationList from "./ApplicationList";
import ApplicationListByDate from "./ApplicationListByDate";
import ApplicationModal from "./ApplicationModal";
import DatePicker from "./DatePicker";
import { Button } from "@ux-lab/ui";
import { Plus, Loader2, List, Calendar, X, Filter, Star } from "lucide-react";

export default function ApplicationsPage() {
  const {
    applications,
    isLoading,
    addApplication,
    updateApplication,
    deleteApplication,
  } = useApplications();
  const { favoriteApplicationIds, toggleFavorite, isFavorite } =
    useFavoriteApplications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<
    Application | undefined
  >();
  const [viewMode, setViewMode] = useState<"date" | "list">("date");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    ApplicationStatus | "today" | "all" | null
  >(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const handleAdd = () => {
    setEditingApplication(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (application: Application) => {
    setEditingApplication(application);
    setIsModalOpen(true);
  };

  const handleSubmit = (
    data: Omit<Application, "id" | "createdAt" | "updatedAt">
  ) => {
    if (editingApplication) {
      updateApplication(editingApplication.id, data);
    } else {
      addApplication(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteApplication(id);
    }
  };

  // 오늘 날짜
  const today = new Date().toISOString().split("T")[0];

  // 필터링
  let filteredApplications = applications;

  if (filterStatus === "today") {
    filteredApplications = filteredApplications.filter(
      (a) => a.appliedDate === today
    );
  } else if (filterStatus && filterStatus !== "all") {
    filteredApplications = filteredApplications.filter(
      (a) => a.status === filterStatus
    );
  }

  if (filterDate) {
    filteredApplications = filteredApplications.filter(
      (a) => a.appliedDate === filterDate
    );
  }

  if (showFavoritesOnly) {
    filteredApplications = filteredApplications.filter((a) => isFavorite(a.id));
  }

  const sortedApplications = [...filteredApplications].sort(
    (a, b) =>
      new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
  );

  // 오늘 날짜의 지원 개수
  const todayCount = applications.filter((a) => a.appliedDate === today).length;

  const handleStatusFilter = (status: ApplicationStatus | "today" | "all") => {
    if (filterStatus === status) {
      setFilterStatus(null);
    } else {
      setFilterStatus(status);
    }
  };

  const stats = {
    total: applications.length, // 전체는 항상 고정
    today: todayCount,
    draft: applications.filter((a) => a.status === "draft").length,
    applied: applications.filter((a) => a.status === "applied").length,
    document_passed: applications.filter((a) => a.status === "document_passed")
      .length,
    interview: applications.filter((a) => a.status === "interview").length,
    final_passed: applications.filter((a) => a.status === "final_passed")
      .length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 backdrop-blur-sm border-b border-soft-pink/30 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-soft-pink via-soft-blue to-soft-teal bg-clip-text text-transparent">
                이력서 지원 현황
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                지원 현황을 기록하고 관리하세요
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAdd}
                className="flex items-center gap-2 bg-gradient-to-r from-soft-pink to-soft-blue text-white hover:from-soft-pink/90 hover:to-soft-blue/90 shadow-soft rounded-lg"
              >
                <Plus className="w-4 h-4" />새 지원 추가
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <button
            onClick={() => handleStatusFilter("all")}
            className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:bg-white/90 transition-all text-left ${
              filterStatus === null || filterStatus === "all"
                ? "border-soft-pink/40 ring-2 ring-soft-pink/30"
                : "border-soft-pink/20"
            }`}
          >
            <div className="text-2xl font-bold text-gray-700">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600">전체</div>
          </button>
          <button
            onClick={() => handleStatusFilter("today")}
            className={`bg-gradient-to-br from-soft-pink/40 to-soft-blue/40 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:from-soft-pink/50 hover:to-soft-blue/50 transition-all text-left ${
              filterStatus === "today"
                ? "border-soft-pink/50 ring-2 ring-soft-pink/40"
                : "border-soft-pink/30"
            }`}
          >
            <div className="text-2xl font-bold text-soft-blue">
              {stats.today}
            </div>
            <div className="text-sm text-gray-700 font-medium">오늘 지원</div>
          </button>
          <button
            onClick={() => handleStatusFilter("draft")}
            className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:bg-white/90 transition-all text-left ${
              filterStatus === "draft"
                ? "border-purple-400/50 ring-2 ring-purple-300/40"
                : "border-soft-pink/20"
            }`}
          >
            <div className="text-2xl font-bold text-purple-500">
              {stats.draft}
            </div>
            <div className="text-sm text-gray-600">작성 중</div>
          </button>
          <button
            onClick={() => handleStatusFilter("applied")}
            className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:bg-white/90 transition-all text-left ${
              filterStatus === "applied"
                ? "border-soft-teal/40 ring-2 ring-soft-teal/30"
                : "border-soft-teal/20"
            }`}
          >
            <div className="text-2xl font-bold text-gray-600">
              {stats.applied}
            </div>
            <div className="text-sm text-gray-600">지원함</div>
          </button>
          <button
            onClick={() => handleStatusFilter("document_passed")}
            className={`bg-gradient-to-br from-soft-blue/30 to-soft-teal/30 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:from-soft-blue/40 hover:to-soft-teal/40 transition-all text-left ${
              filterStatus === "document_passed"
                ? "border-soft-blue/50 ring-2 ring-soft-blue/40"
                : "border-soft-blue/20"
            }`}
          >
            <div className="text-2xl font-bold text-soft-blue">
              {stats.document_passed}
            </div>
            <div className="text-sm text-gray-700">서류통과</div>
          </button>
          <button
            onClick={() => handleStatusFilter("interview")}
            className={`bg-gradient-to-br from-soft-teal/30 to-soft-mint/30 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:from-soft-teal/40 hover:to-soft-mint/40 transition-all text-left ${
              filterStatus === "interview"
                ? "border-soft-teal/50 ring-2 ring-soft-teal/40"
                : "border-soft-teal/20"
            }`}
          >
            <div className="text-2xl font-bold text-soft-teal">
              {stats.interview}
            </div>
            <div className="text-sm text-gray-700">면접</div>
          </button>
          <button
            onClick={() => handleStatusFilter("final_passed")}
            className={`bg-gradient-to-br from-soft-mint/40 to-soft-teal/40 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:from-soft-mint/50 hover:to-soft-teal/50 transition-all text-left ${
              filterStatus === "final_passed"
                ? "border-green-400/50 ring-2 ring-green-300/40"
                : "border-soft-mint/30"
            }`}
          >
            <div className="text-2xl font-bold text-green-600">
              {stats.final_passed}
            </div>
            <div className="text-sm text-gray-700">최종합격</div>
          </button>
          <button
            onClick={() => handleStatusFilter("rejected")}
            className={`bg-white/70 backdrop-blur-sm rounded-xl shadow-soft border p-4 hover:bg-white/90 transition-all text-left ${
              filterStatus === "rejected"
                ? "border-red-300/50 ring-2 ring-red-200/40"
                : "border-soft-pink/20"
            }`}
          >
            <div className="text-2xl font-bold text-red-400">
              {stats.rejected}
            </div>
            <div className="text-sm text-gray-600">불합격</div>
          </button>
        </div>

        {/* 필터 및 뷰 모드 */}
        <div className="flex items-center justify-between mb-6 gap-4 h-12">
          <div className="flex items-center gap-2 h-full">
            <div className="flex h-full items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg border border-soft-pink/20 shadow-soft p-1">
              <button
                onClick={() => setViewMode("date")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "date"
                    ? "bg-gradient-to-r from-soft-pink/50 to-soft-blue/50 text-gray-700 shadow-soft"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  viewMode === "list"
                    ? "bg-gradient-to-r from-soft-pink/50 to-soft-blue/50 text-gray-700 shadow-soft"
                    : "text-gray-600 hover:bg-white/50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* 즐겨찾기 필터 */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`h-full flex items-center gap-1 px-3 py-2 text-sm transition-all bg-white/70 backdrop-blur-sm rounded-lg border shadow-soft ${
                showFavoritesOnly
                  ? "border-soft-pink/40 text-soft-pink from-soft-pink/20 to-soft-blue/20"
                  : "border-soft-pink/20 text-gray-600 hover:text-gray-800"
              }`}
            >
              <Star
                className={`w-5 h-5 ${
                  showFavoritesOnly
                    ? "fill-soft-pink text-soft-pink"
                    : "text-gray-400"
                }`}
              />
              {favoriteApplicationIds.length > 0 && (
                <span className="text-xs bg-soft-pink/20 text-primary-500 px-2 py-0.5 rounded">
                  {favoriteApplicationIds.length}
                </span>
              )}
            </button>
          </div>

          {/* 필터 */}
          <div className="flex items-center gap-2 h-full">
            {(filterStatus || filterDate || showFavoritesOnly) && (
              <button
                onClick={() => {
                  setFilterStatus(null);
                  setFilterDate("");
                  setShowFavoritesOnly(false);
                }}
                className="flex h-full items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-white/70 backdrop-blur-sm rounded-lg border border-soft-pink/20 shadow-soft transition-all"
                title="필터 초기화"
              >
                <X className="w-4 h-4" />
                필터 초기화
              </button>
            )}
            <div className="flex h-full items-center gap-1">
              <div className="w-48 h-full relative">
                <DatePicker
                  value={filterDate}
                  onChange={setFilterDate}
                  required={false}
                  applications={applications}
                />
              </div>
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="날짜 필터 초기화"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 지원 현황 목록 */}
        {viewMode === "date" ? (
          <ApplicationListByDate
            applications={sortedApplications}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={(id) => toggleFavorite(id)}
            isFavorite={(id) => isFavorite(id)}
          />
        ) : (
          <ApplicationList
            applications={sortedApplications}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={(id) => toggleFavorite(id)}
            isFavorite={(id) => isFavorite(id)}
          />
        )}
      </main>

      <ApplicationModal
        isOpen={isModalOpen}
        application={editingApplication}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        applications={applications}
      />
    </div>
  );
}
