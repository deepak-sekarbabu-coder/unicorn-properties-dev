import type { User, Category, Expense } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alex Martin' },
  { id: 'user-2', name: 'Ben Carter' },
  { id: 'user-3', name: 'Chloe Davis' },
  { id: 'user-4', name: 'Dana Evans' },
  { id: 'user-5', name: 'Eva Foster' },
  { id: 'user-6', name: 'Frank Green' },
  { id: 'user-7', name: 'Grace Hill' },
];

export const categories: Category[] = [
  { id: 'cat-1', name: 'Electricity', icon: 'Zap' },
  { id: 'cat-2', name: 'Cleaning', icon: 'Sparkles' },
  { id: 'cat-3', name: 'Internet', icon: 'Wifi' },
  { id: 'cat-4', name: 'Groceries', icon: 'ShoppingCart' },
  { id: 'cat-5', name: 'Water', icon: 'Droplets' },
  { id: 'cat-6', name: 'Other', icon: 'FileText' },
];

export const expenses: Expense[] = [
  { id: 'exp-1', description: 'Monthly electricity bill', amount: 140, date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(), paidBy: 'user-1', categoryId: 'cat-1' },
  { id: 'exp-2', description: 'Weekly cleaning service', amount: 70, date: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString(), paidBy: 'user-2', categoryId: 'cat-2' },
  { id: 'exp-3', description: 'Gigabit Fiber Internet', amount: 56, date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(), paidBy: 'user-3', categoryId: 'cat-3' },
  { id: 'exp-4', description: 'Shared groceries for BBQ', amount: 105, date: new Date(new Date().setDate(new Date().getDate() - 4)).toISOString(), paidBy: 'user-4', categoryId: 'cat-4' },
  { id: 'exp-5', description: 'Quarterly water bill', amount: 49, date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(), paidBy: 'user-5', categoryId: 'cat-5' },
  { id: 'exp-6', description: 'Light bulbs and batteries', amount: 21, date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), paidBy: 'user-1', categoryId: 'cat-6' },
];
