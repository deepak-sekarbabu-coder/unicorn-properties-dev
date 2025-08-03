# Unicorn Properties Developer Documentation

Welcome, developer! This guide provides a technical overview of the Unicorn Properties application to help you get started with the codebase quickly.

## 1. Tech Stack

This project is a modern web application built with the following technologies:

- **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **State Management**: React Context API
- **Backend & Services**:
  - **Authentication**: Firebase Authentication
  - **Database**: Firestore
  - **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Deployment**: Configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## 2. Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn

### Installation and Running the App

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Run the development server**:

   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 3. Project Structure

The codebase is organized into the following key directories:

- `src/app/`: Contains the pages and routing structure for the Next.js App Router.
  - `layout.tsx`: The root layout for the entire application.
  - `page.tsx`: The entry page, which handles redirection based on auth status.
  - `login/page.tsx`: The login page.
  - `dashboard/page.tsx`: The main dashboard page that renders the core app component.
  - `api/`: API routes for server-side functionality.
    - `auth/session/`: Session management endpoints.
    - `health/`: Health check endpoint.
    - `test/`: Test endpoint for deployment verification.
- `src/components/`: Reusable React components.
  - `ui/`: Auto-generated UI components from ShadCN (e.g., `Button`, `Card`, `Dialog`).
  - `apartment-share-app.tsx`: The main stateful component that orchestrates the entire application UI and logic.
  - Dialog components (e.g., `add-expense-dialog.tsx`, `edit-user-dialog.tsx`, `select-apartment-dialog.tsx`): Self-contained dialogs for specific actions.
  - `outstanding-balance.tsx`: Displays outstanding expense amounts prominently.
  - `expense-item.tsx`: Enhanced expense display with payment tracking.
  - `payment-distribution.tsx`: Shows payment status across apartments.
  - `protected-route.tsx`: Client-side route protection component.
- `src/lib/`: Core utilities, type definitions, and backend communication logic.
  - `firebase.ts`: Initializes and exports Firebase services (Firestore, Auth, Messaging).
  - `firebase-client.ts`: Client-side Firebase configuration.
  - `firebase-admin.ts`: Server-side Firebase Admin SDK configuration.
  - `firestore.ts`: Contains all functions for interacting with the Firestore database (CRUD operations for users, expenses, etc.).
  - `types.ts`: TypeScript type definitions for `User`, `Category`, `Expense`, etc.
  - `expense-utils.ts`: Utility functions for expense calculations and payment tracking.
  - `payment-utils.ts`: Payment-related utility functions.
  - `auth-utils.ts`: Authentication helper functions.
  - `auth-fallback.ts`: Fallback authentication for development.
  - `push-notifications.ts`: Manages requesting user permission for notifications and handling FCM tokens.
  - `utils.ts`: Utility functions, including `cn` for merging Tailwind classes.
- `src/context/`: Contains React context providers for global state management.
  - `auth-context.tsx`: Manages user authentication state, including login/logout and the current user object.
- `src/hooks/`: Custom React hooks.
  - `use-toast.ts`: Hook for displaying toast notifications.
  - `use-apartments.ts`: Hook for managing apartment data.
  - `use-mobile.tsx`: Hook for detecting mobile devices.
- `public/`: Static assets, including the `firebase-messaging-sw.js` service worker for push notifications.

## 4. Key Concepts

### State Management

- **Global State**: The primary global state is authentication, managed in `AuthContext`. It stores the currently logged-in user and handles login/logout logic.
- **Local/Component State**: The core application state (users, expenses, categories) is managed within the `UnicornPropertiesApp` component using `React.useState`. Data is passed down to child components via props, and updates are handled by callback functions (e.g., `onAddExpense`, `onUpdateUser`). This keeps the data flow predictable.

### Authentication and Onboarding

