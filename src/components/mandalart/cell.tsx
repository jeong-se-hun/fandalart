"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Goal } from "@/data/goals";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { DetailSheet } from "./detail-sheet";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CellProps {
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
  className?: string; // For positioning or overrides
  onGoalClick?: (goalId: string) => void;
  currentUserNickname?: string;
}

const CATEGORY_COLORS = {
  cat1: "bg-emerald-50 hover:bg-emerald-100 text-emerald-900",
  cat2: "bg-sky-50 hover:bg-sky-100 text-sky-900",
  cat3: "bg-amber-50 hover:bg-amber-100 text-amber-900",
  cat4: "bg-rose-50 hover:bg-rose-100 text-rose-900",
};

const PROGRESS_COLORS = {
  cat1: "text-emerald-500",
  cat2: "text-sky-500",
  cat3: "text-amber-500",
  cat4: "text-rose-500",
};

export function Cell({
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
  className,
  onGoalClick,
  currentUserNickname,
}: CellProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle browser back button to close sheet
  React.useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Only close sheet if we're currently open and the new state is not a sheet state
      if (isOpen && e.state?.sheet !== "goal-detail") {
        setIsOpen(false);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isOpen]);

  // Track if we pushed a history entry for this sheet
  const historyPushedRef = React.useRef(false);

  // Handle sheet open/close with history
  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Sheet is opening - add history entry
      history.pushState({ sheet: "goal-detail", goalId: goal.id }, "");
      historyPushedRef.current = true;
      setIsOpen(true);
      if (onGoalClick) {
        onGoalClick(goal.id);
      }
    } else {
      // Sheet is closing (via X button, overlay click, etc.)
      setIsOpen(false);
      // Only go back if we pushed a history entry and current state is our sheet
      if (historyPushedRef.current && history.state?.sheet === "goal-detail") {
        historyPushedRef.current = false;
        history.back();
      }
    }
  };

  // Circular Progress Logic
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const hasPlans = goal.plans && goal.plans.length > 0;
  const currentProgress = hasPlans ? goal.progress : 0;
  const offset = circumference - (currentProgress / 100) * circumference;

  // Check for unread comments
  const hasUnreadComments = React.useMemo(() => {
    if (!goal.cheers || goal.cheers.length === 0) return false;
    if (!currentUserId) return false;

    // If I'm not the owner, I don't need to see red dots for my own unread status (unless maybe I want to see replies?)
    // Requirement: "Owner sees red dot when others comment".
    // Also: "Don't show red dot for my own comments".

    const lastViewed = goal.lastViewedAt
      ? new Date(goal.lastViewedAt).getTime()
      : 0;

    return goal.cheers.some((comment) => {
      // 1. Comment is not written by me
      const isMyComment = comment.member_id === currentUserId;
      if (isMyComment) return false;

      // 2. Comment is newer than last viewed time
      const commentTime = comment.createdAt
        ? new Date(comment.createdAt).getTime()
        : 0;
      return commentTime > lastViewed;
    });
  }, [goal.cheers, goal.lastViewedAt, currentUserId]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <motion.button
          whileHover={{ scale: 0.98 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative w-full h-full p-1 flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer border border-transparent hover:border-black/5 overflow-hidden",
            CATEGORY_COLORS[goal.category],
            className
          )}
        >
          {/* Circular Progress */}
          {/* Circular Progress */}
          <div className="relative w-10 h-10 sm:w-14 sm:h-14 mb-1.5 sm:mb-2.5 flex-none flex items-center justify-center">
            {/* Background Circle */}
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 64 64"
            >
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-black/5"
              />
              {/* Progress Circle */}
              <motion.circle
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeOut" }}
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeLinecap="round"
                className={PROGRESS_COLORS[goal.category]}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              {goal.progress === 100 && goal.plans && goal.plans.length > 0 ? (
                <Check
                  className={cn(
                    "w-4 h-4 sm:w-6 sm:h-6",
                    PROGRESS_COLORS[goal.category]
                  )}
                />
              ) : (
                <span className="text-[9px] sm:text-xs font-bold opacity-50">
                  {goal.plans && goal.plans.length > 0
                    ? `${goal.progress}%`
                    : "-"}
                </span>
              )}
            </div>
          </div>
          <span className="text-[9px] sm:text-[11px] font-bold text-center leading-tight block w-full line-clamp-2 px-0.5 break-keep">
            {goal.title}
          </span>

          {hasUnreadComments && (
            <div className="absolute top-2 right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse shadow-sm" />
          )}
        </motion.button>
      </SheetTrigger>

      <DetailSheet
        goal={goal}
        categoryTitle={categoryTitle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddPlan={onAddPlan}
        onUpdatePlan={onUpdatePlan}
        onDeletePlan={onDeletePlan}
        onAddComment={onAddComment}
        onDeleteComment={onDeleteComment}
        currentUserId={currentUserId}
        currentUserNickname={currentUserNickname}
      />
    </Sheet>
  );
}
