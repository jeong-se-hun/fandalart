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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  RecurrenceType,
  RecurrenceSettings,
  WeeklyMode,
  MonthlyMode,
} from "@/data/goals";

interface RecurrenceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings?: RecurrenceSettings;
  onSave: (settings: RecurrenceSettings | null) => void;
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export function RecurrenceSettingsModal({
  open,
  onOpenChange,
  initialSettings,
  onSave,
}: RecurrenceSettingsModalProps) {
  // 올해 마지막 날 계산
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  // 상태
  const [type, setType] = React.useState<RecurrenceType>(
    initialSettings?.type || "none",
  );
  const [startDate, setStartDate] = React.useState(
    initialSettings?.startDate ||
      (() => {
        const d = new Date();
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split("T")[0];
      })(),
  );
  const [endDate, setEndDate] = React.useState(
    initialSettings?.endDate || yearEnd,
  );

  // 주간 설정
  const [weeklyMode, setWeeklyMode] = React.useState<WeeklyMode>(
    initialSettings?.weeklyMode || "times",
  );
  const [timesPerWeek, setTimesPerWeek] = React.useState(
    initialSettings?.timesPerWeek || 3,
  );
  const [weekdays, setWeekdays] = React.useState<number[]>(
    initialSettings?.weekdays || [1, 3, 5], // 월, 수, 금
  );

  // 월간 설정
  const [monthlyMode, setMonthlyMode] = React.useState<MonthlyMode>(
    initialSettings?.monthlyMode || "times",
  );
  const [timesPerMonth, setTimesPerMonth] = React.useState(
    initialSettings?.timesPerMonth || 2,
  );
  const [monthDays, setMonthDays] = React.useState<number[]>(
    initialSettings?.monthDays || [1, 15],
  );
  const [monthDayInput, setMonthDayInput] = React.useState(
    initialSettings?.monthDays?.join(", ") || "1, 15",
  );

  // 요일 토글
  const toggleWeekday = (day: number) => {
    if (weekdays.includes(day)) {
      setWeekdays(weekdays.filter((d) => d !== day));
    } else {
      setWeekdays([...weekdays, day].sort());
    }
  };

  // 저장
  const handleSave = () => {
    if (type === "none") {
      onSave(null);
      onOpenChange(false);
      return;
    }

    // 시작일/종료일 필수 검증
    if (!startDate || !endDate) {
      alert("시작일과 종료일을 모두 입력해주세요.");
      return;
    }

    const settings: RecurrenceSettings = {
      type,
      startDate,
      endDate,
    };

    if (type === "weekly") {
      settings.weeklyMode = weeklyMode;
      if (weeklyMode === "times") {
        settings.timesPerWeek = timesPerWeek;
      } else {
        settings.weekdays = weekdays;
      }
    }

    if (type === "monthly") {
      settings.monthlyMode = monthlyMode;
      if (monthlyMode === "times") {
        settings.timesPerMonth = timesPerMonth;
      } else {
        // 일자 파싱
        const days = monthDayInput
          .split(",")
          .map((s) => parseInt(s.trim()))
          .filter((n) => !isNaN(n) && n >= 1 && n <= 31)
          .sort((a, b) => a - b);
        settings.monthDays = days.length > 0 ? days : [1];
      }
    }

    onSave(settings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ 반복 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 반복 유형 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">반복 유형</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as RecurrenceType)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="cursor-pointer">
                  반복 안 함
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily" className="cursor-pointer">
                  매일
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">
                  매주
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  매월
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 주간 세부 설정 */}
          {type === "weekly" && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <RadioGroup
                value={weeklyMode}
                onValueChange={(v) => setWeeklyMode(v as WeeklyMode)}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="times" id="weekly-times" />
                    <Label htmlFor="weekly-times" className="cursor-pointer">
                      횟수
                    </Label>
                  </div>
                  {weeklyMode === "times" && (
                    <div className="flex items-center gap-2 pl-6">
                      <span className="text-sm">주</span>
                      <Input
                        type="number"
                        min={1}
                        max={7}
                        value={timesPerWeek}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setTimesPerWeek(Math.min(7, Math.max(1, val)));
                        }}
                        className="w-16 h-8"
                      />
                      <span className="text-sm">회 (최대 7회)</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="days" id="weekly-days" />
                    <Label htmlFor="weekly-days" className="cursor-pointer">
                      특정 요일
                    </Label>
                  </div>
                  {weeklyMode === "days" && (
                    <div className="flex gap-1 pl-6">
                      {DAY_NAMES.map((name, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleWeekday(index)}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                            weekdays.includes(index)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80",
                          )}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 월간 세부 설정 */}
          {type === "monthly" && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <RadioGroup
                value={monthlyMode}
                onValueChange={(v) => setMonthlyMode(v as MonthlyMode)}
                className="space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="times" id="monthly-times" />
                    <Label htmlFor="monthly-times" className="cursor-pointer">
                      횟수
                    </Label>
                  </div>
                  {monthlyMode === "times" && (
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">월</span>
                        <Input
                          type="number"
                          min={1}
                          max={28}
                          value={timesPerMonth}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setTimesPerMonth(Math.min(28, Math.max(1, val)));
                          }}
                          className="w-16 h-8"
                        />
                        <span className="text-sm">회 (최대 28회)</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        * 횟수 모드: 해당 월 내 아무 날짜나 체크 가능
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dates" id="monthly-dates" />
                    <Label htmlFor="monthly-dates" className="cursor-pointer">
                      특정 일자
                    </Label>
                  </div>
                  {monthlyMode === "dates" && (
                    <div className="pl-6">
                      <Input
                        placeholder="1, 15, 28"
                        value={monthDayInput}
                        onChange={(e) => setMonthDayInput(e.target.value)}
                        className="h-8"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        쉼표로 구분 (예: 1, 15)
                      </p>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>
          )}

          {/* 기간 설정 */}
          {type !== "none" && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">기간 설정</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    시작일
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    종료일 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
