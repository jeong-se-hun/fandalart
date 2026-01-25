# 🔄 반복 목표 (Recurring Goals) 기능 기획서

> **작성일**: 2026-01-14  
> **최종 수정**: 2026-01-15  
> **버전**: v2.0 (최종 확정)  
> **상태**: ✅ 기획 완료

---

## 📋 기능 개요

### 문제점

현재 세부 계획(Plan)은 일회성으로만 관리됩니다. "매일 스트레칭", "주 3회 운동" 같은 반복 목표를 관리하려면 수동으로 여러 항목을 추가해야 하는 불편함이 있습니다.

### 해결책

세부 계획에 **반복 주기 설정**을 추가하여, 사용자가 한 번만 등록하면 자동으로 주기에 맞춰 체크가 갱신되고 기록이 관리되는 기능을 제공합니다.

### 사용 시나리오

1. 사용자가 목표의 세부 계획을 추가할 때 **"반복 설정"** 옵션을 선택
2. 반복 유형(매일/주 N회/주 특정요일/월 N회/월 특정일자), 시작일, 종료일(선택) 설정
3. 화면에는 하나의 항목 + 서브 체크박스로 표시
4. 체크하면 해당 날짜로 기록 저장
5. 다음 주기가 되면 서브 체크박스 초기화
6. **"기록 보기"** 버튼으로 달력에서 달성 현황 확인 및 **과거 기록 수정 가능**

---

## 🎯 반복 모드 정의

| 모드         | 설명                  | 예시              |
| ------------ | --------------------- | ----------------- |
| **없음**     | 일반 세부 계획 (기존) | 책 구매하기       |
| **매일**     | 매일 1회              | 매일 스트레칭     |
| **주(횟수)** | 주 N회 (요일 자유)    | 주 3회 운동       |
| **주(요일)** | 특정 요일 지정        | 월,수,금 독서     |
| **월(횟수)** | 월 N회 (날짜 자유)    | 월 4회 영화       |
| **월(일자)** | 특정 일자 지정        | 1일,15일 급여관리 |

---

## 🖥️ UI 설계

### 1. 모드별 화면 표시

#### 없음 (일반 계획)

```
☐ 책 "클린 코드" 구매하기
```

- 체크하면 완료, 화면에 유지됨

#### 매일

```
☐ 스트레칭                    🔁 매일
                              [📅 기록]
```

- 체크박스 1개
- 체크 → 오늘 기록
- 다음 날 00:00에 ☐로 초기화
- 달력에서 이전 기록 확인/수정 가능

#### 주(횟수) - 주 3회

```
☐ 운동                        🔁 주 3회
  ☐ 1회                       [📅 기록]
  ☐ 2회
  ☐ 3회
```

- **서브 체크박스 N개**
- 각 체크 시 오늘 날짜로 기록
- 3개 다 체크되면 상위 ☑ 자동 체크
- 매주 일요일 00:00에 서브 체크박스 초기화

#### 주(요일) - 월,수,금

```
☐ 독서                        🔁 매주 (월,수,금)
  ☐ 월 (1/13)                 [📅 기록]
  ☐ 수 (1/15)
  ☐ 금 (1/17)
```

- **요일별 서브 체크박스**
- 금요일에 월 체크해도 → 1/13 날짜로 기록됨
- 3개 다 체크되면 상위 ☑ 자동 체크
- 매주 일요일 00:00에 다음 주 날짜로 갱신

#### 월(횟수) - 월 2회

```
☐ 영화 보기                   🔁 월 2회
  ☐ 1회                       [📅 기록]
  ☐ 2회
```

- **서브 체크박스 N개**
- 각 체크 시 오늘 날짜로 기록
- 매월 1일 00:00에 초기화

#### 월(일자) - 1일, 15일

```
☐ 급여 관리                   🔁 매월 (1일,15일)
  ☐ 1일 (1/1)                 [📅 기록]
  ☐ 15일 (1/15)
```

- **일자별 서브 체크박스**
- 20일에 1일 체크해도 → 1/1 날짜로 기록됨
- 매월 1일 00:00에 다음 달 날짜로 갱신

---

### 2. 반복 설정 모달

```
┌─────────────────────────────────────────────────────┐
│                  ⚙️ 반복 설정                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  반복 유형                                          │
│  ┌─────────────────────────────────────────────┐   │
│  │ ○ 반복 안 함                                 │   │
│  │ ○ 매일                                      │   │
│  │ ● 매주 ──┬─ ● 횟수: [ 3 ▼ ] 회              │   │
│  │          └─ ○ 요일: ☐일☑월☐화☑수☐목☑금☐토 │   │
│  │ ○ 매월 ──┬─ ○ 횟수: [ 2 ▼ ] 회              │   │
│  │          └─ ○ 일자: [1, 15] 일              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  기간 설정                                          │
│  시작일: [2026-01-15 📅]                           │
│  ☑ 종료일 없음 (계속 반복)                          │
│  종료일: [선택 안 함] (비활성)                       │
│                                                     │
├─────────────────────────────────────────────────────┤
│            [취소]           [확인]                   │
└─────────────────────────────────────────────────────┘
```

