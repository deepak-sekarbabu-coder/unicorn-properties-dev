'use client';

import { useAuth } from '@/context/auth-context';
import { format, subMonths } from 'date-fns';
import * as React from 'react';

import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Announcement, Apartment, Category, Expense, User } from '@/lib/types';

import { AdminView } from '@/components/admin/admin-view';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { CommunityView } from '@/components/community/community-view';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { ExpensesList } from '@/components/expenses/expenses-list';
import { ExpensesView } from '@/components/expenses/expenses-view';
import { NavigationMenu } from '@/components/layout/navigation-menu';
import { PageHeader } from '@/components/layout/page-header';
import { SelectApartmentDialog } from '@/components/select-apartment-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sidebar,
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { useToast } from '@/hooks/use-toast';

type View = 'dashboard' | 'expenses' | 'admin' | 'analytics' | 'community';

interface UnicornPropertiesAppProps {
  initialCategories: Category[];
  initialAnnouncements: Announcement[];
}

export function UnicornPropertiesApp({
  initialCategories,
  initialAnnouncements,
}: UnicornPropertiesAppProps) {
  const { user, logout, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
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
  const [analyticsMonth, setAnalyticsMonth] = React.useState('all');

  const [userSearch, setUserSearch] = React.useState('');
  const [announcementMessage, setAnnouncementMessage] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Maintain focus during re-renders
  React.useEffect(() => {
    if (textareaRef.current && document.activeElement !== textareaRef.current) {
      // Only refocus if the textarea was previously focused
      const shouldRefocus = textareaRef.current.dataset.wasFocused === 'true';
      if (shouldRefocus) {
        textareaRef.current.focus();
      }
    }
  });

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

          setUsers(allUsers);
          setExpenses(allExpenses);
        } else {
          // For regular users, fetch their apartment&apos;s users and all relevant expenses
          const apartmentUsers = await firestore.getUsers(user.apartment);

          // Get all expenses where the user's apartment is either the payer or owes a share
          const allExpenses = await firestore.getExpenses();

          const relevantExpenses = allExpenses.filter(
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

  // Calculate total expenses for all time and per user share
  const totalExpenses = expenses.reduce((acc, expense) => acc + (Number(expense.amount) || 0), 0);
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

  const pendingAnnouncements = announcements.filter(a => a.status === 'pending');
  const approvedAnnouncements = announcements.filter(a => a.status === 'approved');



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

    // Check if this is a cleaning expense - if so, don't split it
    const category = getCategoryById(newExpenseData.categoryId);
    const isCleaningExpense = category?.name.toLowerCase() === 'cleaning';

    let expenseWithApartmentDebts: Omit<Expense, 'id' | 'date'>;
    let successMessage: string;

    if (isCleaningExpense) {
      // For cleaning expenses, only the paying apartment bears the cost
      expenseWithApartmentDebts = {
        ...newExpenseData,
        paidByApartment: payingApartmentId,
        owedByApartments: [], // No other apartments owe anything
        perApartmentShare: 0, // No sharing
        paidByApartments: [], // Initialize as empty
      };
      successMessage = `₹${newExpenseData.amount} cleaning expense added. Only your apartment will bear this cost.`;
    } else {
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
      expenseWithApartmentDebts = {
        ...newExpenseData,
        paidByApartment: payingApartmentId,
        owedByApartments: owingApartments,
        perApartmentShare,
        paidByApartments: [], // Initialize as empty - no one has paid yet
      };

      // Show success message
      const totalOwedByOthers = owingApartments.length * perApartmentShare;
      successMessage = `₹${newExpenseData.amount} expense split among ${allApartmentIds.length} apartments. Your share: ₹${perApartmentShare.toFixed(2)}. You are owed ₹${totalOwedByOthers.toFixed(2)} from others.`;
    }

    console.log('[handleAddExpense] expenseWithApartmentDebts:', expenseWithApartmentDebts);

    const newExpense = await firestore.addExpense(expenseWithApartmentDebts);
    console.log('[handleAddExpense] newExpense from Firestore:', newExpense);
    setExpenses(prev => [newExpense, ...prev]);

    toast({
      title: 'Expense Added',
      description: successMessage,
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
    // Filter expenses by selected month for analytics
    const filteredExpenses =
      analyticsMonth === 'all'
        ? expenses.filter(e => e.date && e.amount != null) // Filter out invalid expenses
        : expenses.filter(e => {
          try {
            return e.date && e.amount != null && format(new Date(e.date), 'yyyy-MM') === analyticsMonth;
          } catch {
            return false;
          }
        });

    const categorySpending = categories.map(category => {
      const total = filteredExpenses
        .filter(e => e.categoryId === category.id)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      return {
        name: category.name,
        total: Math.round(total * 100) / 100, // Ensure proper rounding
        fill: `hsl(var(--chart-${(categories.indexOf(category) % 5) + 1}))`,
      };
    });

    const monthlySpending = Array.from({ length: 6 })
      .map((_, i) => {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, 'yyyy-MM');
        const total = expenses
          .filter(e => {
            try {
              return e.date && e.amount != null && format(new Date(e.date), 'yyyy-MM') === monthKey;
            } catch {
              return false;
            }
          })
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return {
          name: format(monthDate, 'MMM yyyy'),
          total: Math.round(total * 100) / 100, // Ensure proper rounding
        };
      })
      .reverse();

    return { categorySpending, monthlySpending };
  }, [expenses, categories, analyticsMonth]);

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

    const ExpensesListComponent = React.useCallback(
      ({ expenses, limit }: { expenses: Expense[]; limit?: number }) => (
        <ExpensesList
          expenses={expenses}
          limit={limit}
          apartments={apartments}
          users={users}
          categories={categories}
          currentUserApartment={currentUserApartment}
          currentUserRole={role}
          onExpenseUpdate={handleExpenseUpdate}
          onExpenseDelete={role === 'admin' ? handleDeleteExpense : undefined}
        />
      ),
      [apartments, users, categories, currentUserApartment, role]
    );

    switch (view) {
      case 'admin':
        if (role !== 'admin') {
          return (
            <DashboardView
              user={user}
              role={role}
              expenses={expenses}
              announcements={announcements}
              apartments={apartments}
              currentUserApartment={currentUserApartment}
              apartmentBalances={apartmentBalances}
              announcementMessage={announcementMessage}
              setAnnouncementMessage={setAnnouncementMessage}
              isSending={isSending}
              onSendAnnouncement={handleSendAnnouncement}
              ExpensesList={ExpensesListComponent}
            />
          );
        }
        return (
          <AdminView
            users={users}
            categories={categories}
            announcements={announcements}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            filteredUsers={filteredUsers}
            pendingAnnouncements={pendingAnnouncements}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUserFromAdmin}
            onDeleteUser={handleDeleteUser}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAnnouncementDecision={handleAnnouncementDecision}
            getUserById={getUserById}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            categories={categories}
            apartments={apartments}
            expenseSearch={expenseSearch}
            setExpenseSearch={setExpenseSearch}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterPaidBy={filterPaidBy}
            setFilterPaidBy={setFilterPaidBy}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filteredExpenses={filteredExpenses}
            expenseMonths={expenseMonths}
            onClearFilters={handleClearFilters}
            ExpensesList={ExpensesListComponent}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            expenses={expenses}
            categories={categories}
            analyticsMonth={analyticsMonth}
            setAnalyticsMonth={setAnalyticsMonth}
            expenseMonths={expenseMonths}
            analyticsData={analyticsData}
          />
        );
      case 'community':
        return <CommunityView users={users} apartments={apartments} />;
      default:
        return (
          <DashboardView
            user={user}
            role={role}
            expenses={expenses}
            announcements={announcements}
            apartments={apartments}
            currentUserApartment={currentUserApartment}
            apartmentBalances={apartmentBalances}
            announcementMessage={announcementMessage}
            setAnnouncementMessage={setAnnouncementMessage}
            isSending={isSending}
            onSendAnnouncement={handleSendAnnouncement}
            ExpensesList={ExpensesListComponent}
          />
        );
    }
  };

  // Get current user's apartment ID
  const currentUserApartment = user?.apartment;

  // Debug function to log expense calculations
  const debugExpenseCalculations = React.useCallback(() => {
    console.log('=== EXPENSE CALCULATION DEBUG ===');
    expenses.forEach((expense, index) => {
      const unpaidApartments =
        expense.owedByApartments?.filter(
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
      const {
        paidByApartment,
        owedByApartments,
        perApartmentShare,
        paidByApartments = [],
      } = expense;

      // Get apartments that still owe money (haven't paid yet)
      const unpaidApartments =
        owedByApartments?.filter(apartmentId => !paidByApartments.includes(apartmentId)) || [];

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
  }, [expenses, apartments, debugExpenseCalculations, currentUserApartment]);

  // Get balances for the current user's apartment
  const currentApartmentBalance = currentUserApartment
    ? apartmentBalances[currentUserApartment]
    : null;

  // Use apartment balance instead of user balance for notifications
  const loggedInUserBalance = currentApartmentBalance ? currentApartmentBalance.balance : 0;

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await firestore.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: 'Expense Deleted',
        description: 'The expense has been successfully removed.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete expense.',
        variant: 'destructive',
      });
    }
  };

  const handleExpenseUpdate = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp)));
  };



  // Calculate monthly expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((total, expense) => total + (Number(expense.amount) || 0), 0);

  return (
    <>
      <SidebarProvider>
        <Sidebar>
          <NavigationMenu user={user} view={view} setView={setView} role={role} />
          <SidebarFooter>
            <Card className="m-2">
              <CardHeader className="p-3">
                <CardTitle>Total This Month</CardTitle>
                <CardDescription>Sum of all shared expenses in your apartment.</CardDescription>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">₹{monthlyExpenses.toFixed(2)}</div>
              </CardContent>
            </Card>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <div className="flex flex-col min-h-screen">
            <PageHeader
              view={view}
              user={user}
              categories={categories}
              users={users}
              onAddExpense={handleAddExpense}
              onUpdateUser={handleUpdateUser}
              onLogout={logout}
            />
            <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-x-hidden">
              <div className="max-w-7xl mx-auto">
                <MainContent />
              </div>
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


