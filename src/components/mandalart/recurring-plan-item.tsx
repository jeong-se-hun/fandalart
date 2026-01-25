"use client";

import * as React from "react";
import { DetailPlan, PlanRecord } from "@/data/goals";
import { cn } from "@/lib/utils";
import { Calendar, Repeat, Trash2, Pencil, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecurringPlan, SubCheckItem } from "@/hooks/useRecurringPlan";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RecurringPlanItemProps {
  plan: DetailPlan;
  records: PlanRecord[];
  onDelete: (planId: string) => void;
  onEditRecurrence: (plan: DetailPlan) => void;
  onOpenHistory: (plan: DetailPlan) => void;
  onRecordsChange: () => void;
}

export function RecurringPlanItem({
  plan,
  records,
  onDelete,
  onEditRecurrence,
  onOpenHistory,
  onRecordsChange,
}: RecurringPlanItemProps) {
  const {
    isRecurring,
    isExpired,
    subCheckItems,
    achievementRate,
    todayCompleted,
    toggleSubCheck,
    toggleDailyCheck,
  } = useRecurringPlan(plan, records);

  const recurrence = plan.recurrence;

  // 반복 유형 라벨
  const getRecurrenceLabel = () => {
    if (!recurrence) return "";
    switch (recurrence.type) {
      case "daily":
        return "매일";
      case "weekly": {
        // 모드 자동 감지
        const effectiveMode =
          recurrence.weeklyMode ||
          (recurrence.weekdays && recurrence.weekdays.length > 0
            ? "days"
            : "times");
        if (effectiveMode === "times") {
          return `주 ${recurrence.timesPerWeek}회`;
        } else {
          const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
          const days = recurrence.weekdays?.map((d) => dayNames[d]).join(",");
          return `매주 (${days})`;
        }
      }
      case "monthly": {
        // 모드 자동 감지
        const effectiveMode =
          recurrence.monthlyMode ||
          (recurrence.monthDays && recurrence.monthDays.length > 0
            ? "dates"
            : "times");
        if (effectiveMode === "times") {
          return `월 ${recurrence.timesPerMonth}회`;
        } else {
          const dates = recurrence.monthDays?.join(",");
          return `매월 (${dates}일)`;
        }
      }
      default:
        return "";
    }
  };

  // 서브 체크박스 토글 핸들러
  const handleSubCheckToggle = async (item: SubCheckItem) => {
    await toggleSubCheck(item.seq, item.recordDate);
    onRecordsChange();
  };

  // 일일 체크 토글 핸들러
  const handleDailyToggle = async () => {
    await toggleDailyCheck();
    onRecordsChange();
  };

  // 삭제 확인
  const recordCount = records.filter((r) => r.isCompleted).length;

  return (
    <div
      className={cn(
        "group p-3 rounded-xl border bg-card transition-colors",
        isExpired ? "opacity-60 bg-muted/50" : "hover:bg-accent/50",
      )}
    >
      {/* 상단: 메인 항목 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* 메인 체크박스 (daily 모드용) */}
          {recurrence?.type === "daily" && (
            <input
              type="checkbox"
              checked={todayCompleted}
              onChange={handleDailyToggle}
              disabled={isExpired}
              className="w-5 h-5 rounded-md border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
            />
          )}

          {/* 서브 체크박스가 있는 경우 상위 체크박스 (읽기 전용) */}
          {(recurrence?.type === "weekly" ||
            recurrence?.type === "monthly") && (
            <input
              type="checkbox"
              checked={subCheckItems.every((item) => item.isChecked)}
              readOnly
              disabled
              className="w-5 h-5 rounded-md border-input text-primary accent-primary shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <span
              className={cn(
                "text-sm block truncate",
                todayCompleted && "text-muted-foreground line-through",
              )}
            >
              {plan.content}
            </span>
          </div>
        </div>

        {/* 우측: 반복 뱃지 + 액션 */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
            <Repeat className="w-3 h-3" />
            {getRecurrenceLabel()}
          </span>

          {/* 액션 버튼들 */}
          <div className="flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onOpenHistory(plan)}
            >
              <Calendar className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEditRecurrence(plan)}
              disabled={isExpired}
            >
              <Settings className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ 반복 계획 삭제</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{plan.content}&quot; 계획을 삭제하시겠습니까?
                    <br />
                    <br />
                    ⚠️ 삭제하면 지금까지의 기록 ({recordCount}회 달성)도 함께
                    삭제됩니다.
                    <br />이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(plan.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* 서브 체크박스들 (weekly/monthly) */}
      {subCheckItems.length > 0 && (
        <div className="mt-2 pl-8 space-y-1">
          {subCheckItems.map((item) => {
            // 미래 날짜인지 확인
            const itemDate = new Date(item.recordDate);
            itemDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isFutureDate = itemDate > today;

            return (
              <div key={item.seq} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={item.isChecked}
                  onChange={() => handleSubCheckToggle(item)}
                  disabled={isExpired || isFutureDate}
                  className="w-4 h-4 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span
                  className={cn(
                    "text-muted-foreground",
                    item.isChecked && "line-through",
                    isFutureDate && "opacity-50",
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단: 기간 및 달성률 */}
      <div className="mt-2 pl-8 flex items-center gap-3 text-xs text-muted-foreground">
        <span>
          {recurrence?.startDate} ~ {recurrence?.endDate || "(계속)"}
          {isExpired && " (종료)"}
        </span>
        <span>📊 {achievementRate}%</span>
      </div>
    </div>
  );
}
