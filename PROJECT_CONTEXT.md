# Fandalart (Family & Friends Mandalart)

## 📋 프로젝트 개요

**Fandalart**는 가족이나 친구들과 함께 꿈을 공유하고 성장하는 과정을 시각화하는 **소셜 만다라트 서비스**입니다. 만다라트 기법을 활용하여 하나의 핵심 목표와 이를 달성하기 위한 카테고리별 세부 목표를 관리하며, 멤버 간의 달성률 공유 및 응원 기능을 제공합니다.

## 🚀 기술 스택

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **UI Components**: Radix UI (Sheet, Dialog, AlertDialog, Progress 등), Lucide React (Icons)
- **State Management**: React State (현재 frontend v1 마감 단계, Supabase 연동 예정)

## 📂 프로젝트 구조

```text
src/
├── app/
│   ├── page.tsx          # 메인 페이지 (글로벌 상태 관리 및 레이아웃 배치)
│   └── layout.tsx        # 글로벌 폰트 및 스타일 설정
├── components/
│   ├── mandalart/        # 핵심 비즈니스 컴포넌트
│   │   ├── board.tsx     # 4x4 만다라트 보드 메인 로직 및 레이아웃
│   │   ├── cell.tsx      # 개별 목표 셀 (진척도 표시 및 시트 트리거)
│   │   ├── detail-sheet.tsx # 목표 상세 정보 및 실천 계획/응원 관리
│   │   └── dashboard.tsx # 멤버 대시보드 및 활동 로그
│   └── ui/               # 디자인 시스템을 위한 기본 컴포넌트 (Shadcn UI 기반)
├── data/
│   ├── goals.ts          # 목표(Goal) 인터페이스 및 Mock 데이터
│   └── logs.ts           # 활동 로그(ActivityLog) 인터페이스 및 Mock 데이터
└── lib/
    └── utils.ts          # 스타일 합성을 위한 유틸리티 (cn)
```

## 💎 핵심 디자인 및 기능 명세

1. **만다라트 보드 디자인**

   - **Crystal Core**: 중앙의 정사각형 유리(Glassmorphism) 스타일 버튼으로 메인 타이틀을 관리합니다.
   - **Lotus Layout**: 카테고리가 중앙 코어를 감싸는 꽃잎 형태의 배치를 가집니다.
   - **Glassmorphism**: 높은 투명도, 블러 효과(`backdrop-blur`), 세밀한 경계선(`border-white/50`)을 사용하여 프리미엄 감성을 구현했습니다.

2. **목표 관리 로직**

   - **Slot 기반 배치**: 각 카테고리당 3개의 목표를 가질 수 있으며, 유저가 클릭한 정확한 위치(slotIndex)에 목표가 배치됩니다.
   - **텍스트 최적화**: 모든 목표 텍스트는 최대 2줄로 제한되며, 길어질 경우 말줄임표(...) 처리가 되어 레이아웃을 유지합니다.

3. **요약 시스템 (Detailed Summary)**

   - 보드 하단에는 전체 달성률과 함께 카테고리별 세부 달성 현황을 미니 프로그레스 바 형태로 제공합니다.

4. **모바일 퍼스트 UX**
   - 모바일 환경을 고려한 하단 슬라이딩 시트(Bottom Sheet) 인터페이스와 터치 피드백 애니메이션(Scale up/down)이 적용되어 있습니다.

## 🛠 현재 상태 및 향후 과제

- **현재**: 프론트엔드 UI/UX 개발 1차 마감. Mock 데이터를 활용한 모든 인터랙션 구현 완료.
- **다음 단계**:
  - **Supabase 연동**: 실시간 데이터 저장 및 Auth 기능 구현.
  - **멤버 초대**: 보드 공유 기능을 위한 백엔드 로직 연동.
  - **이미지 저장**: html-to-image 등을 활용한 보드 공유 기능 추가.
