# Overview

CashWatch is a React-based web application designed for users to earn cryptocurrency by interacting with advertisements. It offers a gamified experience, including daily streaks, a multi-level referral program, and cryptocurrency withdrawal functionalities. The platform aims to provide an engaging and user-friendly method for cryptocurrency earning, built on a modern full-stack architecture with dynamically configurable settings via an admin dashboard.

# Recent Changes (November 7, 2025)

## GitHub Import Setup & Reward System Fixes (November 7, 2025 - Latest)
- **Replit Environment Setup Completed**:
  - Installed all Node.js dependencies via npm
  - Configured development workflow on port 5000 with webview
  - Server running successfully with all database migrations applied
  - Vite dev server configured with proper host settings (0.0.0.0, allowedHosts: true)
- **Completely Removed Channel Join Verification**:
  - Deleted `/api/streak/check-membership` endpoint from `server/routes.ts`
  - Removed all channel verification logic from `/api/streak/claim` endpoint
  - Users now receive rewards directly without needing to join Telegram channels
  - Simple flow: Start Task → Check → Reward Credit (no verification)
- **Fixed Hardcoded Task Rewards to Use Admin Settings**:
  - Changed `TASK_CONFIG` in `server/storage.ts` from static constant to dynamic method `getTaskConfig()`
  - Daily task rewards now fetched from `reward_per_ad` admin setting instead of hardcoded 0.00033000 TON
  - When admin updates `reward_per_ad` in admin panel, all new daily tasks use that value
  - Conversion: reward_per_ad (MGB) / 5,000,000 = reward in TON
- **Verified Default Fallback Values**:
  - `reward_per_ad` default: 1000 MGB (used only if admin setting not configured)
  - `task_per_click_reward` default: 0.0001750 TON = 875 MGB (for advertiser tasks)
  - `task_reward_pad` default: 200 (display padding, not actual reward amount)
- **Deployment Configuration**:
  - Configured deployment target as `vm` for stateful bot application
  - Build command: `npm run build`
  - Start command: `npm start`

## Telegram Bot Withdrawal Display Fixes (November 7, 2025)
- **Fixed Withdrawal Double Amount Bug**: 
  - Updated new withdrawal notification in `server/routes.ts` to display correct MGB amount instead of using undefined variable
  - Fixed line 3863 to use `newWithdrawal.withdrawnAmountMGB.toLocaleString()` instead of `newWithdrawal.withdrawnAmount`
- **Fixed Pending Withdrawal Display in Telegram Bot**:
  - Updated `server/telegram.ts` to convert TON to MGB for display (lines 619-621)
  - Changed withdrawal amount display from TON format to MGB format
  - Now shows amounts like "500 MGB" instead of "0.0001 TON"
- **Removed Channel Join Verification**:
  - Disabled Telegram channel membership verification for task completion
  - Users can now complete tasks by clicking "Check" without needing to actually join channels
  - Updated `channel` and `daily` task types in `server/routes.ts` to auto-verify (lines 2372-2384)
- **Simplified Telegram Bot Admin Panel**:
  - Removed `/szxzyz` command and all detailed dashboard statistics
  - Removed detailed stats display showing APP DASHBOARD, AD ANALYSIS, PLATFORM EARNING, etc.
  - Admin panel now shows simple welcome message with two buttons: "🕓 Pending Withdrawal" and "📢 Advertise"
  - Removed refresh button and all stats-related callback handlers
  - Admins can access the panel via `/start` command

# Recent Changes (November 6, 2025)

## Critical Bug Fixes (Latest - November 6, 2025)
- **Fixed Per-Ad Reward Display Bug**: Corrected balance display in Home.tsx to use proper MGB_TO_TON constant (5,000,000) instead of hardcoded 10,000,000, eliminating the 2x display error
- **Fixed Task Reward Display Bug**: Updated Admin.tsx to properly convert and display task rewards from TON to MGB using MGB_TO_TON constant
- **Fixed Withdrawal Minimum Validation**: Updated default minimum withdrawal from 0.5 TON (2,500,000 MGB) to 0.1 TON (500,000 MGB) in POST /api/withdrawals endpoint
- **Made Task Click Minimum Fully Configurable**: Replaced hardcoded 500 clicks with dynamic 'task_click_minimum' admin setting (default: 100 clicks) in task creation endpoint

## Bug Fixes and Configuration Updates (GitHub Import Completed)
- **Fixed MGB to TON Conversion Rate**: Corrected conversion rate from 10,000,000 to 5,000,000 throughout the entire codebase
  - Updated `formatCurrency` function in `client/utils.ts`
  - Fixed admin settings GET/PUT endpoints in `server/routes.ts`
  - Updated app-settings endpoint defaults
  - Fixed database migration in `server/migrate.ts`
  - Fixed withdrawal endpoint minimum withdrawal default
- **Updated Default Reward Values**:
  - Task completion reward: Changed from 1750 MGB to 100 MGB (0.00002 TON)
  - Ad watch reward: Changed from 1000 MGB to 50 MGB
  - Minimum withdrawal: Changed from 0.5 TON to 0.1 TON (500,000 MGB)
  - Default withdrawal currency: Changed from TON to MGB
- **Made Task Click Minimum Configurable**: Removed hardcoded 500 clicks, now configurable via admin settings with default of 100 clicks
- **Fixed MGB Withdrawal Validation**: Updated minimum withdrawal default in POST /api/withdrawals endpoint to correctly use 0.1 TON (500,000 MGB)
- **Project Setup**: 
  - Configured development workflow on port 5000 with webview
  - Verified database connection and migrations
  - All dependencies installed and server running successfully
  - Database schema migrated with correct defaults

## Home Page UI Update
- **Removed Income Statistics Section**: Removed the income statistics widget (Today's earnings, All time, On referrals) from the home page
- **Added Balance Card**: Added a new balance display card showing:
  - Username/Telegram ID and UID in the top left
  - Admin Dashboard button in the top right (only visible for admins using environment variables)
  - Centered MGB balance display
- **Combined Layout**: Balance card and Today's activity are now in a single card with no gap between them
  - Separated by a subtle border for visual organization
  - Matches the clean, cohesive design of the previous income statistics section
- **Preserved Today's Activity**: Tasks completed and Ads watched counts remain functional
- **Removed unused API call**: Eliminated /api/user/stats endpoint call from Home.tsx

## Admin Dashboard Visibility Fix
- **Removed all hardcoded admin IDs** from the entire codebase
- Fixed admin dashboard visibility to use environment variables exclusively:
  - `server/routes.ts`: Promo code creation now checks `TELEGRAM_ADMIN_ID` or `ADMIN_ID` environment variable
  - `server/storage.ts`: Admin user setup now uses environment variable with graceful fallback
  - `storage.ts`: Admin user setup now uses environment variable with graceful fallback
- Admin access now dynamically determined by `TELEGRAM_ADMIN_ID` or `ADMIN_ID` environment variable
- **No code redeployment needed** when changing admin ID - just update the environment variable
- Frontend admin check uses `VITE_ADMIN_ID` environment variable (must match backend)

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