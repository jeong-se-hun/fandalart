export interface DetailPlan {
  id: string;
  content: string;
  isCompleted: boolean;
}

export interface CheerMessage {
  id: string;
  author?: string;
  content: string;
  createdAt?: string;

  // Additions
  member_id?: string;
  member_nickname?: string;
}

export interface Goal {
  id: string;
  owner: string;
  category: "cat1" | "cat2" | "cat3" | "cat4";
  slotIndex: number;
  title: string;
  progress: number;
  cheers?: CheerMessage[];
  plans?: DetailPlan[];
  lastViewedAt?: string;
}

export const GOALS: Goal[] = [
  // 멤버 1
  {
    id: "1",
    owner: "멤버 1",
    category: "cat1",
    slotIndex: 0,
    title: "아침 공복 조깅 30분",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "2",
    owner: "멤버 1",
    category: "cat1",
    slotIndex: 1,
    title: "영양제 매일 섭취",
    progress: 60,
    cheers: [],
    plans: [],
  },
  {
    id: "3",
    owner: "멤버 1",
    category: "cat1",
    slotIndex: 2,
    title: "일 1만보 걷기",
    progress: 40,
    cheers: [],
    plans: [],
  },
  {
    id: "4",
    owner: "멤버 1",
    category: "cat2",
    slotIndex: 0,
    title: "주식 우량주 매수",
    progress: 80,
    cheers: [],
    plans: [],
  },
  {
    id: "5",
    owner: "멤버 1",
    category: "cat2",
    slotIndex: 1,
    title: "가계부 매일 기록",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "6",
    owner: "멤버 1",
    category: "cat2",
    slotIndex: 2,
    title: "비상금 500만원 마련",
    progress: 20,
    cheers: [],
    plans: [],
  },
  {
    id: "7",
    owner: "멤버 1",
    category: "cat3",
    slotIndex: 0,
    title: "기타 기초 코드 연습",
    progress: 50,
    cheers: [],
    plans: [],
  },
  {
    id: "8",
    owner: "멤버 1",
    category: "cat3",
    slotIndex: 1,
    title: "한 달에 책 2권 읽기",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "9",
    owner: "멤버 1",
    category: "cat3",
    slotIndex: 2,
    title: "매일 일기 쓰기",
    progress: 30,
    cheers: [],
    plans: [],
  },
  {
    id: "10",
    owner: "멤버 1",
    category: "cat4",
    slotIndex: 0,
    title: "부모님께 안부 전화",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "11",
    owner: "멤버 1",
    category: "cat4",
    slotIndex: 1,
    title: "친구 생일 챙기기",
    progress: 80,
    cheers: [],
    plans: [],
  },
  {
    id: "12",
    owner: "멤버 1",
    category: "cat4",
    slotIndex: 2,
    title: "멘토링 참여",
    progress: 10,
    cheers: [],
    plans: [],
  },
  // 멤버 2
  {
    id: "13",
    owner: "멤버 2",
    category: "cat1",
    slotIndex: 0,
    title: "주 3회 웨이트",
    progress: 70,
    cheers: [],
    plans: [],
  },
  {
    id: "14",
    owner: "멤버 2",
    category: "cat1",
    slotIndex: 1,
    title: "설탕 줄이기",
    progress: 20,
    cheers: [],
    plans: [],
  },
  {
    id: "15",
    owner: "멤버 2",
    category: "cat1",
    slotIndex: 2,
    title: "필라테스 등록",
    progress: 0,
    cheers: [],
    plans: [],
  },
  {
    id: "16",
    owner: "멤버 2",
    category: "cat2",
    slotIndex: 0,
    title: "청약 저축 매달 납입",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "17",
    owner: "멤버 2",
    category: "cat2",
    slotIndex: 1,
    title: "부수입 50만원 도전",
    progress: 40,
    cheers: [],
    plans: [],
  },
  {
    id: "18",
    owner: "멤버 2",
    category: "cat2",
    slotIndex: 2,
    title: "포트폴리오 다각화",
    progress: 10,
    cheers: [],
    plans: [],
  },
  {
    id: "19",
    owner: "멤버 2",
    category: "cat3",
    slotIndex: 0,
    title: "코딩 공부 매일 1시간",
    progress: 90,
    cheers: [],
    plans: [],
  },
  {
    id: "20",
    owner: "멤버 2",
    category: "cat3",
    slotIndex: 1,
    title: "블로그 포스팅 주 1회",
    progress: 60,
    cheers: [],
    plans: [],
  },
  {
    id: "21",
    owner: "멤버 2",
    category: "cat3",
    slotIndex: 2,
    title: "유튜브 영상 제작",
    progress: 0,
    cheers: [],
    plans: [],
  },
  {
    id: "22",
    owner: "멤버 2",
    category: "cat4",
    slotIndex: 0,
    title: "주말 봉사활동 참여",
    progress: 50,
    cheers: [],
    plans: [],
  },
  {
    id: "23",
    owner: "멤버 2",
    category: "cat4",
    slotIndex: 1,
    title: "팀 미팅 주도",
    progress: 100,
    cheers: [],
    plans: [],
  },
  {
    id: "24",
    owner: "멤버 2",
    category: "cat4",
    slotIndex: 2,
    title: "새로운 온라인 커뮤니티 가입",
    progress: 10,
    cheers: [],
    plans: [],
  },
];
