import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Goal } from "@/data/goals";
import { Trophy, Heart, Pencil, Sparkles, Check } from "lucide-react";

interface Log {
  id: string;
  user: string;
  type: string;
  message: string;
  timestamp: string;
}

interface DashboardProps {
  goals: Goal[];
  members: readonly string[];
  onMemberClick: (member: string) => void;
  logs: Log[];
  onProfileSwitch?: () => void;
}

export function Dashboard({
  goals,
  members,
  onMemberClick,
  logs,
  onProfileSwitch,
}: DashboardProps) {
  const memberStats = React.useMemo(() => {
    return members.map((member) => {
      const memberGoals = goals.filter((g) => g.owner === member);
      const totalProgress = Math.round(
        memberGoals.reduce((acc, g) => acc + g.progress, 0) / 12
      );

      return {
        name: member,
        progress: totalProgress,
      };
    });
  }, [goals, members]);

  const globalProgress = Math.round(
    memberStats.reduce((acc, stat) => acc + stat.progress, 0) / members.length
  );

  const getLogIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "achievement":
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case "cheer":
        return <Heart className="w-4 h-4 text-pink-500" />;
      case "create":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "complete":
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <Pencil className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="w-full max-w-lg mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Global Progress Header - Minimalist */}
        <section className="px-2 pt-4">
          <div className="bg-white/40 backdrop-blur-xl rounded-[32px] border border-white/60 p-8 shadow-[0_8px_32px_rgba(31,38,135,0.03)] space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Collective Goal
                </span>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                  전체 목표 달성률
                </h3>
              </div>
              <span className="text-4xl font-black text-slate-900 tracking-tighter">
                {globalProgress}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-slate-100/50 overflow-hidden shadow-inner ring-1 ring-slate-200/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${globalProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              />
            </div>
          </div>
        </section>

        {/* Profile Switch Button */}
        {onProfileSwitch && (
          <section className="px-2 -mt-6">
            <button
              onClick={onProfileSwitch}
              className="w-full bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 py-3 shadow-[0_4px_16px_rgba(31,38,135,0.03)] hover:bg-white/60 transition-all cursor-pointer group"
            >
              <span className="text-xs text-slate-400 group-hover:text-slate-600 font-medium transition-colors">
                프로필 전환
              </span>
            </button>
          </section>
        )}

        {/* Member Cards Grid - Refined Glassmorphism */}
        <section className="grid grid-cols-2 gap-4 px-2">
          {memberStats.map((stat) => (
            <Card
              key={stat.name}
              className="group relative overflow-hidden bg-white/40 backdrop-blur-3xl border border-white/70 shadow-[0_8px_32px_rgba(31,38,135,0.05)] hover:shadow-[0_12px_44px_rgba(31,38,135,0.12)] active:scale-95 transition-all duration-500 cursor-pointer rounded-[28px]"
              onClick={() => onMemberClick(stat.name)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardContent className="p-6 flex flex-col items-center justify-between space-y-4 relative z-10 min-h-[150px]">
                <div className="flex-1 flex items-center justify-center w-full">
                  <h3 className="font-bold text-lg text-slate-800 tracking-tight text-center group-hover:text-indigo-600 transition-colors">
                    {stat.name}
                  </h3>
                </div>

                <div className="w-full space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      Progress
                    </span>
                    <span className="text-sm font-black text-slate-900">
                      {stat.progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100/50 rounded-full overflow-hidden ring-1 ring-black/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.progress}%` }}
                      className="h-full bg-slate-800 rounded-full group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500 transition-all duration-500 ease-out"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Activity Logs - Minimalist Timeline Style */}
        <section className="px-2 pb-12">
          <div className="bg-white/30 backdrop-blur-md rounded-[32px] border border-white/70 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                <span className="p-2 bg-indigo-50 rounded-xl">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </span>
                최근 활동
              </h3>
            </div>
            <ScrollArea className="h-[320px] w-full pr-4">
              <div className="relative space-y-8 pl-1">
                {/* Thin Vertical Line */}
                <div className="absolute left-[17px] top-2 bottom-4 w-[1px] bg-slate-100" />

                {logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="relative flex gap-5 group">
                      <div className="relative z-10 w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-indigo-100 group-hover:shadow-md transition-all duration-300">
                        {getLogIcon(log.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-sm text-slate-800 truncate pr-2">
                            {log.user}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-tighter">
                            {new Date(log.timestamp).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "long",
                                day: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              }
                            )}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter ml-auto">
                            {/* Layout spacer if needed, or remove */}
                          </span>
                        </div>
                        <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl rounded-tl-none border border-white/60 group-hover:bg-white/80 transition-colors">
                          <p className="text-xs text-slate-600 leading-relaxed font-medium">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    아직 활동 기록이 없습니다.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>
    </div>
  );
}
