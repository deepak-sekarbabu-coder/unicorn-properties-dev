# Authentication Flow Documentation

## Overview

This document describes the complete authentication flow for Unicorn Properties, including first-time and existing users, role-based redirection and onboarding.

## User Authentication Flow

### 1. First-Time User Login (Email or Google)

When a user logs in for the first time:

1. **Firebase Authentication**: User authenticates via Firebase Auth (email/password or Google Sign-In)
2. **User Lookup**: Check if user exists in Firestore by email
3. **User Creation**: If user doesn't exist in Firestore:
   - Create new user with default `role: 'user'`
   - Set `propertyRole: undefined` (triggers onboarding)
   - Save user data including name, email, avatar from Firebase Auth
4. **Session Creation**: Create Firebase session cookie for server-side authentication
5. **Redirection**: Redirect to `/dashboard`
6. **Onboarding**: Dashboard detects missing `apartment` or `propertyRole` and shows onboarding dialog
7. **Profile Completion**: User selects apartment and property role (tenant/owner)
8. **Dashboard Access**: User can now access full application features

### 2. Existing User Login

When an existing user logs in:

1. **Firebase Authentication**: User authenticates via Firebase Auth
2. **User Retrieval**: Fetch existing user data from Firestore by email
3. **Session Creation**: Create Firebase session cookie
4. **Redirection**: Redirect to `/dashboard`
5. **Dashboard Access**: User immediately accesses dashboard with their role permissions

## Role System

### Authentication Roles (`role` field)

- **`user`**: Default role for regular users (assigned to all new users)
- **`admin`**: Administrative privileges (can manage users, approve announcements, etc.)

### Property Roles (`propertyRole` field)

- **`tenant`**: Rents the apartment
- **`owner`**: Owns the apartment
- **`undefined`**: Not yet assigned (triggers onboarding flow)

## Code Implementation

### AuthContext (`src/context/auth-context.tsx`)

The main authentication logic is handled in the `AuthContext`:

```typescript
// When Firebase auth state changes
onAuthStateChanged(auth, async firebaseUser => {
  if (firebaseUser && firebaseUser.email) {
    // Look up user in Firestore by email
    let appUser = await getUserByEmail(firebaseUser.email);
    let isNewUser = false;

    // Create new user if doesn't exist
    if (!appUser) {
      const newUser = {
        name: firebaseUser.displayName || 'New User',
        email: firebaseUser.email,
        avatar: firebaseUser.photoURL || undefined,
        role: 'user', // Default role
        propertyRole: undefined, // Triggers onboarding
      };
      appUser = await addUser(newUser);
      isNewUser = true;
    }

    // Set user in context
    setUser(appUser);

    // Set session cookie and redirect to dashboard
    await setSessionCookie(firebaseUser);
    router.replace('/dashboard');
  }
});
```

### Onboarding Flow (`src/components/unicorn-properties-app.tsx`)

The main app component handles onboarding:

```typescript
// Show onboarding dialog if user lacks apartment or property role
React.useEffect(() => {
  if (user && (!user.apartment || !user.propertyRole)) {
    setShowApartmentDialog(true);
  }
}, [user]);
```

### Session Management (`src/app/api/auth/session/route.ts`)

Server-side session management:

- Creates secure HTTP-only session cookies
- Handles session verification for protected routes
- Provides development fallback for local testing

## Security Features

1. **HTTP-Only Cookies**: Session cookies are HTTP-only and secure
2. **Server-Side Verification**: Dashboard page verifies session server-side
3. **Role-Based Access**: Different features available based on user role
4. **Automatic Cleanup**: Invalid sessions are automatically cleared

## Development vs Production

### Development Mode

- Fallback session creation if Firebase Admin SDK fails
- Additional logging for debugging
- Less strict security settings for local development

### Production Mode

- Full Firebase Admin SDK integration
- Secure cookie settings
- Proper error handling and user feedback

## User Experience

### New User Journey

1. Click "Sign in with Google" or enter email/password
2. Automatic account creation with default permissions
3. Seamless redirect to dashboard
4. One-time onboarding to select apartment and role
5. Full access to application features

### Returning User Journey

1. Click "Sign in"
2. Automatic authentication and session restoration
3. Direct access to dashboard with existing permissions
4. No additional setup required

## Error Handling

The system handles various error scenarios:

- Invalid authentication tokens
- Network connectivity issues
- Firebase service unavailability
- Session cookie creation failures
- User data corruption

All errors are logged and users receive appropriate feedback messages.

## Testing the Flow

1. **New User Test**:
   - Sign up with new email/Google account
   - Should create user with role 'user'
   - Should redirect to dashboard
   - Should show onboarding dialog

2. **Existing User Test**:
   - Sign in with existing account
   - Should find user in Firestore
   - Should redirect to dashboard
   - Should show main app (no onboarding if complete)

3. **Error Handling Test**:
   - Try invalid credentials
   - Should show error message
   - Should not redirect
   - Should maintain login form state

## Troubleshooting

If authentication is still not working:

1. **Check Browser Console**: Look for error messages during login
2. **Check Network Tab**: Verify API calls are succeeding
3. **Check Firestore**: Ensure user documents exist with correct email field
4. **Check Firebase Auth**: Verify users are being created in Firebase Auth
5. **Check Session Cookies**: Verify session cookies are being set
