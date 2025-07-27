# Unicorn Properties

Unicorn Properties is a modern web application designed to help roommates and apartment dwellers manage shared expenses seamlessly. It provides a centralized platform to track who paid for what, calculate balances, and stay updated with group announcements.

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/unicornproperties/deploys)

## Features

- **Advanced Expense Division**: Automatically divides expenses across apartments and tracks payment status
- **Outstanding Balance Tracking**: Prominently displays total outstanding amounts with visual indicators
- **Payment Management**: Mark apartments as paid when they settle their share
- **User Balances**: A clear dashboard view shows who owes money and who is owed money at a glance
- **Dual Role System**: Separate authentication roles (user/admin) and property roles (tenant/owner)
- **Admin Management**: Comprehensive admin panel for managing users, expense categories, and all expenses
- **Announcement System**: Users can submit announcements for group approval with admin moderation
- **User Profiles**: Complete profile management with apartment assignment and role selection
- **Push Notifications**: Integrated with Firebase Cloud Messaging for real-time updates
- **Data Export**: Export all expense data to CSV format
- **Analytics**: Visual spending insights with charts and category breakdowns

## Tech Stack

- **Framework**: Next.js 15.3.3 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS, ShadCN UI, Radix UI
- **State Management**: React Context API
- **AI Integration**: Genkit 1.13.0
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

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Firebase configuration in `.env.local`

4. **Run the development server**

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
- `npm run genkit:dev` - Start Genkit development server

## Documentation

For detailed information about the application, please see the documentation in the `/docs` directory:

- [Developer Documentation](docs/DEVELOPER_DOCUMENTATION.md) - Technical overview and setup
- [User Documentation](docs/DOCUMENTATION.md) - Feature guide and usage
- [Authentication Flow](docs/AUTHENTICATION_FLOW.md) - Authentication system details
- [Role Structure](docs/ROLE_STRUCTURE.md) - User roles and permissions
- [Expense Division Feature](docs/EXPENSE_DIVISION_FEATURE.md) - Advanced expense tracking
- [Netlify Deployment](docs/NETLIFY_DEPLOYMENT.md) - Deployment guide
