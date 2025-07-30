# Copilot Instructions for Unicorn Properties

## Project Overview

- **Unicorn Properties** is a Next.js (App Router) web app for managing shared apartment expenses, user roles, and notifications.
- Core features: advanced expense division, outstanding balance tracking, dual role system (auth/property), admin panel, push notifications, and analytics.

## Architecture & Data Flow

- **Frontend**: React 18, TypeScript, Tailwind CSS, ShadCN UI, Radix UI.
- **State**: Auth is global (React Context in `src/context/auth-context.tsx`); app data (users, expenses, categories) is local to `UnicornPropertiesApp` and passed via props.
- **Backend**: Firebase (Firestore for data, Auth for login, FCM for notifications). All DB logic is in `src/lib/firestore.ts`.
- **AI**: Genkit flows in `src/ai/` for AI-powered features.
- **API**: Next.js API routes in `src/app/api/` (auth/session, health, test).

## Key Patterns & Conventions

- **Expense Division**: All expenses are auto-divided among 7 apartments. The payer is excluded from what they owe. Payment status is tracked per apartment. See `src/lib/expense-utils.ts` and `src/components/expense-item.tsx`.
- **Outstanding Balances**: Displayed in red at the top of the dashboard (`src/components/outstanding-balance.tsx`).
- **Roles**: Dual roles per user: `role` (user/admin) and `propertyRole` (tenant/owner). Onboarding triggers if missing. See `src/lib/types.ts` and `docs/ROLE_STRUCTURE.md`.
- **Dialogs**: All add/edit flows use dialog components in `src/components/` (e.g., `add-expense-dialog.tsx`).
- **UI**: Use ShadCN UI components from `src/components/ui/`. Styling via Tailwind. Use `utils.ts` for class merging.
- **Notifications**: FCM setup in `public/firebase-messaging-sw.js` and `src/lib/push-notifications.ts`.
- **Testing**: Test scripts are in the project root (e.g., `test-expense-calculation.js`).

## Developer Workflows

- **Install**: `npm install`
- **Dev server**: `npm run dev` (Turbopack, http://localhost:3000)
- **Build**: `npm run build`
- **Lint/Format**: `npm run lint`, `npm run format`
- **AI dev**: `npm run genkit:dev`
- **Env setup**: Copy `.env.example` to `.env.local` and fill Firebase config.

## Integration Points

- **Firebase**: All backend logic (auth, DB, notifications) is via Firebase SDKs. See `src/lib/firebase.ts` (client), `firebase-admin.ts` (server).
- **Netlify**: Deployment via Netlify; see `netlify/` and `netlify.toml`.
- **CSV Export**: Expense data export logic is in the dashboard.

## References

- See `/docs` for detailed feature and architecture docs.
- Key files: `src/lib/types.ts`, `src/lib/expense-utils.ts`, `src/components/outstanding-balance.tsx`, `src/context/auth-context.tsx`, `src/app/dashboard/page.tsx`.

---

**For AI agents:**

- Follow the dual-role model for user logic.
- Use centralized Firestore logic for all DB ops.
- Maintain onboarding and payment tracking flows as described.
- Adhere to UI/UX patterns (dialogs, alerts, card layouts, color/typography from blueprint).
- Reference this file and `/docs` for any non-obvious workflow or pattern.
