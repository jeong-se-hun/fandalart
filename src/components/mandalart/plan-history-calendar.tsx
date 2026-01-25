"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DetailPlan, PlanRecord } from "@/data/goals";
import { supabase } from "@/lib/supabase";
import { calculateRecurrenceRate } from "@/hooks/useRecurringPlan";
import { toast } from "sonner";

interface PlanHistoryCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: DetailPlan;
  records: PlanRecord[];
  onRecordsChange: () => void; // 기록 변경 후 리프레시
}

export function PlanHistoryCalendar({
  open,
  onOpenChange,
  plan,
  records,
  onRecordsChange,
}: PlanHistoryCalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Optimistic UI를 위한 로컬 상태
  const [optimisticRecords, setOptimisticRecords] =
    React.useState<PlanRecord[]>(records);

  // records prop이 변경되면 로컬 상태 동기화
  React.useEffect(() => {
    setOptimisticRecords(records);
  }, [records]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 달력 데이터 생성
  const calendarData = React.useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; dayNum: number | null; isToday: boolean }[] = [];

    // 이전 달 빈칸
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: new Date(), dayNum: null, isToday: false });
    }

    // 현재 달
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
      days.push({ date, dayNum: d, isToday });
    }

    return days;
  }, [year, month]);

  // 날짜별 기록 맵
  const recordMap = React.useMemo(() => {
    const map = new Map<string, PlanRecord[]>();
    optimisticRecords.forEach((r) => {
      const existing = map.get(r.recordDate) || [];
      map.set(r.recordDate, [...existing, r]);
    });
    return map;
  }, [optimisticRecords]);

  // 날짜 문자열 변환
  // 날짜 문자열 변환 (Timezone Safe)
  const toDateStr = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().split("T")[0];
  };

  // 달성률 계산 (calculateRecurrenceRate 사용)
  const stats = React.useMemo(() => {
    const recurrence = plan.recurrence;
    if (!recurrence) return { completed: 0, total: 0, rate: 0 };

    const today = new Date();
    const rate = calculateRecurrenceRate(recurrence, optimisticRecords, today);
    const completed = optimisticRecords.filter((r) => r.isCompleted).length;

    // total 계산 (stats 표시용)
    const startDate = new Date(recurrence.startDate);
    const effectiveEnd = recurrence.endDate
      ? new Date(recurrence.endDate)
      : today;

    if (effectiveEnd < startDate) return { completed, total: 0, rate: 0 };

    const msPerDay = 24 * 60 * 60 * 1000;
    const days =
      Math.floor((effectiveEnd.getTime() - startDate.getTime()) / msPerDay) + 1;

    let total = 0;
    switch (recurrence.type) {
      case "daily":
        total = days;
        break;
      case "weekly":
        const weeks = Math.ceil(days / 7);
        if (recurrence.weeklyMode === "times" && recurrence.timesPerWeek) {
          total = weeks * recurrence.timesPerWeek;
        } else if (recurrence.weeklyMode === "days" && recurrence.weekdays) {
          total = weeks * recurrence.weekdays.length;
        }
        break;
      case "monthly":
        const months =
          (effectiveEnd.getFullYear() - startDate.getFullYear()) * 12 +
          (effectiveEnd.getMonth() - startDate.getMonth()) +
          1;
        if (recurrence.monthlyMode === "times" && recurrence.timesPerMonth) {
          total = months * recurrence.timesPerMonth;
        } else if (recurrence.monthlyMode === "dates" && recurrence.monthDays) {
          total = months * recurrence.monthDays.length;
        }
        break;
    }

    return { completed, total, rate: Math.round(rate * 100) };
  }, [optimisticRecords, plan.recurrence]);

  // 주의 시작일(일요일) 구하기
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // 주의 종료일(토요일) 구하기
  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  // 해당 주의 체크 횟수 계산
  const getWeekCheckCount = (date: Date): number => {
    const weekStart = getWeekStart(date);
    const weekEnd = getWeekEnd(date);
    return optimisticRecords.filter((r) => {
      const d = new Date(r.recordDate);
      return d >= weekStart && d <= weekEnd && r.isCompleted;
    }).length;
  };

  // 해당 월의 체크 횟수 계산
  const getMonthCheckCount = (date: Date): number => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    return optimisticRecords.filter((r) => {
      const d = new Date(r.recordDate);
      return d >= monthStart && d <= monthEnd && r.isCompleted;
    }).length;
  };

  // 날짜 클릭 핸들러 (Optimistic Update 적용)
  const handleDateClick = async (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 미래 날짜는 클릭 불가
    if (date > today) return;

    const dateStr = toDateStr(date);
    const existingRecords = recordMap.get(dateStr) || [];
    const isAlreadyChecked = existingRecords.length > 0;

    // 모드 자동 감지
    const effectiveWeeklyMode =
      plan.recurrence?.weeklyMode ||
      (plan.recurrence?.weekdays && plan.recurrence.weekdays.length > 0
        ? "days"
        : "times");
    const effectiveMonthlyMode =
      plan.recurrence?.monthlyMode ||
      (plan.recurrence?.monthDays && plan.recurrence.monthDays.length > 0
        ? "dates"
        : "times");

    // 체크 해제는 항상 가능
    if (!isAlreadyChecked && plan.recurrence) {
      // 주 N회 제한 체크 (times 모드인 경우)
      if (
        plan.recurrence.type === "weekly" &&
        plan.recurrence.timesPerWeek &&
        effectiveWeeklyMode === "times"
      ) {
        const weekCount = getWeekCheckCount(date);
        if (weekCount >= plan.recurrence.timesPerWeek) {
          toast.error(
            `이번 주 목표(${plan.recurrence.timesPerWeek}회)를 모두 달성했습니다.`,
          );
          return;
        }
      }

      // 특정 요일 모드: 해당 요일만 선택 가능
      if (
        plan.recurrence.type === "weekly" &&
        effectiveWeeklyMode === "days" &&
        plan.recurrence.weekdays
      ) {
        const dayOfWeek = date.getDay(); // 0=일, 1=월, ...
        const allowedDays = plan.recurrence.weekdays.map(Number);
        if (!allowedDays.includes(dayOfWeek)) {
          toast.error("설정된 요일에만 기록할 수 있습니다.");
          return; // 지정된 요일이 아님
        }
      }

      // 월 N회 제한 체크 (times 모드인 경우)
      if (
        plan.recurrence.type === "monthly" &&
        plan.recurrence.timesPerMonth &&
        effectiveMonthlyMode === "times"
      ) {
        const monthCount = getMonthCheckCount(date);
        if (monthCount >= plan.recurrence.timesPerMonth) {
          toast.error(
            `이번 달 목표(${plan.recurrence.timesPerMonth}회)를 모두 달성했습니다. 날짜를 변경하려면 기존 기록을 취소해주세요.`,
          );
          return;
        }
      }

      // 특정 일자 모드: 해당 일자만 선택 가능
      if (
        plan.recurrence.type === "monthly" &&
        effectiveMonthlyMode === "dates" &&
        plan.recurrence.monthDays
      ) {
        const dayOfMonth = date.getDate();
        const allowedDates = plan.recurrence.monthDays.map(Number);
        if (!allowedDates.includes(dayOfMonth)) {
          toast.error("설정된 일자에만 기록할 수 있습니다.");
          return; // 지정된 일자가 아님
        }
      }
    }

    setIsUpdating(true);

    // Optimistic Update: 즉시 UI 반영
    const newRecord: PlanRecord = {
      id: `temp-${Date.now()}`,
      planId: plan.id,
      recordDate: dateStr,
      recordSeq: 1, // 임시값 (DB insert 시 재계산됨)
      isCompleted: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    if (isAlreadyChecked) {
      // 삭제: 현재 날짜의 기록 제거
      setOptimisticRecords((prev) =>
        prev.filter((r) => r.recordDate !== dateStr),
      );
    } else {
      // 추가
      setOptimisticRecords((prev) => [...prev, newRecord]);
    }

    try {
      if (isAlreadyChecked) {
        // 기록 삭제
        await supabase
          .from("plan_records")
          .delete()
          .eq("plan_id", plan.id)
          .eq("record_date", dateStr);
      } else {
        // 기록 추가
        let nextSeq = 1;
        if (plan.recurrence) {
          if (
            plan.recurrence.type === "weekly" &&
            plan.recurrence.weeklyMode === "times"
          ) {
            // weekCheckCount는 optimistic update 전의 값을 반환하므로 +1 하면 됨
            nextSeq = getWeekCheckCount(date) + 1;
          } else if (
            plan.recurrence.type === "monthly" &&
            plan.recurrence.monthlyMode === "times"
          ) {
            nextSeq = getMonthCheckCount(date) + 1;
          }
        }

        await supabase.from("plan_records").insert({
          plan_id: plan.id,
          record_date: dateStr,
          record_seq: nextSeq,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      // 서버 데이터와 동기화
      await onRecordsChange();
    } catch (error) {
      console.error("Failed to update record:", error);
      // 에러 발생 시 롤백 (props.records로 복귀)
      setOptimisticRecords(records);
    } finally {
      setIsUpdating(false);
    }
  };

  // 이전/다음 달
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📅 {plan.content} 달성 기록
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 월 네비게이션 */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPrevMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <div className="font-medium">
                {year}년 {month + 1}월
              </div>
              {/* 이번 달 달성 현황 표시 */}
              {plan.recurrence && (
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                  {plan.recurrence.type === "weekly" &&
                    plan.recurrence.weeklyMode === "times" &&
                    plan.recurrence.timesPerWeek && (
                      <span className="text-primary">
                        이번 주: {getWeekCheckCount(currentDate)} /{" "}
                        {plan.recurrence.timesPerWeek}회
                      </span>
                    )}
                  {plan.recurrence.type === "monthly" &&
                    plan.recurrence.monthlyMode === "times" &&
                    plan.recurrence.timesPerMonth && (
                      <span
                        className={
                          getMonthCheckCount(currentDate) >=
                          plan.recurrence.timesPerMonth
                            ? "text-green-600"
                            : "text-primary"
                        }
                      >
                        이번 달: {getMonthCheckCount(currentDate)} /{" "}
                        {plan.recurrence.timesPerMonth}회
                        {getMonthCheckCount(currentDate) >=
                          plan.recurrence.timesPerMonth && " (달성!)"}
                      </span>
                    )}
                  {/* 그 외 모드는 심플하게 횟수만 표시 */}
                  {!(
                    (plan.recurrence.type === "weekly" &&
                      plan.recurrence.weeklyMode === "times") ||
                    (plan.recurrence.type === "monthly" &&
                      plan.recurrence.monthlyMode === "times")
                  ) && (
                    <span>
                      이번 달 {getMonthCheckCount(currentDate)}회 완료
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mt-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* 달력 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarData.map((day, idx) => {
              if (day.dayNum === null) {
                return <div key={idx} className="h-9" />;
              }

              const dateStr = toDateStr(day.date);
              const dayRecords = recordMap.get(dateStr) || [];
              const isCompleted = dayRecords.some((r) => r.isCompleted);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isFuture = day.date > today;

              // 시작일 비교 시 시간대 정규화
              let startDate: Date | null = null;
              if (plan.recurrence?.startDate) {
                const [y, m, d] = plan.recurrence.startDate
                  .split("-")
                  .map(Number);
                startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
              }

              // day.date도 시간 정규화
              const dayDateNormalized = new Date(day.date);
              dayDateNormalized.setHours(0, 0, 0, 0);

              const isBeforeStart = startDate && dayDateNormalized < startDate;

              // 모드 자동 감지
              const effectiveWeeklyMode =
                plan.recurrence?.weeklyMode ||
                (plan.recurrence?.weekdays &&
                plan.recurrence.weekdays.length > 0
                  ? "days"
                  : "times");
              const effectiveMonthlyMode =
                plan.recurrence?.monthlyMode ||
                (plan.recurrence?.monthDays &&
                plan.recurrence.monthDays.length > 0
                  ? "dates"
                  : "times");

              // 특정 요일 제한 체크
              let isRestrictedByWeekday = false;
              if (
                plan.recurrence?.type === "weekly" &&
                effectiveWeeklyMode === "days" &&
                plan.recurrence.weekdays
              ) {
                const dayOfWeek = day.date.getDay();
                const allowedDays = plan.recurrence.weekdays.map(Number);
                isRestrictedByWeekday = !allowedDays.includes(dayOfWeek);
              }

              // 특정 일자 제한 체크
              let isRestrictedByDate = false;
              if (
                plan.recurrence?.type === "monthly" &&
                effectiveMonthlyMode === "dates" &&
                plan.recurrence.monthDays
              ) {
                const dayOfMonth = day.date.getDate();
                const allowedDates = plan.recurrence.monthDays.map(Number);
                isRestrictedByDate = !allowedDates.includes(dayOfMonth);
              }

              const isDisabled =
                isFuture ||
                isBeforeStart ||
                isUpdating ||
                isRestrictedByWeekday ||
                isRestrictedByDate;

              const completedCount = dayRecords.filter(
                (r) => r.isCompleted,
              ).length;

              return (
                <button
                  key={idx}
                  onClick={() => handleDateClick(day.date)}
                  disabled={isDisabled}
                  className={cn(
                    "relative h-9 w-full rounded-md text-sm font-medium transition-colors",
                    "flex items-center justify-center",
                    day.isToday && "ring-2 ring-primary ring-offset-1",
                    isDisabled && "text-muted-foreground/30 cursor-not-allowed",
                    !isDisabled && "hover:bg-muted cursor-pointer",
                    isCompleted && "bg-green-500 text-white hover:bg-green-600",
                    !isCompleted && !isDisabled && "bg-muted/50",
                  )}
                >
                  {day.dayNum}
                  {completedCount > 1 && (
                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold bg-white text-green-600 px-1 rounded-sm leading-none shadow-sm">
                      x{completedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>완료 ({stats.completed}회)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted" />
              <span>미완료</span>
            </div>
          </div>

          {/* 달성률 */}
          {stats.total > 0 && (
            <div className="space-y-2 border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>📊 전체 달성률</span>
                <span className="font-medium">
                  {stats.completed}/{stats.total} ({stats.rate}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${stats.rate}%` }}
                />
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            💡 과거 날짜를 클릭하면 기록을 수정할 수 있어요
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onRecordsChange();
              onOpenChange(false);
            }}
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
