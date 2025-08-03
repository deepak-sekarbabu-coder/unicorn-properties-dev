'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { User } from '@/lib/types';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast-provider';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const apartmentList = ['G1', 'F1', 'F2', 'S1', 'S2', 'T1', 'T2'];

const userSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['user', 'admin']),
  propertyRole: z.enum(['tenant', 'owner']).optional(),
  apartment: z.string().optional(),
  avatar: z
    .any()
    .optional()
    .refine(
      files => !files || files.length === 0 || files[0].size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      files => !files || files.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only .jpg, .jpeg, .png and .webp formats are supported.'
    ),
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
      phone: user.phone || '',
      role: user.role || 'user',
      propertyRole: user.propertyRole,
      apartment: user.apartment || '',
      avatar: undefined,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role || 'user',
        propertyRole: user.propertyRole,
        apartment: user.apartment || '',
      });
    }
  }, [user, form]);

  const fileRef = form.register('avatar');

  const onSubmit = async (data: UserFormValues) => {
    setIsSaving(true);
    let avatarDataUrl: string | undefined = user.avatar;
    if (data.avatar && data.avatar.length > 0) {
      const file = data.avatar[0];
      const reader = new FileReader();
      reader.readAsDataURL(file);
      avatarDataUrl = await new Promise(resolve => {
        reader.onload = () => resolve(reader.result as string);
      });
    }

    const updatedUser: User = {
      ...user,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      propertyRole: data.propertyRole,
      apartment: data.apartment || '',
      avatar: avatarDataUrl,
    };
    onUpdateUser(updatedUser);
    toast('User Updated', {
      description: `Information for ${data.name} has been updated.`,
    });
    setIsSaving(false);
    setOpen(false);
  };

  const handleResetPassword = () => {
    // In a real app, this would trigger a password reset flow.
    // Here, we just notify the admin what the password is.
    toast('Password Reset', {
      description: `Password for ${user.name} has been reset to "password".`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
            </Avatar>
            <DialogTitle>Edit User</DialogTitle>
          </div>
          <DialogDescription>Update the details for this user account.</DialogDescription>
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
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., +91 98765 43210" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel>Profile Picture</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...fileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select system role" />
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
              <FormField
                control={form.control}
                name="propertyRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apartment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an apartment" />
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
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetPassword}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Password
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto order-1 sm:order-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
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
