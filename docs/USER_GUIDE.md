# Unicorn Properties User Guide

Welcome to Unicorn Properties! This guide will help you get started and make the most of your shared apartment management experience.

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [Managing Expenses](#managing-expenses)
5. [Outstanding Balances](#outstanding-balances)
6. [User Roles](#user-roles)
7. [Notifications](#notifications)
8. [Admin Panel](#admin-panel)
9. [Analytics](#analytics)
10. [Exporting Data](#exporting-data)
11. [FAQs](#faqs)

---

## Overview

Unicorn Properties is a web app designed for communities of 7 apartments to manage shared expenses, track outstanding balances, handle user roles, and receive notifications. The app is optimized for transparency, fairness, and ease of use.

---

## Getting Started

1. **Sign Up / Login**: Use your email to register or log in. Authentication is handled securely via Firebase.
2. **Onboarding**: On your first login, you’ll be prompted to select your apartment and set your roles (tenant/owner, user/admin).
3. **Dashboard Access**: After onboarding, you’ll land on the dashboard where you can view balances, expenses, and more.

---

## Dashboard

- **Outstanding Balances**: See what you owe or are owed at the top, highlighted in red if you have outstanding payments.
- **Expense List**: View all shared expenses, who paid, and payment status for each apartment.
- **Quick Actions**: Add new expenses, categories, or users using the dialog buttons.

---

## Managing Expenses

- **Add Expense**: Click the “Add Expense” button. Fill in the details (amount, category, payer, description).
- **Expense Division**: Expenses are automatically split among all 7 apartments. The payer is excluded from what they owe.
- **Payment Tracking**: Each apartment’s payment status is tracked. Mark payments as completed when settled.
- **Edit/Delete**: Use the edit or delete options on each expense item as needed.

---

## Outstanding Balances

- **View Balances**: Outstanding balances are always visible at the top of the dashboard.
- **Color Coding**: Red indicates you owe money; green means you are owed.
- **Settle Up**: Mark payments as completed to update balances in real time.

---

## User Roles

- **Dual Roles**: Each user has a `role` (user/admin) and a `propertyRole` (tenant/owner).
- **Role Management**: Roles are set during onboarding and can be updated in your profile dialog.
- **Admin Privileges**: Admins can manage users, categories, and view analytics.

---

## Notifications

- **Push Notifications**: Receive real-time updates for new expenses, payments, and announcements.
- **Setup**: Allow notifications in your browser and device for best experience.

---

## Admin Panel

- **User Management**: Add, edit, or remove users and assign roles.
- **Category Management**: Create or edit expense categories.
- **Community Announcements**: Post important updates for all residents.

---

## Analytics

- **Expense Analytics**: View charts and summaries of expenses by category, apartment, or time period.
- **Trends**: Identify spending patterns and optimize shared costs.

---

## Exporting Data

- **CSV Export**: Download all expense data as a CSV file from the dashboard for your records or further analysis.

---

## FAQs

**Q: How are expenses divided?**  
A: All expenses are split among 7 apartments. The payer does not owe themselves.

**Q: What if I miss onboarding?**  
A: You’ll be prompted to complete onboarding if your roles are missing.

**Q: How do I get notifications?**  
A: Enable push notifications in your browser and device settings.

**Q: Who can access the admin panel?**  
A: Only users with the `admin` role.

---

For more details, see the [Developer Documentation](./DEVELOPER_DOCUMENTATION.md) or contact your community admin.

---

Enjoy using Unicorn Properties!
