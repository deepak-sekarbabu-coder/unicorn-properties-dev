'use client';

import { format } from 'date-fns';
import { AlertCircle, CalendarIcon, CheckCircle2, Send, X } from 'lucide-react';

import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { distributePayment, sendPaymentRequests } from '@/lib/payment-utils';
import type { Apartment } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast-provider';

const categories = [
  { id: 'utilities', name: 'Utilities' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'repairs', name: 'Repairs' },
  { id: 'security', name: 'Security' },
  { id: 'cleaning', name: 'Cleaning' },
  { id: 'other', name: 'Other' },
];

interface PaymentDistributionProps {
  apartments: Apartment[];
  currentApartmentId?: string;
}

export function PaymentDistribution({ apartments, currentApartmentId }: PaymentDistributionProps) {
  const { user } = useAuth();
  const toast = useToast();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('utilities');
  const [dueDate, setDueDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default to 7 days from now
    return date;
  });
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');
  const [distribution, setDistribution] = useState<ReturnType<typeof distributePayment> | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = () => {
    setError('');

    // Validate input
    if (!selectedApartmentId) {
      setError('Please select an apartment');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    const payingApartment = apartments.find(apt => apt.id === selectedApartmentId);
    if (!payingApartment) {
      setError('Selected apartment not found');
      return;
    }

    // Calculate distribution
    const result = distributePayment(
      amountValue,
      payingApartment,
      apartments,
      description || 'Shared expense',
      categories.find(c => c.id === category)?.name || 'Utilities',
      dueDate
    );

    setDistribution(result);
  };

  const handleReset = () => {
    setAmount('');
    setDescription('');
    setCategory('utilities');
    setSelectedApartmentId('');
    setDistribution(null);
    setError('');
  };

  const handleSendRequests = async () => {
    if (!distribution || !user) return;

    setIsSending(true);
    setError('');

    try {
      await sendPaymentRequests(distribution, user.uid, currentApartmentId || '');

      toast.success('Payment requests sent', {
        description: 'Payment requests have been sent to the selected apartments.',
      });

      // Reset form
      handleReset();
    } catch (error) {
      console.error('Error sending payment requests:', error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'An error occurred while sending payment requests.';
      toast.error('Error sending payment requests', {
        description: errorMessage,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Distribution</CardTitle>
            <CardDescription>Calculate and request payments from other apartments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-lg font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="E.g., July electricity bill"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Paying Apartment</Label>
              <Select
                value={selectedApartmentId}
                onValueChange={setSelectedApartmentId}
                disabled={!apartments.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select apartment" />
                </SelectTrigger>
                <SelectContent>
                  {apartments.map(apartment => (
                    <SelectItem
                      key={apartment.id}
                      value={apartment.id}
                      disabled={apartment.id === currentApartmentId}
                    >
                      {apartment.name}
                      {apartment.id === currentApartmentId && ' (Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    disabled={date => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            onClick={handleCalculate}
            disabled={!amount || !selectedApartmentId}
            className="flex-1"
          >
            Calculate Distribution
          </Button>
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset
          </Button>
        </div>

        {distribution && (
          <div className="mt-8 space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-green-800">Payment Distribution</h3>
                  <p className="text-sm text-green-700 mt-1">
                    {distribution.otherApartments.length} apartments will each owe{' '}
                    <span className="font-semibold">
                      ₹{distribution.otherApartments[0]?.share.toFixed(2)}
                    </span>{' '}
                    to {distribution.payingApartment.name}.
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {distribution.payingApartment.id === currentApartmentId ? (
                      <span>
                        Your apartment is owed{' '}
                        <span className="font-semibold">
                          ₹{distribution.totalAmount.toFixed(2)}
                        </span>{' '}
                        in total.
                      </span>
                    ) : (
                      <span>
                        Your apartment&apos;s share:{' '}
                        <span className="font-semibold">
                          ₹
                          {distribution.otherApartments
                            .find(a => a.apartment.id === currentApartmentId)
                            ?.share.toFixed(2) || '0.00'}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg divide-y">
              <div className="grid grid-cols-2 p-4 bg-gray-50 rounded-t-lg">
                <div>
                  <h4 className="font-medium">Expense Details</h4>
                  <p className="text-sm text-muted-foreground">{distribution.description}</p>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    <div className="text-lg font-semibold">
                      ₹{distribution.totalWithPayerShare.toFixed(2)}
                    </div>
                    {distribution.payingApartment.id === currentApartmentId && (
                      <div className="text-sm text-muted-foreground">
                        (Your share:{' '}
                        <span className="text-red-600">
                          -₹
                          {(distribution.totalWithPayerShare - distribution.totalAmount).toFixed(2)}
                        </span>
                        )
                      </div>
                    )}
                  </div>
                  {distribution.dueDate && (
                    <div className="text-sm text-muted-foreground">
                      Due by {format(distribution.dueDate, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-b">
                <h4 className="font-medium mb-3">Payment Distribution</h4>
                <div className="space-y-3">
                  {distribution.otherApartments.map(({ apartment, share }) => (
                    <div key={apartment.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span>{apartment.name}</span>
                      </div>
                      <span className="font-medium">₹{share.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-b-lg">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="text-sm text-muted-foreground text-center sm:text-left">
                    {distribution.otherApartments.length} apartments will be notified
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="flex-1"
                      disabled={isSending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSendRequests} className="flex-1" disabled={isSending}>
                      {isSending ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Requests
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