Authentication is handled by **Firebase Authentication**. The `AuthContext` (`src/context/auth-context.tsx`) wraps the Firebase SDK to provide a simplified authentication flow, supporting both email/password and Google Sign-In. The `onAuthStateChanged` listener keeps the app's user state in sync with Firebase. User session is persisted using `browserLocalPersistence`.

A key feature is the **new user onboarding flow**. When a user logs in for the first time and their profile is missing an `apartment` value, the `UnicornPropertiesApp` component will automatically present the `SelectApartmentDialog`. This ensures all users have an apartment assigned to their profile.

### Data Flow & Backend

The application uses **Firestore** as its database. All database interactions are centralized in `src/lib/firestore.ts`.

1. The `DashboardPage` (`src/app/dashboard/page.tsx`) is a Server Component that fetches the initial data (users, expenses, etc.) from Firestore.
2. This data is passed as props to the main client component, `UnicornPropertiesApp`.
3. `UnicornPropertiesApp` stores this data in its state and is responsible for all Create, Read, Update, and Delete (CRUD) operations.
4. When a user performs an action (e.g., adding an expense), the relevant component calls a handler function in `UnicornPropertiesApp`.
5. This handler function then calls the appropriate function in `src/lib/firestore.ts` to update the database.
6. The local state is then updated with the new data, causing the UI to re-render.

### Expense Division System

The application features an advanced expense division system that automatically splits expenses across apartments and tracks payments:

- **Automatic Division**: Expenses are automatically divided equally among all apartments
- **Payment Tracking**: Expense owners can mark apartments as paid when they receive payment
- **Outstanding Balance**: Prominently displays total outstanding amounts
- **Visual Indicators**: Clear payment status for each apartment

Key files:

- `src/lib/expense-utils.ts`: Core calculation logic
- `src/components/outstanding-balance.tsx`: Outstanding amount display
- `src/components/payment-distribution.tsx`: Payment status visualization

### Push Notifications

Push notifications are implemented using **Firebase Cloud Messaging (FCM)**.

- **Service Worker**: `public/firebase-messaging-sw.js` is the service worker that listens for incoming push messages when the app is in the background.
- **Permission & Token**: `src/lib/push-notifications.ts` contains the logic to request notification permission from the user. If granted, it retrieves an FCM token for the device and saves it to the user's profile in Firestore.
- **Triggering Notifications**: _Note: The client-side is set up to receive notifications, but a backend mechanism (like a Cloud Function) would be required to trigger the sending of these notifications (e.g., when a new announcement is approved)._

### Styling

The UI is built with **ShadCN UI** components, which are styled using **Tailwind CSS**. The theme (colors, fonts, etc.) is configured in `tailwind.config.ts` and the global CSS variables are defined in `src/app/globals.css`.

---

## 5. Technical Improvements

### Architecture Updates

- **Next.js 15.3.3**: Latest framework version with App Router
- **TypeScript**: Full type safety throughout the application
- **Modular Structure**: Well-organized component and utility structure
- **Firebase Integration**: Complete Firebase ecosystem integration

### New Components

- `outstanding-balance.tsx` - Outstanding amount display
- `payment-distribution.tsx` - Payment status visualization
- `protected-route.tsx` - Route protection component
- `expense-item.tsx` - Enhanced expense display

### Utility Functions

- `expense-utils.ts` - Expense calculation logic
- `payment-utils.ts` - Payment-related utilities
- `auth-utils.ts` - Authentication helpers
- `use-apartments.ts` - Apartment management hook

### API Structure

- `/api/auth/session` - Session management
- `/api/health` - Health check endpoint
- `/api/test` - Deployment verification

## 6. Future Enhancements

### Potential Enhancements

- Additional payment methods integration
- Advanced analytics and reporting
- Mobile app development
- Multi-language support
- Enhanced notification system

### Maintenance Tasks

- Regular dependency updates
- Performance optimization
- Security audits
- User feedback integration

This should give you a solid foundation for understanding and contributing to the project. Happy coding!
