'use client';

import { format } from 'date-fns';
import { Check, Receipt, Trash2, Users, X } from 'lucide-react';

import { useState } from 'react';

import {
  calculateExpenseAmounts,
  markApartmentAsPaid,
  markApartmentAsUnpaid,
} from '@/lib/expense-utils';
import { updateExpense } from '@/lib/firestore';
import type { Apartment, Expense, User } from '@/lib/types';

import { CategoryIcon } from '@/components/category-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useToast } from '@/hooks/use-toast';

interface ExpenseItemProps {
  expense: Expense;
  apartments: Apartment[];
  users: User[];
  categories?: { id: string; name: string; icon?: string }[];
  currentUserApartment?: string;
  isOwner: boolean; // Whether current user's apartment is the one that paid
  onExpenseUpdate?: (updatedExpense: Expense) => void;
  currentUserRole?: string; // 'admin' or 'user'
  onExpenseDelete?: (expenseId: string) => void;
}

export function ExpenseItem({
  expense,
  apartments,
  users,
  categories,
  currentUserApartment,
  isOwner,
  onExpenseUpdate,
  currentUserRole,
  onExpenseDelete,
}: ExpenseItemProps) {
  const { toast } = useToast();
  const [loadingMap, setLoadingMap] = useState<{ [apartmentId: string]: boolean }>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const calculation = calculateExpenseAmounts(expense);

  // Check if this is a cleaning expense
  const category = categories?.find(c => c.id === expense.categoryId);
  const isCleaningExpense = category?.name.toLowerCase() === 'cleaning';

  // Helper function to get users for an apartment
  const getUsersForApartment = (apartmentId: string) => {
    return users.filter(user => user.apartment === apartmentId);
  };

  // Helper function to format apartment display with users
  const formatApartmentWithUsers = (apartmentId: string, showYou: boolean = false) => {
    const apartment = apartments.find(apt => apt.id === apartmentId);
    const apartmentUsers = getUsersForApartment(apartmentId);
    const userNames = apartmentUsers.map(user => user.name).join(', ');

    const apartmentName = apartment?.name || 'Unknown Apartment';
    const youSuffix = showYou ? ' (You)' : '';

    if (userNames) {
      return `${apartmentName} - ${userNames}${youSuffix}`;
    }
    return `${apartmentName}${youSuffix}`;
  };

  const handleMarkPaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    if (!isOwner && !isCurrentUserPayment) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));
    try {
      const updatedExpense = markApartmentAsPaid(expense, apartmentId);
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments });
      onExpenseUpdate?.(updatedExpense);

      const apartment = apartments.find(apt => apt.id === apartmentId);
      const isUserMarkingOwnPayment = isCurrentUserPayment && !isOwner;

      toast({
        title: 'Payment Marked',
        description: isUserMarkingOwnPayment
          ? 'Your payment has been marked as paid'
          : `${apartment?.name || 'Apartment'} marked as paid`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };

  const handleMarkUnpaid = async (apartmentId: string) => {
    const isCurrentUserPayment = apartmentId === currentUserApartment;
    if (!isOwner && !isCurrentUserPayment) return;

    setLoadingMap(prev => ({ ...prev, [apartmentId]: true }));
    try {
      const updatedExpense = markApartmentAsUnpaid(expense, apartmentId);
      await updateExpense(expense.id, { paidByApartments: updatedExpense.paidByApartments });
      onExpenseUpdate?.(updatedExpense);

      const apartment = apartments.find(apt => apt.id === apartmentId);
      const isUserMarkingOwnPayment = isCurrentUserPayment && !isOwner;

      toast({
        title: 'Payment Unmarked',
        description: isUserMarkingOwnPayment
          ? 'Your payment has been marked as unpaid'
          : `${apartment?.name || 'Apartment'} marked as unpaid`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    } finally {
      setLoadingMap(prev => ({ ...prev, [apartmentId]: false }));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {category?.icon && (
              <CategoryIcon name={category.icon} className="mt-1 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <CardTitle className="text-lg">{expense.description}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {category && (
                  <>
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span>•</span>
                  </>
                )}
                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                <span>•</span>
                <span>Paid by {formatApartmentWithUsers(expense.paidByApartment)}</span>
                {expense.receipt && (
                  <>
                    <span>•</span>
                    <Receipt className="h-4 w-4" />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-2xl font-bold">₹{(Number(expense.amount) || 0).toFixed(2)}</div>
            {calculation.adjustedAmount !== calculation.originalAmount && (
              <div className="text-sm text-muted-foreground">
                Outstanding:{' '}
                <span className="text-red-600 font-medium">
                  ₹{(Number(calculation.adjustedAmount) || 0).toFixed(2)}
                </span>
              </div>
            )}
            {/* Admin Delete Button */}
            {currentUserRole === 'admin' && onExpenseDelete && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-100 mt-2"
                  onClick={() => setShowDeleteDialog(true)}
                  title="Delete Expense"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Expense</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this expense? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setShowDeleteDialog(false);
                          onExpenseDelete(expense.id);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Payment Status Overview - Hidden for cleaning expenses */}
        {!isCleaningExpense && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {calculation.paidApartments.length} of {expense.owedByApartments?.length || 0} paid
              </span>
            </div>
            <div className="flex gap-2">
              <Badge variant={calculation.unpaidApartments.length === 0 ? 'default' : 'secondary'}>
                {calculation.unpaidApartments.length === 0 ? 'Fully Paid' : 'Pending'}
              </Badge>
            </div>
          </div>
        )}

        {/* Apartment Payment Status - Hidden for cleaning expenses */}
        {!isCleaningExpense && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Payment Status by Apartment</h4>
            <div className="space-y-2">
              {expense.owedByApartments?.map(apartmentId => {
                const isPaid = calculation.paidApartments.includes(apartmentId);
                const isCurrentUser = apartmentId === currentUserApartment;

                return (
                  <div
                    key={apartmentId}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      isPaid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${isPaid ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="text-sm font-medium">
                        {formatApartmentWithUsers(apartmentId, isCurrentUser)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ₹{(Number(expense.perApartmentShare) || 0).toFixed(2)}
                      </span>

                      {(isOwner || isCurrentUser) && (
                        <div className="flex gap-1">
                          {isPaid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkUnpaid(apartmentId)}
                              disabled={!!loadingMap[apartmentId]}
                              className="h-6 px-2"
                              title={
                                isCurrentUser && !isOwner
                                  ? 'Mark as unpaid'
                                  : 'Mark as unpaid (Owner)'
                              }
                            >
                              {loadingMap[apartmentId] ? (
                                <svg
                                  className="animate-spin mr-1 h-3 w-3 text-gray-500"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="8"
                                    cy="8"
                                    r="7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M15 8a7 7 0 01-7 7V13a5 5 0 005-5h2z"
                                  />
                                </svg>
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkPaid(apartmentId)}
                              disabled={!!loadingMap[apartmentId]}
                              className="h-6 px-2"
                              title={
                                isCurrentUser && !isOwner ? 'Mark as paid' : 'Mark as paid (Owner)'
                              }
                            >
                              {loadingMap[apartmentId] ? (
                                <svg
                                  className="animate-spin mr-1 h-3 w-3 text-gray-500"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="8"
                                    cy="8"
                                    r="7"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M15 8a7 7 0 01-7 7V13a5 5 0 005-5h2z"
                                  />
                                </svg>
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      {!isOwner && !isCurrentUser && (
                        <Badge variant={isPaid ? 'default' : 'destructive'} className="text-xs">
                          {isPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Receipt Dialog */}
        {expense.receipt && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Receipt className="h-4 w-4 mr-2" />
                View Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Receipt - {expense.description}</DialogTitle>
                <DialogDescription>
                  Expense from {format(new Date(expense.date), 'MMMM d, yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={expense.receipt}
                  alt="Receipt"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
