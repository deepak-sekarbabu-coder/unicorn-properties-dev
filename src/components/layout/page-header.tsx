'use client';

import { LogOut, PlusCircle, Settings } from 'lucide-react';
import * as React from 'react';

import type { Category, Expense, User } from '@/lib/types';

import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

type View = 'dashboard' | 'expenses' | 'admin' | 'analytics' | 'community';

interface PageHeaderProps {
    view: View;
    user: User | null;
    categories: Category[];
    users: User[];
    onAddExpense: (expenseData: Omit<Expense, 'id' | 'date'>) => void;
    onUpdateUser: (user: User) => void;
    onLogout: () => void;
}

export function PageHeader({
    view,
    user,
    categories,
    users,
    onAddExpense,
    onUpdateUser,
    onLogout,
}: PageHeaderProps) {
    let title = 'Dashboard';
    if (view === 'expenses') title = 'All Expenses';
    if (view === 'admin') title = 'Admin Panel';
    if (view === 'analytics') title = 'Analytics';
    if (view === 'community') title = 'Community Directory';

    return (
        <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-card px-4 sm:px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg sm:text-xl font-semibold truncate flex-1">{title}</h1>
            <div className="flex items-center gap-2 sm:gap-4">
                {user && (
                    <AddExpenseDialog
                        categories={categories}
                        users={users}
                        onAddExpense={onAddExpense}
                        currentUser={user}
                    >
                        <Button className="bg-accent hover:bg-accent/90">
                            <PlusCircle className="mr-2 h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add Expense</span>
                        </Button>
                    </AddExpenseDialog>
                )}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>
                                <p className="truncate">{user.name}</p>
                                <p className="font-normal text-muted-foreground truncate">
                                    {user.phone || user.email}
                                </p>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <UserProfileDialog user={user} onUpdateUser={onUpdateUser}>
                                <DropdownMenuItem onSelect={e => e.preventDefault()}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </DropdownMenuItem>
                            </UserProfileDialog>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}