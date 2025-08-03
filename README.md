# Unicorn Properties

Unicorn Properties is a modern web application for managing shared apartment expenses, user roles, notifications, and community engagement in a 7-apartment complex.

Features:

- Advanced expense division (auto-split, payer excluded, per-apartment payment tracking)
- Outstanding balance tracking (dashboard top, red highlight)
- Dual role system (auth role: user/admin, propertyRole: tenant/owner) with onboarding trigger if missing
- Admin panel for user/category/expense/announcement management
- Push notifications (FCM, browser opt-in, token saved to user profile)
- Analytics dashboard
- CSV export for expenses
- Fault reporting flows
- Payment gateway integration

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/unicornproperties/deploys)

---

## Project Structure

```text
/ ├── src/
│   ├── app/           # Next.js App Router: pages, layouts, API routes
│   ├── components/    # Reusable UI and feature components (dialogs, lists, admin, analytics, etc.)
│   │   └── ui/        # ShadCN UI components (Button, Card, Dialog, etc.)
│   ├── context/       # React Contexts (e.g., AuthContext for global auth state)
│   ├── hooks/         # Custom React hooks (e.g., use-toast, use-apartments)
│   ├── lib/           # Firestore logic, type definitions, utilities, backend logic
│
├── public/            # Static assets, favicon, service workers (FCM)
├── docs/              # User and developer documentation (see below)
├── netlify/           # Netlify functions and config
├── .github/           # Copilot and workflow instructions
├── package.json       # Project dependencies and scripts
├── tailwind.config.ts # Tailwind CSS config
├── netlify.toml       # Netlify deployment config
```

**Key files:**

- `src/lib/firestore.ts`: Centralized Firestore CRUD logic (users, expenses, categories, announcements)
- `src/context/auth-context.tsx`: Global authentication state and onboarding logic
- `src/lib/types.ts`: TypeScript types for all core entities and roles
- `src/lib/expense-utils.ts`: Expense division and per-apartment payment tracking logic
- `src/components/outstanding-balance.tsx`: Outstanding balance display (dashboard)
- `src/components/expense-item.tsx`: Expense display and payment status
- `src/components/dialogs/`: Dialogs for add/edit flows (ShadCN UI)
- `src/lib/push-notifications.ts` & `public/firebase-messaging-sw.js`: FCM push notification logic
- `src/components/admin/`: Admin panel features
- `src/components/analytics/`: Analytics dashboard
- `src/components/payment-gateways.tsx`: Payment gateway integration
- `src/components/fault-reporting-form.tsx`: Fault reporting flows

---

## Architecture & Data Flow

- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI, Radix UI. All UI logic is component-driven and uses dialogs for add/edit flows.
- **State Management**:
  - **Global**: Authentication state via React Context (`AuthContext`). Onboarding triggers if roles missing.
  - **Local**: App data (users, expenses, categories) managed in main app component, passed via props.
- **Backend**: Firebase (Firestore for data, Auth for login, FCM for notifications). All DB logic in `src/lib/firestore.ts`.
- **Expense Division**: Every expense is auto-divided among 7 apartments, payer excluded. Payment status tracked per apartment. See [`docs/features/EXPENSE_DIVISION_FEATURE.md`](docs/features/EXPENSE_DIVISION_FEATURE.md).
- **Roles**: Dual roles per user: `role` (user/admin) and `propertyRole` (tenant/owner). Onboarding required if missing. See [`docs/roles/ROLE_STRUCTURE.md`](docs/roles/ROLE_STRUCTURE.md).
- **Notifications**: Push notifications via FCM, setup in `public/firebase-messaging-sw.js` and `src/lib/push-notifications.ts`.
- **Admin Panel**: Admins manage users, categories, expenses, announcements.
- **Payment Integration**: Payment gateway logic in `src/components/payment-gateways.tsx` and [`docs/payments/PAYMENT_INTEGRATION_GUIDE.md`](docs/payments/PAYMENT_INTEGRATION_GUIDE.md).
- **Fault Reporting**: Fault reporting flows in `src/components/fault-reporting-form.tsx` and `src/app/fault-reporting/`.
- **Analytics**: Analytics logic in `src/components/analytics/`.
- **CSV Export**: Dashboard supports expense data export.

---

## Developer Workflow

- **Install dependencies**: `npm install`
- **Environment setup**: Copy `.env.example` to `.env.local` and fill Firebase config
- **Dev server**: `npm run dev` (Turbopack, [http://localhost:3000](http://localhost:3000))
- **Build**: `npm run build`
- **Lint/Format**: `npm run lint`, `npm run format`
- **Testing**: Run test scripts in `tests/` and project root for expense, poll voting, and server logic
- **Debugging**: Use `get_errors` tool and test scripts to isolate and resolve issues
- **Contribution**: Fork, branch, follow code style (TypeScript, Prettier, ESLint), add/update tests, document changes, submit PR

---

## Integration Points

- **Firebase**: All backend logic (auth, DB, notifications) via Firebase SDKs. See `src/lib/firebase.ts` (client), `firebase-admin.ts` (server).
- **Netlify**: Deployment via Netlify; see `netlify/` and `netlify.toml`.
- **CSV Export**: Expense data export logic in dashboard
- **Payment Gateways**: See `src/components/payment-gateways.tsx` and related docs
- **Fault Reporting**: Dedicated flows and components

---

## Documentation & References

- [Developer Documentation](docs/guides/DEVELOPER_DOCUMENTATION.md): Technical overview, setup, architecture
- [User Guide](docs/architecture/DOCUMENTATION.md): Feature guide and practical usage
- [Authentication Flow](docs/roles/AUTHENTICATION_FLOW.md): Auth system, onboarding, session management
- [Role Structure](docs/roles/ROLE_STRUCTURE.md): User roles, permissions, onboarding logic
- [Expense Division](docs/features/EXPENSE_DIVISION_FEATURE.md): Expense logic, payment tracking, outstanding balances
- [Netlify Deployment](docs/deployment/NETLIFY_DEPLOYMENT.md): Deployment and environment setup
- [Blueprint](docs/architecture/blueprint.md): UI/UX guidelines and design patterns
- [Payment Integration Guide](docs/payments/PAYMENT_INTEGRATION_GUIDE.md): Payment gateway setup

---

## FAQ & Troubleshooting

- For common issues, see [`docs/deployment/NETLIFY_TROUBLESHOOTING.md`](docs/deployment/NETLIFY_TROUBLESHOOTING.md) and in-app help dialogs
- If you encounter authentication or deployment issues, check browser console and Netlify logs
- For more, see `.github/copilot-instructions.md` and `/docs` for AI/developer guidance

---

## Contribution Guidelines

We welcome contributions! To get started:

1. **Fork** the repository and create a new feature branch
2. **Follow the code style**: TypeScript, Prettier, ESLint enforced
3. **Add or update tests** as needed (see test scripts in project root)
4. **Document your changes** in relevant markdown files in `/docs`
5. **Submit a pull request** with a clear description of your changes
6. For major changes, **open an issue** first to discuss your proposal

---
