# Unicorn Properties Developer Documentation

Welcome, developer! This guide provides a technical overview of the Unicorn Properties application to help you get started with the codebase quickly.

## 1. Tech Stack

This project is a modern web application built with the following technologies:

- Framework: Next.js (App Router)
- Language: TypeScript
- UI Library: React 18
- Styling: Tailwind CSS
- UI Components: ShadCN UI
- State Management: React Context API
- Backend & Services:
  - Authentication: Firebase Authentication
  - Database: Firestore
  - Push Notifications: Firebase Cloud Messaging (FCM)
- Deployment: Netlify

## 2. Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation and Running the App

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 3. Project Structure

The codebase is organized into the following key directories:

- `src/app/`: Next.js App Router pages, layouts, API routes
- `src/components/`: Reusable React components (dialogs, lists, admin, analytics, etc.)
- `src/components/ui/`: ShadCN UI components
- `src/context/`: React Contexts (e.g., AuthContext for global auth state)
- `src/hooks/`: Custom React hooks
- `src/lib/`: Firestore logic, type definitions, utilities, backend logic
- `public/`: Static assets, favicon, service workers (FCM)
- `docs/`: User and developer documentation
- `netlify/`: Netlify functions and config
- `.github/`: Copilot and workflow instructions

## 4. Key Concepts

### State Management

- Global State: Authentication state managed via React Context (`AuthContext`).
- Local State: App data (users, expenses, categories) managed in the main app component and passed via props.

### Authentication and Onboarding

- Firebase Authentication for login (email/password, Google Sign-In)
- Onboarding flow triggers if roles or apartment assignment are missing

### Backend & Data Flow

- Firestore for all data (users, expenses, categories, announcements)
- All DB logic centralized in `src/lib/firestore.ts`
- FCM for push notifications

### Expense Division System

- Auto-divides expenses among 7 apartments
- Payer excluded from what they owe
- Payment status tracked per apartment
- Outstanding balances displayed in red at the top of the dashboard

### Notifications

- Push notifications via FCM
- Service worker in `public/firebase-messaging-sw.js`
- Client logic in `src/lib/push-notifications.ts`

### Styling

- ShadCN UI components
- Tailwind CSS
- Utility functions for class merging in `src/lib/utils.ts`

## 5. Technical Improvements

- Modular structure
- Centralized Firestore logic
- Dual-role system
- Dialog-driven UI flows
- Payment gateway integration
- Fault reporting flows
- Analytics components

## 6. Future Enhancements

- Additional payment methods
- Advanced analytics
- Mobile app
- Multi-language support
- Enhanced notifications
- Performance optimization
- Security audits

Happy coding!
