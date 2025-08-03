'use client';

import { useAuth } from '@/context/auth-context';
import { format, subMonths } from 'date-fns';

import * as React from 'react';

import dynamic from 'next/dynamic';

import * as firestore from '@/lib/firestore';
import { requestNotificationPermission } from '@/lib/push-notifications';
import type { Apartment, Category, Expense, User } from '@/lib/types';
import type { View } from '@/lib/types';

import { CommunityView } from '@/components/community/community-view';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { SelectApartmentDialog } from '@/components/dialogs/select-apartment-dialog';
import { ExpensesList } from '@/components/expenses/expenses-list';
import { ExpensesView } from '@/components/expenses/expenses-view';
import { CurrentFaultsList } from '@/components/fault-reporting/current-faults-list';
import { FaultReportingForm } from '@/components/fault-reporting/fault-reporting-form';
import { NavigationMenu } from '@/components/layout/navigation-menu';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarFooter, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { useToast } from '@/hooks/use-toast';

const AdminView = dynamic(() => import('@/components/admin/admin-view').then(mod => mod.default), {
  ssr: false,
});
const AnalyticsView = dynamic(
  () => import('@/components/analytics/analytics-view').then(mod => mod.default),
  { ssr: false }
);

interface UnicornPropertiesAppProps {
  initialCategories: Category[];
}

