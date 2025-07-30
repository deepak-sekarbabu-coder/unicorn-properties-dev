# Unicorn Properties

Unicorn Properties is a modern web application for managing shared apartment expenses, user roles, and notifications in a 7-apartment community. It features advanced expense division, outstanding balance tracking, dual role system (auth/property), admin panel, push notifications, analytics, and CSV export.

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/unicornproperties/deploys)

## Features

- **Advanced Expense Division**: Expenses are auto-divided among 7 apartments. The payer is excluded from what they owe. Payment status is tracked per apartment.
- **Outstanding Balance Tracking**: Outstanding balances are displayed in red at the top of the dashboard.
- **Payment Management**: Mark apartments as paid when they settle their share. Visual indicators for payment status.
- **User Balances**: Dashboard shows who owes and who is owed at a glance.
- **Dual Role System**: Each user has both an authentication role (`user`/`admin`) and a property role (`tenant`/`owner`). Onboarding triggers if missing.
- **Admin Management**: Admin panel for managing users, categories, and expenses.
- **Announcement System**: Users can submit announcements for admin approval. Admins can approve/reject instantly.
- **User Profiles**: Profile management with apartment assignment and role selection. Mobile-optimized dialogs.
- **Push Notifications**: Integrated with Firebase Cloud Messaging (FCM) for real-time updates.
- **Data Export**: Export all expense data to CSV from the dashboard.
- **Analytics**: Visual spending insights with charts and category breakdowns.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS, ShadCN UI, Radix UI
- **State Management**: React Context API (auth global, app data local to main app)
- **AI Integration**: Genkit (flows in `src/ai/`)
- **Backend & Database**: Firebase (Firestore, Authentication, Cloud Messaging)
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Netlify with Firebase App Hosting support

## Quick Start

### Prerequisites

- Node.js (LTS version recommended)
- Firebase project with Firestore and Authentication enabled
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd unicorn-properties
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   cp .env.example .env.local

   # Edit `.env.local` and fill in your Firebase config values as described in the docs

4. **Run the development server**

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Scripts

- `npm run dev` — Start development server (Turbopack, hot reload)
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run format` — Format code with Prettier
- `npm run genkit:dev` — Start Genkit AI development server

## Documentation

See the `/docs` directory for detailed guides:

- [Developer Documentation](docs/DEVELOPER_DOCUMENTATION.md): Technical overview and setup
- [User Documentation](docs/DOCUMENTATION.md): Feature guide and usage
- [Authentication Flow](docs/AUTHENTICATION_FLOW.md): Auth system details
- [Role Structure](docs/ROLE_STRUCTURE.md): User roles and permissions
- [Expense Division Feature](docs/EXPENSE_DIVISION_FEATURE.md): Expense logic
- [Netlify Deployment](docs/NETLIFY_DEPLOYMENT.md): Deployment guide
- [Netlify Troubleshooting](docs/NETLIFY_TROUBLESHOOTING.md): Troubleshooting for Netlify
- [Blueprint](docs/blueprint.md): Application blueprint and UI/UX guidelines

## Key Conventions & Patterns

- All Firestore logic is centralized in `src/lib/firestore.ts`.
- Use dialog components in `src/components/` for all add/edit flows.
- UI is built with ShadCN UI and Tailwind CSS. Use `src/lib/utils.ts` for class merging.
- Dual role model: see `src/lib/types.ts` and `docs/ROLE_STRUCTURE.md`.
- Outstanding balances: see `src/components/outstanding-balance.tsx`.
- Expense division: see `src/lib/expense-utils.ts` and `src/components/expense-item.tsx`.
- Push notifications: see `public/firebase-messaging-sw.js` and `src/lib/push-notifications.ts`.
- Test scripts are in the project root (e.g., `test-expense-calculation.js`).

---

For more, see `.github/copilot-instructions.md` and `/docs` for AI and developer guidance.
