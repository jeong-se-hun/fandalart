"use client";

import { useMemo, useCallback } from "react";
import { DetailPlan, PlanRecord, RecurrenceSettings } from "@/data/goals";
import { supabase } from "@/lib/supabase";

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 주어진 날짜가 속한 주의 시작일 (일요일) 반환
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = 일요일
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 주어진 날짜가 속한 주의 종료일 (토요일) 반환
 */
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * 주어진 날짜가 속한 달의 시작일 반환
 */
function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 주어진 날짜가 속한 달의 종료일 반환
 */
function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * ISO 날짜 문자열로 변환
 */
function toISODate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().split("T")[0];
}

/**
 * 두 날짜 사이의 일수 계산
 */
function daysBetween(start: Date, end: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
}

/**
 * 두 날짜 사이의 주수 계산
 */
function weeksBetween(start: Date, end: Date): number {
  const days = daysBetween(start, end);
  return Math.ceil(days / 7);
}

/**
 * 두 날짜 사이의 월수 계산
 */
function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}

// ============================================
// 서브 체크박스 항목 생성
// ============================================

export interface SubCheckItem {
  seq: number; // 1, 2, 3... 또는 요일/일자
  label: string; // "1회", "월 (1/13)", "1일 (1/1)" 등 (긴 라벨)
  buttonLabel: string; // "1", "월", "1일" 등 (버튼용 짧은 라벨)
  isChecked: boolean;
  recordDate: string; // 이 체크박스에 해당하는 날짜
}

/**
 * 현재 주기의 서브 체크박스 항목들 생성
 */
function generateSubCheckItems(
  recurrence: RecurrenceSettings,
  records: PlanRecord[],
  today: Date,
): SubCheckItem[] {
  const items: SubCheckItem[] = [];

  if (recurrence.type === "weekly") {
    const weekStart = getWeekStart(today);
    const weekEnd = getWeekEnd(today);

    // 이번 주 기록 필터링
    const weekRecords = records.filter((r) => {
      const d = new Date(r.recordDate);
      return d >= weekStart && d <= weekEnd;
    });

    // 모드 자동 감지: weeklyMode가 없어도 weekdays가 있으면 요일 모드
    const effectiveWeeklyMode =
      recurrence.weeklyMode ||
      (recurrence.weekdays && recurrence.weekdays.length > 0
        ? "days"
        : "times");

    if (effectiveWeeklyMode === "times" && recurrence.timesPerWeek) {
      // 주 N회 모드: 체크된 갯수 기반으로 표시
      const checkedCount = weekRecords.filter((r) => r.isCompleted).length;

      for (let i = 1; i <= recurrence.timesPerWeek; i++) {
        // i번째 슬롯이 체크되었는지는 체크된 총 갯수와 비교
        const isChecked = i <= checkedCount;
        // 해당 seq에 맞는 레코드 찾기
        const record = weekRecords.find((r) => r.recordSeq === i);

        items.push({
          seq: i,
          label: `${i}회`,
          buttonLabel: `${i}`,
          isChecked,
          recordDate: record?.recordDate || toISODate(today),
        });
      }
    } else if (effectiveWeeklyMode === "days" && recurrence.weekdays) {
      // 특정 요일 모드
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      recurrence.weekdays.forEach((dayIndex, i) => {
        const targetDate = new Date(weekStart);
        targetDate.setDate(targetDate.getDate() + dayIndex);
        const dateStr = toISODate(targetDate);

        const record = weekRecords.find((r) => r.recordDate === dateStr);
        const dateDisplay = `${
          targetDate.getMonth() + 1
        }/${targetDate.getDate()}`;

        items.push({
          seq: i + 1,
          label: `${dayNames[dayIndex]} (${dateDisplay})`,
          buttonLabel: dayNames[dayIndex],
          isChecked: !!record,
          recordDate: dateStr,
        });
      });
    }
  } else if (recurrence.type === "monthly") {
    const monthStart = getMonthStart(today);
    const monthEnd = getMonthEnd(today);

    // 이번 달 기록 필터링
    const monthRecords = records.filter((r) => {
      const d = new Date(r.recordDate);
      return d >= monthStart && d <= monthEnd;
    });

    // 모드 자동 감지: monthlyMode가 없어도 monthDays가 있으면 일자 모드
    const effectiveMonthlyMode =
      recurrence.monthlyMode ||
      (recurrence.monthDays && recurrence.monthDays.length > 0
        ? "dates"
        : "times");

    if (effectiveMonthlyMode === "times" && recurrence.timesPerMonth) {
      // 월 N회 모드: 체크된 갯수 기반으로 표시
      const checkedCount = monthRecords.filter((r) => r.isCompleted).length;

      for (let i = 1; i <= recurrence.timesPerMonth; i++) {
        // i번째 슬롯이 체크되었는지는 체크된 총 갯수와 비교
        const isChecked = i <= checkedCount;
        // 해당 seq에 맞는 레코드 찾기
        const record = monthRecords.find((r) => r.recordSeq === i);

        items.push({
          seq: i,
          label: `${i}회`,
          buttonLabel: `${i}`,
          isChecked,
          recordDate: record?.recordDate || toISODate(today),
        });
      }
    } else if (effectiveMonthlyMode === "dates" && recurrence.monthDays) {
      // 특정 일자 모드
      recurrence.monthDays.forEach((day, i) => {
        const targetDate = new Date(today.getFullYear(), today.getMonth(), day);
        const dateStr = toISODate(targetDate);

        const record = monthRecords.find((r) => r.recordDate === dateStr);
        const dateDisplay = `${targetDate.getMonth() + 1}/${day}`;

        items.push({
          seq: i + 1,
          label: `${day}일 (${dateDisplay})`,
          buttonLabel: `${day}일`,
          isChecked: !!record,
          recordDate: dateStr,
        });
      });
    }
  }

  return items;
}

