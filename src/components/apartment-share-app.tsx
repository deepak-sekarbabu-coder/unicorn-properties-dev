'use client';

import { useAuth } from '@/context/auth-context';
import { format, formatDistanceToNow, subMonths } from 'date-fns';
import {
  Bell,
  CheckCircle,
  FileDown,
  Home,
  LineChart,
  LogOut,
  Megaphone,
  Package2,
  PieChart,
  PlusCircle,
  Search,
  Send,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { migrateAllExpenses } from '@/lib/expense-migration';
import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Announcement, Apartment, Category, Expense, User } from '@/lib/types';

import { AddCategoryDialog } from '@/components/add-category-dialog';
import { AddExpenseDialog } from '@/components/add-expense-dialog';
import { AddUserDialog } from '@/components/add-user-dialog';
import { CategoryIcon } from '@/components/category-icon';
import { EditCategoryDialog } from '@/components/edit-category-dialog';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { ExpenseItem } from '@/components/expense-item';
import { Icons } from '@/components/icons';
import { OutstandingBalance } from '@/components/outstanding-balance';
import { SelectApartmentDialog } from '@/components/select-apartment-dialog';
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
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { UserProfileDialog } from '@/components/user-profile-dialog';

import { useToast } from '@/hooks/use-toast';

import { Skeleton } from './ui/skeleton';

type View = 'dashboard' | 'expenses' | 'admin' | 'analytics';

interface ApartmentShareAppProps {
  initialCategories: Category[];
  initialAnnouncements: Announcement[];
}

