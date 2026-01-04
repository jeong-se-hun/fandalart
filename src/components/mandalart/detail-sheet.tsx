"use client";

import * as React from "react";
import { Goal, CheerMessage, DetailPlan } from "@/data/goals";
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

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Trash2, Send, Pencil } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
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
  onAddPlan: (goalId: string, content: string) => void;
  onUpdatePlan: (
    goalId: string,
    planId: string,
    content: string,
    isCompleted: boolean
  ) => void;
  onDeletePlan: (goalId: string, planId: string) => void;
  onAddComment: (goalId: string, content: string) => void;
  onDeleteComment: (goalId: string, commentId: string) => void;
  currentUserId?: string;
  currentUserNickname?: string;
}

// Sub-component for individual plan items
function PlanItem({
  plan,
  onUpdate,
  onDelete,
}: {
  plan: DetailPlan;
  onUpdate: (id: string, newContent: string, isCompleted: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editContent, setEditContent] = React.useState(plan.content);

  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(plan.id, editContent, plan.isCompleted);
      setIsEditOpen(false);
    }
  };

  return (
    <div className="group flex items-center space-x-3 p-3 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
      <input
        type="checkbox"
        checked={plan.isCompleted}
        onChange={(e) => onUpdate(plan.id, plan.content, e.target.checked)}
        className="w-5 h-5 rounded-md border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
      />

      <span
        className={cn(
          "flex-1 text-sm truncate",
          plan.isCompleted &&
            "text-muted-foreground line-through decoration-slate-400"
        )}
      >
        {plan.content}
      </span>

      <div className="flex items-center gap-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <button className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xs rounded-2xl">
            <DialogHeader>
              <DialogTitle>계획 수정</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave} className="w-full">
                저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Alert */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl max-w-xs">
            <AlertDialogHeader>
              <AlertDialogTitle>계획 삭제</AlertDialogTitle>
              <AlertDialogDescription>
                정말로 삭제하시겠습니까?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
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
  onAddComment,
  onDeleteComment,
  currentUserId,
  currentUserNickname,
}: DetailSheetProps) {
  const isOwner = currentUserNickname
    ? goal.owner === currentUserNickname
    : false;
  const [isEditTitleOpen, setIsEditTitleOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(goal.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== goal.title) {
      onUpdate(goal.id, { title: editTitle.trim() });
    }
    setIsEditTitleOpen(false);
  };

  const triggerConfetti = React.useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        zIndex: 9999, // Ensure it's on top of sheet
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        zIndex: 9999,
      });
    }, 250);

    toast.success("축하합니다! 목표를 달성했습니다! 🎉 ", {});
  }, []);

  const handlePlanUpdateInternal = (
    planId: string,
    content: string,
    isCompleted: boolean
  ) => {
    // Calculate progress for confetti check (Optimistic check)
    const currentPlans = goal.plans || [];
    const newPlans = currentPlans.map((p) =>
      p.id === planId ? { ...p, content, isCompleted } : p
    );
    const completedCount = newPlans.filter((p) => p.isCompleted).length;
    const newProgress =
      newPlans.length > 0
        ? Math.round((completedCount / newPlans.length) * 100)
        : 0;

    // Call Parent Handler
    onUpdatePlan(goal.id, planId, content, isCompleted);

    if (newProgress === 100 && goal.progress !== 100 && isCompleted) {
      triggerConfetti();
    }
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
                      onUpdate={handlePlanUpdateInternal}
                      onDelete={handlePlanDeleteInternal}
                    />
                  ) : (
                    // Read-only plan for non-owners
                    <div
                      key={plan.id}
                      className="flex items-center space-x-3 p-3 rounded-xl border bg-card"
                    >
                      <div
                        className={`w-5 h-5 rounded-md border ${
                          plan.isCompleted
                            ? "bg-primary/20 border-primary"
                            : "border-slate-200"
                        } flex items-center justify-center`}
                      >
                        {plan.isCompleted && (
                          <svg
                            className="w-3 h-3 text-primary"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm ${
                          plan.isCompleted
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        {plan.content}
                      </span>
                    </div>
                  )
                )}

              {/* Add New Plan Input - Owner Only */}
              {isOwner && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem(
                      "content"
                    ) as HTMLInputElement;
                    if (!input.value.trim()) return;

                    onAddPlan(goal.id, input.value);
                    input.value = "";
                  }}
                  className="flex gap-2 mt-2 px-0.5"
                >
                  <Input
                    name="content"
                    type="text"
                    placeholder="새로운 실천 계획 추가..."
                    className="flex-1 h-10 rounded-xl"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    className="h-10 rounded-xl px-4"
                  >
                    추가
                  </Button>
                </form>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground mr-1">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleDateString()
                            : ""}
                        </span>
                        {/* Delete Button */}
                        {(comment.member_id === currentUserId ||
                          comment.author === "나") && (
                          <button
                            onClick={() => onDeleteComment(goal.id, comment.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
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
    </SheetContent>
  );
}
