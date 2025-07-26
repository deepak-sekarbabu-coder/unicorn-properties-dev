
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  FileDown,
  Search,
  Paperclip,
  PieChart,
  TrendingUp,
  Wallet,
  Megaphone,
  CheckCircle,
  XCircle,
  Send,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';

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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


import type { User, Category, Expense, Announcement } from '@/lib/types';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddCategoryDialog } from '@/components/add-category-dialog';
import { UserProfileDialog } from '@/components/user-profile-dialog';
import { EditCategoryDialog } from '@/components/edit-category-dialog';
import { AddUserDialog } from '@/components/add-user-dialog';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { CategoryIcon } from '@/components/category-icon';
import { format, formatDistanceToNow, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';

type View = 'dashboard' | 'expenses' | 'admin' | 'analytics';

interface ApartmentShareAppProps {
  initialUsers: User[];
  initialCategories: Category[];
  initialExpenses: Expense[];
  initialAnnouncements: Announcement[];
}

export function ApartmentShareApp({ initialUsers, initialCategories, initialExpenses, initialAnnouncements }: ApartmentShareAppProps) {
  const { user, logout, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = React.useState<View>('dashboard');
  const [users, setUsers] = React.useState<User[]>(initialUsers);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [expenses, setExpenses] = React.useState<Expense[]>(initialExpenses);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(initialAnnouncements);
  const [expenseSearch, setExpenseSearch] = React.useState('');
  const [userSearch, setUserSearch] = React.useState('');
  const [announcementMessage, setAnnouncementMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);


  const role = user?.role || 'user';

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const perUserShare = users.length > 0 ? totalExpenses / users.length : 0;

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful, scope is:', registration.scope);
        })
        .catch((err) => {
          console.log('Service Worker registration failed, error:', err);
        });
    }
  }, []);

  React.useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);

  const userBalances = React.useMemo(() => {
    return users.map(u => {
      const totalPaid = expenses
        .filter(e => e.paidBy === u.id)
        .reduce((acc, e) => acc + e.amount, 0);
      const balance = totalPaid - perUserShare;
      return { ...u, balance };
    });
  }, [users, expenses, perUserShare]);
  
  const loggedInUserBalance = user ? userBalances.find(b => b.id === user.id)?.balance : 0;
  const pendingAnnouncements = announcements.filter(a => a.status === 'pending');
  const approvedAnnouncements = announcements.filter(a => a.status === 'approved');

  const handleLogoClick = () => {
    if (user) {
      setView('dashboard');
    } else {
      router.push('/login');
    }
  };

  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense = await firestore.addExpense(newExpenseData);
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = async (expenseId: string) => {
    await firestore.deleteExpense(expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    toast({
        title: 'Expense Deleted',
        description: 'The expense has been successfully removed.',
    });
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    await firestore.updateUser(updatedUser.id, updatedUser);
    updateAuthUser(updatedUser);
    setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleUpdateCategory = async (updatedCategory: Category) => {
    await firestore.updateCategory(updatedCategory.id, updatedCategory);
    setCategories(currentCategories => currentCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
  };
  
  const handleAddCategory = async (newCategoryData: Omit<Category, 'id'>) => {
    const newCategory = await firestore.addCategory(newCategoryData);
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = async (categoryId: string) => {
    await firestore.deleteCategory(categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    toast({
      title: 'Category Deleted',
      description: 'The category has been successfully removed.',
    });
  };
  
  const handleAddUser = async (newUserData: Omit<User, 'id'>) => {
    const newUser = await firestore.addUser(newUserData);
    setUsers(prev => [...prev, newUser]);
  };

  const handleUpdateUserFromAdmin = async (updatedUser: User) => {
     await firestore.updateUser(updatedUser.id, updatedUser);
     setUsers(currentUsers => currentUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = async (userId: string) => {
    if (user?.id === userId) {
      toast({
        title: 'Action Prohibited',
        description: "You cannot delete your own account.",
        variant: 'destructive',
      });
      return;
    }
    await firestore.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: 'User Deleted',
      description: 'The user has been successfully removed.',
    });
  };

  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim() || !user) return;
    setIsSending(true);
    try {
        const newAnnouncement = await firestore.addAnnouncement(announcementMessage, user.id, role);
        if (newAnnouncement.status === 'approved') {
            setAnnouncements(prev => [newAnnouncement, ...prev]);
            toast({
                title: "Announcement Sent!",
                description: "Your message has been sent to all users."
            });
        } else {
             toast({
                title: "Announcement Submitted!",
                description: "Your message has been sent for admin review."
            });
        }
        setAnnouncementMessage('');
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to send announcement.",
            variant: "destructive"
        });
    } finally {
        setIsSending(false);
    }
  };

  const handleAnnouncementDecision = async (announcementId: string, decision: 'approved' | 'rejected') => {
    await firestore.updateAnnouncementStatus(announcementId, decision);
    if (decision === 'approved') {
        const approvedAnnouncement = announcements.find(a => a.id === announcementId)!;
        setAnnouncements(prev => prev.map(a => a.id === announcementId ? {...approvedAnnouncement, status: 'approved'} : a));
    } else {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    }
     toast({
        title: `Announcement ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The announcement has been ${decision}.`,
    });
  }

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const handleExportCSV = () => {
    const csvRows = [];
    const headers = ['ID', 'Description', 'Amount', 'Date', 'Paid By', 'Category', 'Receipt URL'];
    csvRows.push(headers.join(','));

    for (const expense of expenses) {
        const paidBy = getUserById(expense.paidBy)?.name || 'N/A';
        const category = getCategoryById(expense.categoryId)?.name || 'N/A';
        const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');
        const values = [
            expense.id,
            `"${expense.description}"`,
            expense.amount,
            formattedDate,
            paidBy,
            category,
            expense.receipt || ''
        ].join(',');
        csvRows.push(values);
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
        title: "Export Successful",
        description: "Your expenses have been exported to expenses.csv.",
    });
  };

  const filteredExpenses = React.useMemo(() => {
    return expenses.filter(expense =>
      expense.description.toLowerCase().includes(expenseSearch.toLowerCase())
    );
  }, [expenses, expenseSearch]);

  const filteredUsers = React.useMemo(() => {
    return users.filter(user =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);
  
  const analyticsData = React.useMemo(() => {
    const categorySpending = categories.map(category => {
      const total = expenses
        .filter(e => e.categoryId === category.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: category.name, total, fill: `hsl(var(--chart-${(categories.indexOf(category) % 5) + 1}))` };
    });

    const monthlySpending = Array.from({ length: 6 }).map((_, i) => {
      const monthDate = subMonths(new Date(), i);
      const total = expenses
        .filter(e => format(new Date(e.date), 'yyyy-MM') === format(monthDate, 'yyyy-MM'))
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: format(monthDate, 'MMM'), total };
    }).reverse();

    return { categorySpending, monthlySpending };
  }, [expenses, categories]);


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
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DashboardView />;
    }
  };
  
  const DashboardView = () => (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userBalances.map(u => (
          <Card key={u.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{u.name}</CardTitle>
               <Avatar className="h-6 w-6">
                <AvatarImage src={u.avatar} alt={u.name} />
                <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${u.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {u.balance >= 0 ? `+₹${u.balance.toFixed(2)}` : `-₹${Math.abs(u.balance).toFixed(2)}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {u.balance >= 0 ? 'is owed' : 'owes'}
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
              <ExpensesTable expenses={expenses} limit={5} showPayer />
            </CardContent>
          </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Your personal reminders and balance status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {approvedAnnouncements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(ann => (
                <React.Fragment key={ann.id}>
                    <div className="flex items-start gap-4">
                       <Megaphone className="h-6 w-6 text-primary mt-1" />
                      <div className="grid gap-1">
                        <p className="text-sm font-medium">New Announcement</p>
                        <p className="text-sm text-muted-foreground">{ann.message}</p>
                         <p className="text-xs text-muted-foreground/80 pt-1">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <Separator />
                </React.Fragment>
            ))}
            <div className="flex items-center gap-4">
               <Bell className="h-6 w-6 text-accent" />
              <div className="grid gap-1">
                <p className="text-sm font-medium">Welcome back, {user?.name}!</p>
                <p className="text-sm text-muted-foreground">Here is a summary of your account.</p>
              </div>
            </div>
             <Separator />
            <div className="flex items-center gap-4">
              <Wallet className={`h-6 w-6 ${loggedInUserBalance && loggedInUserBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div className="grid gap-1">
                <p className="text-sm font-medium">
                  Your balance is {loggedInUserBalance && loggedInUserBalance >= 0 ? `+₹${loggedInUserBalance.toFixed(2)}` : `-₹${Math.abs(loggedInUserBalance || 0).toFixed(2)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                   {loggedInUserBalance && loggedInUserBalance >= 0 ? 'You are all settled up.' : 'You have outstanding balances.'}
                </p>
              </div>
            </div>
            {loggedInUserBalance && loggedInUserBalance < 0 && (
                <>
                <Separator />
                <div className="flex items-center gap-4">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                    <div className="grid gap-1">
                        <p className="text-sm font-medium">Settle Up Reminder</p>
                        <p className="text-sm text-muted-foreground">
                            Please pay your outstanding balance to keep the records updated.
                        </p>
                    </div>
                </div>
                </>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Submit an Announcement</CardTitle>
            <CardDescription>
              {role === 'admin' ? "Send a notification to all users. It will disappear after 2 days." : "Submit an announcement for admin approval. It will be reviewed shortly."}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid w-full gap-2">
                <Textarea 
                    placeholder="Type your message here..." 
                    maxLength={500}
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                />
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {announcementMessage.length} / 500
                    </p>
                    <Button onClick={handleSendAnnouncement} disabled={isSending || !announcementMessage.trim()}>
                        {role === 'admin' ? <Megaphone className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSending ? 'Sending...' : (role === 'admin' ? 'Send Announcement' : 'Submit for Review')}
                    </Button>
                </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );

  const ExpensesView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
            <div>
                <CardTitle>All Expenses</CardTitle>
                <CardDescription>A complete log of all shared expenses.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search expenses..."
                        className="pl-8 sm:w-[300px]"
                        value={expenseSearch}
                        onChange={(e) => setExpenseSearch(e.target.value)}
                    />
                </div>
                <Button onClick={handleExportCSV} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExpensesTable expenses={filteredExpenses} />
      </CardContent>
    </Card>
  );

  const AnalyticsView = () => (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>A breakdown of expenses by category for the current month.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <BarChart data={analyticsData.categorySpending} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis />
              <RechartsTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="total" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Spending Over Time</CardTitle>
          <CardDescription>Total expenses over the last 6 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={analyticsData.monthlySpending}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Spending" />
                </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );

  const AdminView = () => (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                 <div className="flex items-center justify-between gap-4">
                    <div>
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Add, edit, or remove users from the system.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input
                                type="search"
                                placeholder="Search users..."
                                className="pl-8 sm:w-[300px]"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                             />
                        </div>
                        <AddUserDialog onAddUser={handleAddUser}>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add User
                            </Button>
                        </AddUserDialog>
                    </div>
                 </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map(u => (
                        <TableRow key={u.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={u.avatar} alt={u.name} />
                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>{u.phone || 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                                    {u.role}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <EditUserDialog user={u} onUpdateUser={handleUpdateUserFromAdmin}>
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </EditUserDialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete <strong>{u.name}</strong>'s account.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                        >
                                        Delete User
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        
        {pendingAnnouncements.length > 0 && (
          <Card>
            <CardHeader>
                <CardTitle>Pending Announcements</CardTitle>
                <CardDescription>Review and approve or reject announcements submitted by users.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {pendingAnnouncements.map(ann => (
                  <li key={ann.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                                From: <span className="font-medium text-foreground">{getUserById(ann.createdBy)?.name || 'Unknown User'}</span>
                            </p>
                             <p className="text-sm">{ann.message}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleAnnouncementDecision(ann.id, 'approved')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                             <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleAnnouncementDecision(ann.id, 'rejected')}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
            <CardTitle>Category Management</CardTitle>
            <CardDescription>Manage expense categories for the group.</CardDescription>
            </div>
            <AddCategoryDialog onAddCategory={handleAddCategory}>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </AddCategoryDialog>
        </CardHeader>
        <CardContent className="grid gap-6">
            <div>
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
    </div>
  );
  
  const ExpensesTable = ({ expenses, limit, showPayer = false }: { expenses: Expense[], limit?: number, showPayer?: boolean }) => {
    
    const relevantExpenses = expenses
        .slice(0, limit)
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden sm:table-cell">Category</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Paid by</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
           {role === 'admin' && !showPayer && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {relevantExpenses.map(expense => {
          const category = getCategoryById(expense.categoryId);
          const expenseUser = getUserById(expense.paidBy);
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
              <TableCell>
                <div className="flex items-center gap-2">
                  {expense.description}
                  {expense.receipt && (
                    <a href={expense.receipt} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      <Paperclip className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>{expenseUser?.name}</TableCell>
              <TableCell>{formatDistanceToNow(new Date(expense.date), { addSuffix: true })}</TableCell>
              <TableCell className="text-right font-medium">₹{expense.amount.toFixed(2)}</TableCell>
              {role === 'admin' && !showPayer && (
                <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the expense: <strong>"{expense.description}"</strong>.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            >
                            Delete Expense
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )};

  const PageHeader = () => {
    let title = "Dashboard";
    if (view === 'expenses') title = "All Expenses";
    if (view === 'admin') title = "Admin Panel";
    if (view === 'analytics') title = "Analytics";
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <p>{user.name}</p>
                  <p className="font-normal text-muted-foreground">{user.phone || user.email}</p>
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
          <div 
            className="flex items-center gap-2 p-2 cursor-pointer"
            onClick={handleLogoClick}
          >
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
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setView('analytics')} isActive={view === 'analytics'} tooltip="Analytics">
                <PieChart />
                Analytics
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
               <div className="text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
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
