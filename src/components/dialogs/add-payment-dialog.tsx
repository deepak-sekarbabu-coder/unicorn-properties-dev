import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import * as React from 'react';

import type { User } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AddPaymentDialogProps {
  currentUser: User;
  users: User[];
  onAddPayment: (data: {
    payeeId: string;
    amount: number;
    receiptFile?: File;
    expenseId?: string;
    monthYear: string;
  }) => void;
  children: React.ReactNode;
}

export function AddPaymentDialog({
  currentUser,
  users,
  onAddPayment,
  children,
}: AddPaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [payeeId, setPayeeId] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [receiptFile, setReceiptFile] = React.useState<File | undefined>(undefined);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [expenseId, setExpenseId] = React.useState<string | undefined>(undefined);

  const selectedPayee = users.find(u => u.id === payeeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payeeId || !amount || !selectedDate) return;

    const monthYear = format(selectedDate, 'yyyy-MM');
    const paymentData: {
      payeeId: string;
      amount: number;
      receiptFile?: File;
      monthYear: string;
      expenseId?: string;
    } = {
      payeeId,
      amount: Number(amount),
      receiptFile,
      monthYear,
    };
    // Only add expenseId if it is a non-empty string
    if (expenseId && typeof expenseId === 'string' && expenseId.trim() !== '') {
      paymentData.expenseId = expenseId;
    }
    onAddPayment(paymentData);
    setOpen(false);
    setPayeeId('');
    setAmount('');
    setReceiptFile(undefined);
    setSelectedDate(undefined);
    setExpenseId(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Payee</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={payeeId}
              onChange={e => setPayeeId(e.target.value)}
              required
            >
              <option value="">Select Payee</option>
              {users
                .filter(u => u.id !== currentUser.id)
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            {selectedPayee && (
              <div className="mt-2 px-3 py-2 rounded bg-blue-50 text-blue-900 text-sm font-medium border border-blue-200">
                Apartment: <span className="font-semibold">{selectedPayee.apartment}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <Input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Month & Year</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMMM yyyy') : 'Select month and year'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={date => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Receipt (optional)</label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={e => setReceiptFile(e.target.files?.[0])}
            />
            {receiptFile && (
              <p className="text-sm text-gray-600 mt-1">Selected: {receiptFile.name}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit">Add Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddPaymentDialog;
