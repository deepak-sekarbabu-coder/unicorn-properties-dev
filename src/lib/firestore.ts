import {
  DocumentData,
  QuerySnapshot,
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
import type {
  Apartment,
  BalanceSheet,
  Category,
  Expense,
  Fault,
  Payment,
  Poll,
  User,
} from './types';

const removeUndefined = (obj: Record<string, unknown>) => {
  Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
  return obj;
};

// --- Apartments ---
export const getApartments = async (): Promise<Apartment[]> => {
  // Only fetch needed fields for dashboard
  const apartmentsQuery = query(collection(db, 'apartments'));
  const apartmentSnapshot = await getDocs(apartmentsQuery);
  return apartmentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
};

export const subscribeToApartments = (callback: (apartments: Apartment[]) => void) => {
  // Use real-time listener only if UI requires live updates
  const apartmentsQuery = query(collection(db, 'apartments'));
  return onSnapshot(apartmentsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const apartments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Apartment);
    callback(apartments);
  });
};

// --- Users ---
export const getUsers = async (apartment?: string): Promise<User[]> => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment)); // Composite index: apartment
  }
  // Only fetch needed fields for user list
  usersQuery = query(usersQuery); // Add .select() if using Firestore Lite
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
  const q = query(usersCol, where('email', '==', email)); // Index: email
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
  const cleanUser = removeUndefined({ ...user, isApproved: false });
  const docRef = await addDoc(usersCol, cleanUser);
  return { id: docRef.id, ...cleanUser } as User;
};

export const approveUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await updateDoc(userDoc, { isApproved: true });
};

export const updateUser = async (id: string, user: Partial<User>): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  const cleanUser = removeUndefined(user) as Partial<User>;
  await updateDoc(userDoc, cleanUser);
};

export const deleteUser = async (id: string): Promise<void> => {
  const userDoc = doc(db, 'users', id);
  await deleteDoc(userDoc);
};

export const subscribeToUsers = (callback: (users: User[]) => void, apartment?: string) => {
  let usersQuery = query(collection(db, 'users'));
  if (apartment) {
    usersQuery = query(usersQuery, where('apartment', '==', apartment));
  }
  return onSnapshot(usersQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as User);
    callback(users);
  });
};

// --- Categories ---
export const getCategories = async (): Promise<Category[]> => {
  const categoriesCol = collection(db, 'categories');
  // Only fetch needed fields for category list
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
  const cleanCategory = removeUndefined(category) as Partial<Category>;
  await updateDoc(categoryDoc, cleanCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryDoc = doc(db, 'categories', id);
  await deleteDoc(categoryDoc);
};

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const categoriesQuery = query(collection(db, 'categories'));
  return onSnapshot(categoriesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
    callback(categories);
  });
};

// --- Expenses ---
export const getExpenses = async (apartment?: string): Promise<Expense[]> => {
  let expensesQuery = query(collection(db, 'expenses'));
  if (apartment) {
    expensesQuery = query(expensesQuery, where('paidByApartment', '==', apartment)); // Composite index: paidByApartment
  }
  // Only fetch needed fields for dashboard
  expensesQuery = query(expensesQuery); // Add .select() if using Firestore Lite
  // Limit results for dashboard
  expensesQuery = query(expensesQuery /* e.g. */ /* limit(20) */);
  const expenseSnapshot = await getDocs(expensesQuery);
  return expenseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
};

export const subscribeToExpenses = (
  callback: (expenses: Expense[]) => void,
  apartment?: string
) => {
  let expensesQuery = query(collection(db, 'expenses'));
  if (apartment) {
    expensesQuery = query(expensesQuery, where('paidByApartment', '==', apartment));
  }
  // Only use real-time listener if UI requires live updates
  return onSnapshot(expensesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
    callback(expenses);
  });
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
  const cleanExpense = removeUndefined(expense) as Partial<Expense>;
  await updateDoc(expenseDoc, cleanExpense);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const expenseDoc = doc(db, 'expenses', id);
  await deleteDoc(expenseDoc);
};

export const subscribeToRelevantExpenses = (
  callback: (expenses: Expense[]) => void,
  apartment: string
) => {
  // Listen to all expenses, then filter client-side for relevant ones
  const expensesQuery = query(collection(db, 'expenses'));
  return onSnapshot(expensesQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const allExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Expense);
    const relevantExpenses = allExpenses.filter(
      expense =>
        expense.paidByApartment === apartment ||
        (Array.isArray(expense.owedByApartments) && expense.owedByApartments.includes(apartment))
    );
    callback(relevantExpenses);
  });
};

// --- Outstanding Balances ---
// Suggestion: Store outstanding balances in a summary document per apartment, updated on expense changes.
// This avoids scanning all expenses for each dashboard load.

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
    cb(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Poll));
  });
};

