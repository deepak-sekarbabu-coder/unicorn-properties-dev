# Unicorn Properties

Unicorn Properties is a modern web application for managing shared apartment expenses, user roles, and notifications in a 7-apartment community. It features advanced expense division, outstanding balance tracking, dual role system (auth/property), admin panel, push notifications, analytics, and CSV export.

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/unicornproperties/deploys)

---

## Project Structure

```
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

- `src/lib/firestore.ts`: All Firestore CRUD logic (users, expenses, categories, announcements)
- `src/context/auth-context.tsx`: Global authentication state and logic
- `src/lib/types.ts`: TypeScript types for all core entities
- `src/lib/expense-utils.ts`: Expense division and payment tracking logic
- `src/components/outstanding-balance.tsx`: Outstanding balance display
- `src/components/expense-item.tsx`: Expense display and payment status

---

## Architecture & Data Flow

- **Frontend**: Built with Next.js (App Router), React 18, TypeScript, Tailwind CSS, and ShadCN UI. All UI logic is component-driven and uses dialogs for add/edit flows.
- **State Management**:
  - **Global**: Authentication state is managed via React Context (`AuthContext`).
  - **Local**: App data (users, expenses, categories) is managed in the main app component and passed down via props.
- **Backend**: Firebase (Firestore for data, Auth for login, FCM for notifications). All database logic is centralized in `src/lib/firestore.ts`.
- **Expense Division**: Every expense is auto-divided among 7 apartments. The payer is excluded from what they owe. Payment status is tracked per apartment. See [`docs/features/EXPENSE_DIVISION_FEATURE.md`](docs/features/EXPENSE_DIVISION_FEATURE.md).
- **Roles**: Each user has two roles: `role` (user/admin) and `propertyRole` (tenant/owner). Onboarding is triggered if either is missing. See [`docs/roles/ROLE_STRUCTURE.md`](docs/roles/ROLE_STRUCTURE.md).
- **Notifications**: Push notifications use Firebase Cloud Messaging (FCM), with setup in `public/firebase-messaging-sw.js` and `src/lib/push-notifications.ts`.
- **Admin Panel**: Admins can manage users, categories, expenses, and approve/reject announcements.

**Data Flow Example:**

1. User logs in (auth state managed globally).
2. App fetches users, expenses, and categories from Firestore via `src/lib/firestore.ts`.
3. Data is stored in local state in the main app component and passed to child components.
4. User actions (add expense, mark paid, etc.) trigger handler functions, which update Firestore and local state.
5. UI updates automatically via React state.

---

## Quick Start

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd unicorn-properties
npm install
```

Set up your environment:

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Firebase config (see Firebase Console)
```

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

**Troubleshooting:**

- If you see errors about missing Firebase config, double-check your `.env.local` file.
- For Netlify deployment, see [`docs/deployment/NETLIFY_DEPLOYMENT.md`](docs/deployment/NETLIFY_DEPLOYMENT.md) and [`docs/deployment/NETLIFY_TROUBLESHOOTING.md`](docs/deployment/NETLIFY_TROUBLESHOOTING.md).

---

## Practical Usage

### Adding an Expense

1. Click **Add Expense** in the header.
2. Fill in the details (description, amount, payer, category).
3. Click **Add Expense**. The amount is split among all apartments (payer excluded).
4. Each apartment's share and payment status is tracked automatically.

### Onboarding

- On first login, you must select your apartment and property role (tenant/owner) to complete your profile. This ensures all users are properly assigned and can participate in expense tracking.

### Admin Actions

- Access the **Admin Panel** to manage users, categories, and expenses.
- Approve or reject pending announcements submitted by users.
- Assign or update user roles and apartments.

### CSV Export

- On the dashboard, click **Export CSV** to download all expense data for your apartment.

### Notifications

- Enable browser notifications to receive real-time updates (e.g., new announcements, payment reminders).
- FCM token is saved to your user profile for push notifications.

---

## Contribution Guidelines

We welcome contributions! To get started:

1. **Fork** the repository and create a new feature branch.
2. **Follow the code style**: TypeScript, Prettier, and ESLint are enforced.
3. **Add or update tests** as needed (see test scripts in the project root).
4. **Document your changes** in the relevant markdown files in `/docs`.
5. **Submit a pull request** with a clear description of your changes.
6. For major changes, **open an issue** first to discuss your proposal.

---

## Documentation & References

- [Developer Documentation](docs/guides/DEVELOPER_DOCUMENTATION.md): Technical overview, setup, and architecture
- [User Guide](docs/architecture/DOCUMENTATION.md): Feature guide and practical usage
- [Authentication Flow](docs/roles/AUTHENTICATION_FLOW.md): Auth system, onboarding, and session management
- [Role Structure](docs/roles/ROLE_STRUCTURE.md): User roles, permissions, and onboarding logic
- [Expense Division](docs/features/EXPENSE_DIVISION_FEATURE.md): Expense logic, payment tracking, and outstanding balances
- [Netlify Deployment](docs/deployment/NETLIFY_DEPLOYMENT.md): Deployment and environment setup
- [Blueprint](docs/architecture/blueprint.md): UI/UX guidelines and design patterns

---

## FAQ & Troubleshooting

- For common issues, see [`docs/deployment/NETLIFY_TROUBLESHOOTING.md`](docs/deployment/NETLIFY_TROUBLESHOOTING.md) and in-app help dialogs.
- If you encounter authentication or deployment issues, check the browser console and Netlify logs for details.
- For more, see `.github/copilot-instructions.md` and `/docs` for AI and developer guidance.
