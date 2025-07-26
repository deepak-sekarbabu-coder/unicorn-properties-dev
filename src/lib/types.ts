export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin';
  fcmToken?: string; // For push notifications
  apartment?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  paidBy: string; // User ID
  categoryId: string; // Category ID
  receipt?: string; // Optional: data URI for the receipt image
};

export type Announcement = {
    id: string;
    message: string;
    status: 'pending' | 'approved' | 'rejected';
    createdBy: string; // User ID
    createdAt: string; // ISO date string
    expiresAt: string; // ISO date string
};
