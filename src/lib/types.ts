export type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role?: 'user' | 'admin'; // Authentication role (system permissions)
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

export type Announcement = {
  id: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: string; // User ID
  createdAt: string; // ISO date string
  expiresAt: string; // ISO date string
};

export type NotificationType = 'payment_request' | 'payment_received' | 'announcement' | 'reminder';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  fromApartmentId?: string;
  toApartmentId?: string;
  relatedExpenseId?: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  dueDate?: string; // ISO date string
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
