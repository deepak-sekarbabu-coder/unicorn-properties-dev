import { Download, PlusCircle } from 'lucide-react';

import * as React from 'react';

import * as firestore from '@/lib/firestore';
import type { BalanceSheet, Payment, User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

import AddPaymentDialog from '@/components/dialogs/add-payment-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LedgerViewProps {
  payments: Payment[];
  balanceSheets: BalanceSheet[];
  users: User[];
}

export function LedgerView({ payments, balanceSheets, users }: LedgerViewProps) {
  const { user: authUser } = useAuth();
  
  // Helper to get user name by ID
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;
  // Helper to check if user is admin or incharge
  const isApprover = (id: string) => {
    const user = users.find(u => u.id === id);
    return user && (user.role === 'admin' || user.role === 'incharge');
  };

  // State for delete confirmation
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const handleExportPaymentsCSV = () => {
    const headers = [
      'Payer',
      'Payee',
      'Amount',
      'Status',
      'Created At',
      'Approved By',
      'MonthYear',
    ];
    const rows = payments.map(p => [
      getUserName(p.payeeId), // Payer column now shows payeeId (who paid)
      'In Charge', // Payee column is always 'In Charge'
      p.amount,
      p.status,
      p.createdAt,
      p.approvedBy && isApprover(p.approvedBy) ? getUserName(p.approvedBy) : '',
      p.monthYear,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ledger-payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // CSV export for balance sheets
  const handleExportBalanceSheetsCSV = () => {
    const headers = ['Apartment', 'MonthYear', 'Opening', 'Income', 'Expenses', 'Closing'];
    const rows = balanceSheets.map(b => [
      b.apartmentId,
      b.monthYear,
      b.openingBalance,
      b.totalIncome,
      b.totalExpenses,
      b.closingBalance,
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'balance-sheets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  // Delete payment handler
  const handleDeletePayment = async (paymentId: string) => {
    setIsDeleting(true);
    try {
      await firestore.deletePayment(paymentId);
      setDeleteId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Use auth context for current user, but fallback to users array for other operations
  const currentUser = authUser || 
    users.find(
      u => u.id === (typeof window !== 'undefined' ? window.localStorage.getItem('userId') : '')
    ) || users[0];

  // Payment creation handler
  const handleAddPayment = async (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
  }) => {
    let receiptURL = '';
    if (data.receiptFile) {
      // Simulate upload, in real app use Firebase Storage
      receiptURL = URL.createObjectURL(data.receiptFile);
    }
    const paymentData: {
      payerId: string;
      payeeId: string;
      amount: number;
      status: 'pending' | 'approved' | 'rejected';
      monthYear: string;
      receiptURL: string;
      expenseId?: string;
    } = {
      payerId: currentUser.id,
      payeeId: data.payeeId,
      amount: data.amount,
      status: 'pending',
      monthYear: data.monthYear,
      receiptURL,
    };

    // Only add expenseId if it is a non-empty string
    if (data.expenseId && typeof data.expenseId === 'string' && data.expenseId.trim() !== '') {
      paymentData.expenseId = data.expenseId;
    }

    await firestore.addPayment(paymentData);
  };

  // Admin approval handlers
  const handleApprovePayment = async (paymentId: string) => {
    // Only allow admin to approve and set their name
    if (currentUser.role === 'admin') {
      // Use displayName if available, fallback to email, never 'New User'
      let approverName = currentUser.name;
      if (approverName === 'New User') {
        approverName = currentUser.email || currentUser.id;
      }
      await firestore.updatePayment(paymentId, {
        status: 'approved',
        approvedBy: currentUser.id,
        approvedByName: approverName,
      });
    }
  };
  const handleRejectPayment = async (paymentId: string) => {
    // Only allow admin to reject and set their name
    if (currentUser.role === 'admin') {
      await firestore.updatePayment(paymentId, { status: 'rejected', approvedBy: currentUser.id });
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Ledger Payments</CardTitle>
              <CardDescription>All payment transactions and statuses.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <AddPaymentDialog
                currentUser={currentUser}
                users={users}
                onAddPayment={handleAddPayment}
              >
                <Button className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                </Button>
              </AddPaymentDialog>
              <Button
                onClick={handleExportPaymentsCSV}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payer</TableHead>
                <TableHead>Payee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Approved By</TableHead>
                <TableHead>Month</TableHead>
                {currentUser.role === 'admin' && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  {/* Payer column: show payer name */}
                  <TableCell>{getUserName(payment.payerId)}</TableCell>
                  {/* Payee column: show payee name */}
                  <TableCell>{getUserName(payment.payeeId)}</TableCell>
                  <TableCell>{payment.amount}</TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{payment.createdAt}</TableCell>
                  <TableCell>
                    {(() => {
                      // Show approver name if available
                      if (payment.approvedByName) {
                        return payment.approvedByName;
                      }
                      if (payment.approvedBy === currentUser.id && currentUser.role === 'admin') {
                        return currentUser.name;
                      }
                      const approver = users.find(u => u.id === payment.approvedBy);
                      if (!approver) return '';
                      if (approver.role === 'admin') {
                        return approver.name;
                      }
                      return '';
                    })()}
                  </TableCell>
                  <TableCell>{payment.monthYear}</TableCell>
                  {currentUser.role === 'admin' && (
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {payment.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprovePayment(payment.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectPayment(payment.id)}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => setDeleteId(payment.id)}
                          disabled={isDeleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {/* Delete confirmation dialog rendered outside table rows */}
              {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                    <h2 className="text-lg font-semibold mb-2">Delete Payment</h2>
                    <p className="mb-4">
                      Are you sure you want to delete this payment? This action cannot be
                      undone.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setDeleteId(null)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDeletePayment(deleteId)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Monthly Balance Sheets</CardTitle>
              <CardDescription>Summary of balances per apartment per month.</CardDescription>
            </div>
            <Button
              onClick={handleExportBalanceSheetsCSV}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apartment</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Income</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balanceSheets.map(sheet => (
                <TableRow key={sheet.apartmentId + sheet.monthYear}>
                  <TableCell>{sheet.apartmentId}</TableCell>
                  <TableCell>{sheet.monthYear}</TableCell>
                  <TableCell>{sheet.openingBalance}</TableCell>
                  <TableCell>{sheet.totalIncome}</TableCell>
                  <TableCell>{sheet.totalExpenses}</TableCell>
                  <TableCell>{sheet.closingBalance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default LedgerView;
