# Expense Division Feature

## Overview

This feature automatically divides expenses across seven apartments and tracks which apartments have paid their share back to the expense owner.

## Key Features

### 1. Automatic Division

- When a new expense is added, it's automatically divided equally among all 7 apartments
- The paying apartment's share is excluded from what they owe
- Example: $700 expense ÷ 7 apartments = $100 per apartment
- Paying apartment owes $0, other 6 apartments owe $100 each = $600 total outstanding

### 2. Outstanding Balance Display

- Prominently displays total outstanding amount in red at the top of the dashboard
- Shows as negative value (e.g., -$600) to indicate money owed to the user
- Only appears when there are outstanding amounts

### 3. Payment Tracking

- Expense owners can mark apartments as "paid" when they receive payment
- Adjusted amounts automatically update to exclude paid apartments
- Visual indicators show payment status for each apartment

### 4. Enhanced Expense Display

- Each expense shows both original amount and adjusted outstanding amount
- Payment status overview shows how many apartments have paid
- Individual apartment payment status with easy mark/unmark functionality
- Receipt viewing capability

## Data Structure

### Expense Object

```typescript
{
  id: string;
  description: string;
  amount: number; // Original total amount (e.g., 700)
  date: string;
  paidByApartment: string; // Apartment that paid the expense
  owedByApartments: string[]; // Apartments that owe money
  perApartmentShare: number; // Amount each apartment owes (e.g., 100)
  categoryId: string;
  receipt?: string;
  paidByApartments?: string[]; // Apartments that have paid back
}
```

## User Experience

### For Expense Owners

1. Add expense - automatically divided among all apartments
2. See total outstanding amount prominently displayed
3. Mark apartments as paid when they settle their share
4. Watch outstanding amount decrease as payments are received

### For Other Apartment Members

1. See their share of each expense clearly displayed
2. View payment status (paid/pending) for their apartment
3. Understand how much they still owe

## Technical Implementation

### Key Files

- `src/lib/expense-utils.ts` - Calculation logic
- `src/components/outstanding-balance.tsx` - Red alert display
- `src/components/expense-item.tsx` - Enhanced expense display
- `src/lib/types.ts` - Updated Expense type

### Key Functions

- `calculateExpenseAmounts()` - Calculates adjusted amounts
- `calculateTotalOutstanding()` - Sums all outstanding amounts
- `markApartmentAsPaid()` / `markApartmentAsUnpaid()` - Payment tracking

## Example Scenario

1. **Initial State**: T2 pays $700 electricity bill
   - Original amount: $700
   - Outstanding: $600 (6 apartments × $100)
   - Display: -$600 in red

2. **After T1 and T3 pay**:
   - Original amount: $700
   - Outstanding: $400 (4 apartments × $100)
   - Display: -$400 in red

3. **All apartments paid**:
   - Original amount: $700
   - Outstanding: $0
   - Display: No red alert shown

## Benefits

- Clear visibility of outstanding amounts
- Easy payment tracking for expense owners
- Automatic calculation prevents errors
- Improved user experience with visual indicators
- Scalable to any number of apartments
