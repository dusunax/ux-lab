"use client";

import { useState, useEffect } from "react";
import { useApplications } from "../hooks/useApplications";
import { useFavoriteApplications } from "../hooks/useFavoriteApplications";
import { Application, ApplicationStatus } from "../types/application";
import ApplicationList from "./ApplicationList";
import ApplicationListByDate from "./ApplicationListByDate";
import ApplicationModal from "./ApplicationModal";
import DatePicker from "./DatePicker";
import WantedCertificateParser from "./WantedCertificateParser";
import { Button } from "@ux-lab/ui";
import {
  Plus,
  Loader2,
  List,
  Calendar,
  X,
  Filter,
  Star,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";

export default function ApplicationsPage() {
  const {
    applications,
    isLoading,
    addApplication,
    addApplications,
    updateApplication,
    deleteApplication,
    deleteApplications,
  } = useApplications();
  const { favoriteApplicationIds, toggleFavorite, isFavorite } =
    useFavoriteApplications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<
    Application | undefined
  >();
  const [viewMode, setViewMode] = useState<"date" | "list">("list");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    ApplicationStatus | "today" | "all" | null
  >(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 필터 변경 시 선택 초기화
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filterDate, filterStatus, showFavoritesOnly]);

  const handleAdd = () => {
    setEditingApplication(undefined);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 모달이 닫힐 때 편집 중인 항목 초기화
    setEditingApplication(undefined);
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

  const handleBulkAdd = (
    applicationsToAdd: Omit<Application, "id" | "createdAt" | "updatedAt">[]
  ) => {
    // 기존 항목과 중복 체크
    const existingApplications = applications;
    const newApplications = applicationsToAdd.filter((newApp) => {
      // 같은 회사명과 같은 지원일이면 중복으로 간주
      return !existingApplications.some(
        (existing) =>
          existing.companyName === newApp.companyName &&
          existing.appliedDate === newApp.appliedDate
      );
    });

    if (newApplications.length === 0) {
      alert("추가할 새로운 지원 내역이 없습니다. (모두 중복됨)");
      return;
    }

    if (newApplications.length < applicationsToAdd.length) {
      const duplicateCount = applicationsToAdd.length - newApplications.length;
      alert(
        `${duplicateCount}개의 중복 항목이 제외되었습니다. ${newApplications.length}개의 새로운 지원 내역이 추가됩니다.`
      );
    }

    addApplications(newApplications);
    if (newApplications.length === applicationsToAdd.length) {
      alert(`${newApplications.length}개의 지원 내역이 추가되었습니다.`);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 삭제하시겠습니까?")) {
      deleteApplication(id);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }

    if (confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
      const idsArray = Array.from(selectedIds) as string[];
      deleteApplications(idsArray);
      setSelectedIds(new Set());
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

  const handleSelectAll = () => {
    if (
      selectedIds.size === sortedApplications.length &&
      sortedApplications.length > 0
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedApplications.map((app) => app.id)));
    }
  };

  const isAllSelected =
    sortedApplications.length > 0 &&
    selectedIds.size === sortedApplications.length;

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
        {/* 원티드 증명서 파서 */}
        <div className="mb-6">
          <WantedCertificateParser onParse={handleBulkAdd} />
        </div>

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
            {/* 전체 선택 체크박스 */}
            {sortedApplications.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="h-full flex items-center gap-2 px-3 py-2 text-sm transition-all bg-white/70 backdrop-blur-sm rounded-lg border border-soft-pink/20 shadow-soft hover:bg-white/90"
                title={isAllSelected ? "전체 해제" : "전체 선택"}
              >
                {isAllSelected ? (
                  <CheckSquare className="w-5 h-5 text-soft-pink" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </button>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="h-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 bg-white/70 backdrop-blur-sm rounded-lg border border-red-200 shadow-soft transition-all"
              >
                <Trash2 className="w-4 h-4" />
                선택 삭제 ({selectedIds.size})
              </button>
            )}
            <div className="flex h-full items-center gap-2 bg-white/70 backdrop-blur-sm rounded-lg border border-soft-pink/20 shadow-soft p-1">
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
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        ) : (
          <ApplicationList
            applications={sortedApplications}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleFavorite={(id) => toggleFavorite(id)}
            isFavorite={(id) => isFavorite(id)}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
          />
        )}
      </main>

      <ApplicationModal
        key={editingApplication?.id || "new"}
        isOpen={isModalOpen}
        application={editingApplication}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        applications={applications}
      />
    </div>
  );
}