export function UnicornPropertiesApp({ initialCategories }: UnicornPropertiesAppProps) {
  const { user, logout, updateUser: updateAuthUser } = useAuth();
  const { toast } = useToast();
  const [view, setView] = React.useState<View>('dashboard');

  const [users, setUsers] = React.useState<User[]>([]);

  // Safe wrapper for setUsers to ensure data integrity
  const setSafeUsers = React.useCallback((usersOrUpdater: User[] | ((prev: User[]) => User[])) => {
    if (typeof usersOrUpdater === 'function') {
      setUsers(prev => {
        const newUsers = usersOrUpdater(prev);
        return Array.isArray(newUsers)
          ? newUsers.filter(
              user =>
                user &&
                typeof user === 'object' &&
                typeof user.id === 'string' &&
                user.id.trim() !== ''
            )
          : [];
      });
    } else {
      const validUsers = Array.isArray(usersOrUpdater)
        ? usersOrUpdater.filter(
            user =>
              user &&
              typeof user === 'object' &&
              typeof user.id === 'string' &&
              user.id.trim() !== ''
          )
        : [];
      setUsers(validUsers);
    }
  }, []);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [apartments, setApartments] = React.useState<Apartment[]>([]);

  const [isLoadingData, setIsLoadingData] = React.useState(true);

  // State for search and filters
  const [expenseSearch, setExpenseSearch] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [filterPaidBy, setFilterPaidBy] = React.useState('all');
  const [filterMonth, setFilterMonth] = React.useState('all');
  const [analyticsMonth, setAnalyticsMonth] = React.useState('all');

  const [userSearch, setUserSearch] = React.useState('');
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
    setIsLoadingData(true);
    let unsubscribeExpenses: (() => void) | null = null;
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeCategories: (() => void) | null = null;

    const fetchApartments = async () => {
      const allApartments = await firestore.getApartments();
      setApartments(allApartments);
    };
    fetchApartments();

    unsubscribeCategories = firestore.subscribeToCategories(setCategories);

    if (user?.role === 'admin' || !user?.apartment) {
      unsubscribeUsers = firestore.subscribeToUsers(setSafeUsers);
      unsubscribeExpenses = firestore.subscribeToExpenses(setExpenses);
    } else {
      unsubscribeUsers = firestore.subscribeToUsers(setSafeUsers, user.apartment);
      unsubscribeExpenses = firestore.subscribeToRelevantExpenses(setExpenses, user.apartment);
    }

    setIsLoadingData(false);
    return () => {
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeCategories) unsubscribeCategories();
    };
  }, [user, showApartmentDialog, toast, setSafeUsers]);

  const role = user?.role || 'user';

  React.useEffect(() => {
    if (user && !user.fcmToken) {
      requestNotificationPermission(user.id);
    }
  }, [user]);

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
    const isCleaningExpense =
      category?.name && typeof category.name === 'string' && category.name.trim()
        ? category.name.toLowerCase() === 'cleaning'
        : false;

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
    setExpenses(prev => {
      const all = [newExpense, ...prev];
      return Array.from(new Map(all.map(e => [e.id, e])).values());
    });

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
      setSafeUsers(currentUsers =>
        currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
      );
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
      setSafeUsers(prev => [...prev, newUser]);
    }
  };

  const handleUpdateUserFromAdmin = async (updatedUser: User) => {
    await firestore.updateUser(updatedUser.id, updatedUser);
    setSafeUsers(currentUsers =>
      currentUsers.map(u => (u.id === updatedUser.id ? updatedUser : u))
    );
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
    setSafeUsers(prev => prev.filter(u => u.id !== userId));
    toast({
      title: 'User Deleted',
      description: 'The user has been successfully removed.',
    });
  };

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getUserById = (id: string) => users.find(u => u.id === id);

  const [filteredExpenses, setFilteredExpenses] = React.useState<Expense[]>([]);

  React.useEffect(() => {
    try {
      const searchTerm = (expenseSearch || '').toLowerCase();
      const filtered = expenses
        .filter(expense => {
          if (!expense || typeof expense !== 'object') return false;
          const description =
            expense.description &&
            typeof expense.description === 'string' &&
            expense.description.trim()
              ? expense.description.toLowerCase()
              : '';
          return description.includes(searchTerm);
        })
        .filter(expense => filterCategory === 'all' || expense.categoryId === filterCategory)
        .filter(expense => filterPaidBy === 'all' || expense.paidByApartment === filterPaidBy)
        .filter(expense => {
          if (filterMonth === 'all') return true;
          try {
            return expense.date && format(new Date(expense.date), 'yyyy-MM') === filterMonth;
          } catch {
            return false;
          }
        });

      setFilteredExpenses(filtered);
    } catch (error) {
      console.error('Error filtering expenses:', error);
      setFilteredExpenses([]);
    }
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
    try {
      if (!userSearch || typeof userSearch !== 'string') {
        return Array.isArray(users) ? users : [];
      }

      const searchTerm = String(userSearch).toLowerCase();
      const usersArray = Array.isArray(users) ? users : [];

      return usersArray.filter(user => {
        if (!user || typeof user !== 'object') return false;

        // More robust null checks for user properties
        const userName =
          user.name && typeof user.name === 'string' && user.name.trim()
            ? String(user.name).toLowerCase()
            : '';
        const userEmail =
          user.email && typeof user.email === 'string' && user.email.trim()
            ? String(user.email).toLowerCase()
            : '';

        return userName.includes(searchTerm) || userEmail.includes(searchTerm);
      });
    } catch (error) {
      console.error('Error in filteredUsers:', error, { users, userSearch });
      return [];
    }
  }, [users, userSearch]);

  const analyticsData = React.useMemo(() => {
    // Filter expenses by selected month for analytics
    const filteredExpenses =
      analyticsMonth === 'all'
        ? expenses.filter(e => e.date && e.amount != null) // Filter out invalid expenses
        : expenses.filter(e => {
            try {
              return (
                e.date && e.amount != null && format(new Date(e.date), 'yyyy-MM') === analyticsMonth
              );
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

  // Place this after all dependencies (apartments, categories, currentUserApartment, handleDeleteExpense, handleExpenseUpdate, role, users) are declared
  const ExpensesListComponent = (
    props: Partial<import('./expenses/expenses-list').ExpensesListProps>
  ) => (
    <ExpensesList
      {...props}
      expenses={props.expenses ?? []}
      users={users}
      categories={categories}
      currentUserApartment={user?.apartment}
      currentUserRole={role}
      onExpenseUpdate={handleExpenseUpdate}
      onExpenseDelete={handleDeleteExpense}
    />
  );

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
        if (role !== 'admin') {
          return (
            <DashboardView
              user={user}
              expenses={expenses}
              users={users}
              categories={categories}
              currentUserApartment={user?.apartment}
              currentUserRole={role}
              apartmentBalances={apartmentBalances}
              onExpenseUpdate={handleExpenseUpdate}
              onExpenseDelete={handleDeleteExpense}
              ExpensesList={props => (
                <ExpensesList
                  {...props}
                  users={users}
                  categories={categories}
                  currentUserApartment={user?.apartment}
                  currentUserRole={role}
                  onExpenseUpdate={handleExpenseUpdate}
                  onExpenseDelete={handleDeleteExpense}
                />
              )}
            />
          );
        }
        return (
          <AdminView
            users={users}
            categories={categories}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            filteredUsers={filteredUsers}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUserFromAdmin}
            onDeleteUser={handleDeleteUser}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            getUserById={getUserById}
            onAddPoll={async data => {
              await firestore.addPoll({
                question: data.question,
                options: data.options,
                createdBy: user?.id || '',
                expiresAt: data.expiresAt,
                isActive: true,
              });
            }}
          />
        );
      case 'expenses':
        return (
          <ExpensesView
            expenses={expenses}
            categories={categories}
            apartments={apartments}
            users={users}
            currentUserApartment={currentUserApartment}
            currentUserRole={role}
            onExpenseUpdate={handleExpenseUpdate}
            onExpenseDelete={handleDeleteExpense}
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
      case 'fault-reporting':
        return <FaultReportingForm onReport={() => setView('current-faults')} />;
      case 'current-faults':
        return <CurrentFaultsList />;

      default:
        return (
          <DashboardView
            user={user}
            expenses={expenses}
            users={users}
            categories={categories}
            currentUserApartment={currentUserApartment}
            currentUserRole={role}
            apartmentBalances={apartmentBalances}
            onExpenseUpdate={handleExpenseUpdate}
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
        isCurrentUserOwing: currentUserApartment
          ? expense.owedByApartments?.includes(currentUserApartment)
          : false,
        hasCurrentUserPaid: currentUserApartment
          ? expense.paidByApartments?.includes(currentUserApartment)
          : false,
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

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await firestore.deleteExpense(expenseId);
      setExpenses(prev => {
        const filtered = prev.filter(e => e.id !== expenseId);
        return Array.from(new Map(filtered.map(e => [e.id, e])).values());
      });
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
    setExpenses(prev => {
      const updated = prev.map(exp => (exp.id === updatedExpense.id ? updatedExpense : exp));
      return Array.from(new Map(updated.map(e => [e.id, e])).values());
    });
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

  // Restrict access for unapproved users
  if (user && user.isApproved === false) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Approval Pending</CardTitle>
            <CardDescription>Wait until you are approved by Admin</CardDescription>
          </CardHeader>
          <CardContent>
            <button className="mt-4 px-4 py-2 bg-primary text-white rounded" onClick={logout}>
              Logout
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  interface SidebarLayoutProps {
    user: User | null;
    view: View;
    setView: React.Dispatch<React.SetStateAction<View>>;
    role: string;
    categories: Category[];
    handleAddExpense: (newExpenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
    handleUpdateUser: (updatedUser: User) => Promise<void>;
    logout: () => void;
    monthlyExpenses: number;
    MainContent: React.ComponentType;
  }

  function SidebarLayout({
    user,
    view,
    setView,
    role,
    categories,
    handleAddExpense,
    handleUpdateUser,
    logout,
    monthlyExpenses,
    MainContent,
  }: SidebarLayoutProps) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
      <SidebarProvider>
        <SidebarLayout
          user={user}
          view={view}
          setView={setView}
          role={role}
          categories={categories}
          handleAddExpense={handleAddExpense}
          handleUpdateUser={handleUpdateUser}
          logout={logout}
          monthlyExpenses={monthlyExpenses}
          MainContent={MainContent}
        />
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
