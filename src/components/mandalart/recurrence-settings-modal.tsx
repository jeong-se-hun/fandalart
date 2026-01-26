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
import { toast } from "sonner";
import { RecurrenceType, RecurrenceSettings } from "@/data/goals";

interface RecurrenceSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialSettings?: RecurrenceSettings;
  initialContent?: string;
  onSave: (settings: RecurrenceSettings | null, content?: string) => void;
}

export function RecurrenceSettingsModal({
  open,
  onOpenChange,
  initialSettings,
  initialContent,
  onSave,
}: RecurrenceSettingsModalProps) {
  // 올해 마지막 날 계산
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  // 상태
  const [content, setContent] = React.useState(initialContent || "");
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
  // ... (rest of states remain same, just ensure handleSave uses 'content')

  // (States for weekly/monthly settings omitted here for brevity, assume they exist as before)
  const [endDate, setEndDate] = React.useState(
    initialSettings?.endDate || yearEnd,
  );

  const [timesPerWeek, setTimesPerWeek] = React.useState(
    initialSettings?.timesPerWeek || 3,
  );

  const [timesPerMonth, setTimesPerMonth] = React.useState(
    initialSettings?.timesPerMonth || 2,
  );

  // 저장
  const handleSave = () => {
    if (!content.trim()) {
      toast.warning("계획 내용을 입력해주세요.");
      return;
    }

    if (type === "none") {
      onSave(null, content);
      onOpenChange(false);
      return;
    }

    // 시작일/종료일 필수 검증
    if (!startDate || !endDate) {
      toast.warning("시작일과 종료일을 모두 입력해주세요.");
      return;
    }

    const settings: RecurrenceSettings = {
      type,
      startDate,
      endDate,
    };

    if (type === "weekly") {
      settings.weeklyMode = "times";
      // 저장 시 범위 제한 (1~7)
      settings.timesPerWeek = Math.min(7, Math.max(1, timesPerWeek));
    }

    if (type === "monthly") {
      settings.monthlyMode = "times";
      // 저장 시 범위 제한 (1~28)
      settings.timesPerMonth = Math.min(28, Math.max(1, timesPerMonth));
    }

    onSave(settings, content);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚙️ 계획 설정
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 계획 내용 수정 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">계획 내용</Label>
            <Input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="예: 매일 물 마시기"
            />
          </div>
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
              <div className="flex items-center gap-2">
                <span className="text-sm">주</span>
                <Input
                  type="number"
                  min={1}
                  max={7}
                  value={timesPerWeek || ""}
                  onChange={(e) => {
                    // 입력 중에는 자유롭게 하되, 저장 시 검증
                    const val = parseInt(e.target.value);
                    if (isNaN(val)) setTimesPerWeek(0);
                    else setTimesPerWeek(val);
                  }}
                  className="w-16 h-8 text-black"
                />
                <span className="text-sm text-black">회 반복 (최대 7회)</span>
              </div>
            </div>
          )}

          {/* 월간 세부 설정 */}
          {type === "monthly" && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <div className="flex items-center gap-2">
                <span className="text-sm">월</span>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={timesPerMonth || ""}
                  onChange={(e) => {
                    // 입력 중에는 자유롭게 하되, 저장 시 검증
                    const val = parseInt(e.target.value);
                    if (isNaN(val)) setTimesPerMonth(0);
                    else setTimesPerMonth(val);
                  }}
                  className="w-16 h-8 text-black"
                />
                <span className="text-sm text-black">회 반복 (최대 28회)</span>
              </div>
            </div>
          )}

          {/* 기간 설정 */}
          {type !== "none" && (
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">기간 설정</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    시작일 <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
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
