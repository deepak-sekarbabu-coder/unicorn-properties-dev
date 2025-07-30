'use client';

import { format } from 'date-fns';
import { FileDown, Search } from 'lucide-react';

import * as React from 'react';

import type { Apartment, Category, Expense, User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useToast } from '@/hooks/use-toast';

interface ExpensesViewProps {
  expenses: Expense[];
  categories: Category[];
  apartments: Apartment[];
  users: User[];
  expenseSearch: string;
  setExpenseSearch: (search: string) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  filterPaidBy: string;
  setFilterPaidBy: (paidBy: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  filteredExpenses: Expense[];
  expenseMonths: string[];
  onClearFilters: () => void;
  ExpensesList: React.ComponentType<any>;
  currentUserApartment: string | undefined;
  currentUserRole: string;
  onExpenseUpdate: (expense: Expense) => void;
  onExpenseDelete?: (expenseId: string) => void;
}

export function ExpensesView({
  expenses,
  categories,
  apartments,
  users,
  expenseSearch,
  setExpenseSearch,
  filterCategory,
  setFilterCategory,
  filterPaidBy,
  setFilterPaidBy,
  filterMonth,
  setFilterMonth,
  filteredExpenses,
  expenseMonths,
  onClearFilters,
  ExpensesList,
  currentUserApartment,
  currentUserRole,
  onExpenseUpdate,
  onExpenseDelete,
}: ExpensesViewProps) {
  const { toast } = useToast();

  const handleExportCSV = () => {
    const csvRows = [];
    const headers = [
      'ID',
      'Description',
      'Amount',
      'Date',
      'Paid By Apartment',
      'Category',
      'Receipt URL',
    ];
    csvRows.push(headers.join(','));

    for (const expense of expenses) {
      const paidByApartment = expense.paidByApartment;
      const apartment = apartments.find(a => a.id === paidByApartment);
      const apartmentName = apartment?.name || paidByApartment;
      const category = categories.find(c => c.id === expense.categoryId)?.name || 'N/A';
      const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');
      const values = [
        expense.id,
        `"${expense.description}"`,
        expense.amount,
        formattedDate,
        apartmentName,
        category,
        expense.receipt || '',
      ].join(',');
      csvRows.push(values);
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Your expenses have been exported to expenses.csv.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                A complete log of all shared expenses for your apartment.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search expenses..."
                  className="pl-8 w-full sm:w-[200px] lg:w-[300px]"
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaidBy} onValueChange={setFilterPaidBy}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by paid by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apartments</SelectItem>
                {apartments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {expenseMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(`${month}-02`), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              onClick={onClearFilters}
              className="sm:col-span-2 lg:col-span-1"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExpensesList
          expenses={filteredExpenses}
          apartments={apartments}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          currentUserRole={currentUserRole}
          onExpenseUpdate={onExpenseUpdate}
          onExpenseDelete={onExpenseDelete}
        />
      </CardContent>
    </Card>
  );
}
