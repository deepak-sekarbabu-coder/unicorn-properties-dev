export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'incharge'; // Authentication role (system permissions)
  propertyRole?: 'tenant' | 'owner'; // Property relationship role
  fcmToken?: string; // For push notifications
  apartment: string; // Apartment is now required
  isApproved?: boolean; // User approval status (default: false)
};

export type Category = {
  id: string;
  name: string;
  icon: string;
};

export type Apartment = {
  id: string;
  name: string;
  members: string[]; // User IDs
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  paidByApartment: string; // Apartment ID that paid
  owedByApartments: string[]; // Apartments that owe a share
  perApartmentShare: number; // Amount each owing apartment owes
  categoryId: string; // Category ID
  receipt?: string; // Optional: data URI for the receipt image
  paidByApartments?: string[]; // Apartments that have already paid their share back
};

export type NotificationType =
  | 'payment_request'
  | 'payment_received'
  | 'payment_confirmed'
  | 'reminder'
  | 'announcement';

export type PaymentMethodType =
  | 'googlepay'
  | 'phonepay'
  | 'upi'
  | 'card'
  | 'cash'
  | 'bank_transfer';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  fromApartmentId?: string;
  toApartmentId?: string | string[]; // Can be single apartment or array for announcements
  relatedExpenseId?: string;
  // Announcement-specific fields (when type === 'announcement')
  createdBy?: string; // Admin user ID who created the announcement
  isActive?: boolean; // Whether the announcement is still active
  priority?: 'low' | 'medium' | 'high';
  expiresAt?: string; // ISO date string
  isRead: boolean | { [apartmentId: string]: boolean }; // Can be boolean or object for announcements
  isDismissed?: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // ISO date string
  status?: PaymentStatus;
  paymentMethod?: PaymentMethodType;
  transactionId?: string;
  category?: string;
  requestedBy?: string; // User ID who requested the payment
  paidAt?: string; // ISO date string when payment was completed
};

// --- Polling Feature ---
export type PollOption = {
  id: string;
  text: string;
};

export type Poll = {
  id: string; // Firestore doc ID
  question: string;
  options: PollOption[];
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional ISO date
  votes: { [apartmentId: string]: string }; // apartmentId -> optionId
  isActive: boolean;
};

export type Fault = {
  id: string;
  images: string[]; // URLs or base64
  location: string;
  description: string;
  reportedBy: string; // User ID
  reportedAt: string; // ISO date string
  fixed: boolean;
  fixedAt?: string; // ISO date string
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  createdBy: string; // Admin user ID
  createdAt: string; // ISO date
  expiresAt?: string; // Optional ISO date
  isActive: boolean;
  priority: 'low' | 'medium' | 'high';
};

export type View =
  | 'dashboard'
  | 'expenses'
  | 'admin'
  | 'analytics'
  | 'community'
  | 'fault-reporting'
  | 'current-faults'
  | 'ledger';

export type Payment = {
  id: string;
  payerId: string; // User ID who paid
  payeeId: string; // User ID to receive payment
  amount: number;
  expenseId?: string; // Linked expense (optional)
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string; // ISO date string
  approvedBy?: string; // Admin user ID
  approvedByName?: string; // Admin user name
  receiptURL?: string; // Uploaded receipt URL
  monthYear: string; // Format: YYYY-MM
};

export type BalanceSheet = {
  apartmentId: string;
  monthYear: string; // Format: YYYY-MM
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  closingBalance: number;
};