// ============================================
// 달성률 계산
// ============================================

/**
 * 반복 계획의 전체 달성률 계산 (0~1)
 */
export function calculateRecurrenceRate(
  recurrence: RecurrenceSettings,
  records: PlanRecord[],
  today: Date,
): number {
  const startDate = new Date(recurrence.startDate);
  startDate.setHours(0, 0, 0, 0);

  // endDate가 있으면 전체 기간 달성률, 없으면 현재까지의 준수율
  const effectiveEnd = recurrence.endDate
    ? new Date(recurrence.endDate)
    : today;
  effectiveEnd.setHours(23, 59, 59, 999);

  if (effectiveEnd < startDate) return 0;

  // 시작일~종료일 범위 내의 완료 레코드만 카운트
  const completedRecords = records.filter((r) => {
    if (!r.isCompleted) return false;
    const recordDate = new Date(r.recordDate);
    return recordDate >= startDate && recordDate <= effectiveEnd;
  });

  let totalExpected = 0;

  switch (recurrence.type) {
    case "daily":
      totalExpected = daysBetween(startDate, effectiveEnd);
      break;

    case "weekly":
      if (recurrence.weeklyMode === "times" && recurrence.timesPerWeek) {
        totalExpected =
          weeksBetween(startDate, effectiveEnd) * recurrence.timesPerWeek;
      } else if (recurrence.weeklyMode === "days" && recurrence.weekdays) {
        totalExpected =
          weeksBetween(startDate, effectiveEnd) * recurrence.weekdays.length;
      }
      break;

    case "monthly":
      if (recurrence.monthlyMode === "times" && recurrence.timesPerMonth) {
        totalExpected =
          monthsBetween(startDate, effectiveEnd) * recurrence.timesPerMonth;
      } else if (recurrence.monthlyMode === "dates" && recurrence.monthDays) {
        totalExpected =
          monthsBetween(startDate, effectiveEnd) * recurrence.monthDays.length;
      }
      break;
  }

  if (totalExpected === 0) return 0;
  return Math.min(completedRecords.length / totalExpected, 1);
}

// ============================================
// Custom Hook
// ============================================

export interface UseRecurringPlanReturn {
  // 상태
  isRecurring: boolean;
  isExpired: boolean;
  subCheckItems: SubCheckItem[];
  achievementRate: number; // 0~100 백분율
  todayCompleted: boolean;

  // 액션
  toggleSubCheck: (seq: number, recordDate: string) => Promise<void>;
  toggleDailyCheck: () => Promise<void>;
}

