# ApartmentShare Application Documentation

Welcome to the ApartmentShare application! This guide will walk you through its features and how to use them effectively.

## 1. Overview

ApartmentShare is a web application designed to help roommates and apartment dwellers manage shared expenses seamlessly. It provides a centralized platform to track who paid for what, calculate balances, and gain insights into spending habits.

## 2. Getting Started: Logging In

To begin using the application, you need to log in.

-   **URL**: Access the application through its main URL, which will redirect you to the login page.
-   **Credentials**:
    -   **Admin User**: To access administrative features, use the email `admin@apartment.com`.
    -   **Regular Users**: User emails are generated from their names (e.g., `ben.carter@apartment.com`).
    -   **Password**: For all accounts, the default password is `password`.

## 3. User Roles

The application has two distinct roles with different levels of access:

### 3.1. User

This is the standard role for most members of the apartment.

-   **Permissions**:
    -   View the main dashboard, including all user balances and recent expenses.
    -   Add new expenses for the group.
    -   View a complete history of all expenses.
    -   Export expense data.
    -   View spending analytics.
    -   Update their own profile information (name, profile picture) and reset their password.

### 3.2. Admin

The Admin role has all the permissions of a standard user, plus additional administrative capabilities.

-   **Additional Permissions**:
    -   Access the **Admin Panel**.
    -   **Manage Users**: Add new users, edit existing user details (including their role), and delete users.
    -   **Manage Categories**: Create new expense categories, edit their names, and delete them.
    -   **Manage Expenses**: Delete any expense from the log.
    -   Reset passwords for any user.

## 4. Core Features

### 4.1. Dashboard

The Dashboard is the first screen you see after logging in. It provides a quick overview of the apartment's financial status.

-   **User Balances**: See at a glance who owes money and who is owed money. Positive balances mean the user is owed, while negative balances indicate they owe.
-   **Recent Expenses**: A list of the most recently added expenses.
-   **Notifications**: Reminders for upcoming bills or payments.

### 4.2. All Expenses

This page provides a detailed log of every expense recorded in the app.

-   **Search**: You can search for specific expenses by their description.
-   **Export**: Export all expense data to a CSV file for your own records or analysis.
-   **Receipts**: Expenses with an attached receipt will show a paperclip icon. Click it to view the receipt.

### 4.3. Analytics

The Analytics page offers visual insights into the group's spending.

-   **Spending by Category**: A bar chart showing the total amount spent in each category.
-   **Spending Over Time**: A chart illustrating total expenses over the last six months, helping you identify trends.

### 4.4. User Profile & Settings

You can manage your personal information from the user menu in the top-right corner.

-   **Update Profile**: Click "Settings" to open a dialog where you can change your name and upload a new profile picture.
-   **Reset Password**: You can reset your own password back to the default (`password`) from the Settings dialog.
-   **Logout**: Securely log out of the application.

### 4.5. Admin Panel (Admin Users Only)

Administrators have access to a special panel for managing the application's core data.

-   **User Management**:
    -   View a list of all users.
    -   Add new users to the system.
    -   Edit existing users' details (name, email, role, avatar).
    -   Delete users.
    -   Reset any user's password.
-   **Category Management**:
    -   View all expense categories.
    -   Add new categories with a name and icon.
    -   Edit the names of existing categories.
    -   Delete categories.

## 5. How to Use the Application

### 5.1. Adding a New Expense

1.  Click the **"Add Expense"** button, available on the main header.
2.  Fill in the expense details:
    -   **Description**: What the expense was for (e.g., "Monthly electricity bill").
    -   **Amount**: The total cost.
    -   **Paid By**: Select the user who paid for it.
    -   **Category**: Assign it to the appropriate category.
    -   **Receipt (Optional)**: Upload an image of the receipt.
3.  Click **"Add Expense"** to save it. The expense will be split evenly among all users.

### 5.2. Managing Users (Admin)

1.  Navigate to the **Admin** panel from the sidebar.
2.  In the **User Management** section:
    -   To add a user, click **"Add User"** and fill in their details.
    -   To edit a user, find them in the list and click **"Edit"**.
    -   To delete a user, click the trash can icon next to their name and confirm the action.

### 5.3. Updating Your Profile

1.  Click your avatar in the top-right corner of the header.
2.  Select **"Settings"** from the dropdown menu.
3.  In the dialog, you can change your name or upload a new profile picture.
4.  Click **"Save Changes"**.
