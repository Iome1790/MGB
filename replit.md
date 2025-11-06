# Overview

CashWatch is a React-based web application designed for users to earn cryptocurrency by interacting with advertisements. It offers a gamified experience, including daily streaks, a multi-level referral program, and cryptocurrency withdrawal functionalities. The platform aims to provide an engaging and user-friendly method for cryptocurrency earning, built on a modern full-stack architecture with dynamically configurable settings via an admin dashboard.

# Recent Changes (November 6, 2025)

## Telegram Bot Admin Panel Updates
- Updated welcome message for admin users to show "⚙️ Admin Control Panel" instead of regular welcome message
- Replaced multiple inline buttons with 3 clean admin buttons:
  - 🕓 Pending Withdrawal
  - 📢 Advertise
  - 🔄 Refresh
- Removed hardcoded admin ID from `client/src/hooks/useAdmin.ts`
- Admin authentication now uses `ADMIN_ID` or `TELEGRAM_ADMIN_ID` environment variable
- Updated `server/telegram.ts` to check admin status using environment variable instead of hardcoded value

## Environment Variables Required
- `ADMIN_ID` or `TELEGRAM_ADMIN_ID`: Telegram user ID for admin access
- `VITE_ADMIN_ID`: Frontend environment variable for admin panel access (should match backend ADMIN_ID)

## MGB to TON Conversion Rate Update
- Updated conversion rate from 10,000,000 MGB = 1 TON to 5,000,000 MGB = 1 TON
- This means 500,000 MGB = 0.1 TON
- Admin settings now display minimum withdrawal in MGB instead of TON for clarity
- Backend continues to store values in TON for precision, with automatic conversion to/from MGB in the UI

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
*   **Frameworks**: React with TypeScript, Vite.
*   **Routing**: Wouter.
*   **State Management**: TanStack Query.
*   **UI/UX**: shadcn/ui, Radix UI, Tailwind CSS, custom CSS for theming (light/dark mode), Framer Motion for animations. Features a diamond-themed UI with a cyan and silver palette, frosted glass cards, glow effects, and sparkle animations.
*   **Forms**: React Hook Form with Zod validation.
*   **Navigation**: Curved bottom navigation and a top-left hamburger menu with Lucide React icons.
*   **Anti-Cheat**: Implemented a 3-second minimum ad watch time to prevent fast claiming.
*   **Wallet Activity**: Dedicated page for displaying transaction history with status indicators.
*   **Leaderboard**: Monthly leaderboards for PAD earners and referrers, with user rank display.

## Backend
*   **Runtime**: Node.js with Express.js.
*   **Database ORM**: Drizzle ORM with PostgreSQL.
*   **API**: RESTful API with JSON responses.
*   **Session Management**: Express sessions with PostgreSQL store.
*   **Telegram Bot**: Integration for admin controls, broadcasts, and user notifications.
*   **Security**: Parameterized queries, device tracking for multi-account prevention.

## Authentication & Authorization
*   **Provider**: Replit OAuth (OpenID Connect).
*   **Session Strategy**: Server-side sessions with secure HTTP-only cookies.
*   **Authorization**: Middleware-based route protection.
*   **User Management**: Automatic user creation/updates, device ID-based multi-account prevention.

## Data Storage
*   **Primary Database**: PostgreSQL.
*   **Schema Management**: Drizzle migrations.
*   **Key Entities**: Users (balance, streaks, referrals), Earnings, Withdrawals, Referral relationships, Sessions, Advertiser Tasks, Task Clicks.

## Business Logic
*   **Ad Watching System**: Users earn PAD per ad with cooldowns and minimum watch time. Rewards dynamically pulled from admin settings; notifications display actual MGB amount earned. Backend increments adsWatched and adsWatchedToday counters, synchronized with frontend stats.
*   **Gamification**: Spin & Win system and Daily Streak rewards.
*   **Referral Program**: Multi-level commission on referred users' ad earnings.
*   **Withdrawal System**: MGB-based withdrawals (1 TON = 5,000,000 MGB internally, or 500,000 MGB = 0.1 TON), minimum friend invite requirement, admin approval, TON wallet address validation (UQ/EQ prefix, 48 characters).
*   **Currency System**: Earnings and tasks displayed as PAD (1 TON = 100,000 PAD internally). Withdrawals are exclusively in MGB. Internal database storage uses TON for precision.
*   **Admin Controls**: Comprehensive settings for affiliate commission, wallet change fees, minimum withdrawal, task rewards, task creation cost, balance conversion, and broadcast functionality.
*   **Task System**: Users can create tasks (e.g., join Telegram channels) with strict Telegram link validation (only https://t.me/ or t.me/ links allowed). Invalid links are rejected before TON/PDZ deduction to prevent user balance loss.

# External Dependencies

## Core Infrastructure
*   **Database**: Neon PostgreSQL serverless.
*   **Authentication**: Replit OAuth/OIDC.
*   **Session Storage**: `connect-pg-simple`.
*   **Telegram Bot API**: `node-telegram-bot-api`.

## Frontend Libraries
*   **UI**: Radix UI, Tailwind CSS.
*   **State Management**: TanStack Query.
*   **Form Management**: React Hook Form, Zod.
*   **Date Handling**: `date-fns`.
*   **Animations**: Framer Motion.

## Ad Integration
*   **Ad Provider**: External advertisement service integrated via the global window object.