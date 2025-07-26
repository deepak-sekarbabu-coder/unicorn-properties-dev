# ApartmentShare

ApartmentShare is a modern web application designed to help roommates and apartment dwellers manage shared expenses seamlessly. It provides a centralized platform to track who paid for what, calculate balances, and stay updated with group announcements.

## Features

- **Expense Tracking**: Log shared expenses, assign who paid, and categorize them. The app automatically calculates what each person owes.
- **User Balances**: A clear dashboard view shows who owes money and who is owed money at a glance.
- **Admin Management**: An admin role allows for managing users, expense categories, and all expenses.
- **Announcement System**: Users can submit announcements for the group, which admins can approve. Approved announcements are visible to all users.
- **Push Notifications**: Integrated with Firebase Cloud Messaging to allow for push notifications on supported devices.
- **User Profiles**: Users can manage their own profile information, including their name and phone number.
- **Data Export**: Export all expense data to a CSV file.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI**: React, Tailwind CSS, ShadCN UI
- **AI**: Genkit
- **Backend & Database**: Firebase (Firestore, Authentication, Cloud Messaging)

## Getting Started

1.  Install dependencies: `npm install`
2.  Run the development server: `npm run dev`

The application will be available at `http://localhost:9002`.

For more detailed information, please see the documentation in the `/docs` directory.
