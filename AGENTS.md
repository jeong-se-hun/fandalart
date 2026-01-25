# AGENTS.md - Fandalart Codebase Guide

This document provides coding standards and workflows for AI agents working on the **Fandalart** project - a Next.js-based collaborative goal-tracking application using Supabase.

---

## 🛠️ Build, Lint, and Test Commands

### Available Scripts

```bash
# Development server
npm run dev          # Starts Next.js dev server on http://localhost:3000

# Production build
npm run build        # Creates optimized production build

# Production server
npm start            # Runs production server (requires build first)

# Linting
npm run lint         # Runs ESLint with Next.js config
```

### Testing

**⚠️ IMPORTANT**: This project currently has **NO automated testing setup** (no Jest, Vitest, or Playwright).
- Validation relies on TypeScript for build-time safety
- Manual testing required for all changes
- If adding tests in the future, consider Vitest or Playwright for critical paths (auth, goal creation)

### Running a Single Test

Not applicable - no test framework configured.

---

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main entry point (1300+ lines - handles auth, state, real-time sync)
│   ├── layout.tsx         # Global layout with fonts
│   └── globals.css        # Tailwind imports
├── components/
│   ├── mandalart/         # Domain-specific components
│   │   ├── board.tsx      # 4x4 grid layout and category management
│   │   ├── cell.tsx       # Individual goal cell with circular progress
│   │   ├── detail-sheet.tsx  # Goal details, plans, and comments
│   │   └── dashboard.tsx  # Member dashboard and activity logs
│   └── ui/                # Reusable Radix UI primitives (Button, Dialog, Sheet, etc.)
├── data/
│   ├── goals.ts           # TypeScript interfaces and legacy mock data
│   └── logs.ts            # Activity log interfaces
└── lib/
    ├── supabase.ts        # Supabase client initialization
    └── utils.ts           # Utility functions (cn for className merging)
```

---

## 🎯 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router) with React 19.2.3
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions, PIN-based group access)
- **Styling**: Tailwind CSS v4 with `tailwind-merge` and `clsx`
- **Animations**: Framer Motion for transitions and optimistic UI
- **UI Components**: Radix UI primitives (Dialog, Sheet, Hover Card, etc.)
- **Icons**: Lucide React
- **TypeScript**: Strict mode enabled

---

## 📝 Code Style Guidelines

### 1. Imports

**Path Aliases**: Always use `@/` to reference the `src` directory.

```typescript
// ✅ CORRECT
import { Button } from "@/components/ui/button"
import { Goal } from "@/data/goals"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

// ❌ INCORRECT
import { Button } from "../../components/ui/button"
import { Button } from "src/components/ui/button"
```

**Import Order**: Follow this structure:
1. React imports
2. External libraries (Framer Motion, Radix UI, etc.)
3. Internal components/utilities (using `@/` alias)
4. Type imports (if separate)

```typescript
// Example from board.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Goal } from "@/data/goals";
import { Cell } from "./cell";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
```

### 2. TypeScript Standards

**Strict Mode**: TypeScript strict mode is enabled. Always adhere to it.

```typescript
// ✅ CORRECT - Explicit types
interface BoardProps {
  goals: Goal[];
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  currentUserId?: string;  // Optional props marked explicitly
}

export function Board({ goals, onUpdate, currentUserId }: BoardProps) {
  // ...
}

// ❌ INCORRECT - Implicit any
function updateGoal(id, updates) {  // Missing types
  // ...
}
```

**Never Use Type Suppression**:
```typescript
// ❌ FORBIDDEN - NEVER use these
// @ts-ignore
// @ts-expect-error
value as any
```

### 3. Component Structure

**Client Components**: Almost all UI components require `"use client"` directive (Framer Motion, Radix UI interactions).

```typescript
"use client";

import * as React from "react";
// ... other imports

interface ComponentProps {
  // Props definition
}

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic
}
```

**State Management**: Use React state for local UI state, Supabase for persistent data.

```typescript
// Local state for UI interactions
const [isOpen, setIsOpen] = React.useState(false);

// Supabase for persistent data (from page.tsx)
const [goals, setGoals] = React.useState<Goal[]>([]);
```

### 4. Styling Conventions

**Tailwind CSS**: Use Tailwind utility classes with `cn()` for conditional styling.

```typescript
import { cn } from "@/lib/utils";

// ✅ CORRECT - Using cn() for dynamic classes
<div className={cn(
  "base-classes here",
  condition && "conditional-classes",
  CATEGORY_COLORS[category]
)}>

