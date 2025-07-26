"use client";

import * as React from 'react';
import {
  Bell,
  Home,
  LineChart,
  Package2,
  Settings,
  Users,
  PlusCircle,
  ChevronDown,
  UserCircle,
  LogOut,
  Trash2,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { User, Category, Expense } from '@/lib/types';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddCategoryDialog } from '@/components/add-category-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { EditCategoryDialog } from '@/components/edit-category-dialog';
import { CategoryIcon } from '@/components/category-icon';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useToast } from './hooks/use-toast';

type View = 'dashboard' | 'expenses' | 'admin';

interface ApartmentShareAppProps {
  initialUsers: User[];
  initialCategories: Category[];
  initialExpenses: Expense[];
}

export function ApartmentShareApp({ initialUsers, initialCategories, initialExpenses }: ApartmentShareAppProps) {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  const [view, setView] = React.useState<View>('dashboard');
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);

  const role = user?.role || 'user';

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const perUserShare = totalExpenses / users.length;

  const userBalances = React.useMemo(() => {
    return users.map(u => {
      const totalPaid = expenses
        .filter(e => e.paidBy === u.id)
        .reduce((acc, e) => acc + e.amount, 0);
      const balance = totalPaid - perUserShare;
      return { ...u, balance };
    });
  }, [users, expenses, perUserShare]);

  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    updateUser(updatedUser);
    setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    const userIndex = initialUsers.findIndex(u => u.id === updatedUser.id);
    if(userIndex !== -1){
        initialUsers[userIndex] = updatedUser;
    }
  };
  
  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories(currentCategories => currentCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  
  const handleAddCategory = (newCategoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...newCategoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    toast({
      title: 'Category Deleted',
      description: 'The category has been successfully removed.',
    });
  };


  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  React.useEffect(() => {
    if (role === 'user' && view === 'admin') {
      setView('dashboard');
    }
  }, [role, view]);

  const MainContent = () => {
    switch (view) {
      case 'admin':
        if (role !== 'admin') return <DashboardView />;
        return <AdminView />;
      case 'expenses':
        return <ExpensesView />;
      default:
        return <DashboardView />;
    }
  };
  
  const DashboardView = () => (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userBalances.map(user => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${user.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {user.balance >= 0 ? `+${user.balance.toFixed(2)}` : user.balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {user.balance >= 0 ? 'is owed' : 'owes'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
         <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>The last 5 expenses added to the group.</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpensesTable limit={5} />
            </CardContent>
          </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Upcoming due dates and payment reminders.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-4">
               <Bell className="h-6 w-6 text-accent" />
              <div className="grid gap-1">
                <p className="text-sm font-medium">Electricity Bill Due</p>
                <p className="text-sm text-muted-foreground">Due in 3 days. Please settle your balances.</p>
              </div>
            </div>
             <Separator />
            <div className="flex items-center gap-4">
              <Bell className="h-6 w-6 text-accent" />
              <div className="grid gap-1">
                <p className="text-sm font-medium">Settle up with Alex</p>
                <p className="text-sm text-muted-foreground">Alex covered the last grocery run.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ExpensesView = () => (
    <Card>
      <CardHeader>
        <CardTitle>All Expenses</CardTitle>
        <CardDescription>A complete log of all shared expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ExpensesTable />
      </CardContent>
    </Card>
  );

  const AdminView = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>Manage categories and view system logs.</CardDescription>
        </div>
        <AddCategoryDialog onAddCategory={handleAddCategory}>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Category
            </Button>
        </AddCategoryDialog>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Manage Categories</h3>
          <ul className="space-y-2">
            {categories.map(cat => (
              <li key={cat.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={cat.icon as any} />
                  <span>{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <EditCategoryDialog category={cat} onUpdateCategory={handleUpdateCategory}>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </EditCategoryDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the <strong>{cat.name}</strong> category.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
  
  const ExpensesTable = ({ limit }: { limit?: number }) => (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Paid by</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.slice(0, limit).map(expense => {
          const category = getCategoryById(expense.categoryId);
          const user = getUserById(expense.paidBy);
          return (
            <TableRow key={expense.id}>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-2">
                  {category && <CategoryIcon name={category.icon as any} className="h-9 w-9" />}
                   <div>
                      <p className="font-medium">{category?.name}</p>
                   </div>
                </div>
              </TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>{formatDistanceToNow(new Date(expense.date), { addSuffix: true })}</TableCell>
              <TableCell>{user?.name}</TableCell>
              <TableCell className="text-right font-medium">${expense.amount.toFixed(2)}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const PageHeader = () => {
    let title = "Dashboard";
    if (view === 'expenses') title = "All Expenses";
    if (view === 'admin') title = "Admin Panel";
    return (
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-4">
          <AddExpenseDialog categories={categories} users={users} onAddExpense={handleAddExpense}>
            <Button className="bg-accent hover:bg-accent/90">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </AddExpenseDialog>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserCircle className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <p>{user.name}</p>
                  <p className="font-normal text-muted-foreground">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <UserProfileDialog user={user} onUpdateUser={handleUpdateUser}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </DropdownMenuItem>
                </UserProfileDialog>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
    )
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Package2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">ApartmentShare</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setView('dashboard')} isActive={view === 'dashboard'} tooltip="Dashboard">
                <Home />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setView('expenses')} isActive={view === 'expenses'} tooltip="All Expenses">
                <LineChart />
                All Expenses
              </SidebarMenuButton>
            </SidebarMenuItem>
            {role === 'admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setView('admin')} isActive={view === 'admin'} tooltip="Admin">
                  <Settings />
                  Admin
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <Card className="m-2">
             <CardHeader className="p-3">
              <CardTitle>Total This Month</CardTitle>
              <CardDescription>Sum of all shared expenses.</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
               <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            </CardContent>
          </Card>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <PageHeader />
          <main className="flex-1 p-4 sm:p-6 bg-background">
            <MainContent />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

    