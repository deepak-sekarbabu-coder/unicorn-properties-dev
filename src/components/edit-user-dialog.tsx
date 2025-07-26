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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { Loader2, UserCircle, KeyRound } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['user', 'admin']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface EditUserDialogProps {
  children: React.ReactNode;
  user: User;
  onUpdateUser: (user: User) => void;
}

export function EditUserDialog({ children, user, onUpdateUser }: EditUserDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    },
  });

  React.useEffect(() => {
    if (user) {
        form.reset({
            name: user.name,
            email: user.email,
            role: user.role || 'user',
        })
    }
  }, [user, form]);

  const onSubmit = (data: UserFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
        const updatedUser = { ...user, ...data };
        onUpdateUser(updatedUser);
        toast({
          title: 'User Updated',
          description: `Information for ${data.name} has been updated.`,
        });
        setIsSaving(false);
        setOpen(false);
    }, 1000);
  };
  
  const handleResetPassword = () => {
    // In a real app, this would trigger a password reset flow.
    // Here, we just notify the admin what the password is.
    toast({
        title: "Password Reset",
        description: `Password for ${user.name} has been reset to "password".`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
                <UserCircle className="h-10 w-10 text-muted-foreground" />
                <DialogTitle>Edit User</DialogTitle>
            </div>
          <DialogDescription>
            Update the details for this user account.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={handleResetPassword}>
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
