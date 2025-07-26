# ApartmentShare Developer Documentation

Welcome, developer! This guide provides a technical overview of the ApartmentShare application to help you get started with the codebase quickly.

## 1. Tech Stack

This project is a modern web application built with the following technologies:

-   **Framework**: [Next.js](https://nextjs.org/) (using the App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI Library**: [React](https://react.dev/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **State Management**: React Context API
-   **AI Integration**: [Genkit](https://firebase.google.com/docs/genkit)
-   **Deployment**: Configured for [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## 2. Getting Started

### Prerequisites

-   Node.js (LTS version recommended)
-   npm or yarn

### Installation and Running the App

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002`.

## 3. Project Structure

The codebase is organized into the following key directories:

-   `src/app/`: Contains the pages and routing structure for the Next.js App Router.
    -   `layout.tsx`: The root layout for the entire application.
    -   `page.tsx`: The entry page, which handles redirection based on auth status.
    -   `login/page.tsx`: The login page.
    -   `dashboard/page.tsx`: The main dashboard page that renders the core app component.
-   `src/components/`: Reusable React components.
    -   `ui/`: Auto-generated UI components from ShadCN (e.g., `Button`, `Card`, `Dialog`).
    -   `apartment-share-app.tsx`: The main stateful component that orchestrates the entire application UI and logic.
    -   Dialog components (e.g., `add-expense-dialog.tsx`, `edit-user-dialog.tsx`): Self-contained dialogs for specific actions.
-   `src/lib/`: Core utilities, type definitions, and mock data.
    -   `data.ts`: Contains the initial mock data for users, categories, and expenses. **This acts as our temporary database.**
    -   `types.ts`: TypeScript type definitions for `User`, `Category`, `Expense`, etc.
    -   `utils.ts`: Utility functions, including `cn` for merging Tailwind classes.
-   `src/context/`: Contains React context providers for global state management.
    -   `auth-context.tsx`: Manages user authentication state, including login/logout and the current user object.
-   `src/hooks/`: Custom React hooks.
    -   `use-toast.ts`: Hook for displaying toast notifications.
-   `src/ai/`: Contains Genkit flows and configuration for AI-powered features.

## 4. Key Concepts

### State Management

-   **Global State**: The primary global state is authentication, managed in `AuthContext`. It stores the currently logged-in user and handles login/logout logic.
-   **Local/Component State**: The core application state (users, expenses, categories) is managed within the `ApartmentShareApp` component using `React.useState`. Data is passed down to child components via props, and updates are handled by callback functions (e.g., `onAddExpense`, `onUpdateUser`). This keeps the data flow predictable.

### Authentication

Authentication is mocked for simplicity. The `AuthContext` (`src/context/auth-context.tsx`) checks for a user in `localStorage` to persist the session. The `login` function in the context validates credentials against the hardcoded data in `src/lib/data.ts`. The default password for all users is `password`.

### Data Flow

1.  The `DashboardPage` (`src/app/dashboard/page.tsx`) fetches the initial mock data from `src/lib/data.ts`.
2.  This data is passed as props to the main client component, `ApartmentShareApp`.
3.  `ApartmentShareApp` stores this data in its state and is responsible for all Create, Read, Update, and Delete (CRUD) operations.
4.  When a user performs an action (e.g., adding an expense), the relevant dialog calls a handler function passed down from `ApartmentShareApp` (e.g., `handleAddExpense`).
5.  This handler updates the state in `ApartmentShareApp`, causing the UI to re-render with the new data.

### Styling

The UI is built with **ShadCN UI** components, which are styled using **Tailwind CSS**. The theme (colors, fonts, etc.) is configured in `tailwind.config.ts` and the global CSS variables are defined in `src/app/globals.css`. To modify the look and feel, start by adjusting the CSS variables in `globals.css`.

## 5. Database / Data Management

This application currently operates **without a traditional database**. For development and demonstration purposes, it uses a mock data source.

-   **Mock Data File**: All initial data for users, expenses, and categories is hardcoded in `src/lib/data.ts`. This file exports arrays of objects that simulate records you would typically find in a database.
-   **Data Types**: The TypeScript types that define the structure of this data (e.g., `User`, `Expense`) are located in `src/lib/types.ts`.
-   **Data Persistence**: The application's state is held in memory within the `ApartmentShareApp` component. Any changes made during a user session (like adding an expense) are **not saved** and will be reset when the page is reloaded. The only exception is the logged-in user's session, which is persisted in the browser's `localStorage`.

### Transitioning to a Real Database

To connect this application to a real backend database (like Firestore, PostgreSQL, etc.), you would need to:
1.  Set up a backend service or API endpoints that perform CRUD (Create, Read, Update, Delete) operations on your database.
2.  In the `DashboardPage` (`src/app/dashboard/page.tsx`), replace the import of mock data from `src/lib/data.ts` with an asynchronous fetch call to your API to get the initial data.
3.  In the `ApartmentShareApp` component, modify the handler functions (e.g., `handleAddExpense`, `handleDeleteUser`) to make API calls to your backend instead of just updating the local React state.

## 6. Adding New Features

-   **New Component**: Create the component file in `src/components/`. If it's a UI primitive, consider if ShadCN already has a suitable component.
-   **New Page**: Add a new folder with a `page.tsx` file inside `src/app/`.
-   **New State**: If the state is local to a component, use `useState`. If it needs to be shared across multiple components, lift the state up to the nearest common ancestor (likely `ApartmentShareApp`) or consider adding it to a new or existing React Context if it's truly global.
-   **New AI Feature**: Implement new AI functionality using Genkit flows in the `src/ai/` directory.

---

This should give you a solid foundation for understanding and contributing to the project. Happy coding!
