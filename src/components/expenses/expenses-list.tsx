'use client';

import * as React from 'react';

import type { Apartment, Category, Expense, User } from '@/lib/types';

import { ExpenseItem } from '@/components/expense-item';

interface ExpensesListProps {
    expenses: Expense[];
    limit?: number;
    apartments: Apartment[];
    users: User[];
    categories: Category[];
    currentUserApartment: string | undefined;
    currentUserRole: string;
    onExpenseUpdate: (expense: Expense) => void;
    onExpenseDelete?: (expenseId: string) => void;
}

export function ExpensesList({
    expenses,
    limit,
    apartments,
    users,
    categories,
    currentUserApartment,
    currentUserRole,
    onExpenseUpdate,
    onExpenseDelete,
}: ExpensesListProps) {
    const relevantExpenses = limit
        ? expenses
            .slice(0, limit)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantExpenses.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No expenses found.</div>;
    }

    return (
        <div className="space-y-4">
            {relevantExpenses.map(expense => (
                <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    apartments={apartments}
                    users={users}
                    categories={categories}
                    currentUserApartment={currentUserApartment}
                    isOwner={expense.paidByApartment === currentUserApartment}
                    onExpenseUpdate={onExpenseUpdate}
                    currentUserRole={currentUserRole}
                    onExpenseDelete={currentUserRole === 'admin' ? onExpenseDelete : undefined}
                />
            ))}
        </div>
    );
}