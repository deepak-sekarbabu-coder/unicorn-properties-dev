import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from './firebase';
import type { Announcement, Apartment, Category, Expense, Poll, User } from './types';

const removeUndefined = (obj: Record<string, unknown>) => {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
  return obj;
};

// --- Apartments ---
export const getApartments = async (): Promise<Apartment[]> => {
  const apartmentsQuery = query(collection(db, 'apartments'));
  const apartmentSnapshot = await getDocs(apartmentsQuery);
  return apartmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
};

// --- Users ---
export const getUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  const userSnapshot = await getDocs(usersQuery);
  return userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
};

export const getUser = async (id: string): Promise<User | null> => {
  const userDoc = doc(db, 'users', id);
  const userSnapshot = await getDoc(userDoc);
  if (userSnapshot.exists()) {
    return { id: userSnapshot.id, ...userSnapshot.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersCol = collection(db, 'users');
  const q = query(usersCol, where('email', '==', email));
  try {
    const userSnapshot = await getDocs(q);
    if (userSnapshot.empty) {
      return null;
    }
    const doc = userSnapshot.docs[0];
    const userData = { id: doc.id, ...doc.data() } as User;
    return userData;
  } catch (error) {
    console.error('Error querying user by email:', error);
    throw error;
  }
};

export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
  const usersCol = collection(db, 'users');
  const cleanUser = removeUndefined(user);
  const docRef = await addDoc(usersCol, cleanUser);
  return { id: docRef.id, ...cleanUser } as User;
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  const cleanUser = removeUndefined(user);
  await updateDoc(userDoc, cleanUser);
};

export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await deleteDoc(userDoc);
};

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, 'categories');
  const categorySnapshot = await getDocs(categoriesCol);
  return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
};

export const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
  const categoriesCol = collection(db, 'categories');
  const cleanCategory = removeUndefined(category);
  const docRef = await addDoc(categoriesCol, cleanCategory);
  return { id: docRef.id, ...cleanCategory } as Category;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  const cleanCategory = removeUndefined(category);
  await updateDoc(categoryDoc, cleanCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  await deleteDoc(categoryDoc);
};

// --- Expenses ---
export const getExpenses = async (apartment?: string): Promise<Expense[]> => {
  const expensesQuery = query(collection(db, 'expenses'));
  const expenseSnapshot = await getDocs(expensesQuery);
  const allExpenses = expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
  if (!apartment) {
    return allExpenses;
  }
  // Return expenses where the apartment is either the payer or one of the owing apartments
  return allExpenses.filter(
    expense =>
      expense.paidByApartment === apartment || expense.owedByApartments?.includes(apartment)
  );
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'date'>): Promise<Expense> => {
  const newExpense = {
    ...expense,
    date: new Date().toISOString(),
    paidByApartments: expense.paidByApartments || [],
  };
  const expensesCol = collection(db, 'expenses');
  const cleanExpense = removeUndefined(newExpense);
  const docRef = await addDoc(expensesCol, cleanExpense);
  return { id: docRef.id, ...cleanExpense } as Expense;
};

export const updateExpense = async (id: string, expense: Partial<Expense>): Promise<void> => {
  const expenseDoc = doc(db, 'expenses', id);
  const cleanExpense = removeUndefined(expense);
  await updateDoc(expenseDoc, cleanExpense);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseDoc = doc(db, 'expenses', id);
  await deleteDoc(expenseDoc);
};

// --- Announcements ---
export const getAnnouncements = async (role: 'admin' | 'user'): Promise<Announcement[]> => {
  const announcementsCol = collection(db, 'announcements');
  const now = Timestamp.now();
  const statusesToFetch = role === 'admin' ? ['approved', 'pending'] : ['approved'];
  const q = query(
    announcementsCol,
    where('expiresAt', '>', now),
    where('status', 'in', statusesToFetch)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      message: data.message,
      status: data.status,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate().toISOString(),
      expiresAt: data.expiresAt.toDate().toISOString(),
    };
  });
};

export const addAnnouncement = async (
  message: string,
  userId: string,
  userRole: 'admin' | 'user'
): Promise<Announcement> => {
  const now = new Date();
  const expires = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
  const newAnnouncement = {
    message,
    createdBy: userId,
    status: userRole === 'admin' ? 'approved' : 'pending',
    createdAt: Timestamp.fromDate(now),
    expiresAt: Timestamp.fromDate(expires),
  };
  const announcementsCol = collection(db, 'announcements');
  const docRef = await addDoc(announcementsCol, newAnnouncement);
  return {
    id: docRef.id,
    message: newAnnouncement.message,
    createdBy: newAnnouncement.createdBy,
    status: newAnnouncement.status,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
};

export const updateAnnouncementStatus = async (
  id: string,
  status: 'approved' | 'rejected'
): Promise<void> => {
  const announcementDoc = doc(db, 'announcements', id);
  if (status === 'rejected') {
    await deleteDoc(announcementDoc);
  } else {
    await updateDoc(announcementDoc, { status });
  }
};

// --- Polling Feature ---
export const getPolls = async (activeOnly = false): Promise<Poll[]> => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll);
};

export const listenToPolls = (cb: (polls: Poll[]) => void, activeOnly = false) => {
  const pollsCol = collection(db, 'polls');
  let q = query(pollsCol);
  if (activeOnly) {
    q = query(pollsCol, where('isActive', '==', true));
  }
  return onSnapshot(q, snapshot => {
    cb(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll[]));
  });
};

export const addPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'votes'>): Promise<Poll> => {
  const now = new Date().toISOString();
  const newPoll = {
    ...poll,
    createdAt: now,
    votes: {},
  };
  const pollsCol = collection(db, 'polls');
  const docRef = await addDoc(pollsCol, newPoll);
  return { id: docRef.id, ...newPoll } as Poll;
};

export const voteOnPoll = async (
  pollId: string,
  apartmentId: string,
  optionId: string
): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) throw new Error('Poll not found');
  const poll = pollSnap.data() as Poll;
  if (poll.votes && poll.votes[apartmentId]) {
    throw new Error('This apartment has already voted.');
  }
  const update = { [`votes.${apartmentId}`]: optionId };
  await updateDoc(pollDoc, update);
};

export const getPollResults = async (pollId: string): Promise<Poll | null> => {
  const pollDoc = doc(db, 'polls', pollId);
  const pollSnap = await getDoc(pollDoc);
  if (!pollSnap.exists()) return null;
  return { id: pollSnap.id, ...pollSnap.data() } as Poll;
};

export const closePoll = async (pollId: string): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  await updateDoc(pollDoc, { isActive: false });
};

export const deletePoll = async (pollId: string): Promise<void> => {
  const pollDoc = doc(db, 'polls', pollId);
  await deleteDoc(pollDoc);
};
