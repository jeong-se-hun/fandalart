"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Goal } from "@/data/goals";
import { Cell } from "./cell";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface BoardProps {
  goals: Goal[];
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onAddGoal: (
    category: Goal["category"],
    title: string,
    slotIndex: number
  ) => void;
  onDeleteGoal: (id: string) => void;
  categoryTitles: Record<string, string>;
  onCategoryRename: (key: string, newName: string) => void;
  mainTitle: string;
  onMainTitleRename: (newName: string) => void;
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
  onGoalClick: (goalId: string) => void;
  currentUserNickname?: string;
  boardOwnerNickname?: string;
}

// Grid Indices for 4x4 (0-15)
// 0  1  | 2  3
// 4  5  | 6  7
// ------+------
// 8  9  | 10 11
// 12 13 | 14 15

// Configuration for mapping categories to specific grid cells.
// mainIndex: The cell closest to the center (Category Title)
// goalIndices: The other 3 cells for specific goals
const CATEGORY_LAYOUT = {
  cat1: {
    mainIndex: 5,
    goalIndices: [0, 1, 4],
    label: "Category 1",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100/50",
  },
  cat2: {
    mainIndex: 6,
    goalIndices: [2, 3, 7],
    label: "Category 2",
    color: "text-sky-600",
    bgColor: "bg-sky-100/50",
  },
  cat3: {
    mainIndex: 9,
    goalIndices: [8, 12, 13],
    label: "Category 3",
    color: "text-amber-600",
    bgColor: "bg-amber-100/50",
  },
  cat4: {
    mainIndex: 10,
    goalIndices: [11, 14, 15],
    label: "Category 4",
    color: "text-rose-600",
    bgColor: "bg-rose-100/50",
  },
} as const;