export function ApartmentShareApp({
  initialCategories,
  initialAnnouncements,
}: ApartmentShareAppProps) {
  const { user, logout, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [view, setView] = React.useState<View>('dashboard');

  const [users, setUsers] = React.useState<User[]>([]);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [announcements, setAnnouncements] = React.useState<Announcement[]>(initialAnnouncements);
  const [apartments, setApartments] = React.useState<Apartment[]>([]);

  const [isLoadingData, setIsLoadingData] = React.useState(true);

  // State for search and filters
  const [expenseSearch, setExpenseSearch] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterPaidBy, setFilterPaidBy] = React.useState('all');
  const [filterMonth, setFilterMonth] = React.useState('all');

  const [userSearch, setUserSearch] = React.useState('');
  const [announcementMessage, setAnnouncementMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);

  const [showApartmentDialog, setShowApartmentDialog] = React.useState(false);

  React.useEffect(() => {
    if (user && (!user.apartment || !user.propertyRole)) {
      setShowApartmentDialog(true);
    }
  }, [user]);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);

      try {
        // Always fetch all apartments
        const allApartments = await firestore.getApartments();
        setApartments(allApartments);

        // If user is an admin or has no apartment assigned, fetch all users and expenses
        if (user?.role === 'admin' || !user?.apartment) {
          const allUsers = await firestore.getUsers();
          const allExpenses = await firestore.getExpenses();

          // Migrate expenses to new format
          const migratedExpenses = await migrateAllExpenses(allExpenses, allApartments);

          setUsers(allUsers);
          setExpenses(migratedExpenses);
        } else {
          // For regular users, fetch their apartment&apos;s users and all relevant expenses
          const apartmentUsers = await firestore.getUsers(user.apartment);

          // Get all expenses where the user's apartment is either the payer or owes a share
          const allExpenses = await firestore.getExpenses();

          // Migrate expenses to new format
          const migratedExpenses = await migrateAllExpenses(allExpenses, allApartments);

          const relevantExpenses = migratedExpenses.filter(
            expense =>
              expense.paidByApartment === user.apartment ||
              expense.owedByApartments?.includes(user.apartment)
          );

          setUsers(apartmentUsers);
          setExpenses(relevantExpenses);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [user, showApartmentDialog, toast]);

  const role = user?.role || 'user';

  const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const perUserShare = users.length > 0 ? totalExpenses / users.length : 0;

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then(registration => {
          console.log('Service Worker registration successful, scope is:', registration.scope);
        })
        .catch(err => {
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
        .filter(e => e.paidByApartment === u.apartment)
        .reduce((acc, e) => acc + e.amount, 0);
      const balance = totalPaid - perUserShare;
      return { ...u, balance };
    });
  }, [users, expenses, perUserShare]);

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
    console.log('[handleAddExpense] Input:', newExpenseData);

    if (!user?.apartment) {
      toast({
        title: 'Error',
        description: 'You must belong to an apartment to add an expense',
        variant: 'destructive',
      });
      return;
    }

    const payingApartmentId = user.apartment;

    // Get all unique apartment IDs (7 apartments total)
    const allApartmentIds = apartments.map(apt => apt.id);

    // Calculate per-apartment share (divide by 7 apartments)
    const perApartmentShare = newExpenseData.amount / allApartmentIds.length;

    // All other apartments owe money (excluding the paying apartment)
    const owingApartments = allApartmentIds.filter(id => id !== payingApartmentId);

    console.log('[handleAddExpense] payingApartmentId:', payingApartmentId);
    console.log('[handleAddExpense] allApartmentIds:', allApartmentIds);
    console.log('[handleAddExpense] owingApartments:', owingApartments);
    console.log('[handleAddExpense] perApartmentShare:', perApartmentShare);

    // Create expense with apartment debts
    const expenseWithApartmentDebts: Omit<Expense, 'id' | 'date'> = {
      ...newExpenseData,
      paidByApartment: payingApartmentId,
      owedByApartments: owingApartments,
      perApartmentShare,
      paidByApartments: [], // Initialize as empty - no one has paid yet
    };
    console.log('[handleAddExpense] expenseWithApartmentDebts:', expenseWithApartmentDebts);

    const newExpense = await firestore.addExpense(expenseWithApartmentDebts);
    console.log('[handleAddExpense] newExpense from Firestore:', newExpense);
    setExpenses(prev => [newExpense, ...prev]);

    // Show success message
    const totalOwedByOthers = owingApartments.length * perApartmentShare;
    toast({
      title: 'Expense Added',
      description: `₹${newExpenseData.amount} expense split among ${allApartmentIds.length} apartments. Your share: ₹${perApartmentShare.toFixed(2)}. You are owed ₹${totalOwedByOthers.toFixed(2)} from others.`,
    });
  };

  const handleUpdateUser = async (updatedUser: User) => {
    await firestore.updateUser(updatedUser.id, updatedUser);
    updateAuthUser(updatedUser);
    // If the user's apartment changed, we need to refetch data, which the useEffect will handle.
    // Otherwise, just update the state locally.
    if (updatedUser.apartment === user?.apartment) {
      setUsers(currentUsers => currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    }
  };

  const handleUpdateCategory = async (updatedCategory: Category) => {
    await firestore.updateCategory(updatedCategory.id, updatedCategory);
    setCategories(currentCategories =>
      currentCategories.map(c => (c.id === updatedCategory.id ? updatedCategory : c))
    );
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
    if (newUser.apartment === user?.apartment || role === 'admin') {
      setUsers(prev => [...prev, newUser]);
    }
  };

  const handleUpdateUserFromAdmin = async (updatedUser: User) => {
    await firestore.updateUser(updatedUser.id, updatedUser);
    setUsers(currentUsers => currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleDeleteUser = async (userId: string) => {
    if (user?.id === userId) {
      toast({
        title: 'Action Prohibited',
        description: 'You cannot delete your own account.',
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
      const newAnnouncement = await firestore.addAnnouncement(
        announcementMessage,
        user.id,
        role === 'admin' ? 'admin' : 'user'
      );
      if (newAnnouncement.status === 'approved') {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        toast({
          title: 'Announcement Sent!',
          description: 'Your message has been sent to all users.',
        });
      } else {
        toast({
          title: 'Announcement Submitted!',
          description: 'Your message has been sent for admin review.',
        });
      }
      setAnnouncementMessage('');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send announcement.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAnnouncementDecision = async (
    announcementId: string,
    decision: 'approved' | 'rejected'
  ) => {
    await firestore.updateAnnouncementStatus(announcementId, decision);
    if (decision === 'approved') {
      const approvedAnnouncement = announcements.find(a => a.id === announcementId)!;
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcementId ? { ...approvedAnnouncement, status: 'approved' } : a
        )
      );
    } else {
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    }
    toast({
      title: `Announcement ${decision === 'approved' ? 'Approved' : 'Rejected'}`,
      description: `The announcement has been ${decision}.`,
    });
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const handleExportCSV = () => {
    const csvRows = [];
    const headers = [
      'ID',
      'Description',
      'Amount',
      'Date',
      'Paid By Apartment',
      'Category',
      'Receipt URL',
    ];
    csvRows.push(headers.join(','));

    for (const expense of expenses) {
      const paidByApartment = expense.paidByApartment;
      const apartment = apartments.find(a => a.id === paidByApartment);
      const apartmentName = apartment?.name || paidByApartment;
      const category = getCategoryById(expense.categoryId)?.name || 'N/A';
      const formattedDate = format(new Date(expense.date), 'yyyy-MM-dd');
      const values = [
        expense.id,
        `"${expense.description}"`,
        expense.amount,
        formattedDate,
        apartmentName,
        category,
        expense.receipt || '',
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
      title: 'Export Successful',
      description: 'Your expenses have been exported to expenses.csv.',
    });
  };

  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);

  React.useEffect(() => {
    const filtered = expenses
      .filter(expense => expense.description.toLowerCase().includes(expenseSearch.toLowerCase()))
      .filter(expense => filterCategory === 'all' || expense.categoryId === filterCategory)
      .filter(expense => filterPaidBy === 'all' || expense.paidByApartment === filterPaidBy)
      .filter(
        expense =>
          filterMonth === 'all' || format(new Date(expense.date), 'yyyy-MM') === filterMonth
      );

    setFilteredExpenses(filtered);
  }, [expenses, expenseSearch, filterCategory, filterPaidBy, filterMonth]);

  const expenseMonths = React.useMemo(() => {
    const months = new Set<string>();
    expenses.forEach(e => {
      months.add(format(new Date(e.date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const handleClearFilters = () => {
    setExpenseSearch('');
    setFilterCategory('all');
    setFilterPaidBy('all');
    setFilterMonth('all');
  };

  const filteredUsers = React.useMemo(() => {
    return users.filter(
      user =>
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  const analyticsData = React.useMemo(() => {
    const categorySpending = categories.map(category => {
      const total = expenses
        .filter(e => e.categoryId === category.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        name: category.name,
        total,
        fill: `hsl(var(--chart-${(categories.indexOf(category) % 5) + 1}))`,
      };
    });

    const monthlySpending = Array.from({ length: 6 })
      .map((_, i) => {
        const monthDate = subMonths(new Date(), i);
        const total = expenses
          .filter(e => format(new Date(e.date), 'yyyy-MM') === format(monthDate, 'yyyy-MM'))
          .reduce((sum, e) => sum + e.amount, 0);
        return { name: format(monthDate, 'MMM'), total };
      })
      .reverse();

    return { categorySpending, monthlySpending };
  }, [expenses, categories]);

  React.useEffect(() => {
    if (role !== 'admin' && view === 'admin') {
      setView('dashboard');
    }
  }, [role, view]);

  const MainContent = () => {
    if (isLoadingData) {
      return (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

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

  // Debug function to log expense calculations
  const debugExpenseCalculations = React.useCallback(() => {
    console.log('=== EXPENSE CALCULATION DEBUG ===');
    expenses.forEach((expense, index) => {
      const unpaidApartments = expense.owedByApartments?.filter(
        apartmentId => !expense.paidByApartments?.includes(apartmentId)
      ) || [];

      console.log(`Expense ${index + 1}:`, {
        description: expense.description,
        amount: expense.amount,
        paidByApartment: expense.paidByApartment,
        owedByApartments: expense.owedByApartments,
        paidByApartments: expense.paidByApartments || [],
        unpaidApartments,
        perApartmentShare: expense.perApartmentShare,
        totalStillOwed: unpaidApartments.length * expense.perApartmentShare,
        isCurrentUserPaying: expense.paidByApartment === currentUserApartment,
        isCurrentUserOwing: expense.owedByApartments?.includes(currentUserApartment),
        hasCurrentUserPaid: expense.paidByApartments?.includes(currentUserApartment),
      });
    });
    console.log('=== END DEBUG ===');
  }, [expenses, currentUserApartment]);

  // Calculate apartment balances
  const apartmentBalances = React.useMemo(() => {
    const balances: Record<
      string,
      {
        name: string;
        balance: number;
        owes: Record<string, number>;
        isOwed: Record<string, number>;
      }
    > = {};

    // Initialize balances for all apartments
    apartments.forEach(apartment => {
      balances[apartment.id] = {
        name: apartment.name,
        balance: 0,
        owes: {},
        isOwed: {},
      };
    });

    // Process each expense to calculate balances
    expenses.forEach(expense => {
      const { paidByApartment, owedByApartments, perApartmentShare, paidByApartments = [] } = expense;

      // Get apartments that still owe money (haven't paid yet)
      const unpaidApartments = owedByApartments?.filter(
        apartmentId => !paidByApartments.includes(apartmentId)
      ) || [];

      // Calculate the amount still owed to the paying apartment (only from unpaid apartments)
      const totalStillOwed = unpaidApartments.length * perApartmentShare;

      // Add to the paid apartment's balance (only the amount still owed by unpaid apartments)
      if (balances[paidByApartment]) {
        balances[paidByApartment].balance += totalStillOwed;

        // Track how much this apartment is owed by others (only unpaid apartments)
        unpaidApartments.forEach(apartmentId => {
          if (apartmentId !== paidByApartment) {
            balances[paidByApartment].isOwed[apartmentId] =
              (balances[paidByApartment].isOwed[apartmentId] || 0) + perApartmentShare;
          }
        });
      }

      // Subtract from the unpaid apartments' balances only
      unpaidApartments.forEach(apartmentId => {
        if (balances[apartmentId] && apartmentId !== paidByApartment) {
          balances[apartmentId].balance -= perApartmentShare;

          // Track how much this apartment owes to others
          balances[apartmentId].owes[paidByApartment] =
            (balances[apartmentId].owes[paidByApartment] || 0) + perApartmentShare;
        }
      });

      // For apartments that have paid their share but aren't the paying apartment,
      // their balance should be 0 for this expense (they don't owe anything)
      paidByApartments.forEach(apartmentId => {
        if (apartmentId !== paidByApartment && owedByApartments?.includes(apartmentId)) {
          // This apartment has paid their share, so they don't owe anything for this expense
          // Their balance remains unchanged (neither positive nor negative for this expense)
        }
      });
    });

    // Debug the calculations
    if (process.env.NODE_ENV === 'development') {
      debugExpenseCalculations();
      console.log('Calculated apartment balances:', balances);
      console.log('Current user apartment:', currentUserApartment);
    }

    return balances;
  }, [expenses, apartments, debugExpenseCalculations]);

  // Get current user's apartment ID
  const currentUserApartment = user?.apartment;

  // Get balances for the current user's apartment
  const currentApartmentBalance = currentUserApartment
    ? apartmentBalances[currentUserApartment]
    : null;

  // Use apartment balance instead of user balance for notifications
  const loggedInUserBalance = currentApartmentBalance ? currentApartmentBalance.balance : 0;

  const DashboardView = () => (
    <div className="grid gap-6">




      {/* Apartment Balances */}
      {currentApartmentBalance && (
        <Card>
          <CardHeader>
            <CardTitle>Apartment Balances</CardTitle>
            <CardDescription>Summary of amounts owed between apartments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* What you are owed */}
            {Object.entries(currentApartmentBalance.isOwed).map(
              ([apartmentId, amount]) =>
                amount > 0 && (
                  <div
                    key={`owed-${apartmentId}`}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                        </p>
                        <p className="text-sm text-muted-foreground">owes your apartment</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-green-700">
                      ₹{amount.toFixed(2)}
                    </span>
                  </div>
                )
            )}

            {/* What you owe */}
            {Object.entries(currentApartmentBalance.owes).map(
              ([apartmentId, amount]) =>
                amount > 0 && (
                  <div
                    key={`owes-${apartmentId}`}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-red-100">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          You owe {apartmentBalances[apartmentId]?.name || 'Unknown Apartment'}
                        </p>
                        <p className="text-sm text-muted-foreground">for shared expenses</p>
                      </div>
                    </div>
                    <span className="text-lg font-semibold text-red-700">₹{amount.toFixed(2)}</span>
                  </div>
                )
            )}

            {/* Net balance */}
            {currentApartmentBalance.balance !== 0 && (
              <div
                className={`mt-4 p-4 rounded-lg ${currentApartmentBalance.balance > 0 ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {currentApartmentBalance.balance > 0
                        ? 'Your apartment is owed'
                        : 'Your apartment owes'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentApartmentBalance.balance > 0
                        ? 'in total across all apartments'
                        : 'in total to other apartments'}
                    </p>
                  </div>
                  <span
                    className={`text-xl font-bold ${currentApartmentBalance.balance > 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {currentApartmentBalance.balance > 0 ? '+' : ''}₹
                    {Math.abs(currentApartmentBalance.balance).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Calculation verification for development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Calculation Verification</h4>
                <div className="text-xs space-y-1">
                  <p>Total apartments: {apartments.length}</p>
                  <p>Total expenses paid by your apartment: {expenses.filter(e => e.paidByApartment === currentUserApartment).length}</p>
                  <p>Total amount you paid: ₹{expenses.filter(e => e.paidByApartment === currentUserApartment).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</p>
                  <p>Total amount still owed to you: ₹{Object.values(currentApartmentBalance.isOwed).reduce((sum, amount) => sum + amount, 0).toFixed(2)}</p>
                  <p>Total amount you still owe: ₹{Object.values(currentApartmentBalance.owes).reduce((sum, amount) => sum + amount, 0).toFixed(2)}</p>
                  <p>Your net balance: {currentApartmentBalance.balance >= 0 ? '+' : ''}₹{currentApartmentBalance.balance.toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>The last 5 expenses added to your apartment.</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesList expenses={expenses} limit={5} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Your personal reminders and balance status.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {approvedAnnouncements
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(ann => (
                <React.Fragment key={ann.id}>
                  <div className="flex items-start gap-4">
                    <Megaphone className="h-6 w-6 text-primary mt-1" />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium">New Announcement</p>
                      <p className="text-sm text-muted-foreground">{ann.message}</p>
                      <p className="text-xs text-muted-foreground/80 pt-1">
                        {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                      </p>
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
              <Wallet
                className={`h-6 w-6 ${loggedInUserBalance && loggedInUserBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}
              />
              <div className="grid gap-1">
                <p className="text-sm font-medium">
                  Your balance is{' '}
                  {loggedInUserBalance && loggedInUserBalance >= 0
                    ? `+₹${loggedInUserBalance.toFixed(2)}`
                    : `-₹${Math.abs(loggedInUserBalance || 0).toFixed(2)}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {loggedInUserBalance && loggedInUserBalance >= 0
                    ? 'You are all settled up.'
                    : 'You have outstanding balances.'}
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
            {role === 'admin'
              ? 'Send a notification to all users. It will disappear after 2 days.'
              : 'Submit an announcement for admin approval. It will be reviewed shortly.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Type your message here..."
              maxLength={500}
              value={announcementMessage}
              onChange={e => setAnnouncementMessage(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{announcementMessage.length} / 500</p>
              <Button
                onClick={handleSendAnnouncement}
                disabled={isSending || !announcementMessage.trim()}
              >
                {role === 'admin' ? (
                  <Megaphone className="mr-2 h-4 w-4" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending
                  ? 'Sending...'
                  : role === 'admin'
                    ? 'Send Announcement'
                    : 'Submit for Review'}
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
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>All Expenses</CardTitle>
              <CardDescription>
                A complete log of all shared expenses for your apartment.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search expenses..."
                  className="pl-8 sm:w-[200px] lg:w-[300px]"
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                />
              </div>
              <Button onClick={handleExportCSV} variant="outline">
                <FileDown className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaidBy} onValueChange={setFilterPaidBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by paid by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apartments</SelectItem>
                {apartments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {expenseMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {format(new Date(`${month}-02`), 'MMMM yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ExpensesList expenses={filteredExpenses} />
      </CardContent>
    </Card>
  );

  const AnalyticsView = () => (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>A breakdown of expenses by category for your apartment.</CardDescription>
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
          <CardDescription>
            Total expenses over the last 6 months for your apartment.
          </CardDescription>
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
                  onChange={e => setUserSearch(e.target.value)}
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
                <TableHead>Apartment</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
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
                  <TableCell>{u.apartment || 'N/A'}</TableCell>
                  <TableCell>{u.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Badge
                        variant={u.role === 'admin' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {u.role}
                      </Badge>
                      {u.propertyRole && (
                        <Badge variant="outline" className="capitalize">
                          {u.propertyRole}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditUserDialog user={u} onUpdateUser={handleUpdateUserFromAdmin}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </EditUserDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{' '}
                            <strong>{u.name}</strong>&apos;s account.
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
            <CardDescription>
              Review and approve or reject announcements submitted by users.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {pendingAnnouncements.map(ann => (
                <li key={ann.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        From:{' '}
                        <span className="font-medium text-foreground">
                          {getUserById(ann.createdBy)?.name || 'Unknown User'}
                        </span>
                      </p>
                      <p className="text-sm">{ann.message}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleAnnouncementDecision(ann.id, 'approved')}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleAnnouncementDecision(ann.id, 'rejected')}
                      >
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
                <li
                  key={cat.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <CategoryIcon name={cat.icon as keyof typeof Icons} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EditCategoryDialog category={cat} onUpdateCategory={handleUpdateCategory}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </EditCategoryDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the{' '}
                            <strong>{cat.name}</strong> category.
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

  const ExpensesList = ({ expenses, limit }: { expenses: Expense[]; limit?: number }) => {
    const relevantExpenses = limit
      ? expenses
          .slice(0, limit)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleExpenseUpdate = (updatedExpense: Expense) => {
      setExpenses(prev => prev.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp)));
    };

    if (relevantExpenses.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No expenses found.</div>;
    }

    return (
      <div className="space-y-4">
        {relevantExpenses.map(expense => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            apartments={apartments}
            currentUserApartment={currentUserApartment}
            isOwner={expense.paidByApartment === currentUserApartment}
            onExpenseUpdate={handleExpenseUpdate}
          />
        ))}
      </div>
    );
  };

  const PageHeader = () => {
    let title = 'Dashboard';
    if (view === 'expenses') title = 'All Expenses';
    if (view === 'admin') title = 'Admin Panel';
    if (view === 'analytics') title = 'Analytics';
    return (
      <header className="flex h-14 items-center gap-4 border-b bg-card px-4 sm:px-6">
        <SidebarTrigger className="md:hidden" />
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="ml-auto flex items-center gap-4">
          {user && (
            <AddExpenseDialog
              categories={categories}
              users={users}
              onAddExpense={handleAddExpense}
              currentUser={user}
            >
              <Button className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
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
                  <p>{user.name}</p>
                  <p className="font-normal text-muted-foreground">{user.phone || user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <UserProfileDialog user={user} onUpdateUser={handleUpdateUser}>
                  <DropdownMenuItem onSelect={e => e.preventDefault()}>
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
    );
  };

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={handleLogoClick}>
              <Package2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">ApartmentShare</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setView('dashboard')}
                  isActive={view === 'dashboard'}
                  tooltip="Dashboard"
                >
                  <Home />
                  Dashboard
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setView('expenses')}
                  isActive={view === 'expenses'}
                  tooltip="All Expenses"
                >
                  <LineChart />
                  All Expenses
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setView('analytics')}
                  isActive={view === 'analytics'}
                  tooltip="Analytics"
                >
                  <PieChart />
                  Analytics
                </SidebarMenuButton>
              </SidebarMenuItem>
              {role === 'admin' && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setView('admin')}
                    isActive={view === 'admin'}
                    tooltip="Admin"
                  >
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
                <CardDescription>Sum of all shared expenses in your apartment.</CardDescription>
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
      {user && (
        <SelectApartmentDialog
          open={showApartmentDialog}
          onOpenChange={setShowApartmentDialog}
          user={user}
          onSave={data => {
            const updatedUser = {
              ...user,
              apartment: data.apartment,
              propertyRole: data.propertyRole,
            };
            handleUpdateUser(updatedUser);
            setShowApartmentDialog(false);
          }}
        />
      )}
    </>
  );
}
