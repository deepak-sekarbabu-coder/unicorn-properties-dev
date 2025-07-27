# Unicorn Properties Application Documentation

Welcome to the Unicorn Properties application! This guide will walk you through its features and how to use them effectively.

## 1. Overview

Unicorn Properties is a web application designed to help roommates and apartment dwellers manage shared expenses seamlessly. It provides a centralized platform to track who paid for what, calculate balances, and gain insights into spending habits.

## 2. Getting Started: Logging In

To begin using the application, you need to log in.

- **URL**: Access the application through its main URL, which will redirect you to the login page.
- **Credentials**:
  - You can sign in using a Google account or with an email and password.
  - New accounts can be created by the **Admin** user.
  - When an admin creates an account, the default password is `password`.
- **First-Time Sign-In**: The first time you sign in, you will be prompted to select your apartment number from a list. This is a one-time setup step to complete your profile.

## 3. User Roles

The application has two distinct roles with different levels of access:

### 3.1. User

This is the standard role for most members of the apartment.

- **Permissions**:
  - View the main dashboard, including all user balances and recent expenses.
  - Add new expenses for the group.
  - View a complete history of all expenses.
  - **Submit announcements** for admin review.
  - Export expense data.
  - View spending analytics.
  - Update their own profile information (name, phone number, and profile picture). Their assigned apartment is also visible in their settings.
  - Receive push notifications for important updates.

### 3.2. Admin

The Admin role has all the permissions of a standard user, plus additional administrative capabilities.

- **Additional Permissions**:
  - Access the **Admin Panel**.
  - **Manage Users**: Add new users, edit existing user details (including their role and apartment), and delete users.
  - **Manage Categories**: Create new expense categories, edit their names, and delete them.
  - **Manage Expenses**: Delete any expense from the log.
  - **Manage Announcements**: Approve or reject announcements submitted by other users.
  - Send announcements that are instantly visible to all users.

## 4. Core Features

### 4.1. Dashboard

The Dashboard is the first screen you see after logging in. It provides a quick overview of the apartment's financial status.

- **User Balances**: See at a glance who owes money and who is owed money. Balances are shown in Indian Rupees (₹).
- **Recent Expenses**: A list of the most recently added expenses.
- **Notifications**: This section displays announcements from the admin or other users. You may also be prompted here to enable push notifications to get alerts on your device.

### 4.2. All Expenses

This page provides a detailed log of every expense recorded in the app.

- **Search**: You can search for specific expenses by their description.
- **Export**: Export all expense data to a CSV file for your own records or analysis.
- **Receipts**: Expenses with an attached receipt will show a paperclip icon. Click it to view the receipt.

### 4.3. Analytics

The Analytics page offers visual insights into the group's spending.

- **Spending by Category**: A bar chart showing the total amount spent in each category.
- **Spending Over Time**: A chart illustrating total expenses over the last six months.

### 4.4. Announcements

All users can contribute to group communication.

- **Submit for Review**: On the dashboard, you can type a message and submit it. An admin will review it before it's sent to everyone.
- **Admin Approval**: Admins will see pending announcements in their Admin Panel and can choose to approve or reject them.

### 4.5. User Profile & Settings

You can manage your personal information from the user menu in the top-right corner.

- **Update Profile**: Click "Settings" to open a dialog where you can change your name, phone number, and upload a new profile picture. You can also view your assigned apartment here.
- **Reset Password**: You can reset your own password from the Settings dialog.
- **Logout**: Securely log out of the application.

### 4.6. Admin Panel (Admin Users Only)

Administrators have access to a special panel for managing the application's core data.

- **User Management**: View, add, edit, or delete users. You can also view user phone numbers and their assigned apartment.
- **Category Management**: Create, edit, and delete expense categories.
- **Pending Announcements**: Review and act on announcements submitted by users.

## 5. How to Use the Application

### 5.1. Adding a New Expense

1. Click the **"Add Expense"** button, available on the main header.
2. Fill in the expense details (Description, Amount in ₹, who paid, category).
3. Click **"Add Expense"**. The expense will be split evenly among all users.

### 5.2. Submitting an Announcement

1. On the main dashboard, find the **"Submit an Announcement"** section.
2. Type your message (up to 500 characters).
3. Click **"Submit for Review"**. An admin will be notified to approve it.

### 5.3. Updating Your Profile

1. Click your avatar in the top-right corner of the header.
2. Select **"Settings"** from the dropdown menu.
3. In the dialog, you can change your name, phone number, or upload a new profile picture.
4. Click **"Save Changes"**.