---

### 3. 기록 달력 모달

```
┌─────────────────────────────────────────────────────┐
│              📅 운동 달성 기록                       │
├─────────────────────────────────────────────────────┤
│  ◀ 이전          2026년 1월          다음 ▶        │
│                                                     │
│  ┌───┬───┬───┬───┬───┬───┬───┐                    │
│  │ 일│ 월│ 화│ 수│ 목│ 금│ 토│                    │
│  ├───┼───┼───┼───┼───┼───┼───┤                    │
│  │   │   │   │ 🟢│   │ 🟢│   │  ← 클릭 시 토글    │
│  │   │ 🟢│   │ 🔴│   │ 🟢│   │  (과거 수정 가능)  │
│  │   │ 🟢│   │ 🟢│   │ ⭐│   │  ← 오늘           │
│  │   │ ░░│   │ ░░│   │ ░░│   │  ← 미래 (비활성)   │
│  │   │ ░░│   │   │   │   │   │                    │
│  └───┴───┴───┴───┴───┴───┴───┘                    │
│                                                     │
│  🟢 완료 (7회)   🔴 미완료 (1회)   ⭐ 오늘          │
│  💡 과거 날짜를 클릭하면 기록을 수정할 수 있어요     │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📊 전체 달성률: 7/36 (19.4%)                │   │
│  │ ████░░░░░░░░░░░░░░░░░░░░░░░░               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                    [닫기]                           │
└─────────────────────────────────────────────────────┘
```

---

### 4. 종료된 반복 계획

```
[종료됨 - 비활성]
▢ 명상                                  🔁 매일
  └─ 2025-01-01 ~ 2025-12-31 (종료)    [📅 기록]
  └─ 📊 최종 달성: 280/365 (76.7%)
```

- 회색으로 표시 (비활성화)
- 체크 불가
- 기록 열람만 가능

---

### 5. 삭제 시 경고 다이얼로그

```
┌─────────────────────────────────────────┐
│  ⚠️ 반복 계획 삭제                      │
├─────────────────────────────────────────┤
│                                         │
│  "주 3회 운동" 계획을 삭제하시겠습니까?  │
│                                         │
│  ⚠️ 삭제하면 지금까지의 기록            │
│     (24회 달성)도 함께 삭제됩니다.       │
│                                         │
│  이 작업은 되돌릴 수 없습니다.           │
│                                         │
├─────────────────────────────────────────┤
│       [취소]          [삭제]            │
└─────────────────────────────────────────┘
```

---

## 📊 달성률 계산

### 개별 세부계획 달성률

| 모드        | 계산 공식                  |
| ----------- | -------------------------- |
| 없음 (일반) | 체크됨=100%, 안됨=0%       |
| 매일        | 달성일 / 전체일            |
| 주(횟수)    | 달성횟수 / (주수 × N회)    |
| 주(요일)    | 달성횟수 / (주수 × 요일수) |
| 월(횟수)    | 달성횟수 / (월수 × N회)    |
| 월(일자)    | 달성횟수 / (월수 × 일자수) |

**무기한 설정 시**: 시작일 ~ 오늘까지 기준으로 계산

### Goal 전체 달성률

```
Goal 달성률 = 각 세부계획 달성률의 평균
```

**예시:**

| 세부 계획     | 모드     | 달성률 |
| ------------- | -------- | ------ |
| 헬스장 등록   | 없음     | 100%   |
| 매일 스트레칭 | 매일     | 71%    |
| 주 3회 운동   | 주(횟수) | 67%    |
| 월,수,금 독서 | 주(요일) | 56%    |

**Goal 달성률** = (100 + 71 + 67 + 56) / 4 = **74%**

---

## 💾 데이터 구조

### TypeScript 인터페이스

```typescript
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

export interface Plan {
  id: string;
  goalId: string;
  content: string;
  isCompleted: boolean; // 일반 계획용
  recurrence?: RecurrenceSettings; // JSONB로 저장
  createdAt: string;
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
```

---

## 🗄️ 데이터베이스 스키마

### 1. plans 테이블 수정

```sql
-- JSONB 컬럼 1개만 추가 (기존 데이터 영향 없음)
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS recurrence JSONB DEFAULT NULL;

-- 인덱스 추가 (JSONB 필드 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_plans_recurrence_type
ON plans ((recurrence->>'type'));
```

### 2. plan_records 테이블 생성

```sql
CREATE TABLE IF NOT EXISTS plan_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_seq INTEGER NOT NULL DEFAULT 1,  -- 같은 날 몇 번째 (1회, 2회, 3회)
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, record_date, record_seq)  -- 같은 날 같은 순번만 중복 방지
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_plan_records_plan_id ON plan_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_records_date ON plan_records(record_date);
CREATE INDEX IF NOT EXISTS idx_plan_records_plan_date ON plan_records(plan_id, record_date);

-- RLS
ALTER TABLE plan_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_plan_records" ON plan_records FOR ALL USING (true);
```

### 3. 롤백 스크립트

