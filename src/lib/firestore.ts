import { db } from './firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import type { User, Category, Expense } from './types';

// Users
export const getUsers = async (): Promise<User[]> => {
  const usersCol = collection(db, 'users');
  const userSnapshot = await getDocs(usersCol);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUser = async (id: string): Promise<User | null> => {
    const userDoc = doc(db, 'users', id);
    const userSnapshot = await getDoc(userDoc);
    if(userSnapshot.exists()){
        return {id: userSnapshot.id, ...userSnapshot.data()} as User;
    }
    return null;
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
    const usersCol = collection(db, 'users');
    const q = query(usersCol, where("email", "==", email));
    const userSnapshot = await getDocs(q);
    if (userSnapshot.empty) {
        return null;
    }
    const doc = userSnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
}

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const usersCol = collection(db, 'users');
    const docRef = await addDoc(usersCol, user);
    return { id: docRef.id, ...user };
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
    const userDoc = doc(db, 'users', id);
    await updateDoc(userDoc, user);
};

export const deleteUser = async (id: string): Promise<void> => {
    const userDoc = doc(db, 'users', id);
    await deleteDoc(userDoc);
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, 'categories');
  const categorySnapshot = await getDocs(categoriesCol);
  return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const categoriesCol = collection(db, 'categories');
    const docRef = await addDoc(categoriesCol, category);
    return { id: docRef.id, ...category };
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
    const categoryDoc = doc(db, 'categories', id);
    await updateDoc(categoryDoc, category);
};

export const deleteCategory = async (id: string): Promise<void> => {
    const categoryDoc = doc(db, 'categories', id);
    await deleteDoc(categoryDoc);
};


// Expenses
export const getExpenses = async (): Promise<Expense[]> => {
  const expensesCol = collection(db, 'expenses');
  const expenseSnapshot = await getDocs(expensesCol);
  return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
};

export const addExpense = async (expense: Omit<Expense, 'id'|'date'>): Promise<Expense> => {
    const newExpense = {
        ...expense,
        date: new Date().toISOString()
    }
    const expensesCol = collection(db, 'expenses');
    const docRef = await addDoc(expensesCol, newExpense);
    return { id: docRef.id, ...newExpense };
};

export const deleteExpense = async (id: string): Promise<void> => {
    const expenseDoc = doc(db, 'expenses', id);
    await deleteDoc(expenseDoc);
};