// ❌ INCORRECT - String concatenation
<div className={`base-classes ${condition ? 'conditional' : ''}`}>
```

**Glassmorphism Design Pattern**: This project uses a premium glassmorphism aesthetic.

```typescript
// Typical glassmorphism pattern used throughout
className="bg-white/40 backdrop-blur-xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60"
```

**Responsive Design**: Mobile-first with `sm:` breakpoints.

```typescript
// Mobile-first sizing
className="text-[9px] sm:text-[11px] w-20 sm:w-24"
```

### 5. Naming Conventions

**Files**: 
- Components: `kebab-case.tsx` (e.g., `detail-sheet.tsx`)
- Utilities: `kebab-case.ts` (e.g., `utils.ts`)

**Components**: `PascalCase`
```typescript
export function Board() {}
export function DetailSheet() {}
```

**Variables/Functions**: `camelCase`
```typescript
const isOwner = true;
const handleOpenChange = (open: boolean) => {};
```

**Constants**: `SCREAMING_SNAKE_CASE`
```typescript
const CATEGORY_LAYOUT = { ... };
const PROGRESS_COLORS = { ... };
```

**Interfaces**: `PascalCase` (no `I` prefix)
```typescript
// ✅ CORRECT
interface Goal { ... }
interface BoardProps { ... }

// ❌ INCORRECT
interface IGoal { ... }
```

### 6. Error Handling

**Async Operations**: Always use try-catch for Supabase operations.

```typescript
// ✅ CORRECT
try {
  const { data, error } = await supabase
    .from('goals')
    .insert(newGoal);
  
  if (error) throw error;
  
  // Handle success
} catch (error) {
  console.error("목표 저장 실패:", error);
  alert("목표를 저장하는 중 오류가 발생했습니다.");
}

// ❌ INCORRECT - No error handling
const { data } = await supabase.from('goals').insert(newGoal);
```

**Environment Variables**: Graceful degradation for missing env vars.

```typescript
// From supabase.ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Please check .env.local");
}

// Prevent crash with placeholder values
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);
```

### 7. Optimistic UI Pattern (Critical)

**Always update local state before Supabase operations** for snappy UX.

```typescript
// ✅ CORRECT - Optimistic update pattern
const handleAddGoal = async (category: string, title: string) => {
  const newGoal = { id: crypto.randomUUID(), category, title, progress: 0 };
  
  // 1. Update local state immediately (optimistic)
  setGoals((prev) => [...prev, newGoal]);
  
  // 2. Then sync to Supabase
  try {
    const { error } = await supabase.from('goals').insert(newGoal);
    if (error) throw error;
  } catch (error) {
    // 3. Rollback on failure
    setGoals((prev) => prev.filter(g => g.id !== newGoal.id));
    alert("Failed to save goal");
  }
};

// ❌ INCORRECT - Wait for database before UI update
const { data } = await supabase.from('goals').insert(newGoal);
setGoals((prev) => [...prev, data]);  // Slow, janky UX
```

### 8. History Management

Custom history handling for sheet navigation (not Next.js routing).

```typescript
// Opening a sheet - push history state
history.pushState({ sheet: "goal-detail", goalId: goal.id }, "");

// Closing a sheet - go back
if (history.state?.sheet === "goal-detail") {
  history.back();
}
```

---

## 🚫 Anti-Patterns (DO NOT DO)

1. **Never use type suppression**: No `as any`, `@ts-ignore`, or `@ts-expect-error`
2. **Never use inline styles**: Always use Tailwind classes
3. **Never use string concatenation for classes**: Always use `cn()` helper
4. **Never skip error handling**: All Supabase operations must have try-catch
5. **Never use `alert()` for success messages**: Use `sonner` toast library (currently minimal usage, but preferred)
6. **Never commit `.env.local`**: Already in `.gitignore`

---

## 🔧 ESLint Configuration

The project uses Next.js ESLint config with TypeScript support:
- Config: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

---

## 📌 Key Architectural Patterns

1. **Slot-based Goal Placement**: Each category has 3 goal slots (0, 1, 2). Goals are placed in specific `slotIndex` positions.
2. **Real-time Sync**: Supabase `postgres_changes` channels listen for updates from other members.
3. **PIN-based Access**: Custom authentication using `localStorage` and a `groups` table (no Supabase Auth).
4. **Circular Progress**: SVG-based progress rings calculated from completed plans percentage.

---

## 🎨 Design Philosophy

- **Mobile-First**: All components optimized for mobile with `sm:` breakpoints for desktop
- **Glassmorphism**: High transparency, backdrop blur, subtle borders for premium feel
- **Lotus Layout**: Category cells arranged like flower petals around central core
- **Text Optimization**: All goal text limited to 2 lines with ellipsis (`line-clamp-2`)

---

## 📦 Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚀 When Making Changes

1. **Read existing patterns**: This codebase is disciplined. Follow established conventions strictly.
2. **Use LSP diagnostics**: Run `lsp_diagnostics` on changed files before completion.
3. **Test manually**: No automated tests - verify changes in browser.
4. **Check TypeScript**: Run `npm run build` to catch type errors.
5. **Optimistic updates**: Always update UI before database operations.
6. **Mobile-first**: Test responsive behavior on small screens.

---

**Last Updated**: 2026-01-14  
**Project**: Fandalart (Family & Friends Mandalart)  
**Version**: v0.1.0
