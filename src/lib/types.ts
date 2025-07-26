export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  role?: 'user' | 'admin';
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
};
