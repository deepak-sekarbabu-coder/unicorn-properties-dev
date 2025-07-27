import { updateExpense } from './firestore';
import type { Apartment, Expense } from './types';

/**
 * Migrates old expense format to new format with apartment-based division
 */
export async function migrateExpenseToNewFormat(
  expense: Expense,
  apartments: Apartment[]
): Promise<Expense> {
  // If expense already has the new fields, return as is
  if (
    expense.owedByApartments &&
    expense.perApartmentShare !== undefined &&
    expense.paidByApartments
  ) {
    return expense;
  }

  console.log('[migrateExpenseToNewFormat] Migrating expense:', expense.description);

  // Get all apartment IDs
  const allApartmentIds = apartments.map(apt => apt.id);

  // Calculate per-apartment share (divide by total apartments)
  const perApartmentShare = expense.amount / allApartmentIds.length;

  // All apartments except the paying one owe money
  const owedByApartments = allApartmentIds.filter(id => id !== expense.paidByApartment);

  // Create the migrated expense
  const migratedExpense: Expense = {
    ...expense,
    owedByApartments,
    perApartmentShare,
    paidByApartments: [], // No one has paid yet
  };

  // Update in database
  try {
    await updateExpense(expense.id, {
      owedByApartments,
      perApartmentShare,
      paidByApartments: [],
    });
    console.log('[migrateExpenseToNewFormat] Successfully migrated expense:', expense.description);
  } catch (error) {
    console.error('[migrateExpenseToNewFormat] Failed to migrate expense:', error);
  }

  return migratedExpense;
}

/**
 * Migrates all expenses to the new format
 */
export async function migrateAllExpenses(
  expenses: Expense[],
  apartments: Apartment[]
): Promise<Expense[]> {
  console.log('[migrateAllExpenses] Starting migration of', expenses.length, 'expenses');

  const migratedExpenses: Expense[] = [];

  for (const expense of expenses) {
    const migratedExpense = await migrateExpenseToNewFormat(expense, apartments);
    migratedExpenses.push(migratedExpense);
  }

  console.log('[migrateAllExpenses] Migration complete');
  return migratedExpenses;
}
