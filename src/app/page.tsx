"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Goal } from "@/data/goals";
import { Board } from "@/components/mandalart/board";
import { Dashboard } from "@/components/mandalart/dashboard";
import { Toaster } from "@/components/ui/sonner";
import { Home as HomeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// MEMBERS mock data removed. We will fetch from DB.
export type Member = {
  id: string;
  nickname: string;
  avatar_url?: string;
  order: number;
};

type TabType = string | "전체";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { supabase } from "@/lib/supabase";

export default function Home() {
  // isAuthenticated: null = checking, false = not logged in, true = logged in
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  );
  // ... (rest of the code)

  const [isLoading, setIsLoading] = React.useState(false);

  const [loginError, setLoginError] = React.useState("");
  const [members, setMembers] = React.useState<Member[]>([]);
  const [myProfile, setMyProfile] = React.useState<Member | null>(null); // Current User Profile
  const [showProfileSelector, setShowProfileSelector] = React.useState(false); // Toggle for Profile Selection Screen

  // Function to fetch members
  const fetchMembers = React.useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .eq("group_id", groupId)
      .order("order", { ascending: true });

    if (data) {
      setMembers(data);
    }
  }, []);

  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);

  // Check Local Storage on Mount (Auto Login Logic)
  React.useEffect(() => {
    const savedGroupId = localStorage.getItem("fandalart_group_id");
    const savedMemberId = localStorage.getItem("fandalart_member_id");

    if (savedGroupId) {
      // 1. Fetch group members first
      fetchMembers(savedGroupId).then(() => {
        if (savedMemberId) {
          // 2. Verified member login
          supabase
            .from("members")
            .select("*")
            .eq("id", savedMemberId)
            .single()
            .then(({ data }) => {
              if (data) {
                setMyProfile(data);
                setIsAuthenticated(true);
                setShowProfileSelector(false);
                setActiveTab("전체");
              } else {
                // Invalid member ID
                setIsAuthenticated(true);
                setShowProfileSelector(true);
              }
            });
        } else {
          // 3. No member ID -> Show Profile Selector
          setIsAuthenticated(true);
          setShowProfileSelector(true);
        }
      });
    } else {
      // No saved group, show login screen
      setIsAuthenticated(false);
    }
  }, [fetchMembers]);

  const [activeTab, setActiveTab] = React.useState<TabType>("전체");
  const [goals, setGoals] = React.useState<Goal[]>([]);

  interface LogItem {
    id: string;
    user: string;
    type: "create" | "cheer" | "achievement" | "update";
    message: string;
    timestamp: string;
  }
  const [logs, setLogs] = React.useState<LogItem[]>([]);

  // Fetch Logs
  const fetchLogs = React.useCallback(async (groupId: string) => {
    const { data } = await supabase
      .from("logs")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setLogs(
        data.map((log) => ({
          id: log.id,
          user: log.member_nickname,
          type:
            log.action_type === "CREATE"
              ? "create"
              : log.action_type === "CHEER"
              ? "cheer"
              : log.action_type === "COMPLETE"
              ? "achievement"
              : "update",
          message: log.target_title || "Updated",
          timestamp: log.created_at,
        }))
      );
    }
  }, []);

  // Fetch Goals from Supabase
  const fetchGoals = React.useCallback(async (groupId: string) => {
    // Join with members to get owner nickname if needed, but we store member_id in goals.
    // We need to map member_id to nickname or owner string.

    // First get members map for quick lookup
    const { data: membersData } = await supabase
      .from("members")
      .select("id, nickname")
      .eq("group_id", groupId);

    const memberMap = new Map(membersData?.map((m) => [m.id, m.nickname]));

    const { data: goalsData } = await supabase
      .from("goals")
      .select(
        `
        *,
        plans (*),
        comments (*)
      `
      )
      .in("member_id", Array.from(memberMap.keys()));

    if (goalsData) {
      // Supabase returns nested arrays for joins
      // We manually cast because Supabase types might imply single object or array depending on relationship
      interface SupabaseGoalRaw {
        id: string;
        member_id: string;
        type: "GOAL" | "CATEGORY";
        category: "cat1" | "cat2" | "cat3" | "cat4" | "main";
        slot_index: number;
        title: string | null;
        progress: number;
        plans: { id: string; content: string; is_completed: boolean }[];
        comments: {
          id: string;
          member_id: string;
          content: string;
          created_at: string;
          writer?: string; // Legacy support if needed
        }[];
        last_viewed_at: string;
      }

      const rawGoals = goalsData as unknown as SupabaseGoalRaw[];

      const formattedGoals: Goal[] = rawGoals
        .filter((g) => g.type !== "CATEGORY") // Exclude category title rows
        .map((g) => ({
          id: g.id,
          owner: memberMap.get(g.member_id) || "Unknown",
          // The Goal interface expects specific category strings.
          // In DB we might have 'main' for category titles, but here we are filtering for GOAL type.
          // Assuming GOAL type only has cat1-4.
          category: g.category as Goal["category"],
          slotIndex: g.slot_index,
          title: g.title || "",
          progress: g.progress || 0,
          plans: g.plans.map((p) => ({
            id: p.id,
            content: p.content,
            isCompleted: p.is_completed,
          })),
          cheers:
            g.comments?.map((c) => ({
              id: c.id,
              content: c.content,
              createdAt: c.created_at,
              member_id: c.member_id,
              member_nickname: memberMap.get(c.member_id) || "Unknown",
              author: memberMap.get(c.member_id) || c.writer || "Unknown",
            })) || [],
          lastViewedAt: g.last_viewed_at,
        }));
      setGoals(formattedGoals);

      // Extract Category/Main Titles
      const categoryGoals = rawGoals.filter((g) => g.type === "CATEGORY");
      const mainTitles: Record<string, string> = {};
      const catTitles: Record<string, Record<string, string>> = {};

      categoryGoals.forEach((g) => {
        const owner = memberMap.get(g.member_id);
        if (!owner) return;

        if (g.category === "main") {
          mainTitles[owner] = g.title || "";
        } else {
          if (!catTitles[owner]) catTitles[owner] = {};
          catTitles[owner][g.category] = g.title || "";
        }
      });

      setMemberMainTitles(mainTitles);
      setMemberCategoryTitles(catTitles);
    }
  }, []);

  // Fetch goals when authenticated
  React.useEffect(() => {
    const groupId = localStorage.getItem("fandalart_group_id");
    if (isAuthenticated && groupId) {
      fetchGoals(groupId);
      fetchLogs(groupId);
    }
  }, [isAuthenticated, fetchGoals, fetchLogs]);

  const activeMemberGoals = React.useMemo(() => {
    if (activeTab === "전체") return [];
    return goals.filter((g) => g.owner === activeTab);
  }, [goals, activeTab]);

  const handleGoalClick = async (goalId: string) => {
    if (!myProfile) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    // Only update if I am the owner
    if (goal.owner !== myProfile.nickname) return;

    // Optimistic Update
    const now = new Date().toISOString();
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, lastViewedAt: now } : g))
    );

    try {
      await supabase
        .from("goals")
        .update({ last_viewed_at: now })
        .eq("id", goalId);
    } catch {
      console.error("Failed to update read status");
    }
  };

  const handleGoalUpdate = async (id: string, updates: Partial<Goal>) => {
    // Optimistic Update
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );

    // DB Update
    try {
      await supabase
        .from("goals")
        .update({
          title: updates.title,
          progress: updates.progress,
        })
        .eq("id", id);
    } catch {
      console.error("Failed to update goal");
    }
  };

  const handleAddGoal = async (
    category: Goal["category"],
    title: string,
    slotIndex: number
  ) => {
    if (!myProfile) return;

    // Optimistic ID (temp)
    const tempId = Math.random().toString(36).substr(2, 9);
    const newGoal: Goal = {
      id: tempId,
      owner: myProfile.nickname,
      category,
      slotIndex,
      title,
      progress: 0,
      plans: [],
      cheers: [],
    };
    setGoals((prev) => [...prev, newGoal]);

    // DB Insert
    try {
      const { data } = await supabase
        .from("goals")
        .insert({
          member_id: myProfile.id,
          type: "GOAL",
          category,
          slot_index: slotIndex,
          title,
          progress: 0,
        })
        .select()
        .single();

      if (data) {
        // Replace temp ID with real ID
        setGoals((prev) =>
          prev.map((g) => (g.id === tempId ? { ...g, id: data.id } : g))
        );

        // Add Log
        const groupId = localStorage.getItem("fandalart_group_id");
        if (groupId) {
          await supabase.from("logs").insert({
            group_id: groupId,
            member_nickname: myProfile.nickname,
            action_type: "CREATE",
            target_title: `'${title}' 목표를 추가했습니다.`,
          });
          // Refresh logs
          fetchLogs(groupId);
        }
      }
    } catch {
      alert("목표 저장 실패");
    }
  };

  const [memberCategoryTitles, setMemberCategoryTitles] = React.useState<
    Record<string, Record<string, string>>
  >({});

  const currentCategoryTitles = React.useMemo(() => {
    if (activeTab === "전체") return {};
    return (
      memberCategoryTitles[activeTab] || {
        cat1: "",
        cat2: "",
        cat3: "",
        cat4: "",
      }
    );
  }, [memberCategoryTitles, activeTab]);

  const handleCategoryRename = async (key: string, newName: string) => {
    if (activeTab === "전체" || !myProfile) return;

    // Optimistic
    setMemberCategoryTitles((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || { cat1: "", cat2: "", cat3: "", cat4: "" }),
        [key]: newName,
      },
    }));

    // DB Insert/Update (Upsert)
    // First, find if exists
    try {
      // We need to find the goal entry that represents this category title
      const { data: existing } = await supabase
        .from("goals")
        .select("id")
        .eq("member_id", myProfile.id)
        .eq("type", "CATEGORY")
        .eq("category", key)
        .single();

      if (existing) {
        await supabase
          .from("goals")
          .update({ title: newName })
          .eq("id", existing.id);
      } else {
        await supabase.from("goals").insert({
          member_id: myProfile.id,
          type: "CATEGORY",
          category: key,
          title: newName,
        });
      }
    } catch {
      console.error("Failed to rename category");
    }
  };

  const [memberMainTitles, setMemberMainTitles] = React.useState<
    Record<string, string>
  >({});

  const currentMainTitle = React.useMemo(() => {
    if (activeTab === "전체") return "";
    return memberMainTitles[activeTab] || "";
  }, [memberMainTitles, activeTab]);

  const handleMainTitleRename = async (newName: string) => {
    if (activeTab === "전체" || !myProfile) return;

    setMemberMainTitles((prev) => ({
      ...prev,
      [activeTab]: newName,
    }));

    try {
      const { data: existing } = await supabase
        .from("goals")
        .select("id")
        .eq("member_id", myProfile.id)
        .eq("type", "CATEGORY")
        .eq("category", "main")
        .single();

      if (existing) {
        await supabase
          .from("goals")
          .update({ title: newName })
          .eq("id", existing.id);
      } else {
        await supabase.from("goals").insert({
          member_id: myProfile.id,
          type: "CATEGORY",
          category: "main",
          title: newName,
        });
      }
    } catch {
      console.error("Main title save failures");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    try {
      await supabase.from("goals").delete().eq("id", id);
    } catch {
      alert("Delete failed");
    }
  };

  // Comment Handlers
  const handleAddComment = async (goalId: string, content: string) => {
    if (!myProfile) return;

    // Optimistic
    const tempId = crypto.randomUUID();
    const newComment = {
      id: tempId,
      goal_id: goalId,
      member_id: myProfile.id,
      content,
      created_at: new Date().toISOString(),
      member_nickname: myProfile.nickname, // Optimistic field
    };

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, cheers: [...(g.cheers || []), newComment] }
          : g
      )
    );

    // DB
    try {
      const { data } = await supabase
        .from("comments")
        .insert({
          goal_id: goalId,
          member_id: myProfile.id,
          content,
        })
        .select(`*, members(nickname)`)
        .single();

      if (data && data.members) {
        const realComment = {
          ...data,
          member_nickname: data.members.nickname,
        };

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;
            const updatedCheers = (g.cheers || []).map((c) =>
              c.id === tempId ? realComment : c
            );
            return { ...g, cheers: updatedCheers };
          })
        );

        // Add Log (CHEER)
        const groupId = localStorage.getItem("fandalart_group_id");
        const targetGoal = goals.find((g) => g.id === goalId);
        if (groupId && targetGoal) {
          await supabase.from("logs").insert({
            group_id: groupId,
            member_nickname: myProfile.nickname,
            action_type: "CHEER",
            target_title: `${targetGoal.owner}님의 '${targetGoal.title}' 목표에 응원 메시지를 남겼습니다.`,
          });
          fetchLogs(groupId); // Refresh logs
        }
      }
    } catch {
      console.error("Comment add failed");
    }
  };

  const handleDeleteComment = async (goalId: string, commentId: string) => {
    // Optimistic
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, cheers: (g.cheers || []).filter((c) => c.id !== commentId) }
          : g
      )
    );

    // DB
    try {
      await supabase.from("comments").delete().eq("id", commentId);
    } catch {
      console.error("Comment delete failed");
    }
  };

  // Plan Handlers
  const handleAddPlan = async (goalId: string, content: string) => {
    // Optimistic
    const tempPlanId = crypto.randomUUID();
    const newPlan = {
      id: tempPlanId,
      content,
      isCompleted: false,
      goal_id: goalId,
    };

    let newProgress = 0;

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedPlans = [...(g.plans || []), newPlan];
        const completedCount = updatedPlans.filter((p) => p.isCompleted).length;
        newProgress = Math.round((completedCount / updatedPlans.length) * 100);
        return { ...g, plans: updatedPlans, progress: newProgress };
      })
    );

    // DB
    try {
      const { data } = await supabase
        .from("plans")
        .insert({
          goal_id: goalId,
          content,
          is_completed: false,
        })
        .select()
        .single();

      if (data) {
        // Replace temp ID and ensure consistency
        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== goalId) return g;
            const updatedPlans =
              g.plans?.map((p) =>
                p.id === tempPlanId ? { ...p, id: data.id } : p
              ) || [];
            return { ...g, plans: updatedPlans };
          })
        );

        // Update Goal Progress in DB
        await supabase
          .from("goals")
          .update({ progress: newProgress })
          .eq("id", goalId);
      }
    } catch {
      console.error("Plan add failed");
    }
  };

  const handleUpdatePlan = async (
    goalId: string,
    planId: string,
    content: string,
    isCompleted: boolean
  ) => {
    // Optimistic
    let newProgress = 0;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedPlans =
          g.plans?.map((p) =>
            p.id === planId ? { ...p, content, isCompleted } : p
          ) || [];
        const completedCount = updatedPlans.filter((p) => p.isCompleted).length;
        newProgress = Math.round((completedCount / updatedPlans.length) * 100);
        return { ...g, plans: updatedPlans, progress: newProgress };
      })
    );

    // DB
    try {
      await supabase
        .from("plans")
        .update({ content, is_completed: isCompleted })
        .eq("id", planId);
      await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId);

      // Add Log (COMPLETE)
      if (isCompleted) {
        const groupId = localStorage.getItem("fandalart_group_id");
        const targetGoal = goals.find((g) => g.id === goalId);
        if (groupId && targetGoal && myProfile) {
          // 1. Log Plan Completion (More specific)
          await supabase.from("logs").insert({
            group_id: groupId,
            member_nickname: myProfile.nickname,
            action_type: "COMPLETE",
            target_title: `'${targetGoal.title}' 목표의 '${content}' 를 달성했습니다!`,
          });

          // 2. Log Goal 100% Achievement (If applicable)
          if (newProgress === 100) {
            await supabase.from("logs").insert({
              group_id: groupId,
              member_nickname: myProfile.nickname,
              action_type: "ACHIEVEMENT",
              target_title: `'${targetGoal.title}' 목표를 100% 달성했습니다! 🎉`,
            });
          }

          fetchLogs(groupId);
        }
      }
    } catch {
      console.error("Plan update failed");
    }
  };

  const handleDeletePlan = async (goalId: string, planId: string) => {
    // Optimistic
    let newProgress = 0;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedPlans = g.plans?.filter((p) => p.id !== planId) || [];
        const completedCount = updatedPlans.filter((p) => p.isCompleted).length;
        newProgress =
          updatedPlans.length > 0
            ? Math.round((completedCount / updatedPlans.length) * 100)
            : 0;
        return { ...g, plans: updatedPlans, progress: newProgress };
      })
    );

    // DB
    try {
      await supabase.from("plans").delete().eq("id", planId);
      await supabase
        .from("goals")
        .update({ progress: newProgress })
        .eq("id", goalId);
    } catch {
      console.error("Plan delete failed");
    } finally {
      // Log Goal 100% Achievement (If delete caused 100%)
      if (newProgress === 100) {
        const groupId = localStorage.getItem("fandalart_group_id");
        const targetGoal = goals.find((g) => g.id === goalId);
        if (groupId && targetGoal && myProfile) {
          try {
            await supabase.from("logs").insert({
              group_id: groupId,
              member_nickname: myProfile.nickname,
              action_type: "ACHIEVEMENT",
              target_title: `'${targetGoal.title}' 목표를 100% 달성했습니다! 🎉`,
            });
            fetchLogs(groupId);
          } catch {
            // ignore log error
          }
        }
      }
    }
  };

  const isDashboard = activeTab === "전체";

  // 0. Loading State (Checking Auth)
  if (isAuthenticated === null) {
    return <div className="min-h-[100dvh] bg-[#fcfaf8]" />;
  }

  // 1. Password Gate View (Not Authenticated)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf8] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background Decorative */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-indigo-50/50 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-slate-100/40 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
              Fandalart
            </h1>
            <p className="text-slate-400 font-bold text-xs tracking-[0.35em] uppercase opacity-80">
              SECRET ACCESS
            </p>
          </div>

          <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 text-center">
                <h3 className="text-lg font-bold text-slate-800">
                  입장 코드를 입력하세요
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  공유받은 입장 코드를 입력해주세요
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsLoading(true);
                  setLoginError("");
                  const formData = new FormData(e.currentTarget);
                  const password = formData.get("password") as string;

                  try {
                    const { data, error } = await supabase
                      .from("groups")
                      .select("id, name")
                      .eq("password", password)
                      .single();

                    if (error || !data) {
                      throw new Error("Invalid password");
                    }

                    // Success
                    localStorage.setItem("fandalart_group_id", data.id);
                    localStorage.setItem("fandalart_group_name", data.name);

                    await fetchMembers(data.id);
                    setIsAuthenticated(true); // Passed password gate
                    setShowProfileSelector(true); // Go to Profile Selection
                  } catch {
                    setLoginError("입장 코드가 올바르지 않습니다.");
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <Input
                  type="password"
                  name="password"
                  placeholder="PIN CODE"
                  className="h-14 rounded-2xl border-slate-200 bg-white/50 text-center text-xl font-black tracking-[0.5em] focus:ring-indigo-500/20"
                  autoFocus
                  maxLength={4}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-lg font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                >
                  {isLoading ? "확인 중..." : "입장하기"}
                </Button>
                {loginError && (
                  <p className="text-center text-xs font-bold text-rose-500 animate-pulse">
                    {loginError}
                  </p>
                )}
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. Profile Selection View (Authenticated but Identity Unknown)
  if (showProfileSelector) {
    return (
      <div className="min-h-[100dvh] bg-[#fcfaf8] flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background Decorative */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-indigo-50/50 blur-[120px] rounded-full" />
          <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-slate-100/40 blur-[100px] rounded-full" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tighter">
              프로필을 선택해주세요
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  localStorage.setItem("fandalart_member_id", member.id);
                  setMyProfile(member);
                  setShowProfileSelector(false);
                  setActiveTab(member.nickname);
                }}
                className="bg-white/60 hover:bg-white backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-center space-y-2 group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-full mx-auto flex items-center justify-center group-hover:scale-110 transition-transform text-2xl">
                  👤
                </div>
                <div className="font-bold text-slate-800">
                  {member.nickname}
                </div>
              </button>
            ))}

            {/* Create New Profile Button */}
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                <button className="bg-white/40 hover:bg-white/60 backdrop-blur-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-4 transition-all text-center space-y-2 group flex flex-col items-center justify-center min-h-[120px]">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors">
                    <span className="text-xl font-bold text-slate-400 group-hover:text-indigo-500">
                      +
                    </span>
                  </div>
                  <div className="font-bold text-slate-400 group-hover:text-indigo-500">
                    새 구성원 추가
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>새로운 멤버 추가</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const nickname = formData.get("nickname") as string;
                    // Modified handleAddMember to handle auto-login
                    const handleAddAndLogin = async (nick: string) => {
                      if (!nick.trim()) return;
                      const groupId =
                        localStorage.getItem("fandalart_group_id");
                      if (!groupId) return;
                      try {
                        const { data, error } = await supabase
                          .from("members")
                          .insert({
                            group_id: groupId,
                            nickname: nick.trim(),
                            order: members.length,
                          })
                          .select()
                          .single();

                        if (error) throw error;
                        if (data) {
                          setMembers((prev) => [...prev, data]);
                          // Auto Select & Login
                          localStorage.setItem("fandalart_member_id", data.id);
                          setMyProfile(data);
                          setShowProfileSelector(false);
                          setActiveTab(data.nickname);
                          setIsAddMemberOpen(false);
                        }
                      } catch {
                        alert("오류가 발생했습니다.");
                      }
                    };
                    handleAddAndLogin(nickname);
                  }}
                  className="space-y-4 pt-4"
                >
                  <Input
                    name="nickname"
                    placeholder="닉네임 (예: 아빠, 김대리)"
                    autoFocus
                    required
                    className="text-center text-lg h-12"
                  />
                  <Button type="submit" className="w-full h-12 text-lg">
                    시작하기
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="text-slate-400 text-xs hover:text-slate-600 underline"
            >
              입장 코드 다시 입력하기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#fcfaf8] flex flex-col items-center py-6 px-4 font-sans selection:bg-black/10 overflow-x-hidden relative">
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Background Decorative Element */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[80%] h-[50%] bg-indigo-50/50 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] left-[-10%] w-[60%] h-[40%] bg-slate-100/40 blur-[100px] rounded-full" />
      </div>

      {/* Header - Re-centered & Reverted Subtitle */}
      <header className="w-full max-w-4xl mb-8 relative flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1.5 cursor-pointer group active:scale-95 transition-transform"
          onClick={() => setActiveTab("전체")}
        >
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
            Fandalart
          </h1>
          <p className="text-slate-400 font-bold text-xs tracking-[0.35em] flex items-center justify-center gap-2 uppercase opacity-80">
            <span className="w-6 h-[1px] bg-slate-200" />
            WISH & GROW
            <span className="w-6 h-[1px] bg-slate-200" />
          </p>
        </motion.div>
      </header>

      {/* Navigation Tabs - Floating Glass Style */}
      <div className="w-fit max-w-[calc(100vw-32px)] sm:max-w-md mx-auto sticky top-4 z-50 mb-4">
        <div className="flex items-center bg-white/70 backdrop-blur-2xl rounded-full border border-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.06)] p-1">
          {/* Fixed Home Button */}
          <button
            onClick={() => setActiveTab("전체")}
            className="relative z-10 w-10 h-10 flex items-center justify-center transition-all rounded-full focus:outline-none cursor-pointer group"
          >
            {activeTab === "전체" && (
              <motion.div
                layoutId="pill"
                className="absolute inset-0 bg-slate-900 rounded-full -z-10 shadow-lg shadow-slate-900/10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <HomeIcon
              className={cn(
                "w-4 h-4 transition-colors",
                activeTab === "전체"
                  ? "text-white"
                  : "text-slate-400 group-hover:text-slate-600"
              )}
            />
          </button>

          <div className="w-[1px] h-4 bg-slate-200/60 mx-1" />

          {/* Scrollable Member List */}
          <div className="relative flex-1 overflow-hidden h-10">
            <div className="flex overflow-x-auto no-scrollbar scroll-smooth px-1 gap-1 items-center h-full">
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setActiveTab(member.nickname)}
                  className="relative z-10 shrink-0 px-4 py-2 text-xs font-black transition-all rounded-full focus:outline-none cursor-pointer whitespace-nowrap h-8 flex items-center justify-center"
                >
                  {activeTab === member.nickname && (
                    <motion.div
                      layoutId="pill"
                      className="absolute inset-0 bg-white shadow-md border border-slate-100 rounded-full -z-10"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span
                    className={cn(
                      "transition-colors duration-300",
                      activeTab === member.nickname
                        ? "text-slate-900"
                        : "text-slate-400"
                    )}
                  >
                    {member.nickname}
                  </span>
                </button>
              ))}

              {/* Add Member Button - Only visible if authorized */}
              {/* Add Member Button */}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full max-w-4xl flex-1 flex flex-col items-center justify-start pb-20">
        <AnimatePresence mode="wait">
          {isDashboard ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <Dashboard
                goals={goals}
                members={members.map((m) => m.nickname)}
                onMemberClick={(member) => setActiveTab(member as TabType)}
                logs={logs || []}
                onProfileSwitch={() => {
                  localStorage.removeItem("fandalart_member_id");
                  setMyProfile(null);
                  setShowProfileSelector(true);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="board-view"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-center"
            >
              <div className="w-full max-w-3xl px-2">
                <Board
                  goals={activeMemberGoals}
                  onUpdate={handleGoalUpdate}
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                  categoryTitles={currentCategoryTitles}
                  onCategoryRename={handleCategoryRename}
                  mainTitle={currentMainTitle}
                  onMainTitleRename={handleMainTitleRename}
                  onAddPlan={handleAddPlan}
                  onUpdatePlan={handleUpdatePlan}
                  onDeletePlan={handleDeletePlan}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  currentUserId={myProfile?.id}
                  onGoalClick={handleGoalClick}
                  currentUserNickname={myProfile?.nickname}
                  boardOwnerNickname={activeTab}
                />

                {/* Individual Summary - Detailed & Refined */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-10 w-full max-w-[720px] mx-auto"
                >
                  <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">
                          Overall Progress
                        </span>
                        <h4 className="text-[14px] font-bold text-slate-900">
                          {activeTab}님의 목표 달성 현황
                        </h4>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-4xl font-black text-slate-900 tracking-tighter">
                          {Math.round(
                            activeMemberGoals.reduce(
                              (acc, g) => acc + g.progress,
                              0
                            ) / 12
                          )}
                        </span>
                        <span className="text-sm font-black text-indigo-500">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-black/[0.03]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.round(
                            activeMemberGoals.reduce(
                              (acc, g) => acc + g.progress,
                              0
                            ) / 12
                          )}%`,
                        }}
                        transition={{
                          duration: 1,
                          ease: "easeOut",
                          delay: 0.7,
                        }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full"
                      />
                    </div>

                    {/* Category Breakdown - Refining "세분화" */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {["cat1", "cat2", "cat3", "cat4"].map((catKey) => {
                        const catTitle = currentCategoryTitles[catKey] || "-";
                        const catGoals = activeMemberGoals.filter(
                          (g) => g.category === catKey
                        );
                        const progress =
                          catGoals.length > 0
                            ? Math.round(
                                catGoals.reduce((a, b) => a + b.progress, 0) / 3
                              )
                            : 0;

                        return (
                          <div
                            key={catKey}
                            className="bg-white/40 rounded-2xl p-3 border border-white/60 space-y-2"
                          >
                            <div className="flex justify-between items-center px-0.5">
                              <span className="text-[10px] font-black text-slate-500 truncate max-w-[60px]">
                                {catTitle}
                              </span>
                              <span className="text-[10px] font-black text-indigo-500">
                                {progress}%
                              </span>
                            </div>
                            <div className="h-1 bg-slate-200/50 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-slate-900 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
