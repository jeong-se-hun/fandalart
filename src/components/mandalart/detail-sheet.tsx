"use client";

import * as React from "react";
import { Goal, DetailPlan, PlanRecord, RecurrenceSettings } from "@/data/goals";
import { toast } from "sonner";

import {
  useRecurringPlan,
  calculateGoalProgress,
} from "@/hooks/useRecurringPlan";
import { RecurrenceSettingsModal } from "./recurrence-settings-modal";
import { PlanHistoryCalendar } from "./plan-history-calendar";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Trophy,
  Trash2,
  Send,
  Pencil,
  Repeat,
  Calendar,
  Check,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DetailSheetProps {
  goal: Goal;
  categoryTitle?: string;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  onAddPlan: (
    goalId: string,
    content: string,
    recurrence?: RecurrenceSettings,
  ) => void;
  onUpdatePlan: (
    goalId: string,
    planId: string,
    content: string,
    isCompleted: boolean,
  ) => void;
  onDeletePlan: (goalId: string, planId: string) => void;
  onUpdatePlanRecurrence: (
    goalId: string,
    planId: string,
    recurrence: RecurrenceSettings | null,
  ) => void;
  onAddComment: (goalId: string, content: string) => void;
  onDeleteComment: (goalId: string, commentId: string) => void;
  planRecords?: PlanRecord[];
  onRecordsChange?: () => void;
  currentUserId?: string;
  currentUserNickname?: string;
}