export function Board({
  goals,
  onUpdate,
  onAddGoal,
  onDeleteGoal,
  categoryTitles,
  onCategoryRename,
  mainTitle,
  onMainTitleRename,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onAddComment,
  onDeleteComment,
  currentUserId,
  onGoalClick,
  currentUserNickname,
  boardOwnerNickname,
}: BoardProps) {
  const [isMainTitleDialogOpen, setIsMainTitleDialogOpen] =
    React.useState(false);

  // Check if current user is the owner of this board
  // Use boardOwnerNickname prop (activeTab) if provided, otherwise fallback to goals[0].owner
  const isOwner =
    currentUserNickname && boardOwnerNickname
      ? currentUserNickname === boardOwnerNickname
      : false;

  // We need to map 16 cells.
  const gridCells = new Array(16).fill(null);

  (Object.keys(CATEGORY_LAYOUT) as Array<keyof typeof CATEGORY_LAYOUT>).forEach(
    (key) => {
      const config = CATEGORY_LAYOUT[key];
      const categoryGoals = goals.filter((g) => g.category === key);

      // 1. Calculate Aggregate Progress for Category Cell
      const totalProgress = categoryGoals.reduce(
        (sum, g) => sum + g.progress,
        0
      );
      const avgProgress =
        categoryGoals.length > 0 ? Math.round(totalProgress / 3) : 0;

      // 2. Assign Category Cell (Main Index)
      // We create a "Virtual" Goal for the category display
      gridCells[config.mainIndex] = {
        type: "CATEGORY",
        title: key, // This is the identifier (cat1, cat2...)
        label: config.label,
        progress: avgProgress,
        color: config.color,
        bgColor: config.bgColor,
        category: key, // needed for color lookups in Cell if we reuse it
      };

      // 3. Assign Goal Cells using slotIndex
      config.goalIndices.forEach((gridIndex, i) => {
        const goalAtSlot = categoryGoals.find((g) => g.slotIndex === i);
        if (goalAtSlot) {
          gridCells[gridIndex] = {
            type: "GOAL",
            ...goalAtSlot,
          };
        } else {
          // Placeholder for empty goal slot - now tracks the specific slot index
          gridCells[gridIndex] = {
            type: "EMPTY_GOAL",
            category: key,
            slotIndex: i,
          };
        }
      });
    }
  );

  return (
    <div className="relative w-full max-w-[720px] mx-auto aspect-[4/5] sm:aspect-square p-2 sm:p-5 bg-white/40 backdrop-blur-xl rounded-[40px] sm:rounded-[48px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60">
      {/* Decorative Radial Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-50/30 pointer-events-none rounded-[48px]" />

      {/* 4x4 Grid */}
      <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full relative z-10">
        {gridCells.map((item, index) => {
          // Wrapper for layout consistency
          const cellContent = (() => {
            if (!item) {
              return (
                <div className="w-full h-full rounded-2xl bg-slate-200/5 border border-slate-100/10" />
              );
            }

            if (item.type === "CATEGORY") {
              const baseStyles =
                "w-full h-full transition-all duration-700 overflow-hidden hover:scale-110 active:scale-95 cursor-pointer p-3 sm:p-4 flex flex-col shadow-xl border border-white/60 z-10 scale-[1.05]";
              const positionStyles = {
                cat1: "rounded-tl-[32px] sm:rounded-tl-[48px] rounded-tr-xl rounded-bl-xl rounded-br-[40px] -translate-x-1 -translate-y-1 items-center text-center bg-gradient-to-br from-emerald-100/40 to-emerald-200/20",
                cat2: "rounded-tr-[32px] sm:rounded-tr-[48px] rounded-tl-xl rounded-br-xl rounded-bl-[40px] translate-x-1 -translate-y-1 items-center text-center bg-gradient-to-bl from-sky-100/40 to-sky-200/20",
                cat3: "rounded-bl-[32px] sm:rounded-bl-[48px] rounded-tl-xl rounded-br-xl rounded-tr-[40px] -translate-x-1 translate-y-1 items-center text-center bg-gradient-to-tr from-amber-100/40 to-amber-200/20",
                cat4: "rounded-br-[32px] sm:rounded-br-[48px] rounded-tr-xl rounded-bl-xl rounded-tl-[40px] translate-x-1 translate-y-1 items-center text-center bg-gradient-to-tl from-rose-100/40 to-rose-200/20",
              };

              const displayTitle = categoryTitles?.[item.title];

              // Category cell design (same for everyone)
              const categoryCellContent = (
                <div
                  className={cn(
                    baseStyles,
                    positionStyles[item.title as keyof typeof positionStyles]
                  )}
                >
                  <div className="flex flex-col h-full w-full py-1">
                    {displayTitle ? (
                      <>
                        <div className="flex-1 flex flex-col justify-center">
                          <span
                            className={cn(
                              "text-[12px] sm:text-[14px] font-black tracking-tight leading-[1.2] drop-shadow-sm line-clamp-2",
                              item.color
                            )}
                          >
                            {displayTitle}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "mt-auto px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-black bg-white/60 backdrop-blur-sm shadow-sm w-fit mx-auto",
                            item.color
                          )}
                        >
                          {item.progress}%
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center w-full h-full">
                        <Plus
                          className={cn(
                            "w-6 h-6 sm:w-8 sm:h-8 opacity-20",
                            item.color
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );

              // Non-owner: same design, no interaction
              if (!isOwner) {
                return (
                  <motion.div
                    key={`cat-wrapper-${item.title}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1.05 }}
                    transition={{ delay: index * 0.05 }}
                    className="w-full h-full"
                  >
                    {categoryCellContent}
                  </motion.div>
                );
              }

              // Owner: with dialog
              return (
                <motion.div
                  key={`cat-wrapper-${item.title}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1.05 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full h-full"
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className={cn(
                          baseStyles,
                          positionStyles[
                            item.title as keyof typeof positionStyles
                          ]
                        )}
                      >
                        <div className="flex flex-col h-full w-full py-1">
                          {displayTitle ? (
                            <>
                              <div className="flex-1 flex flex-col justify-center">
                                <span
                                  className={cn(
                                    "text-[12px] sm:text-[14px] font-black tracking-tight leading-[1.2] drop-shadow-sm line-clamp-2",
                                    item.color
                                  )}
                                >
                                  {displayTitle}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "mt-auto px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-black bg-white/60 backdrop-blur-sm shadow-sm w-fit mx-auto",
                                  item.color
                                )}
                              >
                                {item.progress}%
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center justify-center w-full h-full">
                              <Plus
                                className={cn(
                                  "w-6 h-6 sm:w-8 sm:h-8 opacity-20",
                                  item.color
                                )}
                              />
                            </div>
                          )}
                        </div>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xs rounded-[32px] border-none shadow-2xl backdrop-blur-3xl bg-white/90">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800">
                          카테고리 설정
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const newName = formData.get("name") as string;
                          if (newName && onCategoryRename) {
                            onCategoryRename(item.title, newName);
                          }
                        }}
                        className="space-y-4 pt-6"
                      >
                        <Input
                          name="name"
                          defaultValue={displayTitle}
                          placeholder="카테고리명 입력"
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-center text-lg font-bold focus:ring-indigo-500"
                        />
                        <div className="flex gap-2.5">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                className="flex-1 h-12 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 font-bold transition-colors"
                              >
                                초기화
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold">
                                  카테고리 초기화
                                </AlertDialogTitle>
                                <AlertDialogDescription className="font-medium text-slate-500">
                                  이름을 삭제할까요?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel className="rounded-2xl h-12 border-none bg-slate-100 font-bold">
                                  취소
                                </AlertDialogCancel>
                                <DialogClose asChild>
                                  <AlertDialogAction
                                    onClick={() =>
                                      onCategoryRename(item.title, "")
                                    }
                                    className="rounded-2xl h-12 bg-red-500 hover:bg-red-600 font-bold"
                                  >
                                    확인
                                  </AlertDialogAction>
                                </DialogClose>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <DialogClose asChild>
                            <Button
                              type="submit"
                              className="flex-1 h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold shadow-lg shadow-slate-900/20 transition-all"
                            >
                              저장하기
                            </Button>
                          </DialogClose>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              );
            }

            if (item.type === "EMPTY_GOAL") {
              // Same design for everyone, but only owner can interact
              const emptySlotButton = (
                <div className="w-full h-full rounded-2xl bg-white/20 hover:bg-white border-2 border-dashed border-slate-200/40 hover:border-indigo-200 flex items-center justify-center text-slate-300 hover:text-indigo-400 transition-all duration-300 cursor-pointer group active:scale-90 shadow-sm">
                  <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                </div>
              );

              if (!isOwner) {
                return (
                  <motion.div
                    key={`empty-wrapper-${index}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="w-full h-full"
                  >
                    {emptySlotButton}
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={`empty-wrapper-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="w-full h-full"
                >
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="w-full h-full rounded-2xl bg-white/20 hover:bg-white border-2 border-dashed border-slate-200/40 hover:border-indigo-200 flex items-center justify-center text-slate-300 hover:text-indigo-400 transition-all duration-300 cursor-pointer group active:scale-90 shadow-sm">
                        <Plus className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xs rounded-[32px] border-none shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-black">
                          {categoryTitles?.[item.category] || "-"} 목표 추가
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const title = formData.get("title") as string;
                          if (title && onAddGoal) {
                            onAddGoal(item.category, title, item.slotIndex);
                          }
                        }}
                        className="space-y-4 pt-6"
                      >
                        <Input
                          name="title"
                          placeholder="어떤 목표를 세울까요?"
                          className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-center font-bold text-lg"
                          autoFocus
                        />
                        <DialogClose asChild>
                          <Button
                            type="submit"
                            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20"
                          >
                            생성하기
                          </Button>
                        </DialogClose>
                      </form>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={`goal-wrapper-${item.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="w-full h-full"
              >
                <Cell
                  goal={item}
                  categoryTitle={categoryTitles?.[item.category]}
                  onUpdate={onUpdate}
                  onDelete={onDeleteGoal}
                  onAddPlan={onAddPlan}
                  onUpdatePlan={onUpdatePlan}
                  onDeletePlan={onDeletePlan}
                  onAddComment={onAddComment}
                  onDeleteComment={onDeleteComment}
                  currentUserId={currentUserId}
                  onGoalClick={onGoalClick}
                  currentUserNickname={currentUserNickname}
                  className="bg-white/90 backdrop-blur-sm shadow-md border border-white/80 w-full h-full overflow-hidden"
                />
              </motion.div>
            );
          })();

          return (
            <div key={index} className="w-full h-full">
              {cellContent}
            </div>
          );
        })}
      </div>

      {/* Crystal Square Center Core - Redesigned */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
        {/* Core visual element (same for everyone) */}
        {(() => {
          const coreCellContent = (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.05,
              }}
              className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1 pointer-events-auto group"
            >
              {/* Square Glass Container */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[40px] rounded-[24px] sm:rounded-[32px] shadow-[0_15px_45px_rgba(0,0,0,0.1)] border-[2px] border-white/50 group-hover:border-white group-hover:bg-white/30 transition-all duration-500" />

              {/* Inner Decorative Line */}
              <div className="absolute inset-1.5 sm:inset-2 border border-indigo-500/10 rounded-[18px] sm:rounded-[26px] pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center w-full">
                {mainTitle ? (
                  <span className="text-[10px] sm:text-[12px] font-black leading-[1.3] tracking-tight text-slate-900 drop-shadow-sm px-2 text-center line-clamp-2">
                    {mainTitle}
                  </span>
                ) : (
                  <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-all duration-300">
                    <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500 mb-1" />
                    <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                      CORE
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          );

          // Non-owner: same design, no interaction
          if (!isOwner) {
            return coreCellContent;
          }

          // Owner: with dialog
          return (
            <Dialog
              open={isMainTitleDialogOpen}
              onOpenChange={setIsMainTitleDialogOpen}
            >
              <DialogTrigger asChild>
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: 0.05,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1 cursor-pointer pointer-events-auto group"
                >
                  {/* Square Glass Container */}
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-[40px] rounded-[24px] sm:rounded-[32px] shadow-[0_15px_45px_rgba(0,0,0,0.1)] border-[2px] border-white/50 group-hover:border-white group-hover:bg-white/30 transition-all duration-500" />

                  {/* Inner Decorative Line */}
                  <div className="absolute inset-1.5 sm:inset-2 border border-indigo-500/10 rounded-[18px] sm:rounded-[26px] pointer-events-none" />

                  <div className="relative z-10 flex flex-col items-center w-full">
                    {mainTitle ? (
                      <span className="text-[10px] sm:text-[12px] font-black leading-[1.3] tracking-tight text-slate-900 drop-shadow-sm px-2 text-center line-clamp-2">
                        {mainTitle}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-all duration-300">
                        <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500 mb-1" />
                        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                          CORE
                        </span>
                      </div>
                    )}
                  </div>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xs rounded-[32px] border-none shadow-2xl backdrop-blur-3xl bg-white/90">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black">
                    핵심 목표 수정
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newName = formData.get("name") as string;
                    if (newName && onMainTitleRename) {
                      onMainTitleRename(newName);
                    }
                  }}
                  className="space-y-4 pt-6"
                >
                  <Input
                    name="name"
                    defaultValue={mainTitle}
                    placeholder="나의 핵심 목표는?"
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-center text-lg font-bold"
                  />
                  <div className="flex gap-2.5">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          className="flex-1 h-12 rounded-2xl text-slate-400 font-bold hover:bg-red-50 hover:text-red-500"
                        >
                          초기화
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[32px] border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">
                            목표 초기화
                          </AlertDialogTitle>
                          <AlertDialogDescription className="font-medium">
                            핵심 목표를 삭제할까요?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-2xl h-12 border-none bg-slate-100 font-bold">
                            취소
                          </AlertDialogCancel>
                          <DialogClose asChild>
                            <AlertDialogAction
                              onClick={() => onMainTitleRename("")}
                              className="rounded-2xl h-12 bg-red-500 hover:bg-red-600 font-bold"
                            >
                              확인
                            </AlertDialogAction>
                          </DialogClose>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <DialogClose asChild>
                      <Button
                        type="submit"
                        className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20"
                      >
                        저장하기
                      </Button>
                    </DialogClose>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          );
        })()}
      </div>

      {/* Decorative Background Accents */}
      <div className="absolute inset-0 pointer-events-none -z-10 rounded-[48px] overflow-hidden opacity-40">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100/50 blur-[80px] rounded-full" />
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-sky-100/50 blur-[80px] rounded-full" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-amber-100/50 blur-[80px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-rose-100/50 blur-[80px] rounded-full" />
      </div>
    </div>
  );
}
