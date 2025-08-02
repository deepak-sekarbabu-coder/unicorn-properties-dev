# Copilot Instructions for Unicorn Properties

## Project Overview

Unicorn Properties is a Next.js (App Router) web app for managing shared apartment expenses, user roles, and notifications. It is designed for a 7-apartment community, with advanced expense division, outstanding balance tracking, dual role system (auth/property), admin panel, push notifications, and analytics.

## Architecture & Data Flow

- **Frontend**: React 18, TypeScript, Tailwind CSS, ShadCN UI, Radix UI.
- **State**: Auth is global (React Context in `src/context/auth-context.tsx`). App data (users, expenses, categories) is local to `UnicornPropertiesApp` and passed via props.
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
- **Analytics**: Analytics components and logic are in `src/components/analytics/`.
- **Admin Panel**: Admin features and user management are in `src/components/admin/`.
- **Payment Integration**: Payment gateway logic is in `src/components/payment-gateways.tsx` and `docs/PAYMENT_INTEGRATION_GUIDE.md`.
- **Fault Reporting**: Fault reporting flows are in `src/components/fault-reporting-form.tsx` and `src/app/fault-reporting/`.

## Developer Workflows

- **Install**: `npm install`
- **Dev server**: `npm run dev` (Turbopack, http://localhost:3000)
- **Build**: `npm run build`
- **Lint/Format**: `npm run lint`, `npm run format`
- **AI dev**: `npm run genkit:dev`
- **Env setup**: Copy `.env.example` to `.env.local` and fill Firebase config.
- **Testing**: Run test scripts in the project root for expense, poll voting, and server logic.

## Integration Points

- **Firebase**: All backend logic (auth, DB, notifications) is via Firebase SDKs. See `src/lib/firebase.ts` (client), `firebase-admin.ts` (server).
- **Netlify**: Deployment via Netlify; see `netlify/` and `netlify.toml`.
- **CSV Export**: Expense data export logic is in the dashboard.
- **Payment Gateways**: See `src/components/payment-gateways.tsx` and related docs.

## References

- See `/docs` for detailed feature and architecture docs.
- Key files: `src/lib/types.ts`, `src/lib/expense-utils.ts`, `src/components/outstanding-balance.tsx`, `src/context/auth-context.tsx`, `src/app/dashboard/page.tsx`, `src/components/admin/`, `src/components/analytics/`, `src/components/payment-gateways.tsx`, `src/components/fault-reporting-form.tsx`.

---

**Beast Chatmode Agent Instructions:**

- Always act as an agent: keep going until the user’s query is fully resolved.
- Break down each request into a markdown todo list and check off each step as you go.
- Investigate the codebase for relevant files and flows before making changes.
- Use centralized Firestore logic for all DB operations.
- Follow dual-role logic for users and trigger onboarding if roles are missing.
- Use ShadCN UI components and Tailwind for all dialogs, buttons, and alerts. Use `utils.ts` for class merging.
- For expense logic, always use `src/lib/expense-utils.ts` and update payment status per apartment.
- For notifications, update FCM logic in both service worker and `push-notifications.ts`.
- For payment, use gateway logic and follow integration guide.
- For fault reporting, use the dedicated components and flows.
- Debug using `get_errors` and test scripts. Focus on root causes.
- Test all relevant flows (UI, expense division, onboarding, notifications, payment, fault reporting).
- Iterate until all todo items are checked off and the solution is robust.
- Validate against original intent and project patterns. Add tests if needed.
- Be concise, clear, and professional. Always explain your next step before making a tool call.
- Never end your turn until the problem is fully solved and all todo items are checked off.
