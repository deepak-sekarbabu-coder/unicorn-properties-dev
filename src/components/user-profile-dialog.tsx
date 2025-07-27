'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { User } from '@/lib/types';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { useToast } from '@/components/ui/toast-provider';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  phone: z.string().optional(),
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

type ProfileFormValues = z.infer<typeof profileSchema>;

interface UserProfileDialogProps {
  children: React.ReactNode;
  user: User;
  onUpdateUser: (user: User) => void;
}

export function UserProfileDialog({ children, user, onUpdateUser }: UserProfileDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      avatar: undefined,
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user, form]);

  const fileRef = form.register('avatar');

  const onSubmit = async (data: ProfileFormValues) => {
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

    const updatedUser = { ...user, name: data.name, phone: data.phone, avatar: avatarDataUrl };
    onUpdateUser(updatedUser);
    toast('Profile Updated', {
      description: 'Your profile information has been successfully updated.',
    });
    setIsSaving(false);
    setOpen(false);
  };

  const handleResetPassword = () => {
    // In a real app, this would trigger a password reset flow.
    // Here, we just notify the user what the password is.
    toast('Password Reset', {
      description: `Your password has been reset to "password".`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and profile information.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your@email.com" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Apartment</FormLabel>
                <FormControl>
                  <Input value={user.apartment || 'Not Assigned'} disabled />
                </FormControl>
              </FormItem>
            </div>
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
                  <FormLabel>Change Profile Picture</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...fileRef} />
                  </FormControl>
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
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
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