export const addPoll = async (poll: Omit<Poll, 'id' | 'createdAt' | 'votes'>): Promise<Poll> => {
  const now = new Date().toISOString();
  const newPoll = removeUndefined({
    ...poll,
    createdAt: now,
    votes: {},
  });
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

// --- Faults ---
export const getFaults = async (): Promise<Fault[]> => {
  const faultsCol = collection(db, 'faults');
  // Only fetch needed fields for fault list
  const snapshot = await getDocs(faultsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Fault);
};

export const addFault = async (
  fault: Omit<Fault, 'id' | 'reportedAt' | 'fixed'>
): Promise<Fault> => {
  const newFault = {
    ...fault,
    reportedAt: new Date().toISOString(),
    fixed: false,
  };
  const faultsCol = collection(db, 'faults');
  const docRef = await addDoc(faultsCol, newFault);
  return { id: docRef.id, ...newFault } as Fault;
};

export const updateFault = async (id: string, fault: Partial<Fault>): Promise<void> => {
  const faultDoc = doc(db, 'faults', id);
  await updateDoc(faultDoc, fault);
};

export const deleteFault = async (id: string): Promise<void> => {
  const faultDoc = doc(db, 'faults', id);
  await deleteDoc(faultDoc);
};

// --- Payments ---
export const getPayments = async (apartmentId?: string, monthYear?: string): Promise<Payment[]> => {
  let paymentsQuery = query(collection(db, 'payments'));
  if (apartmentId) {
    paymentsQuery = query(paymentsQuery, where('payerId', '==', apartmentId));
  }
  if (monthYear) {
    paymentsQuery = query(paymentsQuery, where('monthYear', '==', monthYear));
  }
  const paymentSnapshot = await getDocs(paymentsQuery);
  return paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
};

export const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> => {
  const paymentsCol = collection(db, 'payments');
  const newPayment = {
    ...payment,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(paymentsCol, newPayment);
  return { id: docRef.id, ...newPayment } as Payment;
};

export const updatePayment = async (id: string, payment: Partial<Payment>): Promise<void> => {
  const paymentDoc = doc(db, 'payments', id);
  await updateDoc(paymentDoc, payment);
};

export const deletePayment = async (id: string): Promise<void> => {
  const paymentDoc = doc(db, 'payments', id);
  await deleteDoc(paymentDoc);
};

export const subscribeToPayments = (
  callback: (payments: Payment[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  let paymentsQuery = query(collection(db, 'payments'));
  if (apartmentId) {
    paymentsQuery = query(paymentsQuery, where('payerId', '==', apartmentId));
  }
  if (monthYear) {
    paymentsQuery = query(paymentsQuery, where('monthYear', '==', monthYear));
  }
  return onSnapshot(paymentsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Payment);
    callback(payments);
  });
};

// --- Balance Sheets ---
export const getBalanceSheets = async (
  apartmentId?: string,
  monthYear?: string
): Promise<BalanceSheet[]> => {
  let sheetsQuery = query(collection(db, 'balanceSheets'));
  if (apartmentId) {
    sheetsQuery = query(sheetsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    sheetsQuery = query(sheetsQuery, where('monthYear', '==', monthYear));
  }
  const sheetSnapshot = await getDocs(sheetsQuery);
  return sheetSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      apartmentId: data.apartmentId,
      monthYear: data.monthYear,
      openingBalance: data.openingBalance,
      totalIncome: data.totalIncome,
      totalExpenses: data.totalExpenses,
      closingBalance: data.closingBalance,
    } as BalanceSheet;
  });
};

export const addBalanceSheet = async (sheet: Omit<BalanceSheet, 'id'>): Promise<BalanceSheet> => {
  const sheetsCol = collection(db, 'balanceSheets');
  const docRef = await addDoc(sheetsCol, sheet);
  return { id: docRef.id, ...sheet } as BalanceSheet;
};

export const updateBalanceSheet = async (
  id: string,
  sheet: Partial<BalanceSheet>
): Promise<void> => {
  const sheetDoc = doc(db, 'balanceSheets', id);
  await updateDoc(sheetDoc, sheet);
};

export const deleteBalanceSheet = async (id: string): Promise<void> => {
  const sheetDoc = doc(db, 'balanceSheets', id);
  await deleteDoc(sheetDoc);
};

export const subscribeToBalanceSheets = (
  callback: (sheets: BalanceSheet[]) => void,
  apartmentId?: string,
  monthYear?: string
) => {
  let sheetsQuery = query(collection(db, 'balanceSheets'));
  if (apartmentId) {
    sheetsQuery = query(sheetsQuery, where('apartmentId', '==', apartmentId));
  }
  if (monthYear) {
    sheetsQuery = query(sheetsQuery, where('monthYear', '==', monthYear));
  }
  return onSnapshot(sheetsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const sheets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        apartmentId: data.apartmentId,
        monthYear: data.monthYear,
        openingBalance: data.openingBalance,
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        closingBalance: data.closingBalance,
      } as BalanceSheet;
    });
    callback(sheets);
  });
};

// --- Caching & Real-time Listeners ---
// Use client-side caching (React Context, SWR, React Query) for frequently accessed data (users, categories).
// Only use onSnapshot for UI elements that require real-time updates.
