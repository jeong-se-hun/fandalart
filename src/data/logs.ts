export interface ActivityLog {
  id: string;
  type: "achievement" | "cheer" | "update" | "create";
  user: string;
  message: string;
  timestamp: string; // ISO string
  goalId?: string;
  targetUser?: string; // For cheers
}

export const MOCK_LOGS: ActivityLog[] = [
  {
    id: "l1",
    type: "create",
    user: "멤버 1",
    message: "새로운 목표를 설정하고 성장을 시작했습니다! 🚀",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "l2",
    type: "update",
    user: "멤버 2",
    message: "목표의 세부 계획을 수립했습니다.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];