export function useRecurringPlan(
  plan: DetailPlan,
  records: PlanRecord[],
): UseRecurringPlanReturn {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toISODate(today), [today]);

  const recurrence = plan.recurrence;
  const isRecurring = !!recurrence && recurrence.type !== "none";

  // 종료 여부 확인
  const isExpired = useMemo(() => {
    if (!recurrence?.endDate) return false;
    const endDate = new Date(recurrence.endDate);
    return today > endDate;
  }, [recurrence, today]);

  // 서브 체크박스 항목 생성
  const subCheckItems = useMemo(() => {
    if (
      !recurrence ||
      recurrence.type === "none" ||
      recurrence.type === "daily"
    ) {
      return [];
    }
    return generateSubCheckItems(recurrence, records, today);
  }, [recurrence, records, today]);

  // 오늘 완료 여부 (daily 모드용)
  const todayCompleted = useMemo(() => {
    if (!isRecurring) return plan.isCompleted;
    if (recurrence?.type === "daily") {
      return records.some((r) => r.recordDate === todayStr && r.isCompleted);
    }
    // weekly/monthly는 서브 체크박스로 판단
    return subCheckItems.every((item) => item.isChecked);
  }, [
    isRecurring,
    plan.isCompleted,
    recurrence,
    records,
    todayStr,
    subCheckItems,
  ]);

  // 달성률 계산
  const achievementRate = useMemo(() => {
    if (!recurrence || recurrence.type === "none") {
      return plan.isCompleted ? 100 : 0;
    }
    const rate = calculateRecurrenceRate(recurrence, records, today);
    return Math.round(rate * 100);
  }, [recurrence, records, today, plan.isCompleted]);

  // 서브 체크박스 토글
  const toggleSubCheck = useCallback(
    async (seq: number, targetRecordDate: string) => {
      // 모드 자동 감지
      const effectiveWeeklyMode =
        recurrence?.weeklyMode ||
        (recurrence?.weekdays && recurrence.weekdays.length > 0
          ? "days"
          : "times");
      const effectiveMonthlyMode =
        recurrence?.monthlyMode ||
        (recurrence?.monthDays && recurrence.monthDays.length > 0
          ? "dates"
          : "times");

      // N회 모드인지 확인 (weekly/monthly times mode)
      const isTimesMode =
        (recurrence?.type === "weekly" && effectiveWeeklyMode === "times") ||
        (recurrence?.type === "monthly" && effectiveMonthlyMode === "times");

      if (isTimesMode) {
        // [N회 모드] 기존 카운팅 로직 (오늘 날짜 기준)
        const weekStart = getWeekStart(today);
        const weekEnd = getWeekEnd(today);
        const monthStart = getMonthStart(today);
        const monthEnd = getMonthEnd(today);

        let periodRecords: PlanRecord[] = [];
        if (recurrence?.type === "weekly") {
          periodRecords = records.filter((r) => {
            const d = new Date(r.recordDate);
            return d >= weekStart && d <= weekEnd && r.isCompleted;
          });
        } else if (recurrence?.type === "monthly") {
          periodRecords = records.filter((r) => {
            const d = new Date(r.recordDate);
            return d >= monthStart && d <= monthEnd && r.isCompleted;
          });
        }

        const checkedCount = periodRecords.length;
        const isCurrentlyChecked = seq <= checkedCount;

        if (isCurrentlyChecked) {
          // 체크 해제: 가장 높은 seq 삭제
          const highestSeqRecord = periodRecords.reduce(
            (max, r) => (r.recordSeq > (max?.recordSeq || 0) ? r : max),
            null as PlanRecord | null,
          );
          if (highestSeqRecord) {
            await supabase
              .from("plan_records")
              .delete()
              .eq("id", highestSeqRecord.id);
          }
        } else {
          // 체크: 다음 seq로 추가
          const nextSeq = checkedCount + 1;
          await supabase.from("plan_records").insert({
            plan_id: plan.id,
            record_date: toISODate(today),
            record_seq: nextSeq,
            is_completed: true,
            completed_at: new Date().toISOString(),
          });
        }
      } else {
        // [특정 요일/일자 모드] 해당 날짜, 해당 seq 레코드 직접 토글
        const existingRecord = records.find(
          (r) => r.recordDate === targetRecordDate && r.recordSeq === seq,
        );

        if (existingRecord) {
          // 삭제
          await supabase
            .from("plan_records")
            .delete()
            .eq("id", existingRecord.id);
        } else {
          // 추가 (targetRecordDate 사용)
          await supabase.from("plan_records").insert({
            plan_id: plan.id,
            record_date: targetRecordDate,
            record_seq: seq,
            is_completed: true,
            completed_at: new Date().toISOString(),
          });
        }
      }
    },
    [plan.id, records, recurrence, today],
  );

  // 일일 체크박스 토글 (daily)
  const toggleDailyCheck = useCallback(async () => {
    const existingRecord = records.find(
      (r) => r.recordDate === todayStr && r.recordSeq === 1,
    );

    if (existingRecord) {
      // 기록 삭제
      await supabase.from("plan_records").delete().eq("id", existingRecord.id);
    } else {
      // 기록 추가
      await supabase.from("plan_records").insert({
        plan_id: plan.id,
        record_date: todayStr,
        record_seq: 1,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });
    }
  }, [plan.id, records, todayStr]);

  return {
    isRecurring,
    isExpired,
    subCheckItems,
    achievementRate,
    todayCompleted,
    toggleSubCheck,
    toggleDailyCheck,
  };
}

// ============================================
// Goal 달성률 계산 함수 (일반 + 반복 통합)
// ============================================

export function calculateGoalProgress(
  plans: DetailPlan[],
  allRecords: PlanRecord[],
): number {
  if (plans.length === 0) return 0;

  const today = new Date();
  let totalWeight = 0;
  let achievedWeight = 0;

  for (const plan of plans) {
    totalWeight += 1;

    if (!plan.recurrence || plan.recurrence.type === "none") {
      // 일반 계획: 0% 또는 100%
      achievedWeight += plan.isCompleted ? 1 : 0;
    } else {
      // 반복 계획: 현재까지 달성률 (0~1)
      const planRecords = allRecords.filter((r) => r.planId === plan.id);
      const rate = calculateRecurrenceRate(plan.recurrence, planRecords, today);
      achievedWeight += rate;
    }
  }

  return Math.round((achievedWeight / totalWeight) * 100);
}
