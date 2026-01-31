// ============================================
// 반복 계획 (Recurring Goals) 타입 정의
// ============================================

export type RecurrenceType = "none" | "daily" | "weekly" | "monthly";
export type WeeklyMode = "times" | "days"; // 횟수 / 특정요일
export type MonthlyMode = "times" | "dates"; // 횟수 / 특정일자

export interface RecurrenceSettings {
  type: RecurrenceType;
  startDate: string; // ISO 날짜: "2026-01-01"
  endDate?: string | null; // null = 무기한

  // 주간 설정
  weeklyMode?: WeeklyMode;
  timesPerWeek?: number; // 1~7 (횟수 모드)
  weekdays?: number[]; // [0,1,2,3,4,5,6] 0=일요일 (요일 모드)

  // 월간 설정
  monthlyMode?: MonthlyMode;
  timesPerMonth?: number; // 1~31 (횟수 모드)
  monthDays?: number[]; // [1,15,31] (일자 모드)
}

export interface PlanRecord {
  id: string;
  planId: string;
  recordDate: string; // ISO 날짜: "2026-01-14"
  recordSeq: number; // 같은 날 몇 번째 (1, 2, 3)
  isCompleted: boolean;
  completedAt?: string; // 체크한 시각
  createdAt: string;
}

// ============================================
// 기존 타입 정의
// ============================================

export interface DetailPlan {
  id: string;
  content: string;
  isCompleted: boolean;
  recurrence?: RecurrenceSettings; // 반복 설정 (없으면 일반 계획)
}

export interface CheerMessage {
  id: string;
  author?: string;
  content: string;
  createdAt?: string;

  // Additions
  member_id?: string;
  member_nickname?: string;
}

export interface Goal {
  id: string;
  owner: string;
  category: "cat1" | "cat2" | "cat3" | "cat4";
  slotIndex: number;
  title: string;
  progress: number;
  cheers?: CheerMessage[];
  plans?: DetailPlan[];
  lastViewedAt?: string;
}
