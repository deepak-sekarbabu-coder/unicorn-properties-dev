# ApartmentShare

ApartmentShare is a modern web application designed to help roommates and apartment dwellers manage shared expenses seamlessly. It provides a centralized platform to track who paid for what, calculate balances, and stay updated with group announcements.

[![Netlify Status](https://api.netlify.com/api/v1/badges/81d761ff-9a71-4099-b92b-52ada05f2198/deploy-status)](https://app.netlify.com/projects/apartment-share/deploys)

## Features

- **Expense Tracking**: Log shared expenses, assign who paid, and categorize them. The app automatically calculates what each person owes.
- **User Balances**: A clear dashboard view shows who owes money and who is owed money at a glance.
- **Admin Management**: An admin role allows for managing users, expense categories, and all expenses.
- **Announcement System**: Users can submit announcements for the group, which admins can approve. Approved announcements are visible to all users.
- **User Profiles**: Users can manage their own profile information, including their name, phone number, and apartment selection. First-time users are prompted to select their apartment upon sign-in.
- **Push Notifications**: Integrated with Firebase Cloud Messaging to allow for push notifications on supported devices.
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
