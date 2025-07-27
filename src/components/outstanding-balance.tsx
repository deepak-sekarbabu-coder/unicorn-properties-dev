'use client';

import { AlertTriangle } from 'lucide-react';

import { calculateTotalOutstanding } from '@/lib/expense-utils';
import type { Expense } from '@/lib/types';

import { Card, CardContent } from '@/components/ui/card';

interface OutstandingBalanceProps {
  expenses: Expense[];
  currentUserApartment?: string;
}

export function OutstandingBalance({ expenses, currentUserApartment }: OutstandingBalanceProps) {
  if (!currentUserApartment) return null;

  const totalOutstanding = calculateTotalOutstanding(expenses, currentUserApartment);

  if (totalOutstanding <= 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">Total Outstanding Amount</p>
              <p className="text-sm text-red-600">
                Amount still owed to your apartment from shared expenses
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-700">-₹{totalOutstanding.toFixed(2)}</div>
            <p className="text-sm text-red-600">Still owed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
