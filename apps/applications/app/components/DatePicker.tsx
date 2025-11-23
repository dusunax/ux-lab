"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  required?: boolean;
  applications?: Array<{ appliedDate: string }>;
}

export default function DatePicker({
  value,
  onChange,
  required = false,
  applications = [],
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = value ? new Date(value) : new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node) &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleResize = () => {
      if (isOpen && pickerRef.current) {
        calculatePosition();
      }
    };

    const calculatePosition = () => {
      if (pickerRef.current) {
        const rect = pickerRef.current.getBoundingClientRect();
        const popupWidth = 320; // w-80 = 320px
        const popupHeight = 400; // 예상 높이
        const spaceRight = window.innerWidth - rect.right;
        const spaceLeft = rect.left;
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceTop = rect.top;

        let left = rect.left;
        let top = rect.bottom + 8; // mt-2 = 8px

        // 오른쪽 공간이 부족하면 왼쪽으로 조정
        if (spaceRight < popupWidth && spaceLeft > spaceRight) {
          left = rect.right - popupWidth;
        }

        // 아래 공간이 부족하면 위로 열기
        if (spaceBottom < popupHeight && spaceTop > spaceBottom) {
          top = rect.top - popupHeight - 8;
        }

        setPosition({ top, left });
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", calculatePosition, true);
      calculatePosition();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", calculatePosition, true);
    };
  }, [isOpen]);

  const selectedDate = value ? new Date(value) : null;

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleToday = () => {
    const today = new Date();
    onChange(formatDate(today));
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // 빈 칸 추가 (첫 번째 날짜 전)
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const today = new Date();
  const todayString = formatDate(today);

  return (
    <div className="relative h-full" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full px-3 py-2 border border-soft-pink/30 rounded-lg shadow-soft focus:outline-none focus:ring-soft-blue/50 focus:border-soft-blue/50 flex items-center justify-between bg-white/80 backdrop-blur-sm"
      >
        <span
          className={`text-sm ${value ? "text-gray-900" : "text-gray-500"}`}
        >
          {value ? formatDisplayDate(value) : "날짜를 선택하세요"}
        </span>
        <Calendar className="w-5 h-5 text-gray-400" />
      </button>

      {isOpen &&
        mounted &&
        position &&
        createPortal(
          <div
            ref={popupRef}
            className="fixed bg-white/95 backdrop-blur-md rounded-xl shadow-soft-lg border border-soft-pink/30 p-4 w-80"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-soft-pink/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                })}
              </h3>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-soft-pink/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                <div
                  key={day}
                  className={`text-center text-sm font-medium py-2 ${
                    index === 0
                      ? "text-red-500"
                      : index === 6
                      ? "text-blue-500"
                      : "text-gray-600"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={index} className="aspect-square" />;
                }

                const dateString = formatDate(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    day
                  )
                );
                const isSelected = selectedDate && dateString === value;
                const isToday = dateString === todayString;
                const isPast = new Date(dateString) < new Date(todayString);
                const count = applications.filter(
                  (app) => app.appliedDate === dateString
                ).length;

                return (
                  <button
                    key={day + index}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`aspect-square rounded-lg text-sm font-medium transition-all relative flex flex-col items-center justify-center ${
                      isSelected
                        ? "bg-gradient-to-br from-soft-pink to-soft-blue text-white shadow-soft"
                        : isToday
                        ? "bg-soft-teal/30 text-soft-teal font-bold"
                        : isPast
                        ? "text-gray-400 hover:bg-soft-pink/10"
                        : "text-gray-700 hover:bg-soft-pink/20"
                    }`}
                  >
                    <span>{day}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-semibold mt-0.5 ${
                          isSelected
                            ? "text-white/90"
                            : isToday
                            ? "text-soft-teal"
                            : "text-soft-pink"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 오늘 버튼 */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleToday}
                className="w-full px-4 py-2 text-sm font-medium text-soft-blue hover:bg-soft-pink/20 rounded-lg transition-all"
              >
                오늘 선택
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* 숨겨진 input (폼 제출용) */}
      <input
        type="hidden"
        value={value}
        required={required}
        autoComplete="off"
        onChange={() => {}}
      />
    </div>
  );
}