// Sub-component for individual plan items (unified for regular and recurring)
function PlanItem({
  plan,
  records,
  onUpdate,
  onDelete,
  onEditRecurrence,
  onOpenHistory,
  onRecordsChange,
}: {
  plan: DetailPlan;
  records: PlanRecord[];
  onUpdate: (id: string, newContent: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
  onEditRecurrence: (plan: DetailPlan) => void;
  onOpenHistory: (plan: DetailPlan) => void;
  onRecordsChange: () => void;
}) {
  const {
    isRecurring,
    isExpired,
    subCheckItems,
    toggleSubCheck,
    toggleDailyCheck,
    todayCompleted,
  } = useRecurringPlan(plan, records || []);

  const recurrenceLabel = React.useMemo(() => {
    if (!plan.recurrence || plan.recurrence.type === "none") return null;
    switch (plan.recurrence.type) {
      case "daily":
        return "매일";
      case "weekly":
        // weeklyMode가 'times'이거나, 없더라도 timesPerWeek가 있으면 횟수 모드로 간주
        const isWeeklyTimes =
          plan.recurrence.weeklyMode === "times" ||
          (!plan.recurrence.weeklyMode && !!plan.recurrence.timesPerWeek);
        return isWeeklyTimes ? `주 ${plan.recurrence.timesPerWeek}회` : "매주";
      case "monthly":
        const isMonthlyTimes =
          plan.recurrence.monthlyMode === "times" ||
          (!plan.recurrence.monthlyMode && !!plan.recurrence.timesPerMonth);
        return isMonthlyTimes
          ? `월 ${plan.recurrence.timesPerMonth}회`
          : "매월";
      default:
        return null;
    }
  }, [plan.recurrence]);

  const handleToggle = async () => {
    if (isExpired) return;

    if (isRecurring) {
      if (plan.recurrence?.type === "daily") {
        await toggleDailyCheck();
        onRecordsChange();
      }
    } else {
      onUpdate(plan.id, plan.content, !plan.isCompleted);
    }
  };

  const showMainCheckbox = !isRecurring || plan.recurrence?.type === "daily";

  return (
    <div
      className={cn(
        "group flex flex-col p-3 rounded-xl border bg-card transition-colors",
        isExpired ? "opacity-60 bg-muted/30" : "hover:bg-accent/50",
      )}
    >
      <div className="flex items-start space-x-3 w-full">
        {showMainCheckbox ? (
          <input
            type="checkbox"
            checked={todayCompleted}
            onChange={handleToggle}
            disabled={isExpired}
            className={cn(
              "w-5 h-5 rounded-md border-input text-primary focus:ring-primary/20 accent-primary shrink-0 mt-0.5",
              isExpired ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          />
        ) : (
          <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
            <Repeat className="w-4 h-4 text-muted-foreground/50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-medium text-sm transition-colors",
                todayCompleted ||
                  (subCheckItems.length > 0 &&
                    subCheckItems.every((i) => i.isChecked))
                  ? "text-muted-foreground line-through"
                  : "text-foreground",
              )}
            >
              {plan.content}
            </span>

            {isExpired && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border">
                종료됨
              </span>
            )}

            {recurrenceLabel && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {recurrenceLabel}
              </span>
            )}
          </div>

          {isRecurring && plan.recurrence && (
            <div className="text-[10px] text-muted-foreground mt-0.5 ml-0.5">
              {plan.recurrence.startDate}
              {plan.recurrence.endDate ? ` ~ ${plan.recurrence.endDate}` : " ~"}
            </div>
          )}

          {subCheckItems.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap animate-in fade-in duration-300">
              {subCheckItems.map((item) => (
                <button
                  key={`${item.recordDate}-${item.seq}`}
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (isExpired) return;
                    await toggleSubCheck(item.seq, item.recordDate);
                    onRecordsChange();
                  }}
                  disabled={isExpired}
                  title={item.label}
                  className={cn(
                    "w-6 h-6 rounded-md border text-[10px] font-medium transition-all flex items-center justify-center",
                    item.isChecked
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300",
                    isExpired && "opacity-50 cursor-not-allowed hover:bg-white",
                  )}
                >
                  {item.isChecked ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    item.buttonLabel
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {isRecurring && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => onOpenHistory(plan)}
              title="기록 보기"
            >
              <Calendar className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => onEditRecurrence(plan)}
            title="수정 및 설정"
            disabled={isExpired}
          >
            <Pencil className="w-4 h-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                title="삭제"
                disabled={isExpired}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl max-w-xs">
              <AlertDialogHeader>
                <AlertDialogTitle>계획 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  {isRecurring
                    ? "반복 계획을 삭제하시겠습니까? 모든 기록이 함께 삭제됩니다."
                    : "이 계획을 삭제하시겠습니까?"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(plan.id)}
                  className="rounded-xl bg-red-500 hover:bg-red-600"
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyPlanItem({
  plan,
  records,
  onOpenHistory,
}: {
  plan: DetailPlan;
  records: PlanRecord[];
  onOpenHistory: (plan: DetailPlan) => void;
}) {
  const { isRecurring, subCheckItems, todayCompleted } = useRecurringPlan(
    plan,
    records,
  );

  const recurrenceLabel = React.useMemo(() => {
    if (!plan.recurrence || plan.recurrence.type === "none") return null;
    switch (plan.recurrence.type) {
      case "daily":
        return "매일";
      case "weekly":
        // weeklyMode가 'times'이거나, 없더라도 timesPerWeek가 있으면 횟수 모드로 간주
        const isWeeklyTimes =
          plan.recurrence.weeklyMode === "times" ||
          (!plan.recurrence.weeklyMode && !!plan.recurrence.timesPerWeek);

        return isWeeklyTimes ? `주 ${plan.recurrence.timesPerWeek}회` : "매주";
      case "monthly":
        const isMonthlyTimes =
          plan.recurrence.monthlyMode === "times" ||
          (!plan.recurrence.monthlyMode && !!plan.recurrence.timesPerMonth);

        return isMonthlyTimes
          ? `월 ${plan.recurrence.timesPerMonth}회`
          : "매월";
      default:
        return null;
    }
  }, [plan.recurrence]);

  const showMainCheckbox = !isRecurring || plan.recurrence?.type === "daily";

  // 현재 달성 현황 텍스트 생성
  const statusRun = React.useMemo(() => {
    if (!isRecurring || !plan.recurrence) return null;
    if (plan.recurrence.type === "daily") return null;

    // 주간 횟수 모드 판별
    const isWeeklyTimes =
      plan.recurrence.type === "weekly" &&
      (plan.recurrence.weeklyMode === "times" ||
        (!plan.recurrence.weeklyMode && !!plan.recurrence.timesPerWeek));

    if (isWeeklyTimes && plan.recurrence.timesPerWeek) {
      const current = subCheckItems.filter((i) => i.isChecked).length;
      return `${current}/${plan.recurrence.timesPerWeek}회 달성`;
    }

    // 월간 횟수 모드 판별
    const isMonthlyTimes =
      plan.recurrence.type === "monthly" &&
      (plan.recurrence.monthlyMode === "times" ||
        (!plan.recurrence.monthlyMode && !!plan.recurrence.timesPerMonth));

    if (isMonthlyTimes && plan.recurrence.timesPerMonth) {
      const current = subCheckItems.filter((i) => i.isChecked).length;
      return `${current}/${plan.recurrence.timesPerMonth}회 달성`;
    }
    return null;
  }, [isRecurring, plan.recurrence, subCheckItems]);

  return (
    <div className="flex flex-col p-3 rounded-xl border bg-card/60">
      <div className="flex items-start space-x-3">
        {showMainCheckbox ? (
          <div
            onClick={() => toast.error("작성자만 수정할 수 있습니다.")}
            className={cn(
              "w-5 h-5 rounded-md border shrink-0 mt-0.5 flex items-center justify-center cursor-not-allowed hover:bg-slate-50 transition-colors",
              todayCompleted
                ? "bg-primary/20 border-primary"
                : "border-slate-200",
            )}
          >
            {todayCompleted && <Check className="w-3 h-3 text-primary" />}
          </div>
        ) : (
          <div className="w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
            <Repeat className="w-4 h-4 text-muted-foreground/50" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-sm font-medium",
                todayCompleted ||
                  (subCheckItems.length > 0 &&
                    subCheckItems.every((i) => i.isChecked))
                  ? "text-muted-foreground line-through"
                  : "",
              )}
            >
              {plan.content}
            </span>

            {recurrenceLabel && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                {recurrenceLabel}
              </span>
            )}

            {statusRun && (
              <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                (이번 주기: {statusRun})
              </span>
            )}

            {isRecurring && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground/50 hover:text-primary -mt-0.5"
                onClick={() => onOpenHistory(plan)}
                title="기록 보기"
              >
                <Calendar className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          {isRecurring && plan.recurrence && (
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {plan.recurrence.startDate}
              {plan.recurrence.endDate ? ` ~ ${plan.recurrence.endDate}` : " ~"}
            </div>
          )}

          {/* 서브 체크박스 (Read-only) */}
          {subCheckItems.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap opacity-80">
              {subCheckItems.map((item) => (
                <div
                  key={`${item.recordDate}-${item.seq}`}
                  title={item.label}
                  onClick={() => toast.error("작성자만 수정할 수 있습니다.")}
                  className={cn(
                    "w-6 h-6 rounded-md border text-[10px] font-medium flex items-center justify-center cursor-not-allowed hover:bg-slate-50 transition-colors",
                    item.isChecked
                      ? "bg-primary/20 text-primary border-primary"
                      : "bg-white border-slate-200 text-slate-400",
                  )}
                >
                  {item.isChecked ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    item.buttonLabel
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddPlanForm({
  onSubmit,
}: {
  onSubmit: (content: string, recurrence?: RecurrenceSettings) => void;
}) {
  const [content, setContent] = React.useState("");
  const [recurrenceType, setRecurrenceType] = React.useState<
    "none" | "daily" | "weekly" | "monthly"
  >("none");
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Timezone safe today string
  const today = React.useMemo(() => {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split("T")[0];
  }, []);
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  const [startDate, setStartDate] = React.useState(today);
  const [endDate, setEndDate] = React.useState(yearEnd);

  const [timesPerWeek, setTimesPerWeek] = React.useState(3);

  const [timesPerMonth, setTimesPerMonth] = React.useState(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let recurrence: Partial<RecurrenceSettings> | undefined = undefined;

    if (recurrenceType !== "none") {
      recurrence = {
        type: recurrenceType,
        startDate,
        endDate,
      };

      if (recurrenceType === "weekly") {
        recurrence.weeklyMode = "times";
        recurrence.timesPerWeek = Math.min(7, Math.max(1, timesPerWeek));
      } else if (recurrenceType === "monthly") {
        recurrence.monthlyMode = "times";
        recurrence.timesPerMonth = Math.min(28, Math.max(1, timesPerMonth));
      }
    }

    onSubmit(content, recurrence as RecurrenceSettings);

    setContent("");
    setRecurrenceType("none");
    setIsExpanded(false);
    setStartDate(today);
    setEndDate(yearEnd);
  };

  return (
    <div className="bg-muted/30 rounded-xl p-3 border border-dashed border-slate-200">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="실천 계획 추가..."
            className="flex-1 h-10 bg-white"
          />
          <Button type="submit" size="sm" className="h-10 px-4">
            추가
          </Button>
        </div>

        <div className="flex items-center gap-4 text-sm px-1">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">반복 설정:</Label>
            <select
              value={recurrenceType}
              onChange={(e) => {
                const newType = e.target.value as
                  | "none"
                  | "daily"
                  | "weekly"
                  | "monthly";
                setRecurrenceType(newType);
                if (newType !== "none") setIsExpanded(true);
                else setIsExpanded(false);
              }}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs cursor-pointer focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="none">없음 (일반)</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
          </div>

          {recurrenceType !== "none" && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-auto text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              {isExpanded ? "접기" : "펼치기"}
              {isExpanded ? "▲" : "▼"}
            </button>
          )}
        </div>

        {recurrenceType !== "none" && isExpanded && (
          <div className="pt-3 border-t border-slate-200/50 space-y-4 text-sm animate-in slide-in-from-top-2 fade-in duration-200">
            {recurrenceType === "weekly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs">주</span>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={timesPerWeek || ""}
                  onChange={(e) => setTimesPerWeek(Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs text-black"
                />
                <span className="text-xs">회 반복</span>
              </div>
            )}

            {recurrenceType === "monthly" && (
              <div className="flex items-center gap-2">
                <span className="text-xs">월</span>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={timesPerMonth || ""}
                  onChange={(e) => setTimesPerMonth(Number(e.target.value))}
                  className="w-16 h-8 text-center text-xs text-black"
                />
                <span className="text-xs">회 반복</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  시작일 <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">
                  종료일 <span className="text-red-400">*</span>
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

export function DetailSheet({
  goal,
  categoryTitle,
  onUpdate,
  onDelete,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdatePlanRecurrence,
  onAddComment,
  onDeleteComment,
  planRecords = [],
  onRecordsChange,
  currentUserId,
  currentUserNickname,
}: DetailSheetProps) {
  const isOwner = React.useMemo(() => {
    if (currentUserNickname && goal.owner === currentUserNickname) return true;
    // Fallback: Check ID if available (닉네임 변경/불일치 대비)
    const g = goal as unknown as Record<string, string>;
    if (currentUserId) {
      if (g.user_id === currentUserId) return true;
      if (g.userId === currentUserId) return true;
      if (g.member_id === currentUserId) return true;
      if (g.owner_id === currentUserId) return true;
    }
    return false;
  }, [goal, currentUserNickname, currentUserId]);
  const [isEditTitleOpen, setIsEditTitleOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(goal.title);

  // 반복 계획 관련 상태
  const [recurrenceModalOpen, setRecurrenceModalOpen] = React.useState(false);
  const [historyCalendarOpen, setHistoryCalendarOpen] = React.useState(false);
  const [selectedPlanForRecurrence, setSelectedPlanForRecurrence] =
    React.useState<DetailPlan | null>(null);
  const [selectedPlanForHistory, setSelectedPlanForHistory] =
    React.useState<DetailPlan | null>(null);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== goal.title) {
      onUpdate(goal.id, { title: editTitle.trim() });
    }
    setIsEditTitleOpen(false);
  };

  const updateGoalProgress = React.useCallback(
    (overridePlans?: DetailPlan[], overrideRecords?: PlanRecord[]) => {
      const plans = overridePlans || goal.plans || [];
      const records = overrideRecords || planRecords || [];

      if (plans.length === 0) return;

      const newProgress = calculateGoalProgress(plans, records);

      if (newProgress !== goal.progress) {
        onUpdate(goal.id, { progress: newProgress });
      }
    },
    [goal.plans, goal.progress, goal.id, planRecords, onUpdate],
  );

  React.useEffect(() => {
    updateGoalProgress();
  }, [planRecords, updateGoalProgress]);

  const handlePlanUpdateInternal = (
    planId: string,
    content: string,
    isCompleted: boolean,
  ) => {
    const currentPlans = goal.plans || [];
    const newPlans = currentPlans.map((p) =>
      p.id === planId ? { ...p, content, isCompleted } : p,
    );

    updateGoalProgress(newPlans);
    onUpdatePlan(goal.id, planId, content, isCompleted);
  };

  const handlePlanDeleteInternal = (planId: string) => {
    onDeletePlan(goal.id, planId);
  };

  const handleCommentAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const content = formData.get("content") as string;

    if (!content.trim()) return;

    onAddComment(goal.id, content);
    form.reset();
  };

  return (
    <SheetContent
      side="bottom"
      className="h-[85vh] sm:max-w-md mx-auto rounded-t-[32px] p-6 flex flex-col border-none shadow-[0_-20px_80px_rgba(0,0,0,0.1)]"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 shrink-0" />

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-8 no-scrollbar">
        <SheetHeader className="text-left">
          {categoryTitle && (
            <span className="text-[10px] font-black text-slate-400 w-fit px-2.5 py-1 rounded-full bg-slate-100 uppercase tracking-widest">
              {categoryTitle}
            </span>
          )}
          <div className="flex justify-between items-start mt-2">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              {goal.title}
              {goal.progress === 100 && (
                <Trophy className="w-6 h-6 text-yellow-500 animate-bounce" />
              )}
              {isOwner && (
                <Dialog
                  open={isEditTitleOpen}
                  onOpenChange={setIsEditTitleOpen}
                >
                  <DialogTrigger asChild>
                    <button
                      className="text-slate-300 hover:text-slate-500 transition-colors ml-1"
                      title="수정"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xs rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>목표 제목 수정</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveTitle();
                      }}
                      className="space-y-4 pt-4"
                    >
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="목표 제목"
                        className="h-12 rounded-xl"
                        autoFocus
                      />
                      <Button type="submit" className="w-full h-12 rounded-xl">
                        저장하기
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </SheetTitle>

            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl max-w-xs">
                  <AlertDialogHeader>
                    <AlertDialogTitle>목표 삭제</AlertDialogTitle>
                    <AlertDialogDescription>
                      정말로 이 목표를 삭제하시겠습니까?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">
                      취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(goal.id)}
                      className="rounded-xl bg-red-500 hover:bg-red-600"
                    >
                      삭제
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <SheetDescription>
            꾸준한 실천으로 목표를 달성해보세요.
          </SheetDescription>
        </SheetHeader>

        {/* Progress & Detail Plans Section */}
        <div className="space-y-6">
          {/* Read-only Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">달성률</label>
              <span className="text-sm font-bold text-primary">
                {goal.plans && goal.plans.length > 0
                  ? `${goal.progress}%`
                  : "-"}
              </span>
            </div>
            <Progress
              value={goal.plans && goal.plans.length > 0 ? goal.progress : 0}
              className="h-2"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">세부 실천 계획</label>

            <div className="space-y-2">
              {goal.plans &&
                goal.plans.map((plan) =>
                  isOwner ? (
                    <PlanItem
                      key={plan.id}
                      plan={plan}
                      records={planRecords.filter((r) => r.planId === plan.id)}
                      onUpdate={handlePlanUpdateInternal}
                      onDelete={handlePlanDeleteInternal}
                      onEditRecurrence={(p) => {
                        setSelectedPlanForRecurrence(p);
                        setRecurrenceModalOpen(true);
                      }}
                      onOpenHistory={(p) => {
                        setSelectedPlanForHistory(p);
                        setHistoryCalendarOpen(true);
                      }}
                      onRecordsChange={onRecordsChange || (() => {})}
                    />
                  ) : (
                    <ReadOnlyPlanItem
                      key={plan.id}
                      plan={plan}
                      records={planRecords.filter((r) => r.planId === plan.id)}
                      onOpenHistory={(p) => {
                        setSelectedPlanForHistory(p);
                        setHistoryCalendarOpen(true);
                      }}
                    />
                  ),
                )}

              {/* Add New Plan Input - Owner Only */}
              {isOwner && (
                <div className="mt-2 px-0.5">
                  <AddPlanForm
                    onSubmit={(content, recurrence) =>
                      onAddPlan(goal.id, content, recurrence)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cheers/Comments Section */}
        <div className="space-y-4 pb-8">
          <h3 className="text-sm font-medium flex items-center gap-2">
            응원
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {(goal.cheers || []).length}
            </span>
          </h3>

          <div className="space-y-3">
            {goal.cheers && goal.cheers.length > 0 ? (
              goal.cheers.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-sm">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {(comment.member_nickname || comment.author || "익명")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/50 p-3 rounded-r-xl rounded-bl-xl flex-1 group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-xs">
                        {comment.member_nickname || comment.author || "익명"}
                      </span>
                      <div className="flex items-center">
                        <span className="text-[10px] text-muted-foreground">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                        {/* Delete Button */}
                        {(comment.member_id === currentUserId ||
                          comment.author === "나") && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="text-slate-300 hover:text-red-500 transition-colors opacity-60 sm:opacity-0 sm:group-hover:opacity-100 ml-2"
                                title="삭제"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl max-w-xs">
                              <AlertDialogHeader>
                                <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  이 댓글을 삭제하시겠습니까?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">
                                  취소
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    onDeleteComment(goal.id, comment.id)
                                  }
                                  className="rounded-xl bg-red-500 hover:bg-red-600"
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                아직 응원 메시지가 없어요.
                <br />첫 번째 응원을 남겨보세요!
              </div>
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleCommentAdd} className="relative mt-2">
            <Input
              name="content"
              placeholder="응원 메시지를 남겨보세요..."
              className="w-full h-10 pr-10"
              required
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-primary"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      <SheetFooter className="mt-auto pt-4 border-t">
        <SheetClose asChild>
          <Button type="button" className="w-full h-12 text-base rounded-xl">
            확인
          </Button>
        </SheetClose>
      </SheetFooter>

      {/* 반복 설정 모달 */}
      {selectedPlanForRecurrence && (
        <RecurrenceSettingsModal
          open={recurrenceModalOpen}
          onOpenChange={setRecurrenceModalOpen}
          initialSettings={
            selectedPlanForRecurrence?.recurrence || {
              type: "none",
              startDate: new Date().toISOString().split("T")[0],
              endDate: `${new Date().getFullYear()}-12-31`,
            }
          }
          initialContent={selectedPlanForRecurrence?.content}
          onSave={(settings, content) => {
            if (selectedPlanForRecurrence) {
              // 내용 변경이 있으면 함께 업데이트
              if (
                content &&
                content !== selectedPlanForRecurrence.content &&
                content.trim()
              ) {
                handlePlanUpdateInternal(
                  selectedPlanForRecurrence.id,
                  content,
                  selectedPlanForRecurrence.isCompleted,
                );
              }

              onUpdatePlanRecurrence(
                goal.id,
                selectedPlanForRecurrence.id,
                settings,
              );
            }
            setRecurrenceModalOpen(false);
            setSelectedPlanForRecurrence(null);
          }}
        />
      )}

      {/* 기록 달력 모달 */}
      {selectedPlanForHistory && (
        <PlanHistoryCalendar
          open={historyCalendarOpen}
          onOpenChange={setHistoryCalendarOpen}
          plan={selectedPlanForHistory!}
          records={
            selectedPlanForHistory
              ? planRecords.filter(
                  (r) => r.planId === selectedPlanForHistory.id,
                )
              : []
          }
          onRecordsChange={onRecordsChange || (() => {})}
          isReadOnly={!isOwner}
        />
      )}
    </SheetContent>
  );
}
