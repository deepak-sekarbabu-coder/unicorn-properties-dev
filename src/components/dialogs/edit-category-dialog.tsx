'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { Category } from '@/lib/types';

import { CategoryIcon } from '@/components/icons/category-icon';
import { Icons } from '@/components/icons/icons';
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

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'An icon is required'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface EditCategoryDialogProps {
  children: React.ReactNode;
  category: Category;
  onUpdateCategory: (category: Category) => void;
}

export function EditCategoryDialog({
  children,
  category,
  onUpdateCategory,
}: EditCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category.name,
      icon: category.icon,
    },
  });

  React.useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon,
      });
    }
  }, [category, form]);

  const onSubmit = (data: CategoryFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      const updatedCategory = { ...category, name: data.name, icon: data.icon };
      onUpdateCategory(updatedCategory);
      toast('Category Updated', {
        description: `The category has been updated.`,
      });
      setIsSaving(false);
      setOpen(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CategoryIcon name={category.icon as keyof typeof Icons} className="h-10 w-10" />
            <DialogTitle>Edit Category</DialogTitle>
          </div>
          <DialogDescription>Update the details for this category.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Groceries" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="icon"
              render={() => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <Input placeholder="Icon name" value={category.icon} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
