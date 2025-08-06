# AI Rules for Unicorn Properties Development

This document outlines the core technologies used in the Unicorn Properties application and provides guidelines for using specific libraries and tools.

## Tech Stack Overview

Unicorn Properties is built with a modern, type-safe, and component-based architecture:

* **Frontend Framework**: Next.js 15 (App Router) for routing, server components, and API routes.
* **UI Library**: React 18 for building interactive user interfaces.
* **Language**: TypeScript for strong type checking and improved code quality.
* **Styling**: Tailwind CSS for all component styling and responsive design.
* **UI Components**: ShadCN UI for pre-built, accessible, and customizable UI components.
* **UI Primitives**: Radix UI provides the unstyled, accessible primitives that ShadCN UI is built upon.
* **Backend & Database**: Firebase (Firestore for NoSQL data storage, Authentication for user management, Cloud Messaging for push notifications).
* **File Storage**: Firebase Storage for handling image uploads (e.g., receipts, profile pictures).
* **Global State Management**: React Context API for managing global application state (e.g., authentication status).
* **Deployment**: Netlify for continuous deployment.

## Library Usage Guidelines

To maintain consistency, performance, and best practices, adhere to the following rules when developing:

* **React**: Use React for all UI component development.
* **Next.js (App Router)**:
  * Utilize the App Router for defining pages, layouts, and API routes.
  * Prefer server components for data fetching and rendering where appropriate, but ensure client-side interactivity is handled with `"use client"`.
* **TypeScript**: Always use TypeScript for all new and modified code. Ensure strict type checking is maintained.
* **Tailwind CSS**:
  * **Mandatory for Styling**: All styling must be done using Tailwind CSS utility classes. Avoid custom CSS files unless absolutely necessary for global styles or third-party library overrides.
  * **Responsive Design**: Always consider responsiveness using Tailwind's responsive prefixes (e.g., `sm:`, `md:`, `lg:`).
* **ShadCN UI**:
  * **Primary UI Component Library**: Use ShadCN UI components for all common UI elements (buttons, cards, dialogs, forms, tables, etc.).
  * **Customization**: Customize ShadCN components using Tailwind classes via the `cn` utility function. Do not modify the core ShadCN UI files directly; create new components if significant changes are needed.
* **Radix UI**:
  * **Underlying Primitives**: Radix UI is used internally by ShadCN. You should generally **not** import or use Radix UI components directly unless you are extending or creating a new component that requires its unstyled primitives, and a ShadCN equivalent does not exist.
* **Firebase (Client SDK)**:
  * **`firebase/app`**: For initializing the Firebase app.
  * **`firebase/auth`**: For client-side user authentication (login, logout, user state observation).
  * **`firebase/firestore`**: For client-side database interactions (reading, writing, updating, deleting documents, and real-time listeners). All Firestore CRUD operations should be centralized in `src/lib/firestore.ts`.
  * **`firebase/messaging`**: For client-side push notification setup and token management.
  * **`firebase/storage`**: For client-side file uploads (e.g., `src/lib/storage.ts`).
* **Firebase Admin SDK**:
  * **`firebase-admin/auth`**: For server-side authentication (e.g., verifying session cookies in API routes).
  * **`firebase-admin/firestore`**: For server-side database operations, especially for sensitive or privileged actions (e.g., creating announcements, user management in API routes).
* **React Context API**: Use for global state management, such as `AuthContext` (`src/context/auth-context.tsx`). Avoid prop-drilling for widely used data.
* **React Hook Form + Zod**:
  * **Form Management**: Use `react-hook-form` for all form handling (validation, submission, state management).
  * **Schema Validation**: Use `zod` for defining form schemas and validation rules.
* **`date-fns`**: Use `date-fns` for all date manipulation, formatting, and parsing.
* **`lucide-react`**: Use `lucide-react` for all icons within the application.
* **`loglevel`**: Use `loglevel` for structured logging, configured to different levels for development and production environments.
* **`recharts`**: Use `recharts` for all charting and data visualization needs in the analytics section.
* **`use-toast` (Custom Hook)**: Use the custom `use-toast` hook (`src/hooks/use-toast.ts` or `src/components/ui/toast-provider.tsx`) for displaying transient notifications to the user.
