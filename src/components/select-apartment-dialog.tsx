
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const apartmentSchema = z.object({
  apartment: z.string().min(1, 'Please select an apartment.'),
});

type ApartmentFormValues = z.infer<typeof apartmentSchema>;

const apartmentList = ['F1', 'F2', 'S1', 'S2', 'T1', 'T2', 'G1'];

interface SelectApartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  onSave: (apartment: string) => void;
}

export function SelectApartmentDialog({ open, onOpenChange, user, onSave }: SelectApartmentDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<ApartmentFormValues>({
    resolver: zodResolver(apartmentSchema),
  });

  const onSubmit = (data: ApartmentFormValues) => {
    setIsSaving(true);
    onSave(data.apartment);
    toast({
      title: 'Apartment Saved!',
      description: `Welcome to apartment ${data.apartment}, ${user.name}!`,
    });
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome, {user.name}!</DialogTitle>
          <DialogDescription>
            Please select your apartment number to complete your profile setup.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apartment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apartment Number</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your apartment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apartmentList.map(apt => (
                        <SelectItem key={apt} value={apt}>
                          {apt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save and Continue
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
