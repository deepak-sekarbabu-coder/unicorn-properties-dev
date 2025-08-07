'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import * as React from 'react';

import type { Category } from '@/lib/types';

import { CategoryIcon } from '@/components/icons/category-icon';
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
import { Spinner } from '@/components/ui/spinner';

import { useToast } from '@/hooks/use-toast';

// Updated import path

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'An icon is required'),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface AddCategoryDialogProps {
  children: React.ReactNode;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
}

const commonEmojis = ['🏠', '🍕', '🛒', '⚡', '🚗', '🏥', '🎬', '📱', '💡', '🧹', '🔧', '🎉'];

export function AddCategoryDialog({ children, onAddCategory }: AddCategoryDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: '',
    },
  });

  const onSubmit = (data: CategoryFormValues) => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      onAddCategory(data);
      toast({
        title: 'Category Added',
        description: `The "${data.name}" category has been created.`,
      });
      setIsSaving(false);
      setOpen(false);
      form.reset();
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>Create a new category for tracking expenses.</DialogDescription>
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Input placeholder="Enter emoji or icon name (e.g., 🏠 or Zap)" {...field} />
                    </FormControl>
                    <div className="flex flex-wrap gap-2">
                      <p className="text-sm text-muted-foreground w-full">Quick select:</p>
                      {commonEmojis.map(emoji => (
                        <Button
                          key={emoji}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => field.onChange(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                    {field.value && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <CategoryIcon name={field.value} className="h-6 w-6" />
                        <span className="text-sm">Preview</span>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" /> Adding...
                  </span>
                ) : (
                  'Add Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