```sql
ALTER TABLE plans DROP COLUMN IF EXISTS recurrence;
DROP TABLE IF EXISTS plan_records;
```

---

## 🛡️ 안전한 마이그레이션 가이드

### ⚠️ 주의사항

**절대로 아래 명령어를 사용하지 마세요!**

```sql
-- ❌ 이 명령어는 모든 데이터를 삭제합니다!
DROP SCHEMA public CASCADE;
```

### ✅ 안전한 마이그레이션 스크립트 (전체)

```sql
-- ============================================
-- 반복 목표 기능 마이그레이션
-- 작성일: 2026-01-15
-- 주의: 기존 데이터 유지, 새 컬럼/테이블만 추가
-- ============================================

-- [STEP 1] plans 테이블에 recurrence JSONB 컬럼 추가
ALTER TABLE plans
ADD COLUMN IF NOT EXISTS recurrence JSONB DEFAULT NULL;

-- [STEP 2] plan_records 테이블 생성
CREATE TABLE IF NOT EXISTS plan_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  record_seq INTEGER NOT NULL DEFAULT 1,  -- 같은 날 몇 번째 (1회, 2회, 3회)
  is_completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plan_id, record_date, record_seq)  -- 같은 날 같은 순번만 중복 방지
);

-- [STEP 3] 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_plan_records_plan_id ON plan_records(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_records_date ON plan_records(record_date);
CREATE INDEX IF NOT EXISTS idx_plan_records_plan_date ON plan_records(plan_id, record_date);
CREATE INDEX IF NOT EXISTS idx_plans_recurrence_type ON plans ((recurrence->>'type'));

-- [STEP 4] RLS 정책
ALTER TABLE plan_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'plan_records' AND policyname = 'allow_all_plan_records'
  ) THEN
    CREATE POLICY "allow_all_plan_records" ON plan_records FOR ALL USING (true);
  END IF;
END $$;

-- [STEP 5] 검증
SELECT id, content, recurrence FROM plans LIMIT 5;

-- ============================================
-- 마이그레이션 완료!
-- ============================================
```

---

## 📁 수정/생성 파일 목록

| 파일                                                     | 작업 | 설명                  |
| -------------------------------------------------------- | ---- | --------------------- |
| `src/data/goals.ts`                                      | 수정 | 타입 정의 확장        |
| `src/hooks/useRecurringPlan.ts`                          | 신규 | 반복 계획 로직 훅     |
| `src/components/mandalart/recurrence-settings-modal.tsx` | 신규 | 반복 설정 모달        |
| `src/components/mandalart/plan-history-calendar.tsx`     | 신규 | 기록 달력 모달        |
| `src/components/mandalart/recurring-plan-item.tsx`       | 신규 | 반복 계획 UI 컴포넌트 |
| `src/components/mandalart/detail-sheet.tsx`              | 수정 | 반복 계획 통합        |
| `src/app/page.tsx`                                       | 수정 | 달성률 계산, API 연동 |

---

## ✅ 구현 체크리스트

### 1단계: 데이터베이스 마이그레이션

- [ ] 백업 확인 (완료됨)
- [ ] plans 테이블에 recurrence 컬럼 추가
- [ ] plan_records 테이블 생성
- [ ] 인덱스 및 RLS 설정
- [ ] 검증

### 2단계: TypeScript 타입 정의

- [ ] RecurrenceType, WeeklyMode, MonthlyMode 타입
- [ ] RecurrenceSettings 인터페이스
- [ ] Plan 인터페이스 확장
- [ ] PlanRecord 인터페이스

### 3단계: Custom Hook 구현

- [ ] useRecurringPlan.ts 생성
- [ ] 서브 체크박스 상태 계산
- [ ] 체크 토글 함수
- [ ] 달성률 계산

### 4단계: UI 컴포넌트 구현

- [ ] RecurrenceSettingsModal
- [ ] PlanHistoryCalendar
- [ ] RecurringPlanItem (서브 체크박스 포함)

### 5단계: 통합

- [ ] detail-sheet.tsx 수정
- [ ] 달성률 계산 로직 수정
- [ ] 삭제 시 경고 다이얼로그

### 6단계: 테스트

- [ ] 각 모드별 테스트
- [ ] 기록 수정 테스트
- [ ] 달성률 계산 검증

---

## ✅ 확정 사항 요약

| 항목           | 결정                                               |
| -------------- | -------------------------------------------------- |
| 반복 모드      | 없음, 매일, 주(횟수), 주(요일), 월(횟수), 월(일자) |
| UI 방식        | **서브 체크박스** (횟수/요일/일자별)               |
| 주간 시작일    | **일요일**                                         |
| 종료일         | **선택** (무기한 가능)                             |
| 종료 후        | **비활성화** (회색, 기록 열람만 가능)              |
| 과거 기록 수정 | **가능** (달력에서 클릭)                           |
| 삭제 시        | **기록도 삭제 + 경고 다이얼로그 필수**             |
| 달성률 계산    | 각 세부계획 달성률의 **평균**                      |
| DB 구조        | plans에 recurrence JSONB + plan_records 테이블     |
