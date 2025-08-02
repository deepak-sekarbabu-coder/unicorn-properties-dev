# Gemini Project Analysis: Unicorn Properties

This document provides a comprehensive analysis of the Unicorn Properties project, designed to guide development and interaction with the codebase.

## 1. Project Overview

Unicorn Properties is a full-stack web application built to manage shared living spaces, focusing on expense tracking, user management, and community engagement for a 7-apartment complex. It features a robust system for dividing expenses, tracking payments, managing user roles, and sending real-time notifications. The application is built with a modern tech stack and is deployed on Netlify.

- **Primary Goal**: Simplify apartment management by automating expense calculations, centralizing communication, and providing clear financial visibility for all residents.
- **Key Stakeholders**: Residents (tenants/owners) and Property Admins.

## 2. Tech Stack

The project leverages a modern, type-safe, and component-based architecture.

- **Frontend**:
  - **Framework**: Next.js 15 (with App Router & Turbopack)
  - **Language**: TypeScript
  - **UI Library**: React 18
  - **Styling**: Tailwind CSS
  - **Component Toolkit**: ShadCN UI
  - **State Management**: React Context API for global state (e.g., authentication) and component-level state for local data.
- **Backend & Database**:
  - **Platform**: Firebase
  - **Database**: Firestore (NoSQL) for all application data.
  - **Authentication**: Firebase Authentication for user login and session management.
  - **Push Notifications**: Firebase Cloud Messaging (FCM).
- **AI Integration**:
  - **Framework**: Google's Genkit for integrating AI-powered features.
- **Deployment & CI/CD**:
  - **Platform**: Netlify
  - **Build Configuration**: `netlify.toml` and `next.config.ts`
- **Development Tools**:
  - **Linting**: ESLint
  - **Formatting**: Prettier
  - **Type Checking**: TypeScript

## 3. Getting Started & Local Development

To set up and run the project locally, follow these steps:

1. **Install Dependencies**:

    ```bash
    npm install
    ```

2. **Environment Configuration**:
    - Copy the example environment file: `cp .env.example .env.local`
    - Populate `.env.local` with your Firebase project configuration keys.
3. **Run the Development Server**:

    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## 4. Project Structure

The codebase is organized logically, separating concerns and promoting maintainability.

```
/
├── src/
│   ├── app/           # Core of the Next.js App Router: contains all pages, layouts, and API routes.
│   ├── components/    # Reusable React components.
│   │   ├── ui/        # Base UI components from ShadCN (Button, Card, etc.).
│   │   └── ...        # Feature-specific components (e.g., expense lists, dialogs).
│   ├── lib/           # Central hub for core business logic and utilities.
│   │   ├── firestore.ts # All Firestore CRUD operations are centralized here.
│   │   ├── types.ts     # Global TypeScript type definitions for entities like User, Expense, etc.
│   │   ├── auth.ts      # Authentication logic and utilities.
│   │   └── expense-utils.ts # Logic for expense division and payment calculations.
│   ├── context/       # React Context providers for global state.
│   │   └── auth-context.tsx # Manages global authentication state and user profile.
│   ├── hooks/         # Custom React hooks for shared component logic.
│   └── ai/            # Genkit AI flows and configurations.
│
├── public/            # Static assets, including images and the Firebase Messaging service worker.
├── docs/              # Extensive project documentation.
├── netlify/           # Configuration and serverless functions for Netlify.
├── scripts/           # Standalone utility scripts (e.g., for database seeding).
└── package.json       # Project dependencies and scripts.
```

## 5. Key Features & Logic

- **Expense Management**:
  - Expenses are automatically divided among the 7 apartments.
  - The user who paid the expense is excluded from their share of the cost.
  - Payment status is tracked on a per-apartment basis for each expense.
  - Core logic is located in `src/lib/expense-utils.ts` and `src/lib/firestore.ts`.
- **Authentication & Roles**:
  - Uses Firebase Auth for email/password login.
  - A new user undergoes an onboarding flow to select their apartment and `propertyRole` (Tenant/Owner).
  - The system uses a dual-role structure:
    - `role`: `user` or `admin` (application-level permissions).
    - `propertyRole`: `tenant` or `owner` (contextual role within the property).
  - The `AuthContext` (`src/context/auth-context.tsx`) provides the user's profile and auth status throughout the app.
- **Admin Panel**: Admins have elevated privileges to manage users, expense categories, and announcements.
- **Notifications**: Firebase Cloud Messaging (FCM) is used to send push notifications for important events. The service worker setup is in `public/firebase-messaging-sw.js`.

## 6. Available Commands

The `package.json` file defines several scripts for common development tasks:

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Creates a production-ready build of the application.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run typecheck`: Verifies the project's TypeScript types.
- `npm run format`: Formats all code using Prettier.
- `npm run genkit:dev`: Starts the Genkit AI development server.
- `npm run insert-apartments`: A custom script to seed the database with apartment data.

## 7. Deployment

The application is configured for continuous deployment on **Netlify**. The `netlify.toml` file and the `@netlify/plugin-nextjs` package handle the build and deployment process. Pushing to the main branch will trigger a new deployment.

## 8. AI Integration

The project uses **Genkit** to incorporate AI features. The relevant code is located in the `src/ai/` directory. To run the AI flows locally, use the `npm run genkit:dev` command.
